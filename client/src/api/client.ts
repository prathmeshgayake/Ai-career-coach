import axios from 'axios';
import type { 
  Analysis, 
  AssessmentVersion, 
  TrackedRepository, 
  JobPreviewData,
  RepoValidationData 
} from '../types';

// Use relative URL so Vite proxy forwards requests regardless of localhost, 127.0.0.1, or network IP
const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 120000, // 2 min for analysis
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to attach JWT token and student userId
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const currentUserId = localStorage.getItem('activeStudentId');
  if (currentUserId) {
    config.headers['x-user-id'] = currentUserId;
  }
  return config;
});

// Response interceptor to unwrap { status: 'success', data: ... } payloads cleanly
api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data &&
      (response.data.status === 'success' || response.data.status === 'ok')
    ) {
      // Return unwrapped data payload directly on response.data
      return {
        ...response,
        data: response.data.data,
      };
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiClient = {
  // Auth & Student Multi-Tenancy
  signup: (data: {
    name: string;
    email: string;
    password: string;
    targetRole?: string;
    githubUsername?: string;
    bio?: string;
  }) => api.post<import('../types').AuthResponse>('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post<import('../types').AuthResponse>('/auth/login', data),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  getMe: () => api.get<import('../types').StudentProfile>('/auth/me'),
  getStudents: () => api.get<import('../types').StudentProfile[]>('/auth/students'),
  switchStudent: (userId: string) =>
    api.post<{ user: import('../types').StudentProfile; token: string }>('/auth/switch', { userId }),
  getActionPlan: () => api.get<import('../types').ActionPlan>('/auth/action-plan'),

  // Health
  getHealth: () => api.get<{ status: string; timestamp: string }>('/health'),
  
  // Jobs
  previewJob: (data: { url?: string; description?: string }) =>
    api.post<JobPreviewData>('/jobs/preview', data),
  getSampleJobs: () => api.get<import('../types').SampleJob[]>('/jobs/samples'),
  getSampleJobById: (id: string) => api.get<import('../types').SampleJob>(`/jobs/samples/${id}`),

  // Repository validation
  validateRepo: (repositoryUrl: string) =>
    api.post<RepoValidationData>('/repositories/validate', { repositoryUrl }),
  
  // Analyses
  getAnalyses: () => api.get<Analysis[]>('/analyses'),
  createAnalysis: (data: { jobUrl?: string; jobDescription?: string; repositoryUrl: string }) =>
    api.post<{ analysis: Analysis; latestAssessment: AssessmentVersion }>('/analyses', data),
  getAnalysis: (id: string) => api.get<Analysis>(`/analyses/${id}`),
  getAnalysisHistory: (id: string) => api.get<{ analysisId: string; currentVersion: number; versions: AssessmentVersion[] } | AssessmentVersion[]>(`/analyses/${id}/history`),
  deleteAnalysis: (id: string) => api.delete<{ message: string; id: string }>(`/analyses/${id}`),
  
  // Tracked Repositories
  getTrackedRepos: () => api.get<TrackedRepository[]>('/tracked-repositories'),
  startTracking: (analysisId: string) =>
    api.post<TrackedRepository>('/tracked-repositories', { analysisId }),
  getTrackingStatus: (id: string) => 
    api.get<{ tracking: TrackedRepository; recentPolls?: any[] }>(`/tracked-repositories/${id}/status`),
  stopTracking: (id: string) => 
    api.post<TrackedRepository>(`/tracked-repositories/${id}/stop`),
};

export default api;
