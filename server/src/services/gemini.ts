import { GoogleGenerativeAI } from '@google/generative-ai';
import { RepoFile, SkillAssessment, SkillStatus } from '../models/types';
import { validateSkillAssessmentList } from '../models/schemas';
import { config } from '../config';

export const GEMINI_DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

export interface GeminiDiagnosticResult {
  status: 
    | 'missing_configuration' 
    | 'successful_verification' 
    | 'authentication_failure' 
    | 'quota_limits' 
    | 'model_issues' 
    | 'temporary_errors';
  configured: boolean;
  model: string;
  message: string;
  latencyMs?: number;
  testedAt: string;
}

export interface AssessmentResult {
  assessments: SkillAssessment[];
  assessmentEngine: 'gemini' | 'heuristic_fallback';
  modelUsed: string;
}

function getGeminiClient(): GoogleGenerativeAI | null {
  if (!config.geminiApiKey || config.geminiApiKey === 'your_gemini_api_key_here' || config.geminiApiKey.trim() === '') {
    return null;
  }
  return new GoogleGenerativeAI(config.geminiApiKey.trim());
}

/**
 * Strips code fencing or extra non-JSON markdown formatting from LLM output.
 */
function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

/**
 * Safe connection diagnostic that tests Gemini API connectivity and classifies the status.
 * Never throws — always returns a structured diagnostic result.
 */
export async function diagnoseGeminiConnection(): Promise<GeminiDiagnosticResult> {
  const testedAt = new Date().toISOString();

  if (!config.geminiApiKey || config.geminiApiKey === 'your_gemini_api_key_here' || config.geminiApiKey.trim() === '') {
    return {
      status: 'missing_configuration',
      configured: false,
      model: GEMINI_DEFAULT_MODEL,
      message: 'GEMINI_API_KEY is not configured in server/.env. Using deterministic heuristic assessment fallback.',
      testedAt,
    };
  }

  const client = getGeminiClient();
  if (!client) {
    return {
      status: 'missing_configuration',
      configured: false,
      model: GEMINI_DEFAULT_MODEL,
      message: 'GEMINI_API_KEY is not set or placeholder value used.',
      testedAt,
    };
  }

  const startTime = Date.now();
  const candidateModels = [
    GEMINI_DEFAULT_MODEL,
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ].filter((v, i, a) => a.indexOf(v) === i);

  let verifiedModel = GEMINI_DEFAULT_MODEL;
  let text = '';
  let lastErr: any = null;

  for (const modelName of candidateModels) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Respond with OK' }] }],
      });
      text = result.response.text();
      verifiedModel = modelName;
      if (text) break;
    } catch (err: any) {
      lastErr = err;
    }
  }

  const latencyMs = Date.now() - startTime;

  if (text) {
    return {
      status: 'successful_verification',
      configured: true,
      model: verifiedModel,
      message: `Successfully verified connection to Google Gemini (${verifiedModel}).`,
      latencyMs,
      testedAt,
    };
  }

  const err = lastErr || new Error('Received empty response from Gemini API.');
  const msg = (err.message || '').toLowerCase();
    const statusStr = String(err.status || err.code || '');

    if (msg.includes('api_key') || msg.includes('unauthorized') || msg.includes('401') || msg.includes('403') || msg.includes('forbidden') || statusStr.includes('401') || statusStr.includes('403')) {
      return {
        status: 'authentication_failure',
        configured: true,
        model: GEMINI_DEFAULT_MODEL,
        message: 'Invalid or unauthorized GEMINI_API_KEY. Check your key in Google AI Studio.',
        latencyMs,
        testedAt,
      };
    }

    if (msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('429') || statusStr.includes('429')) {
      return {
        status: 'quota_limits',
        configured: true,
        model: GEMINI_DEFAULT_MODEL,
        message: 'Gemini API quota or rate limit exceeded. Please check project quota in Google Cloud/AI Studio.',
        latencyMs,
        testedAt,
      };
    }

    if (msg.includes('not found') || msg.includes('model') || msg.includes('deprecated') || msg.includes('404')) {
      return {
        status: 'model_issues',
        configured: true,
        model: GEMINI_DEFAULT_MODEL,
        message: `Selected model '${GEMINI_DEFAULT_MODEL}' is unavailable or deprecated.`,
        latencyMs,
        testedAt,
      };
    }

    return {
      status: 'temporary_errors',
      configured: true,
      model: GEMINI_DEFAULT_MODEL,
      message: `Transient error connecting to Gemini API: ${err.message}`,
      latencyMs,
      testedAt,
    };
}

