import { PollRun } from '../models/types';
import { getStore } from './store';

export const pollStore = {
  async savePollRun(run: PollRun): Promise<void> {
    return getStore().savePollRun(run);
  },

  async getPollRuns(trackingId: string): Promise<PollRun[]> {
    return getStore().getPollRuns(trackingId);
  },
};
