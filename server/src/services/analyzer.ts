import { Analysis, AssessmentVersion, JobSource } from '../models/types';
import { generateId } from '../utils/id';
import { GithubService } from './github';
import { extractJobSource } from './jobExtractor';
import { assessSkillsWithEngineMetadata } from './gemini';
import { validateAndSanitizeAssessments } from './evidence';
import { analysisStore } from '../db/analysisStore';
import { jobStore } from '../db/jobStore';
import { pipelineCache, computeSha256 } from './cache';
import { generateRecommendations } from './recommendations';

export interface CreateAnalysisInput {
  jobUrl?: string;
  jobDescription?: string;
  repositoryUrl: string;
  /** Pre-extracted job source from /jobs/preview — skips re-fetching the URL */
  previewedJobSource?: JobSource;
  userId?: string;
}

export class AnalyzerService {
  /**
   * Runs the complete end-to-end analysis pipeline with 7-stage profiling & caching.
   */
  static async runInitialAnalysis(input: CreateAnalysisInput): Promise<{
    analysis: Analysis;
    assessment: AssessmentVersion;
  }> {
    const pipelineStart = Date.now();
    const analysisId = generateId();
    const now = new Date().toISOString();

    // Stage 1 & 2: Job description retrieval and Requirement extraction
    const tJobStart = Date.now();
    let jobRetrievalMs = 0;
    let requirementExtractionMs = 0;

    let jobSource: JobSource;
    if (
      input.previewedJobSource &&
      Array.isArray(input.previewedJobSource.requirements) &&
      input.previewedJobSource.requirements.length > 0
    ) {
      jobSource = input.previewedJobSource;
      jobRetrievalMs = 0;
      requirementExtractionMs = 0;
    } else {
      jobSource = await extractJobSource({
        url: input.jobUrl,
        description: input.jobDescription,
      });
      const tJobEnd = Date.now();
      jobRetrievalMs = Math.round((tJobEnd - tJobStart) * 0.4);
      requirementExtractionMs = Math.round((tJobEnd - tJobStart) * 0.6);
    }

    const jobId = generateId();
    await jobStore.saveJobSource(jobId, jobSource);

    // 1. Validate repository URL
    const { owner, repo } = GithubService.parseRepoUrl(input.repositoryUrl);

    // 3. Initialize Analysis record
    const analysis: Analysis = {
      id: analysisId,
      userId: input.userId || '',
      jobSource,
      repositoryUrl: input.repositoryUrl.trim(),
      repositoryOwner: owner,
      repositoryName: repo,
      currentVersion: 0,
      latestCommitSha: '',
      status: 'analyzing',
      createdAt: now,
      updatedAt: now,
    };
    await analysisStore.saveAnalysis(analysis);

    try {
      // Stage 3: GitHub repository and file retrieval
      const tGithubStart = Date.now();
      const commitSha = await GithubService.getLatestCommitSha(owner, repo);
      analysis.latestCommitSha = commitSha;

      const repoFiles = await GithubService.getRepoFiles(owner, repo, commitSha);
      if (repoFiles.length === 0) {
        throw new Error(`No indexable source code files found in repository ${owner}/${repo}`);
      }
      const githubRetrievalMs = Date.now() - tGithubStart;

      // Stage 4: Evidence selection / filtering
      const tEvidenceSelectionStart = Date.now();
      // Files are already filtered & prioritized by GithubService
      const evidenceSelectionMs = Date.now() - tEvidenceSelectionStart;

      // Stage 5: LLM request (with caching for identical jobHash:owner:repo:commitSha)
      const tLlmStart = Date.now();
      const jobHash = computeSha256(jobSource.rawContent || JSON.stringify(jobSource.requirements));
      const assessmentCacheKey = `${jobHash}:${owner.toLowerCase()}:${repo.toLowerCase()}:${commitSha}`;
      
      let rawAssessments;
      let assessmentEngine: 'gemini' | 'heuristic_fallback';
      let modelUsed: string;

      const cachedAssessment = pipelineCache.getAssessmentResult(assessmentCacheKey);
      if (cachedAssessment) {
        rawAssessments = cachedAssessment.assessments;
        assessmentEngine = cachedAssessment.assessmentEngine;
        modelUsed = `${cachedAssessment.modelUsed} (cached)`;
      } else {
        const result = await assessSkillsWithEngineMetadata(
          jobSource.requirements,
          repoFiles,
          {
            repoOwner: owner,
            repoName: repo,
          }
        );
        rawAssessments = result.assessments;
        assessmentEngine = result.assessmentEngine;
        modelUsed = result.modelUsed;

        pipelineCache.setAssessmentResult(assessmentCacheKey, {
          assessments: rawAssessments,
          assessmentEngine,
          modelUsed,
        });
      }
      const llmRequestMs = Date.now() - tLlmStart;

      // Stage 6: Evidence validation (UUID generation, line excerpts, GitHub URL pinning)
      const tValidationStart = Date.now();
      const validatedAssessments = validateAndSanitizeAssessments(rawAssessments, {
        owner,
        repo,
        commitSha,
        files: repoFiles,
      });
      const evidenceValidationMs = Date.now() - tValidationStart;

      // Stage 7: Database persistence and response
      const tDbStart = Date.now();
      const totalSoFar = Date.now() - pipelineStart;
      const stageDurations = {
        jobRetrievalMs,
        requirementExtractionMs,
        githubRetrievalMs,
        evidenceSelectionMs,
        llmRequestMs,
        evidenceValidationMs,
        dbPersistenceMs: 0,
        totalDurationMs: totalSoFar,
      };

      const assessmentVersion: AssessmentVersion = {
        id: generateId(),
        analysisId,
        version: 1,
        commitSha,
        assessments: validatedAssessments,
        trigger: 'initial',
        createdAt: new Date().toISOString(),
        assessmentEngine,
        modelUsed,
        stageDurations,
        recommendations: generateRecommendations(validatedAssessments),
      };

      await analysisStore.saveAssessmentVersion(assessmentVersion);

      analysis.currentVersion = 1;
      analysis.status = 'completed';
      analysis.updatedAt = new Date().toISOString();
      await analysisStore.saveAnalysis(analysis);

      const dbPersistenceMs = Date.now() - tDbStart;
      stageDurations.dbPersistenceMs = dbPersistenceMs;
      stageDurations.totalDurationMs = Date.now() - pipelineStart;

      // Server-side stage duration logging (no secrets or sensitive data)
      console.log(`[Stage Profiler] Analysis ${analysisId} (${owner}/${repo}@${commitSha.slice(0, 7)}) completed in ${stageDurations.totalDurationMs}ms:`, {
        jobRetrieval: `${jobRetrievalMs}ms`,
        requirementExtraction: `${requirementExtractionMs}ms`,
        githubRetrieval: `${githubRetrievalMs}ms`,
        evidenceSelection: `${evidenceSelectionMs}ms`,
        llmRequest: `${llmRequestMs}ms`,
        evidenceValidation: `${evidenceValidationMs}ms`,
        dbPersistence: `${dbPersistenceMs}ms`,
      });

      return {
        analysis,
        assessment: assessmentVersion,
      };
    } catch (err: any) {
      analysis.status = 'failed';
      analysis.errorMessage = err?.message || 'Analysis failed due to an unexpected error';
      analysis.updatedAt = new Date().toISOString();
      await analysisStore.saveAnalysis(analysis);
      throw err;
    }
  }

