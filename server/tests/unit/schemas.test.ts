import {
  parseGithubUrl,
  isValidSkillAssessment,
  validateSkillAssessmentList,
  VALID_SKILL_STATUSES,
} from '../../src/models/schemas';

describe('Validation Schemas & Models', () => {
  describe('VALID_SKILL_STATUSES', () => {
    it('should include all required skill assessment status values', () => {
      expect(VALID_SKILL_STATUSES).toContain('demonstrated');
      expect(VALID_SKILL_STATUSES).toContain('partially_demonstrated');
      expect(VALID_SKILL_STATUSES).toContain('not_demonstrated_in_scope');
      expect(VALID_SKILL_STATUSES).toContain('unable_to_verify');
    });
  });

  describe('parseGithubUrl', () => {
    it('should extract owner and repo from various GitHub URL formats', () => {
      expect(parseGithubUrl('https://github.com/torvalds/linux')).toEqual({
        owner: 'torvalds',
        repo: 'linux',
      });
      expect(parseGithubUrl('https://github.com/expressjs/express.git')).toEqual({
        owner: 'expressjs',
        repo: 'express',
      });
      expect(parseGithubUrl('https://www.github.com/facebook/react/')).toEqual({
        owner: 'facebook',
        repo: 'react',
      });
      expect(parseGithubUrl('https://github.com/facebook/react/tree/main')).toEqual({
        owner: 'facebook',
        repo: 'react',
      });
      expect(parseGithubUrl('https://github.com/facebook/react/blob/master/README.md')).toEqual({
        owner: 'facebook',
        repo: 'react',
      });
      expect(parseGithubUrl('https://github.com/facebook/react?tab=readme-ov-file#readme')).toEqual({
        owner: 'facebook',
        repo: 'react',
      });
    });

    it('should return null for non-github URLs or malformed URLs', () => {
      expect(parseGithubUrl('https://gitlab.com/owner/repo')).toBeNull();
      expect(parseGithubUrl('http://github.com')).toBeNull();
      expect(parseGithubUrl('')).toBeNull();
      expect(parseGithubUrl(null as any)).toBeNull();
    });
  });

  describe('isValidSkillAssessment', () => {
    it('should return true for valid skill assessment structure', () => {
      const valid = {
        skillName: 'TypeScript',
        status: 'demonstrated',
        evidence: [
          {
            filePath: 'src/index.ts',
            excerpt: 'const x: number = 42;',
            explanation: 'TypeScript variable annotation',
          },
        ],
        reasoning: 'Repository uses TypeScript',
      };
      expect(isValidSkillAssessment(valid)).toBe(true);
    });

    it('should return false for invalid statuses', () => {
      const invalid = {
        skillName: 'TypeScript',
        status: 'mastered', // Invalid status
        evidence: [],
        reasoning: 'Repository uses TypeScript',
      };
      expect(isValidSkillAssessment(invalid)).toBe(false);
    });

    it('should return false if skillName is empty', () => {
      const invalid = {
        skillName: '   ',
        status: 'demonstrated',
        evidence: [],
        reasoning: 'Reason',
      };
      expect(isValidSkillAssessment(invalid)).toBe(false);
    });
  });

  describe('validateSkillAssessmentList', () => {
    it('should validate and return list of skill assessments', () => {
      const input = [
        {
          skillName: 'React',
          status: 'demonstrated',
          evidence: [
            {
              filePath: 'src/App.tsx',
              excerpt: 'export function App() { return <div>Hello</div>; }',
              explanation: 'React component',
            },
          ],
          reasoning: 'Found App component',
        },
      ];

      const result = validateSkillAssessmentList(input);
      expect(result).toHaveLength(1);
      expect(result[0].skillName).toBe('React');
      expect(result[0].status).toBe('demonstrated');
    });

    it('should throw if input is not an array', () => {
      expect(() => validateSkillAssessmentList('not an array')).toThrow(
        'AI output must be an array'
      );
    });

    it('should throw if array is empty', () => {
      expect(() => validateSkillAssessmentList([])).toThrow(
        'AI output contained zero assessments'
      );
    });
  });
});
