export type SkillStatus = 
  | 'demonstrated' 
  | 'partially_demonstrated' 
  | 'not_demonstrated_in_scope' 
  | 'unable_to_verify';

export interface Evidence {
  id: string;
  filePath: string;
  excerpt: string;
  commitSha: string;
  githubUrl: string;
  explanation: string;
}

export interface SkillAssessment {
  skillName: string;
  status: SkillStatus;
  evidence: Evidence[];
  reasoning: string;
}

export interface AssessmentVersion {
  id: string;
  analysisId: string;
  version: number;
  commitSha: string;
  assessments: SkillAssessment[];
  trigger: 'initial' | 'commit_change';
  createdAt: string;
  changedFiles?: string[];
  assessmentEngine?: 'gemini' | 'heuristic_fallback';
  modelUsed?: string;
  stageDurations?: {
    jobRetrievalMs?: number;
    requirementExtractionMs?: number;
    githubRetrievalMs?: number;
    evidenceSelectionMs?: number;
    llmRequestMs?: number;
    evidenceValidationMs?: number;
    dbPersistenceMs?: number;
    totalDurationMs?: number;
  };
  recommendations?: Recommendation[];
}

export interface Recommendation {
  id: string;
  skillName: string;
  priority: 'high' | 'medium' | 'low';
  actionTitle: string;
  explanation: string;
  suggestedTask: string;
}

export interface ActionPlanTask {
  id: string;
  title: string;
  skillName: string;
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  description: string;
  codeTask: string;
  githubGuidance: string;
  isCompleted?: boolean;
}

export interface ActionPlanPhase {
  phaseNumber: number;
  phaseTitle: string;
  timeframe: string;
  objective: string;
  tasks: ActionPlanTask[];
}

export interface ActionPlan {
  studentId: string;
  studentName: string;
  targetRole: string;
  overallReadinessScore: number;
  generatedAt: string;
  phases: ActionPlanPhase[];
  keyAdvice: string[];
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  targetRoles: string[];
  githubUsername: string;
  avatarUrl?: string;
  bio: string;
}

export type User = StudentProfile;

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Analysis {
  id: string;
  userId?: string;
  jobSource: {
    url?: string;
    pastedDescription?: string;
    retrievalMethod: 'url_fetch' | 'pasted';
    requirements: string[];
    fetchedAt: string;
  };
  repositoryUrl: string;
  repositoryOwner: string;
  repositoryName: string;
  currentVersion: number;
  latestCommitSha: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  latestAssessment?: AssessmentVersion;
}

export interface TrackedRepository {
  id: string;
  analysisId: string;
  repositoryUrl: string;
  owner: string;
  repo: string;
  lastKnownSha: string;
  lastAssessedSha: string;
  status: 'active' | 'stopped' | 'error';
  pollIntervalMinutes: number;
  createdAt: string;
  updatedAt: string;
  lastPollAt?: string;
  lastError?: string;
  consecutiveErrors: number;
}

export interface PollRun {
  id: string;
  trackingId: string;
  startedAt: string;
  completedAt?: string;
  status: 'running' | 'completed' | 'failed' | 'no_change';
  previousSha?: string;
  currentSha?: string;
  error?: string;
}

export interface JobPreviewData {
  url?: string;
  pastedDescription?: string;
  retrievalMethod: 'url_fetch' | 'pasted';
  requirements: string[];
  fetchedAt: string;
}

export interface RepoValidationData {
  owner: string;
  name: string;
  fullName: string;
  description?: string;
  stars?: number;
  language?: string;
  lastPush?: string;
  defaultBranch?: string;
}

export interface SampleJob {
  id: string;
  title: string;
  company: string;
  category: 'frontend' | 'backend' | 'fullstack';
  sourceUrl: string;
  isLivePosting: boolean;
  verificationStatus: 'verified_active' | 'practice_sample' | 'expired';
  lastVerifiedAt: string;
  summary: string;
  description: string;
  requirements: string[];
}
