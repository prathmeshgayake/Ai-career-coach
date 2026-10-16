import cron from 'node-cron';
import { PollRun, TrackedRepository } from '../models/types';
import { generateId } from '../utils/id';
import { trackingStore } from '../db/trackingStore';
import { pollStore } from '../db/pollStore';
import { GithubService } from './github';
import { AnalyzerService } from './analyzer';
import { config } from '../config';

export class MonitorService {
  private cronJob: cron.ScheduledTask | null = null;
  private isPolling = false;
  private isRunning = false;

  /**
   * Starts the cron polling scheduler.
   */
  start(): void {
    if (this.isRunning) return;

    const intervalMinutes = config.pollIntervalMinutes;
    const cronExpression = `*/${intervalMinutes} * * * *`;

    console.log(`[MonitorService] Starting cron scheduler with expression: ${cronExpression} (every ${intervalMinutes} min)`);
    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.pollAll();
    });

    this.isRunning = true;
  }

  /**
   * Stops the cron scheduler.
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    this.isRunning = false;
    console.log('[MonitorService] Polling scheduler stopped');
  }

  /**
   * Returns current scheduler status.
   */
  getStatus(): { isRunning: boolean; isPolling: boolean; intervalMinutes: number } {
    return {
      isRunning: this.isRunning,
      isPolling: this.isPolling,
      intervalMinutes: config.pollIntervalMinutes,
    };
  }

  /**
   * Polls all active tracked repositories with mutex protection against overlapping runs.
   */
  async pollAll(): Promise<{ polled: number; changesDetected: number; errors: number }> {
    if (this.isPolling) {
      console.warn('[MonitorService] Polling cycle already in progress, skipping overlapping run');
      return { polled: 0, changesDetected: 0, errors: 0 };
    }

    this.isPolling = true;
    let polled = 0;
    let changesDetected = 0;
    let errors = 0;

    try {
      const activeRepos = await trackingStore.getActiveTrackedRepos();
      for (const tracked of activeRepos) {
        polled++;
        try {
          const changed = await this.pollSingleRepo(tracked);
          if (changed) {
            changesDetected++;
          }
        } catch (err: any) {
          errors++;
          console.error(`[MonitorService] Error polling tracked repo ${tracked.id}:`, err.message);
        }
      }
    } finally {
      this.isPolling = false;
    }

    return { polled, changesDetected, errors };
  }

  /**
   * Polls a specific tracked repository by ID.
   */
  async pollById(trackingId: string): Promise<PollRun> {
    const tracked = await trackingStore.getTrackedRepo(trackingId);
    if (!tracked) {
      throw new Error(`Tracked repository ${trackingId} not found`);
    }

    return this.executePoll(tracked);
  }

  /**
   * Helper that executes the poll cycle for a single tracked repository.
   */
  private async pollSingleRepo(tracked: TrackedRepository): Promise<boolean> {
    const run = await this.executePoll(tracked);
    return run.status === 'completed';
  }

  private async executePoll(tracked: TrackedRepository): Promise<PollRun> {
    const pollId = generateId();
    const startTime = new Date().toISOString();

    const pollRun: PollRun = {
      id: pollId,
      trackingId: tracked.id,
      startedAt: startTime,
      status: 'running',
      previousSha: tracked.lastKnownSha,
    };

    try {
      // 1. Fetch latest commit SHA from GitHub
      const latestSha = await GithubService.getLatestCommitSha(tracked.owner, tracked.repo);
      pollRun.currentSha = latestSha;

      // 2. Compare with last known SHA
      if (latestSha === tracked.lastKnownSha) {
        pollRun.status = 'no_change';
        pollRun.completedAt = new Date().toISOString();
        await pollStore.savePollRun(pollRun);

        await trackingStore.updateTrackedRepo(tracked.id, {
          lastPollAt: new Date().toISOString(),
          consecutiveErrors: 0,
        });

        return pollRun;
      }

      // 3. New commit detected! Fetch changed files
      let changedFiles: string[] = [];
      try {
        changedFiles = await GithubService.compareCommits(
          tracked.owner,
          tracked.repo,
          tracked.lastKnownSha,
          latestSha
        );
      } catch (compareErr) {
        console.warn(`[MonitorService] Commit compare failed, proceeding with full scan:`, compareErr);
      }
      pollRun.changedFiles = changedFiles;

      // 4. Trigger reassessment
      await AnalyzerService.reassessOnCommit(tracked.analysisId, latestSha, changedFiles);

      // 5. Update tracked repo only after successful reassessment
      pollRun.status = 'completed';
      pollRun.completedAt = new Date().toISOString();
      await pollStore.savePollRun(pollRun);

      await trackingStore.updateTrackedRepo(tracked.id, {
        lastKnownSha: latestSha,
        lastAssessedSha: latestSha,
        lastPollAt: new Date().toISOString(),
        consecutiveErrors: 0,
        lastError: '',
      });

      return pollRun;
    } catch (err: any) {
      pollRun.status = 'failed';
      pollRun.error = err.message;
      pollRun.completedAt = new Date().toISOString();
      await pollStore.savePollRun(pollRun);

      const consecutiveErrors = (tracked.consecutiveErrors || 0) + 1;
      const updates: Partial<TrackedRepository> = {
        lastPollAt: new Date().toISOString(),
        consecutiveErrors,
        lastError: err.message,
      };

      // Automatically halt if consecutive errors exceed threshold
      if (consecutiveErrors >= 5) {
        updates.status = 'error';
      }

      await trackingStore.updateTrackedRepo(tracked.id, updates);
      return pollRun;
    }
  }
}

export const monitorService = new MonitorService();
