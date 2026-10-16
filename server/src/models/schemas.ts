import { SkillAssessment, SkillStatus } from './types';

export const VALID_SKILL_STATUSES: SkillStatus[] = [
  'demonstrated',
  'partially_demonstrated',
  'not_demonstrated_in_scope',
  'unable_to_verify',
];

/**
 * Validates and extracts owner and repo name from a GitHub repository URL.
 */
export function parseGithubUrl(rawUrl: string): { owner: string; repo: string } | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  let trimmed = rawUrl.trim();

  // Strip query string and fragment
  trimmed = trimmed.split('?')[0].split('#')[0];

  // Must be a github.com URL
  const base = trimmed.match(/^https?:\/\/(?:www\.)?github\.com\/(.+)/);
  if (!base) return null;

  const rest = base[1];
  // Split remaining path into parts
  const parts = rest.split('/').filter(Boolean);

  if (parts.length < 2) return null;

  const owner = parts[0];
  // Strip .git suffix from repo name
  const repo = parts[1].replace(/\.git$/, '');

  if (!owner || !repo) return null;

  // Validate chars — owner and repo must be valid GitHub names
  if (!/^[a-zA-Z0-9_.-]+$/.test(owner) || !/^[a-zA-Z0-9_.-]+$/.test(repo)) return null;

  return { owner, repo };
}

/**
 * Validates that an object conforms to SkillAssessment structure.
 */
export function isValidSkillAssessment(item: any): item is SkillAssessment {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.skillName !== 'string' || !item.skillName.trim()) return false;
  if (!VALID_SKILL_STATUSES.includes(item.status)) return false;
  if (typeof item.reasoning !== 'string') return false;
  if (!Array.isArray(item.evidence)) return false;

  for (const ev of item.evidence) {
    if (!ev || typeof ev !== 'object') return false;
    if (typeof ev.filePath !== 'string' || !ev.filePath.trim()) return false;
    if (typeof ev.excerpt !== 'string') return false;
    if (typeof ev.explanation !== 'string') return false;
  }

  return true;
}

/**
 * Validates an array of SkillAssessments parsed from AI response.
 */
export function validateSkillAssessmentList(data: unknown): SkillAssessment[] {
  if (!Array.isArray(data)) {
    throw new Error('AI output must be an array of skill assessments');
  }

  const validated: SkillAssessment[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!isValidSkillAssessment(item)) {
      throw new Error(`Item at index ${i} is not a valid SkillAssessment`);
    }
    validated.push({
      skillName: item.skillName.trim(),
      status: item.status,
      evidence: item.evidence.map((ev: any) => ({
        id: typeof ev.id === 'string' && ev.id ? ev.id : '',
        filePath: ev.filePath.trim(),
        excerpt: ev.excerpt.trim(),
        commitSha: typeof ev.commitSha === 'string' ? ev.commitSha : '',
        githubUrl: typeof ev.githubUrl === 'string' ? ev.githubUrl : '',
        explanation: ev.explanation.trim(),
      })),
      reasoning: item.reasoning.trim(),
    });
  }

  if (validated.length === 0) {
    throw new Error('AI output contained zero assessments');
  }

  return validated;
}
