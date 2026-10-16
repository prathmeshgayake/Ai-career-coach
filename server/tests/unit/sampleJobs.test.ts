import request from 'supertest';
import { app } from '../../src/app';
import { SAMPLE_JOBS } from '../../src/data/sampleJobs';

describe('Sample Jobs Library Endpoints', () => {
  it('should return the curated list of sample jobs', async () => {
    const res = await request(app).get('/api/v1/jobs/samples');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);

    // Verify categories cover frontend, backend, fullstack
    const categories = res.body.data.map((j: any) => j.category);
    expect(categories).toContain('frontend');
    expect(categories).toContain('backend');
    expect(categories).toContain('fullstack');

    // Verify verification status and attribution
    res.body.data.forEach((job: any) => {
      expect(job.id).toBeDefined();
      expect(job.title).toBeDefined();
      expect(job.company).toBeDefined();
      expect(job.sourceUrl).toBeDefined();
      expect(['verified_active', 'practice_sample', 'expired']).toContain(job.verificationStatus);
      expect(Array.isArray(job.requirements)).toBe(true);
      expect(job.requirements.length).toBeGreaterThan(0);
    });
  });

  it('should return a specific sample job by ID', async () => {
    const firstId = SAMPLE_JOBS[0].id;
    const res = await request(app).get(`/api/v1/jobs/samples/${firstId}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.id).toBe(firstId);
    expect(res.body.data.title).toBe(SAMPLE_JOBS[0].title);
  });

  it('should return 404 for unknown sample job ID', async () => {
    const res = await request(app).get('/api/v1/jobs/samples/non-existent-role');

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });
});
