import crypto from 'crypto';
import { JobSource, RepoFile, SkillAssessment } from '../models/types';

export function computeSha256(input: string): string {
  return crypto.createHash('sha256').update(input.trim()).digest('hex');
}

export interface CachedAssessmentResult {
  assessments: SkillAssessment[];
  assessmentEngine: 'gemini' | 'heuristic_fallback';
  modelUsed: string;
}

class CacheManager {
  private jobCache = new Map<string, { data: JobSource; timestamp: number }>();
  private repoFilesCache = new Map<string, { data: RepoFile[]; timestamp: number }>();
  private assessmentCache = new Map<string, { data: CachedAssessmentResult; timestamp: number }>();

  // Default TTL: 1 hour for job texts; 2 hours for immutable Git commit SHAs
  private readonly DEFAULT_TTL_MS = 60 * 60 * 1000;
  private readonly REPO_TTL_MS = 2 * 60 * 60 * 1000;

  // Job requirements cache
  getJobSource(key: string): JobSource | null {
    const entry = this.jobCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.DEFAULT_TTL_MS) {
      this.jobCache.delete(key);
      return null;
    }
    return entry.data;
  }

  setJobSource(key: string, data: JobSource): void {
    if (this.jobCache.size >= 100) {
      const oldestKey = this.jobCache.keys().next().value;
      if (oldestKey) this.jobCache.delete(oldestKey);
    }
    this.jobCache.set(key, { data, timestamp: Date.now() });
  }

  // Repository files cache keyed by owner:repo:commitSha
  getRepoFiles(owner: string, repo: string, commitSha: string): RepoFile[] | null {
    const key = `${owner.toLowerCase()}:${repo.toLowerCase()}:${commitSha}`;
    const entry = this.repoFilesCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.REPO_TTL_MS) {
      this.repoFilesCache.delete(key);
      return null;
    }
    return entry.data;
  }

  setRepoFiles(owner: string, repo: string, commitSha: string, data: RepoFile[]): void {
    const key = `${owner.toLowerCase()}:${repo.toLowerCase()}:${commitSha}`;
    if (this.repoFilesCache.size >= 50) {
      const oldestKey = this.repoFilesCache.keys().next().value;
      if (oldestKey) this.repoFilesCache.delete(oldestKey);
    }
    this.repoFilesCache.set(key, { data, timestamp: Date.now() });
  }

  // Assessment results cache keyed by jobHash:owner:repo:commitSha
  getAssessmentResult(key: string): CachedAssessmentResult | null {
    const entry = this.assessmentCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.REPO_TTL_MS) {
      this.assessmentCache.delete(key);
      return null;
    }
    return entry.data;
  }

  setAssessmentResult(key: string, data: CachedAssessmentResult): void {
    if (this.assessmentCache.size >= 100) {
      const oldestKey = this.assessmentCache.keys().next().value;
      if (oldestKey) this.assessmentCache.delete(oldestKey);
    }
    this.assessmentCache.set(key, { data, timestamp: Date.now() });
  }

  // Invalidate any cache entries for a repository when a new commit arrives
  invalidateRepo(owner: string, repo: string): void {
    const prefix = `${owner.toLowerCase()}:${repo.toLowerCase()}:`;
    for (const k of this.repoFilesCache.keys()) {
      if (k.startsWith(prefix)) {
        this.repoFilesCache.delete(k);
      }
    }
  }

  clear(): void {
    this.jobCache.clear();
    this.repoFilesCache.clear();
    this.assessmentCache.clear();
  }
}

export const pipelineCache = new CacheManager();
