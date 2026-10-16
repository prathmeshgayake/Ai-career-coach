import { Router, Request, Response, NextFunction } from 'express';
import { trackingStore } from '../db/trackingStore';
import { pollStore } from '../db/pollStore';
import { analysisStore } from '../db/analysisStore';
import { generateId } from '../utils/id';
import { config } from '../config';
import {
  validateTrackRepo,
  validateIdParam,
  handleValidationErrors,
} from '../middleware/validation';
import { TrackedRepository } from '../models/types';

const router = Router();

/**
 * POST /api/v1/tracked-repositories
 * Starts tracking a repository associated with an analysis.
 */
router.post(
  '/',
  validateTrackRepo,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { analysisId } = req.body;

      const analysis = await analysisStore.getAnalysis(analysisId);
      if (!analysis) {
        res.status(404).json({
          status: 'error',
          message: `Analysis '${analysisId}' does not exist`,
        });
        return;
      }

      // Check for duplicate / existing tracking
      const existing = await trackingStore.getTrackedRepoByAnalysisId(analysisId);
      if (existing) {
        if (existing.status === 'active') {
          res.status(200).json({
            status: 'success',
            message: 'Repository is already actively monitored',
            data: existing,
          });
          return;
        }

        // Reactivate stopped tracking
        await trackingStore.updateTrackedRepo(existing.id, {
          status: 'active',
          consecutiveErrors: 0,
          lastError: '',
          lastKnownSha: analysis.latestCommitSha || existing.lastKnownSha,
          lastAssessedSha: analysis.latestCommitSha || existing.lastAssessedSha,
        });

        const reactivated = await trackingStore.getTrackedRepo(existing.id);
        res.status(200).json({
          status: 'success',
          message: 'Monitoring reactivated for repository',
          data: reactivated,
        });
        return;
      }

      const now = new Date().toISOString();
      const newTracking: TrackedRepository = {
        id: generateId(),
        userId: req.userId || analysis.userId || 'student-aarav',
        analysisId,
        repositoryUrl: analysis.repositoryUrl,
        owner: analysis.repositoryOwner,
        repo: analysis.repositoryName,
        lastKnownSha: analysis.latestCommitSha,
        lastAssessedSha: analysis.latestCommitSha,
        status: 'active',
        pollIntervalMinutes: config.pollIntervalMinutes,
        createdAt: now,
        updatedAt: now,
        consecutiveErrors: 0,
      };

      await trackingStore.saveTrackedRepo(newTracking);

      res.status(201).json({
        status: 'success',
        message: 'Repository monitoring started',
        data: newTracking,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/tracked-repositories
 * Lists all active tracked repositories for authenticated student.
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trackedRepos = await trackingStore.getActiveTrackedRepos(req.userId);
    res.status(200).json({
      status: 'success',
      data: trackedRepos,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tracked-repositories/:id/status
 * Fetches tracking status and recent poll execution runs.
 * Supports querying by either trackingId or analysisId.
 */
router.get(
  '/:id/status',
  validateIdParam,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      let tracked = await trackingStore.getTrackedRepo(id);
      if (!tracked) {
        tracked = await trackingStore.getTrackedRepoByAnalysisId(id);
      }

      if (!tracked) {
        res.status(404).json({
          status: 'error',
          message: `Tracked repository '${id}' not found`,
        });
        return;
      }

      // Check student authorization
      if (req.userId && tracked.userId && tracked.userId !== req.userId) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied: this tracked repository belongs to another student account',
        });
        return;
      }

      const pollRuns = await pollStore.getPollRuns(tracked.id);

      res.status(200).json({
        status: 'success',
        data: {
          tracking: tracked,
          recentPolls: pollRuns,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/tracked-repositories/:id/stop
 * Stops monitoring a repository.
 * Supports querying by either trackingId or analysisId.
 */
router.post(
  '/:id/stop',
  validateIdParam,
  handleValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      let tracked = await trackingStore.getTrackedRepo(id);
      if (!tracked) {
        tracked = await trackingStore.getTrackedRepoByAnalysisId(id);
      }

      if (!tracked) {
        res.status(404).json({
          status: 'error',
          message: `Tracked repository '${id}' not found`,
        });
        return;
      }

      // Check student authorization
      if (req.userId && tracked.userId && tracked.userId !== req.userId) {
        res.status(403).json({
          status: 'error',
          message: 'Access denied: cannot modify tracking belonging to another student account',
        });
        return;
      }

      await trackingStore.updateTrackedRepo(tracked.id, {
        status: 'stopped',
      });

      const updated = await trackingStore.getTrackedRepo(tracked.id);

      res.status(200).json({
        status: 'success',
        message: 'Repository monitoring stopped',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
