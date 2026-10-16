import { Evidence, RepoFile, SkillAssessment, SkillStatus } from '../models/types';
import { generateId } from '../utils/id';
import { VALID_SKILL_STATUSES } from '../models/schemas';

export interface EvidenceValidationOptions {
  owner: string;
  repo: string;
  commitSha: string;
  files: RepoFile[];
}

/**
 * Finds the starting line number (1-indexed) of an excerpt within a file's content.
 */
export function findLineNumber(fileContent: string, excerpt: string): number | null {
  if (!fileContent || !excerpt) return null;

  const firstExcerptLine = excerpt.split('\n')[0].trim();
  if (!firstExcerptLine) return null;

  const lines = fileContent.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(firstExcerptLine)) {
      return i + 1;
    }
  }

  return null;
}

/**
 * Validates a single piece of evidence against repository files.
 */
export function validateEvidenceItem(
  rawEvidence: Partial<Evidence>,
  options: EvidenceValidationOptions
): Evidence | null {
  const { owner, repo, commitSha, files } = options;

  if (!rawEvidence.filePath || typeof rawEvidence.filePath !== 'string') {
    return null;
  }

  const normalizedPath = rawEvidence.filePath.trim().replace(/\\/g, '/');
  const targetFile = files.find(
    f => f.path.toLowerCase() === normalizedPath.toLowerCase() ||
         f.path.toLowerCase().endsWith(normalizedPath.toLowerCase())
  );

  if (!targetFile) {
    // Reject evidence pointing to non-existent file in repository
    return null;
  }

  const excerpt = typeof rawEvidence.excerpt === 'string' ? rawEvidence.excerpt.trim() : '';
  if (!excerpt) {
    return null;
  }

  // Check if excerpt exists in the file content (ignoring excessive whitespace)
  const normalizedFileContent = targetFile.content.replace(/\s+/g, ' ');
  const normalizedExcerpt = excerpt.replace(/\s+/g, ' ');

  if (!normalizedFileContent.includes(normalizedExcerpt)) {
    // Also check if any significant line from excerpt matches
    const excerptLines = excerpt.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    const hasLineMatch = excerptLines.some(l => targetFile.content.includes(l));
    if (!hasLineMatch) {
      // Excerpt is fabricated or doesn't match file content
      return null;
    }
  }

  const lineNum = findLineNumber(targetFile.content, excerpt);
  const lineAnchor = lineNum ? `#L${lineNum}` : '';
  const githubUrl = `https://github.com/${owner}/${repo}/blob/${commitSha}/${targetFile.path}${lineAnchor}`;

  return {
    id: generateId(),
    filePath: targetFile.path,
    excerpt: excerpt.slice(0, 800),
    commitSha,
    githubUrl,
    explanation: typeof rawEvidence.explanation === 'string' && rawEvidence.explanation.trim()
      ? rawEvidence.explanation.trim()
      : `Code evidence in ${targetFile.path}`,
  };
}

/**
 * Validates a list of SkillAssessments:
 * - Generates server UUIDs for evidence
 * - Validates files and excerpts against actual repository files
 * - Pins GitHub URLs to commit SHA
 * - Corrects any fabricated claims
 */
export function validateAndSanitizeAssessments(
  assessments: SkillAssessment[],
  options: EvidenceValidationOptions
): SkillAssessment[] {
  const sanitizedList: SkillAssessment[] = [];

  for (const item of assessments) {
    const status: SkillStatus = VALID_SKILL_STATUSES.includes(item.status)
      ? item.status
      : 'unable_to_verify';

    const validatedEvidence: Evidence[] = [];

    if (Array.isArray(item.evidence)) {
      for (const ev of item.evidence) {
        const validated = validateEvidenceItem(ev, options);
        if (validated) {
          validatedEvidence.push(validated);
        }
      }
    }

    let finalStatus = status;
    let finalReasoning = item.reasoning || '';

    // If status was demonstrated but evidence was fabricated/stripped, adjust status
    if (finalStatus === 'demonstrated' && validatedEvidence.length === 0) {
      finalStatus = 'not_demonstrated_in_scope';
      finalReasoning = `${item.skillName}: Claimed evidence could not be verified in the repository files.`;
    } else if (finalStatus === 'partially_demonstrated' && validatedEvidence.length === 0) {
      finalStatus = 'not_demonstrated_in_scope';
      finalReasoning = `${item.skillName}: No verifiable code evidence found in repository.`;
    }

    sanitizedList.push({
      skillName: item.skillName.trim(),
      status: finalStatus,
      evidence: validatedEvidence,
      reasoning: finalReasoning.trim(),
    });
  }

  return sanitizedList;
}