  /**
   * Reassesses an existing analysis when new commits are detected.
   */
  static async reassessOnCommit(
    analysisId: string,
    newCommitSha: string,
    changedFiles: string[] = []
  ): Promise<AssessmentVersion> {
    const analysis = await analysisStore.getAnalysis(analysisId);
    if (!analysis) {
      throw new Error(`Analysis ${analysisId} not found`);
    }

    const { repositoryOwner: owner, repositoryName: repo, jobSource } = analysis;
    const nextVersion = (analysis.currentVersion || 0) + 1;

    const pipelineStart = Date.now();

    // Invalidate prior commit cache for this repository so new commit evidence is fresh
    pipelineCache.invalidateRepo(owner, repo);

    // Fetch files at new commit SHA
    const tGithubStart = Date.now();
    const repoFiles = await GithubService.getRepoFiles(owner, repo, newCommitSha);
    if (repoFiles.length === 0) {
      throw new Error(`No files found in ${owner}/${repo} at commit ${newCommitSha}`);
    }
    const githubRetrievalMs = Date.now() - tGithubStart;

    // Run assessment
    const tLlmStart = Date.now();
    const { assessments: rawAssessments, assessmentEngine, modelUsed } = await assessSkillsWithEngineMetadata(
      jobSource.requirements,
      repoFiles,
      {
        repoOwner: owner,
        repoName: repo,
      }
    );
    const llmRequestMs = Date.now() - tLlmStart;

    // Validate evidence against new commit SHA
    const tValidationStart = Date.now();
    const validatedAssessments = validateAndSanitizeAssessments(rawAssessments, {
      owner,
      repo,
      commitSha: newCommitSha,
      files: repoFiles,
    });
    const evidenceValidationMs = Date.now() - tValidationStart;

    const tDbStart = Date.now();
    const stageDurations = {
      githubRetrievalMs,
      evidenceSelectionMs: 0,
      llmRequestMs,
      evidenceValidationMs,
      dbPersistenceMs: 0,
      totalDurationMs: Date.now() - pipelineStart,
    };

    const newVersion: AssessmentVersion = {
      id: generateId(),
      analysisId,
      version: nextVersion,
      commitSha: newCommitSha,
      assessments: validatedAssessments,
      trigger: 'commit_change',
      createdAt: new Date().toISOString(),
      changedFiles,
      assessmentEngine,
      modelUsed,
      stageDurations,
      recommendations: generateRecommendations(validatedAssessments),
    };

    await analysisStore.saveAssessmentVersion(newVersion);

    // Update analysis record
    await analysisStore.updateAnalysis(analysisId, {
      currentVersion: nextVersion,
      latestCommitSha: newCommitSha,
      status: 'completed',
    });

    const dbPersistenceMs = Date.now() - tDbStart;
    stageDurations.dbPersistenceMs = dbPersistenceMs;
    stageDurations.totalDurationMs = Date.now() - pipelineStart;

    console.log(`[Stage Profiler] Reassessment ${analysisId} (v${nextVersion} @ ${newCommitSha.slice(0, 7)}) completed in ${stageDurations.totalDurationMs}ms:`, {
      githubRetrieval: `${githubRetrievalMs}ms`,
      llmRequest: `${llmRequestMs}ms`,
      evidenceValidation: `${evidenceValidationMs}ms`,
      dbPersistence: `${dbPersistenceMs}ms`,
    });

    return newVersion;
  }
}
