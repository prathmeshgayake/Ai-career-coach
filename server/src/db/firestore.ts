import admin from 'firebase-admin';
import { DataStore } from './store';
import { Analysis, AssessmentVersion, JobSource, PollRun, TrackedRepository, UserRecord } from '../models/types';
import { config } from '../config';

let firestoreDb: admin.firestore.Firestore | null = null;

export function getFirestoreDb(): admin.firestore.Firestore {
  if (firestoreDb) {
    return firestoreDb;
  }

  if (admin.apps.length === 0) {
    if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: config.firebase.projectId,
          clientEmail: config.firebase.clientEmail,
          privateKey: config.firebase.privateKey,
        }),
      });
    } else {
      admin.initializeApp();
    }
  }

  firestoreDb = admin.firestore();
  return firestoreDb;
}

function cleanUndefined<T extends Record<string, any>>(obj: T): any {
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        result[key] = cleanUndefined(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

export class FirestoreStore implements DataStore {
  private db: admin.firestore.Firestore;

  constructor(customDb?: admin.firestore.Firestore) {
    this.db = customDb || getFirestoreDb();
  }

  // Users
  async saveUser(user: UserRecord): Promise<void> {
    await this.db.collection('users').doc(user.id).set(cleanUndefined(user));
  }

  async getUser(id: string): Promise<UserRecord | null> {
    const doc = await this.db.collection('users').doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as UserRecord;
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const cleanEmail = email.toLowerCase().trim();
    const snapshot = await this.db
      .collection('users')
      .where('email', '==', cleanEmail)
      .limit(1)
      .get();
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as UserRecord;
    }

    // Fallback: check if dots were stripped or added (e.g. Gmail addresses)
    const usernamePart = cleanEmail.split('@')[0];
    const domainPart = cleanEmail.split('@')[1];
    const usernameNoDots = usernamePart.replace(/\./g, '');

    const allUsers = await this.getAllUsers();
    const found = allUsers.find((u) => {
      const uEmail = (u.email || '').toLowerCase().trim();
      if (uEmail === cleanEmail) return true;
      const uUser = uEmail.split('@')[0];
      const uDomain = uEmail.split('@')[1];
      if (uDomain === domainPart && uUser.replace(/\./g, '') === usernameNoDots) {
        return true;
      }
      return false;
    });

    return found || null;
  }

  async getAllUsers(): Promise<UserRecord[]> {
    const snapshot = await this.db.collection('users').get();
    return snapshot.docs.map(doc => doc.data() as UserRecord);
  }

  // Jobs
  async saveJobSource(id: string, job: JobSource): Promise<void> {
    await this.db.collection('jobs').doc(id).set(cleanUndefined(job));
  }

  async getJobSource(id: string): Promise<JobSource | null> {
    const doc = await this.db.collection('jobs').doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as JobSource;
  }

  // Analyses
  async saveAnalysis(analysis: Analysis): Promise<void> {
    await this.db.collection('analyses').doc(analysis.id).set(cleanUndefined(analysis));
  }

  async getAnalysis(id: string): Promise<Analysis | null> {
    const doc = await this.db.collection('analyses').doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as Analysis;
  }

  async getAllAnalyses(userId?: string): Promise<Analysis[]> {
    let query: admin.firestore.Query = this.db.collection('analyses');
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    const snapshot = await query.get();
    const list = snapshot.docs.map(doc => doc.data() as Analysis);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateAnalysis(id: string, updates: Partial<Analysis>): Promise<void> {
    await this.db.collection('analyses').doc(id).update({
      ...cleanUndefined(updates),
      updatedAt: new Date().toISOString(),
    });
  }

  async deleteAnalysis(id: string): Promise<void> {
    const batch = this.db.batch();

    // Delete analysis doc
    const analysisRef = this.db.collection('analyses').doc(id);
    batch.delete(analysisRef);

    // Delete subcollection versions
    const versions = await analysisRef.collection('versions').get();
    versions.docs.forEach(vDoc => batch.delete(vDoc.ref));

    // Delete associated tracked repo
    const trackedSnapshot = await this.db.collection('tracked_repos').where('analysisId', '==', id).get();
    for (const tDoc of trackedSnapshot.docs) {
      batch.delete(tDoc.ref);
      const pollRuns = await tDoc.ref.collection('poll_runs').get();
      pollRuns.docs.forEach(pDoc => batch.delete(pDoc.ref));
    }

    await batch.commit();
  }

  // Assessment versions
  async saveAssessmentVersion(version: AssessmentVersion): Promise<void> {
    await this.db
      .collection('analyses')
      .doc(version.analysisId)
      .collection('versions')
      .doc(version.id)
      .set(version);
  }

  async getAssessmentVersions(analysisId: string): Promise<AssessmentVersion[]> {
    const snapshot = await this.db
      .collection('analyses')
      .doc(analysisId)
      .collection('versions')
      .orderBy('version', 'asc')
      .get();
    return snapshot.docs.map(doc => doc.data() as AssessmentVersion);
  }

  async getLatestAssessmentVersion(analysisId: string): Promise<AssessmentVersion | null> {
    const snapshot = await this.db
      .collection('analyses')
      .doc(analysisId)
      .collection('versions')
      .orderBy('version', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as AssessmentVersion;
  }

  // Tracked repos
  async saveTrackedRepo(repo: TrackedRepository): Promise<void> {
    await this.db.collection('tracked_repos').doc(repo.id).set(cleanUndefined(repo));
  }

  async getTrackedRepo(id: string): Promise<TrackedRepository | null> {
    const doc = await this.db.collection('tracked_repos').doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as TrackedRepository;
  }

  async getTrackedRepoByAnalysisId(analysisId: string): Promise<TrackedRepository | null> {
    const snapshot = await this.db
      .collection('tracked_repos')
      .where('analysisId', '==', analysisId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as TrackedRepository;
  }

  async getActiveTrackedRepos(userId?: string): Promise<TrackedRepository[]> {
    let query: admin.firestore.Query = this.db
      .collection('tracked_repos')
      .where('status', '==', 'active');
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as TrackedRepository);
  }

  async updateTrackedRepo(id: string, updates: Partial<TrackedRepository>): Promise<void> {
    await this.db.collection('tracked_repos').doc(id).update({
      ...cleanUndefined(updates),
      updatedAt: new Date().toISOString(),
    });
  }

  // Poll runs
  async savePollRun(run: PollRun): Promise<void> {
    await this.db
      .collection('tracked_repos')
      .doc(run.trackingId)
      .collection('poll_runs')
      .doc(run.id)
      .set(run);
  }

  async getPollRuns(trackingId: string): Promise<PollRun[]> {
    const snapshot = await this.db
      .collection('tracked_repos')
      .doc(trackingId)
      .collection('poll_runs')
      .orderBy('startedAt', 'desc')
      .limit(50)
      .get();
    return snapshot.docs.map(doc => doc.data() as PollRun);
  }
}
