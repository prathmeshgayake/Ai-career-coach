import request from 'supertest';
import { app } from '../../src/app';
import { GithubService } from '../../src/services/github';
import { monitorService } from '../../src/services/monitor';
import { analysisStore } from '../../src/db/analysisStore';
import { trackingStore } from '../../src/db/trackingStore';
import { Analysis } from '../../src/models/types';
import { generateId } from '../../src/utils/id';
import * as geminiModule from '../../src/services/gemini';

describe('Repository Monitoring & Polling Integration Tests', () => {
  jest.setTimeout(35000);
  let testAnalysis: Analysis;
  const initialSha = '1111111111111111111111111111111111111111';
  const updatedSha = '2222222222222222222222222222222222222222';

  beforeEach(async () => {
    jest.clearAllMocks();

    jest.spyOn(geminiModule, 'assessSkillsWithEngineMetadata').mockResolvedValue({
      assessments: [
        {
          skillName: 'TypeScript',
          status: 'demonstrated',
          evidence: [
            {
              id: 'temp-1',
              filePath: 'src/index.ts',
              excerpt: 'export const app = express();',
              commitSha: updatedSha,
              githubUrl: '',
              explanation: 'Exporting Express app in TypeScript',
            },
          ],
          reasoning: 'Repository contains TypeScript implementation.',
        },
      ],
      assessmentEngine: 'gemini',
      modelUsed: 'gemini-3.5-flash',
    });

    const analysisId = generateId();
    testAnalysis = {
      id: analysisId,
      jobSource: {
        retrievalMethod: 'pasted',
        requirements: ['TypeScript', 'Express.js'],
        rawContent: 'Backend developer requirements',
        fetchedAt: new Date().toISOString(),
      },
      repositoryUrl: 'https://github.com/testdev/sample-api',
      repositoryOwner: 'testdev',
      repositoryName: 'sample-api',
      currentVersion: 1,
      latestCommitSha: initialSha,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await analysisStore.saveAnalysis(testAnalysis);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should track repository, prevent duplicates, report status, and stop tracking', async () => {
    // 1. Start tracking
    const trackRes = await request(app)
      .post('/api/v1/tracked-repositories')
      .send({ analysisId: testAnalysis.id });

    expect(trackRes.status).toBe(201);
    expect(trackRes.body.status).toBe('success');
    expect(trackRes.body.data.status).toBe('active');

    const trackingId = trackRes.body.data.id;

    // 2. Duplicate prevention test
    const dupRes = await request(app)
      .post('/api/v1/tracked-repositories')
      .send({ analysisId: testAnalysis.id });

    expect(dupRes.status).toBe(200);
    expect(dupRes.body.data.id).toBe(trackingId);
    expect(dupRes.body.message).toContain('already actively monitored');

    // 3. Status check
    const statusRes = await request(app)
      .get(`/api/v1/tracked-repositories/${trackingId}/status`);

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.tracking.id).toBe(trackingId);
    expect(Array.isArray(statusRes.body.data.recentPolls)).toBe(true);

    // 4. Stop tracking
    const stopRes = await request(app)
      .post(`/api/v1/tracked-repositories/${trackingId}/stop`);

    expect(stopRes.status).toBe(200);
    expect(stopRes.body.data.status).toBe('stopped');

    // 5. Reactivate tracking
    const reactivateRes = await request(app)
      .post('/api/v1/tracked-repositories')
      .send({ analysisId: testAnalysis.id });

    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.data.status).toBe('active');
  });

  it('should detect no change when commit SHA matches', async () => {
    const trackRes = await request(app)
      .post('/api/v1/tracked-repositories')
      .send({ analysisId: testAnalysis.id });

    const trackingId = trackRes.body.data.id;

    jest.spyOn(GithubService, 'getLatestCommitSha').mockResolvedValue(initialSha);

    const pollRun = await monitorService.pollById(trackingId);
    expect(pollRun.status).toBe('no_change');
    expect(pollRun.currentSha).toBe(initialSha);
  });

  it('should detect new commit, run reassessment, and save new version', async () => {
    const trackRes = await request(app)
      .post('/api/v1/tracked-repositories')
      .send({ analysisId: testAnalysis.id });

    const trackingId = trackRes.body.data.id;

    jest.spyOn(GithubService, 'getLatestCommitSha').mockResolvedValue(updatedSha);
    jest.spyOn(GithubService, 'compareCommits').mockResolvedValue(['src/index.ts']);
    jest.spyOn(GithubService, 'getRepoFiles').mockResolvedValue([
      {
        path: 'src/index.ts',
        content: `import express from 'express';\nexport const app = express();`,
        size: 60,
      },
    ]);

    const pollRun = await monitorService.pollById(trackingId);
    expect(pollRun.status).toBe('completed');
    expect(pollRun.currentSha).toBe(updatedSha);
    expect(pollRun.changedFiles).toEqual(['src/index.ts']);

    // Check tracked repo state updated
    const updatedTracked = await trackingStore.getTrackedRepo(trackingId);
    expect(updatedTracked?.lastAssessedSha).toBe(updatedSha);

    // Check analysis version incremented
    const updatedAnalysis = await analysisStore.getAnalysis(testAnalysis.id);
    expect(updatedAnalysis?.currentVersion).toBe(2);

    // Check assessment versions history
    const versions = await analysisStore.getAssessmentVersions(testAnalysis.id);
    expect(versions.some(v => v.trigger === 'commit_change' && v.version === 2)).toBe(true);
  });

  it('should handle GitHub API failure gracefully and retain previous assessment', async () => {
    const trackRes = await request(app)
      .post('/api/v1/tracked-repositories')
      .send({ analysisId: testAnalysis.id });

    const trackingId = trackRes.body.data.id;

    jest.spyOn(GithubService, 'getLatestCommitSha').mockRejectedValue(new Error('GitHub network timeout'));

    const pollRun = await monitorService.pollById(trackingId);
    expect(pollRun.status).toBe('failed');
    expect(pollRun.error).toContain('GitHub network timeout');

    // Verify tracked repository consecutive error incremented
    const tracked = await trackingStore.getTrackedRepo(trackingId);
    expect(tracked?.consecutiveErrors).toBe(1);
    expect(tracked?.lastError).toContain('GitHub network timeout');

    // Analysis currentVersion remains unchanged
    const analysis = await analysisStore.getAnalysis(testAnalysis.id);
    expect(analysis?.currentVersion).toBe(1);
  });
});
