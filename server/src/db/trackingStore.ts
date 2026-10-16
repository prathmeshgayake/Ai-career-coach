import { TrackedRepository } from '../models/types';
import { getStore } from './store';

export const trackingStore = {
  async saveTrackedRepo(repo: TrackedRepository): Promise<void> {
    return getStore().saveTrackedRepo(repo);
  },

  async getTrackedRepo(id: string): Promise<TrackedRepository | null> {
    return getStore().getTrackedRepo(id);
  },

  async getTrackedRepoByAnalysisId(analysisId: string): Promise<TrackedRepository | null> {
    return getStore().getTrackedRepoByAnalysisId(analysisId);
  },

  async getActiveTrackedRepos(userId?: string): Promise<TrackedRepository[]> {
    return getStore().getActiveTrackedRepos(userId);
  },

  async updateTrackedRepo(id: string, updates: Partial<TrackedRepository>): Promise<void> {
    return getStore().updateTrackedRepo(id, updates);
  },
};
