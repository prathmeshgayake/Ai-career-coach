import {
  findLineNumber,
  validateEvidenceItem,
  validateAndSanitizeAssessments,
} from '../../src/services/evidence';
import { RepoFile, SkillAssessment } from '../../src/models/types';

describe('Evidence Validation Service', () => {
  const mockFiles: RepoFile[] = [
    {
      path: 'src/server.ts',
      content: `import express from 'express';\nconst app = express();\napp.get('/health', (req, res) => res.send('ok'));\nexport default app;`,
      size: 110,
    },
    {
      path: 'src/db.ts',
      content: `import { Pool } from 'pg';\nexport const pool = new Pool();\nexport async function query(sql: string) { return pool.query(sql); }`,
      size: 120,
    },
  ];

  describe('findLineNumber', () => {
    it('should find 1-indexed line number of matching excerpt', () => {
      const lineNum = findLineNumber(mockFiles[0].content, "app.get('/health'");
      expect(lineNum).toBe(3);
    });

    it('should return null if excerpt not present', () => {
      const lineNum = findLineNumber(mockFiles[0].content, 'nonexistent code line');
      expect(lineNum).toBeNull();
    });
  });

  describe('validateEvidenceItem', () => {
    const options = {
      owner: 'testowner',
      repo: 'testrepo',
      commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd',
      files: mockFiles,
    };

    it('should validate and augment real code evidence with UUID and pinned GitHub URL', () => {
      const validated = validateEvidenceItem(
        {
          filePath: 'src/server.ts',
          excerpt: `import express from 'express';\nconst app = express();`,
          explanation: 'Express app initialization',
        },
        options
      );

      expect(validated).not.toBeNull();
      expect(validated?.id).toBeDefined();
      expect(validated?.id.length).toBeGreaterThan(10);
      expect(validated?.filePath).toBe('src/server.ts');
      expect(validated?.commitSha).toBe(options.commitSha);
      expect(validated?.githubUrl).toContain('https://github.com/testowner/testrepo/blob/a1b2c3d4e5f6789012345678901234567890abcd/src/server.ts#L1');
    });

    it('should reject evidence pointing to non-existent file path', () => {
      const validated = validateEvidenceItem(
        {
          filePath: 'fake/path/doesNotExist.ts',
          excerpt: 'const x = 1;',
        },
        options
      );

      expect(validated).toBeNull();
    });

    it('should reject evidence with fabricated excerpt not present in the file', () => {
      const validated = validateEvidenceItem(
        {
          filePath: 'src/server.ts',
          excerpt: 'function totallyFabricatedCodeThatDoesNotExist() { return false; }',
        },
        options
      );

      expect(validated).toBeNull();
    });
  });

  describe('validateAndSanitizeAssessments', () => {
    const options = {
      owner: 'testowner',
      repo: 'testrepo',
      commitSha: 'a1b2c3d4e5f6789012345678901234567890abcd',
      files: mockFiles,
    };

    it('should preserve valid assessment with verified evidence', () => {
      const raw: SkillAssessment[] = [
        {
          skillName: 'Express.js',
          status: 'demonstrated',
          evidence: [
            {
              id: '',
              filePath: 'src/server.ts',
              excerpt: "const app = express();",
              commitSha: '',
              githubUrl: '',
              explanation: 'Uses express framework',
            },
          ],
          reasoning: 'Repository clearly creates Express server',
        },
      ];

      const result = validateAndSanitizeAssessments(raw, options);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('demonstrated');
      expect(result[0].evidence).toHaveLength(1);
      expect(result[0].evidence[0].id).toBeDefined();
      expect(result[0].evidence[0].commitSha).toBe(options.commitSha);
    });

    it('should downgrade demonstrated status if all evidence is fabricated', () => {
      const raw: SkillAssessment[] = [
        {
          skillName: 'Docker',
          status: 'demonstrated',
          evidence: [
            {
              id: '',
              filePath: 'Dockerfile', // Does not exist in mockFiles
              excerpt: 'FROM node:18',
              commitSha: '',
              githubUrl: '',
              explanation: 'Uses Docker',
            },
          ],
          reasoning: 'Claims Docker exists',
        },
      ];

      const result = validateAndSanitizeAssessments(raw, options);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('not_demonstrated_in_scope');
      expect(result[0].evidence).toHaveLength(0);
      expect(result[0].reasoning).toContain('Claimed evidence could not be verified');
    });
  });
});
