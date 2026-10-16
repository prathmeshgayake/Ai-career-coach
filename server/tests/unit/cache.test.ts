import { pipelineCache, computeSha256 } from '../../src/services/cache';

describe('Pipeline Cache Manager', () => {
  beforeEach(() => {
    pipelineCache.clear();
  });

  it('should compute consistent sha256 hash', () => {
    const hash1 = computeSha256('https://careers.google.com');
    const hash2 = computeSha256('https://careers.google.com');
    const hash3 = computeSha256('https://careers.other.com');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toHaveLength(64);
  });

  it('should store and retrieve job source by cache key', () => {
    const key = computeSha256('sample job description');
    const mockJob: any = {
      retrievalMethod: 'pasted',
      requirements: ['TypeScript', 'Jest'],
      rawContent: 'sample job description',
      fetchedAt: new Date().toISOString(),
    };

    expect(pipelineCache.getJobSource(key)).toBeNull();

    pipelineCache.setJobSource(key, mockJob);
    const retrieved = pipelineCache.getJobSource(key);

    expect(retrieved).toEqual(mockJob);
  });

  it('should store, retrieve, and invalidate repo files by owner:repo:sha', () => {
    const mockFiles: any = [
      { path: 'src/index.ts', content: 'console.log("hello")', size: 21 },
    ];

    pipelineCache.setRepoFiles('octocat', 'hello-world', 'abc1234', mockFiles);

    const retrieved = pipelineCache.getRepoFiles('octocat', 'hello-world', 'abc1234');
    expect(retrieved).toEqual(mockFiles);

    // Invalidate repo
    pipelineCache.invalidateRepo('octocat', 'hello-world');
    expect(pipelineCache.getRepoFiles('octocat', 'hello-world', 'abc1234')).toBeNull();
  });

  it('should store and retrieve assessment results', () => {
    const key = 'jobhash:owner:repo:sha';
    const mockResult: any = {
      assessments: [{ skillName: 'React', status: 'demonstrated', evidence: [], reasoning: 'ok' }],
      assessmentEngine: 'gemini',
      modelUsed: 'gemini-3.5-flash',
    };

    pipelineCache.setAssessmentResult(key, mockResult);
    expect(pipelineCache.getAssessmentResult(key)).toEqual(mockResult);
  });
});
