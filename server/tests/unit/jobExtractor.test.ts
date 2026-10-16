import {
  extractRequirementsHeuristic,
  extractJobSource,
} from '../../src/services/jobExtractor';
import * as geminiModule from '../../src/services/gemini';

describe('Job Extractor Service', () => {
  beforeEach(() => {
    jest.spyOn(geminiModule, 'extractRequirementsWithGemini').mockResolvedValue([
      '3+ years of experience with Node.js and TypeScript',
      'Strong knowledge of PostgreSQL and database schema design',
      'Experience building RESTful APIs with Express',
      'Familiarity with Docker and containerization',
      'Understanding of CI/CD and unit testing with Jest',
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  const sampleJobText = `
Backend Software Engineer
About the Company:
We are building fast data pipelines.

Requirements:
- 3+ years of experience with Node.js and TypeScript
- Strong knowledge of PostgreSQL and database schema design
- Experience building RESTful APIs with Express
- Familiarity with Docker and containerization
- Understanding of CI/CD and unit testing with Jest

Benefits:
- Competitive salary and equity
`;

  describe('extractRequirementsHeuristic', () => {
    it('should extract bullet point requirements from job text', () => {
      const requirements = extractRequirementsHeuristic(sampleJobText);
      expect(requirements.length).toBeGreaterThanOrEqual(4);
      expect(requirements.some(r => r.includes('Node.js and TypeScript'))).toBe(true);
      expect(requirements.some(r => r.includes('PostgreSQL'))).toBe(true);
      expect(requirements.some(r => r.includes('Docker'))).toBe(true);
    });

    it('should ignore benefits section', () => {
      const requirements = extractRequirementsHeuristic(sampleJobText);
      expect(requirements.some(r => r.toLowerCase().includes('competitive salary'))).toBe(false);
    });
  });

  describe('extractJobSource', () => {
    it('should extract job source from pasted description', async () => {
      const jobSource = await extractJobSource({
        description: sampleJobText,
      });

      expect(jobSource.retrievalMethod).toBe('pasted');
      expect(jobSource.pastedDescription).toBeDefined();
      expect(jobSource.requirements.length).toBeGreaterThan(0);
      expect(jobSource.fetchedAt).toBeDefined();
    });

    it('should throw error when description is too short', async () => {
      await expect(
        extractJobSource({ description: 'Too short' })
      ).rejects.toThrow('Job description is too short');
    });

    it('should throw error when neither url nor description is provided', async () => {
      await expect(extractJobSource({})).rejects.toThrow(
        'Either job url or job description must be provided'
      );
    });
  });
});
