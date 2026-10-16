import fs from 'fs';
import path from 'path';
import { Analysis, AssessmentVersion, JobSource, PollRun, TrackedRepository, UserRecord } from '../models/types';
import { config } from '../config';

export interface DataStore {
  // Users
  saveUser(user: UserRecord): Promise<void>;
  getUser(id: string): Promise<UserRecord | null>;
  getUserByEmail(email: string): Promise<UserRecord | null>;
  getAllUsers(): Promise<UserRecord[]>;

  // Jobs
  saveJobSource(id: string, job: JobSource): Promise<void>;
  getJobSource(id: string): Promise<JobSource | null>;

  // Analyses
  saveAnalysis(analysis: Analysis): Promise<void>;
  getAnalysis(id: string): Promise<Analysis | null>;
  getAllAnalyses(userId?: string): Promise<Analysis[]>;
  updateAnalysis(id: string, updates: Partial<Analysis>): Promise<void>;
  deleteAnalysis(id: string): Promise<void>;

  // Assessment versions
  saveAssessmentVersion(version: AssessmentVersion): Promise<void>;
  getAssessmentVersions(analysisId: string): Promise<AssessmentVersion[]>;
  getLatestAssessmentVersion(analysisId: string): Promise<AssessmentVersion | null>;

  // Tracked repos
  saveTrackedRepo(repo: TrackedRepository): Promise<void>;
  getTrackedRepo(id: string): Promise<TrackedRepository | null>;
  getTrackedRepoByAnalysisId(analysisId: string): Promise<TrackedRepository | null>;
  getActiveTrackedRepos(userId?: string): Promise<TrackedRepository[]>;
  updateTrackedRepo(id: string, updates: Partial<TrackedRepository>): Promise<void>;

  // Poll runs
  savePollRun(run: PollRun): Promise<void>;
  getPollRuns(trackingId: string): Promise<PollRun[]>;
}

/**
 * File-based JSON store for local development without Firebase.
 */
export class JsonFileStore implements DataStore {
  private dataDir: string;
  private memoryCache: {
    users: Record<string, UserRecord>;
    jobs: Record<string, JobSource>;
    analyses: Record<string, Analysis>;
    assessments: Record<string, AssessmentVersion[]>;
    trackedRepos: Record<string, TrackedRepository>;
    pollRuns: Record<string, PollRun[]>;
  };
  private isLoaded = false;

  constructor(customDataDir?: string) {
    if (customDataDir) {
      this.dataDir = customDataDir;
    } else if (process.env.NODE_ENV === 'test') {
      this.dataDir = path.resolve(process.cwd(), 'data-test');
    } else {
      this.dataDir = path.resolve(process.cwd(), 'data');
    }
    this.memoryCache = {
      users: {},
      jobs: {},
      analyses: {},
      assessments: {},
      trackedRepos: {},
      pollRuns: {},
    };
  }