/**
 * Extracts key technical requirements from job text using Gemini.
 */
export async function extractRequirementsWithGemini(jobText: string): Promise<string[]> {
  const client = getGeminiClient();
  if (!client) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const model = client.getGenerativeModel({ model: GEMINI_DEFAULT_MODEL });

  const prompt = `
You are a senior technical recruiter and engineering leader.
Analyze the following job description and extract a concise, deduplicated list of technical skills, technologies, frameworks, and practical engineering requirements that an applicant should possess or demonstrate in code.

Return ONLY a valid JSON array of strings, with each string representing one concrete skill or requirement (e.g., "TypeScript and React", "PostgreSQL database design", "REST API development with Express", "Docker containerization", "Unit testing with Jest").
Do not include generic fluff like "great communication" or "team player".
Max 15 key skills.

Job Description:
${jobText.slice(0, 15000)}
`;

  // Bounded retry with backoff for transient errors
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleaned = cleanJsonOutput(responseText);

      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string' && item.trim())) {
        return parsed.map(s => s.trim());
      }
      throw new Error('Invalid JSON structure for requirements');
    } catch (err: any) {
      lastError = err;
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  throw new Error(`Failed to parse requirements from Gemini output: ${lastError?.message}`);
}

/**
 * Heuristic fallback skill assessment when Gemini API is unavailable.
 * Inspects real file contents for keywords and constructs valid, factual evidence.
 */
