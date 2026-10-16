import { safeFetch, SsrfError } from '../utils/ssrf';
import { stripHtml, sanitizeString } from '../utils/sanitize';
import { JobSource } from '../models/types';
import { extractRequirementsWithGemini } from './gemini';
import { pipelineCache, computeSha256 } from './cache';

export interface ExtractJobInput {
  url?: string;
  description?: string;
}

/**
 * Fallback parser for extracting requirements from job text when AI is unavailable or as a baseline.
 */
export function extractRequirementsHeuristic(text: string): string[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const requirements: string[] = [];
  const bulletRegex = /^[-*•·–—\d+.)\]]+\s*(.*)$/;
  const techKeywords = [
    'experience', 'proficien', 'knowledge', 'understanding', 'familiar',
    'skill', 'develop', 'design', 'implement', 'build', 'framework',
    'python', 'javascript', 'typescript', 'react', 'node', 'express',
    'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'sql', 'nosql',
    'rest', 'graphql', 'git', 'ci/cd', 'testing', 'unit test', 'agile',
  ];

  let inRequirementsSection = false;

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Check for section headers
    if (
      lower.includes('requirement') ||
      lower.includes('qualification') ||
      lower.includes('what you will need') ||
      lower.includes("what you'll need") ||
      lower.includes('who you are') ||
      lower.includes('skills & experience') ||
      lower.includes('must have') ||
      lower.includes('minimum qualification')
    ) {
      inRequirementsSection = true;
      continue;
    }

    // Stop if we hit benefits or about company
    if (
      inRequirementsSection &&
      (lower.includes('benefits') ||
        lower.includes('perks') ||
        lower.includes('about us') ||
        lower.includes('about the company') ||
        lower.includes('compensation') ||
        lower.includes('equal opportunity'))
    ) {
      inRequirementsSection = false;
      continue;
    }

    const bulletMatch = line.match(bulletRegex);
    const content = bulletMatch ? bulletMatch[1].trim() : line;

    // Line is a candidate if we are in the section or if it matches keywords and has good length
    if (content.length >= 15 && content.length <= 300) {
      if (inRequirementsSection) {
        if (!requirements.includes(content)) {
          requirements.push(content);
        }
      } else if (bulletMatch && techKeywords.some(kw => lower.includes(kw))) {
        if (!requirements.includes(content)) {
          requirements.push(content);
        }
      }
    }
  }

  // If section parsing found few, scan all lines with bullets & tech keywords
  if (requirements.length < 3) {
    for (const line of lines) {
      const bulletMatch = line.match(bulletRegex);
      const content = bulletMatch ? bulletMatch[1].trim() : line;
      const lower = content.toLowerCase();
      if (
        content.length >= 15 &&
        content.length <= 250 &&
        techKeywords.some(kw => lower.includes(kw))
      ) {
        if (!requirements.includes(content)) {
          requirements.push(content);
        }
      }
    }
  }

  // If still empty, grab meaningful sentences
  if (requirements.length === 0) {
    const sentences = text
      .split(/[.\n]/)
      .map(s => s.trim())
      .filter(s => s.length >= 20 && s.length <= 200);
    return sentences.slice(0, 10);
  }

  return requirements.slice(0, 20);
}

/**
 * Extracts job content from URL or pasted description and extracts structured skill requirements.
 */
export async function extractJobSource(input: ExtractJobInput): Promise<JobSource> {
  const cacheKey = computeSha256(input.url ? `url:${input.url}` : `desc:${input.description || ''}`);
  const cached = pipelineCache.getJobSource(cacheKey);
  if (cached && cached.requirements && cached.requirements.length > 0) {
    return cached;
  }

  const now = new Date().toISOString();

  if (input.url && input.url.trim()) {
    const targetUrl = input.url.trim();
    try {
      const response = await safeFetch(targetUrl);
      const isHtml = response.contentType.toLowerCase().includes('text/html');
      const rawText = isHtml ? stripHtml(response.data) : response.data;
      const cleaned = sanitizeString(rawText, 50000);

      if (!cleaned || cleaned.length < 50) {
        throw new Error('Fetched job content is too short or empty');
      }

      let requirements: string[] = [];
      try {
        requirements = await extractRequirementsWithGemini(cleaned);
      } catch (geminiErr: any) {
        console.warn('Gemini extraction failed or unavailable, using heuristic parser:', geminiErr.message);
        requirements = extractRequirementsHeuristic(cleaned);
      }

      if (requirements.length === 0) {
        requirements = extractRequirementsHeuristic(cleaned);
      }

      const jobSource: JobSource = {
        url: targetUrl,
        retrievalMethod: 'url_fetch',
        requirements,
        rawContent: cleaned,
        fetchedAt: now,
      };

      pipelineCache.setJobSource(cacheKey, jobSource);
      return jobSource;
    } catch (err: any) {
      if (err instanceof SsrfError) {
        throw new Error(`Security validation failed for job URL: ${err.message}`);
      }
      throw new Error(`Failed to fetch and parse job posting from URL: ${err.message}`);
    }
  }

  if (input.description && input.description.trim()) {
    const rawText = input.description.trim();
    const cleaned = sanitizeString(rawText, 50000);

    if (cleaned.length < 20) {
      throw new Error('Job description is too short (minimum 20 characters required)');
    }

    let requirements: string[] = [];
    try {
      requirements = await extractRequirementsWithGemini(cleaned);
    } catch (geminiErr: any) {
      console.warn('Gemini extraction failed or unavailable, using heuristic parser:', geminiErr.message);
      requirements = extractRequirementsHeuristic(cleaned);
    }

    if (requirements.length === 0) {
      requirements = extractRequirementsHeuristic(cleaned);
    }

    const jobSource: JobSource = {
      pastedDescription: cleaned,
      retrievalMethod: 'pasted',
      requirements,
      rawContent: cleaned,
      fetchedAt: now,
    };

    pipelineCache.setJobSource(cacheKey, jobSource);
    return jobSource;
  }

  throw new Error('Either job url or job description must be provided');
}
