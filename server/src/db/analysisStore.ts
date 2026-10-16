import { Analysis, AssessmentVersion } from '../models/types';
import { getStore } from './store';

export const analysisStore = {
  async saveAnalysis(analysis: Analysis): Promise<void> {
    return getStore().saveAnalysis(analysis);
  },

  async getAnalysis(id: string): Promise<Analysis | null> {
    return getStore().getAnalysis(id);
  },

  async getAllAnalyses(userId?: string): Promise<Analysis[]> {
    return getStore().getAllAnalyses(userId);
  },

  async updateAnalysis(id: string, updates: Partial<Analysis>): Promise<void> {
    return getStore().updateAnalysis(id, updates);
  },

  async deleteAnalysis(id: string): Promise<void> {
    return getStore().deleteAnalysis(id);
  },

  async saveAssessmentVersion(version: AssessmentVersion): Promise<void> {
    return getStore().saveAssessmentVersion(version);
  },

  async getAssessmentVersions(analysisId: string): Promise<AssessmentVersion[]> {
    return getStore().getAssessmentVersions(analysisId);
  },

  async getLatestAssessmentVersion(analysisId: string): Promise<AssessmentVersion | null> {
    return getStore().getLatestAssessmentVersion(analysisId);
  },
};