export function assessSkillsHeuristic(
  requirements: string[],
  files: RepoFile[]
): SkillAssessment[] {
  const assessments: SkillAssessment[] = [];

  for (const req of requirements) {
    const reqLower = req.toLowerCase();
    const reqWords = reqLower
      .replace(/[^a-z0-9#+.]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !['and', 'the', 'for', 'with', 'using'].includes(w));

    let matchedFile: RepoFile | null = null;
    let matchedExcerpt = '';
    let matchScore = 0;

    for (const file of files) {
      const fileLower = file.content.toLowerCase();
      const pathLower = file.path.toLowerCase();
      let fileScore = 0;

      for (const word of reqWords) {
        if (pathLower.includes(word)) fileScore += 2;
        if (fileLower.includes(word)) fileScore += 1;
      }

      if (fileScore > matchScore) {
        matchScore = fileScore;
        matchedFile = file;

        // Find a representative excerpt
        const lines = file.content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const lineLower = lines[i].toLowerCase();
          if (reqWords.some(w => lineLower.includes(w))) {
            const start = Math.max(0, i - 1);
            const end = Math.min(lines.length, i + 3);
            matchedExcerpt = lines.slice(start, end).join('\n').trim();
            break;
          }
        }
      }
    }

    let status: SkillStatus = 'not_demonstrated_in_scope';
    let reasoning = `No concrete evidence found in repository files demonstrating '${req}'.`;
    const evidenceList = [];

    if (matchScore >= 3 && matchedFile && matchedExcerpt) {
      status = 'demonstrated';
      reasoning = `Found concrete implementation and usage related to '${req}' in repository file ${matchedFile.path}.`;
      evidenceList.push({
        id: '',
        filePath: matchedFile.path,
        excerpt: matchedExcerpt.slice(0, 500),
        commitSha: '',
        githubUrl: '',
        explanation: `Demonstrates implementation related to ${req} in ${matchedFile.path}.`,
      });
    } else if (matchScore >= 1 && matchedFile && matchedExcerpt) {
      status = 'partially_demonstrated';
      reasoning = `Found partial references or configuration matching '${req}' in ${matchedFile.path}.`;
      evidenceList.push({
        id: '',
        filePath: matchedFile.path,
        excerpt: matchedExcerpt.slice(0, 500),
        commitSha: '',
        githubUrl: '',
        explanation: `Partial code evidence related to ${req} in ${matchedFile.path}.`,
      });
    }

    assessments.push({
      skillName: req,
      status,
      evidence: evidenceList,
      reasoning,
    });
  }

  return assessments;
}

/**
 * Assesses job requirements against repository files using Gemini with deterministic fallback.
 * Returns both the assessments and engine/model tracking metadata.
 */
export async function assessSkillsWithGemini(
  requirements: string[],
  files: RepoFile[],
  context: { repoOwner: string; repoName: string }
): Promise<SkillAssessment[]> {
  const result = await assessSkillsWithEngineMetadata(requirements, files, context);
  return result.assessments;
}

/**
 * Full assessment returning assessments, engine name, and model.
 */
export async function assessSkillsWithEngineMetadata(
  requirements: string[],
  files: RepoFile[],
  context: { repoOwner: string; repoName: string }
): Promise<AssessmentResult> {
  const client = getGeminiClient();
  if (!client) {
    console.warn('GEMINI_API_KEY not configured or placeholder used, falling back to heuristic assessment');
    return {
      assessments: assessSkillsHeuristic(requirements, files),
      assessmentEngine: 'heuristic_fallback',
      modelUsed: 'deterministic-heuristic-v1',
    };
  }

  const candidateModels = [
    GEMINI_DEFAULT_MODEL,
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ].filter((v, i, a) => a.indexOf(v) === i);

  // Prepare file summary and bounded content
  const filesRepresentation = files
    .map(f => {
      const truncatedContent = f.content.length > 4000 ? `${f.content.slice(0, 4000)}\n... [truncated]` : f.content;
      return `=== FILE: ${f.path} ===\n${truncatedContent}\n=== END FILE: ${f.path} ===\n`;
    })
    .join('\n\n')
    .slice(0, 40000); // stay well within token limits

  const prompt = `
You are an expert AI Technical Evaluator and Career Coach reviewing a candidate's GitHub repository for ${context.repoOwner}/${context.repoName}.
Your job is to assess whether the repository provides concrete evidence for each job requirement listed below.

Job Requirements:
${JSON.stringify(requirements, null, 2)}

Repository Files Provided:
${filesRepresentation}

Evaluation Rules:
1. For every requirement, evaluate if there is proof in the provided files.
2. Status MUST be exactly one of:
   - "demonstrated": Code clearly demonstrates proficiency with real implementation.
   - "partially_demonstrated": Code shows partial implementation, basic config, or incomplete usage.
   - "not_demonstrated_in_scope": No evidence found in the provided repository files.
   - "unable_to_verify": Ambiguous or cannot be verified solely from the files.
3. CRITICAL EVIDENCE RULES:
   - In "evidence", "filePath" MUST match one of the exact file paths provided above.
   - In "evidence", "excerpt" MUST be an exact verbatim snippet (1-5 lines) from the file content.
   - NEVER make up fake files, fake code snippets, or fabricated paths.
   - If no evidence exists for a skill, the "evidence" array MUST be empty [].
4. Output MUST be ONLY a valid JSON array of objects conforming to this schema:
[
  {
    "skillName": "string",
    "status": "demonstrated" | "partially_demonstrated" | "not_demonstrated_in_scope" | "unable_to_verify",
    "evidence": [
      {
        "filePath": "string",
        "excerpt": "string",
        "explanation": "string"
      }
    ],
    "reasoning": "string"
  }
]
`;

  let lastError: any = null;
  for (const modelName of candidateModels) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = cleanJsonOutput(result.response.text());
      const rawParsed = JSON.parse(text);
      const validated = validateSkillAssessmentList(rawParsed);

      return {
        assessments: validated,
        assessmentEngine: 'gemini',
        modelUsed: modelName,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini model ${modelName} call failed (${err.message}), trying next candidate...`);
    }
  }

  console.warn(`All Gemini candidate models failed (${lastError?.message}), falling back to heuristic evaluation`);
  return {
    assessments: assessSkillsHeuristic(requirements, files),
    assessmentEngine: 'heuristic_fallback',
    modelUsed: 'deterministic-heuristic-v1',
  };
}
