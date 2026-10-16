import { UserRecord, PublicUser } from '../models/types';
import { getStore } from './store';

export const userStore = {
  async saveUser(user: UserRecord): Promise<void> {
    return getStore().saveUser(user);
  },

  async getUser(id: string): Promise<UserRecord | null> {
    return getStore().getUser(id);
  },

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    return getStore().getUserByEmail(email);
  },

  async getAllUsers(): Promise<UserRecord[]> {
    return getStore().getAllUsers();
  },

  toPublicUser(user: UserRecord): PublicUser {
    const { passwordHash, ...rest } = user;
    return rest;
  },
};
