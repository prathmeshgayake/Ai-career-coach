import request from 'supertest';
import { app } from '../../src/app';
import { monitorService } from '../../src/services/monitor';

describe('API Integration Tests', () => {
  describe('GET /api/v1/health', () => {
    it('should return 200 with server health status and monitoring info', async () => {
      const res = await request(app).get('/api/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.monitoring).toBeDefined();
      expect(res.body.integrations).toBeDefined();
    });

    it('should return 200 with comprehensive diagnostic report', async () => {
      const res = await request(app).get('/api/v1/health/diagnostics');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.diagnostics).toBeDefined();
      expect(res.body.diagnostics.gemini).toBeDefined();
      expect(res.body.diagnostics.gemini.status).toBeDefined();
      expect(res.body.diagnostics.monitoring).toBeDefined();
      expect(res.body.diagnostics.github).toBeDefined();
      expect(res.body.diagnostics.persistence).toBeDefined();
    });
  });

  describe('POST /api/v1/jobs/preview', () => {
    it('should extract and preview requirements from pasted job description', async () => {
      const res = await request(app)
        .post('/api/v1/jobs/preview')
        .send({
          description: `
          Frontend Engineer Position
          Requirements:
          - Proficient in React and modern JavaScript/TypeScript
          - Experience with CSS Modules and Tailwind
          - Familiar with Git workflow and Jest unit testing
          `,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.retrievalMethod).toBe('pasted');
      expect(Array.isArray(res.body.data.requirements)).toBe(true);
      expect(res.body.data.requirements.length).toBeGreaterThan(0);
    });

    it('should return 400 if neither url nor description provided', async () => {
      const res = await request(app).post('/api/v1/jobs/preview').send({});

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should return 400 if description is too short', async () => {
      const res = await request(app).post('/api/v1/jobs/preview').send({
        description: 'short',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/repositories/validate', () => {
    it('should reject invalid or missing repositoryUrl', async () => {
      const res = await request(app).post('/api/v1/repositories/validate').send({});
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('should reject non-GitHub URLs', async () => {
      const res = await request(app).post('/api/v1/repositories/validate').send({
        repositoryUrl: 'https://gitlab.com/owner/repo',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid GitHub repository URL');
    });
  });

  describe('POST /api/v1/internal/poll Authorization', () => {
    it('should reject unauthorized request without poll secret', async () => {
      const res = await request(app).post('/api/v1/internal/poll').send({});

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Unauthorized');
    });

    it('should reject request with incorrect poll secret', async () => {
      const res = await request(app)
        .post('/api/v1/internal/poll')
        .set('x-poll-secret', 'wrong_secret')
        .send({});

      expect(res.status).toBe(401);
    });

    it('should permit request with valid x-poll-secret header', async () => {
      const pollSpy = jest.spyOn(monitorService, 'pollAll').mockResolvedValueOnce({
        polled: 1,
        changesDetected: 0,
        errors: 0,
      });

      const res = await request(app)
        .post('/api/v1/internal/poll')
        .set('x-poll-secret', 'test_poll_secret')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(pollSpy).toHaveBeenCalled();
      pollSpy.mockRestore();
    });
  });

  describe('Route 404 Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const res = await request(app).get('/api/v1/unknown-endpoint');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('ROUTE_NOT_FOUND');
    });
  });
});