  private async ensureInitialized(): Promise<void> {
    if (this.isLoaded) return;
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      this.memoryCache.users = this.readFile<Record<string, UserRecord>>('users.json', {});
      this.memoryCache.jobs = this.readFile<Record<string, JobSource>>('jobs.json', {});
      this.memoryCache.analyses = this.readFile<Record<string, Analysis>>('analyses.json', {});
      this.memoryCache.assessments = this.readFile<Record<string, AssessmentVersion[]>>('assessments.json', {});
      this.memoryCache.trackedRepos = this.readFile<Record<string, TrackedRepository>>('tracked_repos.json', {});
      this.memoryCache.pollRuns = this.readFile<Record<string, PollRun[]>>('poll_runs.json', {});
      this.isLoaded = true;
    } catch {
      this.isLoaded = true;
    }
  }

  private readFile<T>(filename: string, fallback: T): T {
    const filePath = path.join(this.dataDir, filename);
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as T;
    } catch {
      return fallback;
    }
  }

  private writeFile(filename: string, data: any): void {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      const filePath = path.join(this.dataDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Failed to write store file ${filename}:`, err);
    }
  }

  // Users
  async saveUser(user: UserRecord): Promise<void> {
    await this.ensureInitialized();
    this.memoryCache.users[user.id] = user;
    this.writeFile('users.json', this.memoryCache.users);
  }

  async getUser(id: string): Promise<UserRecord | null> {
    await this.ensureInitialized();
    return this.memoryCache.users[id] || null;
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    await this.ensureInitialized();
    const cleanEmail = email.toLowerCase().trim();
    const user = Object.values(this.memoryCache.users).find(
      (u) => u.email.toLowerCase().trim() === cleanEmail
    );
    return user || null;
  }

  async getAllUsers(): Promise<UserRecord[]> {
    await this.ensureInitialized();
    return Object.values(this.memoryCache.users);
  }

  // Jobs
  async saveJobSource(id: string, job: JobSource): Promise<void> {
    await this.ensureInitialized();
    this.memoryCache.jobs[id] = job;
    this.writeFile('jobs.json', this.memoryCache.jobs);
  }

  async getJobSource(id: string): Promise<JobSource | null> {
    await this.ensureInitialized();
    return this.memoryCache.jobs[id] || null;
  }

  // Analyses
  async saveAnalysis(analysis: Analysis): Promise<void> {
    await this.ensureInitialized();
    this.memoryCache.analyses[analysis.id] = analysis;
    this.writeFile('analyses.json', this.memoryCache.analyses);
  }

  async getAnalysis(id: string): Promise<Analysis | null> {
    await this.ensureInitialized();
    return this.memoryCache.analyses[id] || null;
  }

  async getAllAnalyses(userId?: string): Promise<Analysis[]> {
    await this.ensureInitialized();
    const list = Object.values(this.memoryCache.analyses).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (!userId) return list;
    return list.filter(a => a.userId === userId);
  }

  async updateAnalysis(id: string, updates: Partial<Analysis>): Promise<void> {
    await this.ensureInitialized();
    const existing = this.memoryCache.analyses[id];
    if (existing) {
      this.memoryCache.analyses[id] = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.writeFile('analyses.json', this.memoryCache.analyses);
    }
  }

  async deleteAnalysis(id: string): Promise<void> {
    await this.ensureInitialized();
    delete this.memoryCache.analyses[id];
    delete this.memoryCache.assessments[id];

    // Also stop and delete tracked repo associated with this analysis
    for (const [trackingId, tracked] of Object.entries(this.memoryCache.trackedRepos)) {
      if (tracked.analysisId === id) {
        delete this.memoryCache.trackedRepos[trackingId];
        delete this.memoryCache.pollRuns[trackingId];
      }
    }

    this.writeFile('analyses.json', this.memoryCache.analyses);
    this.writeFile('assessments.json', this.memoryCache.assessments);
    this.writeFile('tracked_repos.json', this.memoryCache.trackedRepos);
    this.writeFile('poll_runs.json', this.memoryCache.pollRuns);
  }

  // Assessment versions
  async saveAssessmentVersion(version: AssessmentVersion): Promise<void> {
    await this.ensureInitialized();
    const list = this.memoryCache.assessments[version.analysisId] || [];
    // Ensure idempotency: if version id or version number exists, replace or append
    const existingIdx = list.findIndex(v => v.id === version.id || v.version === version.version);
    if (existingIdx >= 0) {
      list[existingIdx] = version;
    } else {
      list.push(version);
    }
    list.sort((a, b) => a.version - b.version);
    this.memoryCache.assessments[version.analysisId] = list;
    this.writeFile('assessments.json', this.memoryCache.assessments);
  }

  async getAssessmentVersions(analysisId: string): Promise<AssessmentVersion[]> {
    await this.ensureInitialized();
    const list = this.memoryCache.assessments[analysisId] || [];
    return [...list].sort((a, b) => a.version - b.version);
  }

  async getLatestAssessmentVersion(analysisId: string): Promise<AssessmentVersion | null> {
    const list = await this.getAssessmentVersions(analysisId);
    if (list.length === 0) return null;
    return list[list.length - 1];
  }

  // Tracked repos
  async saveTrackedRepo(repo: TrackedRepository): Promise<void> {
    await this.ensureInitialized();
    this.memoryCache.trackedRepos[repo.id] = repo;
    this.writeFile('tracked_repos.json', this.memoryCache.trackedRepos);
  }

  async getTrackedRepo(id: string): Promise<TrackedRepository | null> {
    await this.ensureInitialized();
    return this.memoryCache.trackedRepos[id] || null;
  }

  async getTrackedRepoByAnalysisId(analysisId: string): Promise<TrackedRepository | null> {
    await this.ensureInitialized();
    for (const repo of Object.values(this.memoryCache.trackedRepos)) {
      if (repo.analysisId === analysisId) {
        return repo;
      }
    }
    return null;
  }

  async getActiveTrackedRepos(userId?: string): Promise<TrackedRepository[]> {
    await this.ensureInitialized();
    const active = Object.values(this.memoryCache.trackedRepos).filter(r => r.status === 'active');
    if (!userId) return active;
    return active.filter(r => r.userId === userId);
  }

  async updateTrackedRepo(id: string, updates: Partial<TrackedRepository>): Promise<void> {
    await this.ensureInitialized();
    const existing = this.memoryCache.trackedRepos[id];
    if (existing) {
      this.memoryCache.trackedRepos[id] = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.writeFile('tracked_repos.json', this.memoryCache.trackedRepos);
    }
  }

  // Poll runs
  async savePollRun(run: PollRun): Promise<void> {
    await this.ensureInitialized();
    const runs = this.memoryCache.pollRuns[run.trackingId] || [];
    const existingIdx = runs.findIndex(r => r.id === run.id);
    if (existingIdx >= 0) {
      runs[existingIdx] = run;
    } else {
      runs.unshift(run); // newer first
    }
    // keep max 100 runs per tracked repo
    if (runs.length > 100) {
      runs.length = 100;
    }
    this.memoryCache.pollRuns[run.trackingId] = runs;
    this.writeFile('poll_runs.json', this.memoryCache.pollRuns);
  }

  async getPollRuns(trackingId: string): Promise<PollRun[]> {
    await this.ensureInitialized();
    return this.memoryCache.pollRuns[trackingId] || [];
  }
}

let storeInstance: DataStore | null = null;

export function getStore(): DataStore {
  if (storeInstance) {
    return storeInstance;
  }

  // If Firebase is configured, FirestoreStore is initialized lazily
  if (config.isFirebaseConfigured) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { FirestoreStore } = require('./firestore');
      storeInstance = new FirestoreStore();
      return storeInstance!;
    } catch (err) {
      console.warn('Failed to initialize FirestoreStore, falling back to JsonFileStore:', err);
    }
  }

  storeInstance = new JsonFileStore();
  return storeInstance;
}

export function setStore(store: DataStore): void {
  storeInstance = store;
}
