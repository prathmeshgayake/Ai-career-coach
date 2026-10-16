import request from 'supertest';
import { app } from '../../src/app';
import { GithubService } from '../../src/services/github';
import * as geminiModule from '../../src/services/gemini';

describe('Analysis Pipeline Integration Tests', () => {
  jest.setTimeout(35000);
  const mockCommitSha = '9f8e7d6c5b4a32109f8e7d6c5b4a32109f8e7d6c';
  const mockFiles = [
    {
      path: 'src/server.ts',
      content: `import express from 'express';\nconst app = express();\nexport default app;`,
      size: 75,
    },
    {
      path: 'package.json',
      content: `{"dependencies": {"express": "^4.21.2", "typescript": "^5.7.0"}}`,
      size: 65,
    },
  ];

  beforeEach(() => {
    jest.spyOn(GithubService, 'getLatestCommitSha').mockResolvedValue(mockCommitSha);
    jest.spyOn(GithubService, 'getRepoFiles').mockResolvedValue(mockFiles);
    jest.spyOn(geminiModule, 'extractRequirementsWithGemini').mockResolvedValue([
      'Express.js and TypeScript experience',
      'Building backend REST services',
    ]);
    jest.spyOn(geminiModule, 'assessSkillsWithEngineMetadata').mockResolvedValue({
      assessments: [
        {
          skillName: 'Express.js and TypeScript experience',
          status: 'demonstrated',
          evidence: [
            {
              id: 'temp-1',
              filePath: 'src/server.ts',
              excerpt: 'import express from \'express\';',
              commitSha: mockCommitSha,
              githubUrl: '',
              explanation: 'Uses express import in TypeScript module',
            },
          ],
          reasoning: 'Repository contains explicit Express server setup with TypeScript.',
        },
      ],
      assessmentEngine: 'gemini',
      modelUsed: 'gemini-3.5-flash',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should run end-to-end analysis, fetch details, view history, and delete', async () => {
    // 1. Create Analysis
    const createRes = await request(app)
      .post('/api/v1/analyses')
      .send({
        repositoryUrl: 'https://github.com/testuser/backend-project',
        jobDescription: `
        Backend Engineer
        Requirements:
        - Express.js and TypeScript experience
        - Building backend REST services
        `,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.status).toBe('success');
    expect(createRes.body.data.analysis).toBeDefined();

    const analysisId = createRes.body.data.analysis.id;
    expect(analysisId).toBeDefined();
    expect(createRes.body.data.analysis.repositoryOwner).toBe('testuser');
    expect(createRes.body.data.analysis.repositoryName).toBe('backend-project');
    expect(createRes.body.data.analysis.currentVersion).toBe(1);
    expect(createRes.body.data.latestAssessment).toBeDefined();
    expect(createRes.body.data.latestAssessment.assessments.length).toBeGreaterThan(0);

    // 2. GET Analysis by ID
    const getRes = await request(app).get(`/api/v1/analyses/${analysisId}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.id).toBe(analysisId);
    expect(getRes.body.data.latestAssessment).toBeDefined();

    // 3. GET History
    const historyRes = await request(app).get(`/api/v1/analyses/${analysisId}/history`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.versions).toHaveLength(1);
    expect(historyRes.body.data.versions[0].version).toBe(1);

    // 4. DELETE Analysis
    const deleteRes = await request(app).delete(`/api/v1/analyses/${analysisId}`);
    expect(deleteRes.status).toBe(200);

    // 5. Verify 404 after deletion
    const verifyRes = await request(app).get(`/api/v1/analyses/${analysisId}`);
    expect(verifyRes.status).toBe(404);
  }, 30000);

  it('should reject invalid GitHub repository URL', async () => {
    const res = await request(app)
      .post('/api/v1/analyses')
      .send({
        repositoryUrl: 'https://invalid-host.com/not/a/repo',
        jobDescription: 'Requirements: - TypeScript',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation failed');
  });
});
