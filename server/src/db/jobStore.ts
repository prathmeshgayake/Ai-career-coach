import { JobSource } from '../models/types';
import { getStore } from './store';

export const jobStore = {
  async saveJobSource(id: string, job: JobSource): Promise<void> {
    return getStore().saveJobSource(id, job);
  },

  async getJobSource(id: string): Promise<JobSource | null> {
    return getStore().getJobSource(id);
  },
};
