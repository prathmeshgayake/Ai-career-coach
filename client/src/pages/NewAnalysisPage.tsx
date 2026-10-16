import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Github, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Star, 
  Code2, 
  Calendar, 
  FileText,
  Link as LinkIcon,
  RotateCcw,
  ExternalLink,
  History as HistoryIcon,
  Check
} from 'lucide-react';
import { apiClient } from '../api/client';
import ProgressBar from '../components/ProgressBar';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import type { JobPreviewData, RepoValidationData, SampleJob, Analysis } from '../types';

type JobInputMode = 'sample' | 'url' | 'paste';

export const NewAnalysisPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Job Requirements
  const [inputMode, setInputMode] = useState<JobInputMode>('sample');
  const [jobUrl, setJobUrl] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [isPreviewingJob, setIsPreviewingJob] = useState<boolean>(false);
  const [jobPreview, setJobPreview] = useState<JobPreviewData | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);

  // Sample jobs & quick start
  const [sampleJobs, setSampleJobs] = useState<SampleJob[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [isLoadingSamples, setIsLoadingSamples] = useState<boolean>(false);
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);

  // Fetch sample jobs and recent setups on mount
  useEffect(() => {
    let mounted = true;
    const fetchSamplesAndHistory = async () => {
      setIsLoadingSamples(true);
      try {
        const [samplesRes, analysesRes] = await Promise.allSettled([
          apiClient.getSampleJobs(),
          apiClient.getAnalyses(),
        ]);

        if (mounted && samplesRes.status === 'fulfilled') {
          const rawSamples = (samplesRes.value as any)?.data || samplesRes.value;
          const list = Array.isArray(rawSamples) ? rawSamples : (rawSamples as any)?.data || [];
          setSampleJobs(list);
          if (list.length > 0 && !jobPreview) {
            // Default select the first sample
            const first = list[0];
            setSelectedSampleId(first.id);
            setJobPreview({
              url: first.sourceUrl,
              pastedDescription: first.description,
              retrievalMethod: first.isLivePosting ? 'url_fetch' : 'pasted',
              requirements: first.requirements,
              fetchedAt: new Date().toISOString(),
            });
            setJobDescription(first.description);
          }
        }

        if (mounted && analysesRes.status === 'fulfilled') {
          const rawAnalyses = (analysesRes.value as any)?.data || analysesRes.value;
          const list = Array.isArray(rawAnalyses) ? rawAnalyses : (rawAnalyses as any)?.data || [];
          setRecentAnalyses(list.slice(0, 3));
        }
      } catch (err) {
        console.warn('Failed to load sample jobs or recent analyses:', err);
      } finally {
        if (mounted) setIsLoadingSamples(false);
      }
    };

    fetchSamplesAndHistory();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectSample = (sample: SampleJob) => {
    setSelectedSampleId(sample.id);
    setJobError(null);
    setJobPreview({
      url: sample.sourceUrl,
      pastedDescription: sample.description,
      retrievalMethod: sample.isLivePosting ? 'url_fetch' : 'pasted',
      requirements: sample.requirements,
      fetchedAt: new Date().toISOString(),
    });
    setJobDescription(sample.description);
  };

  const handleReuseAnalysis = (past: Analysis) => {
    setRepoUrl(past.repositoryUrl);
    setRepoError(null);
    if (past.jobSource?.requirements && past.jobSource.requirements.length > 0) {
      setJobPreview({
        url: past.jobSource.url,
        pastedDescription: past.jobSource.pastedDescription,
        retrievalMethod: past.jobSource.retrievalMethod,
        requirements: past.jobSource.requirements,
        fetchedAt: new Date().toISOString(),
      });
      if (past.jobSource.url) {
        setInputMode('url');
        setJobUrl(past.jobSource.url);
      } else {
        setInputMode('paste');
        setJobDescription(past.jobSource.pastedDescription || '');
      }
    }
  };

  // Step 2: GitHub Repository
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [repoError, setRepoError] = useState<string | null>(null);
  const [isValidatingRepo, setIsValidatingRepo] = useState<boolean>(false);
  const [repoMetadata, setRepoMetadata] = useState<RepoValidationData | null>(null);

  // Step 3: Analysis Pipeline
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStage, setAnalysisStage] = useState<number>(1);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const stages = [
    { id: 1, label: 'Fetching repository files' },
    { id: 2, label: 'Analyzing code with AI' },
    { id: 3, label: 'Validating evidence' },
    { id: 4, label: 'Saving results' },
  ];

  // Validate GitHub URL format
  const parseGitHubUrl = (url: string) => {
    let trimmed = url.trim();
    if (!trimmed) return null;
    trimmed = trimmed.split('?')[0].split('#')[0];
    const base = trimmed.match(/^https?:\/\/(?:www\.)?github\.com\/(.+)/);
    if (!base) return null;
    const parts = base[1].split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, '');
    if (!owner || !repo) return null;
    if (!/^[a-zA-Z0-9_.-]+$/.test(owner) || !/^[a-zA-Z0-9_.-]+$/.test(repo)) return null;
    return { owner, repo };
  };

  // Preview Job Requirements
  const handlePreviewJob = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setJobError(null);

    if (inputMode === 'url' && !jobUrl.trim()) {
      setJobError('Please enter a valid job URL.');
      return;
    }
    if (inputMode === 'paste' && !jobDescription.trim()) {
      setJobError('Please paste the job description text.');
      return;
    }

    setIsPreviewingJob(true);
    try {
      const payload = inputMode === 'url' 
        ? { url: jobUrl.trim() } 
        : { description: jobDescription.trim() };
      const response = await apiClient.previewJob(payload);
      setJobPreview(response.data);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Unable to fetch or parse job requirements.';
      setJobError(msg);
      // Fallback: if server error occurred, parse requirements locally so user isn't blocked
      if (inputMode === 'paste' && jobDescription.trim()) {
        const lines = jobDescription
          .split('\n')
          .map(l => l.replace(/^[-*•\d.]\s*/, '').trim())
          .filter(l => l.length > 10 && l.length < 200)
          .slice(0, 8);
        setJobPreview({
          pastedDescription: jobDescription,
          retrievalMethod: 'pasted',
          requirements: lines.length > 0 ? lines : ['Full-stack web application development', 'TypeScript & React experience', 'REST API design', 'Version control with Git'],
          fetchedAt: new Date().toISOString(),
        });
      }
    } finally {
      setIsPreviewingJob(false);
    }
  };

  // Validate GitHub Repo
  const handleValidateRepo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setRepoError(null);

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      setRepoError('Please enter a valid GitHub URL, e.g., https://github.com/owner/repository');
      return;
    }

    setIsValidatingRepo(true);
    try {
      const res = await apiClient.validateRepo(repoUrl.trim());
      const metadata = (res.data as any)?.data || res.data;
      setRepoMetadata(metadata);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Unable to verify repository. Make sure the repository is public.';
      setRepoError(msg);
      setRepoMetadata(null);
    } finally {
      setIsValidatingRepo(false);
    }
  };

  // Run full analysis
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStage(1);

    // Progression timer for visual feedback through stages
    const stage1Timer = setTimeout(() => setAnalysisStage(2), 2000);
    const stage2Timer = setTimeout(() => setAnalysisStage(3), 5500);
    const stage3Timer = setTimeout(() => setAnalysisStage(4), 8500);

    try {
      const payload: { jobUrl?: string; jobDescription?: string; repositoryUrl: string; jobPreviewData?: any } = {
        repositoryUrl: repoUrl.trim(),
      };
      if (inputMode === 'url') {
        payload.jobUrl = jobUrl.trim();
      } else {
        payload.jobDescription = jobDescription.trim();
      }
      // Pass the already-previewed job source so the server doesn't re-fetch the URL
      if (jobPreview) {
        payload.jobPreviewData = jobPreview;
      }

      const response = await apiClient.createAnalysis(payload);
      const raw = response.data as any;
      const analysisObj = raw?.analysis || raw?.data?.analysis || raw;
      const analysisId = analysisObj?.id || raw?.id;

      // Finish stage 4 and redirect
      setAnalysisStage(4);
      setTimeout(() => {
        if (analysisId) {
          navigate(`/analysis/${analysisId}`);
        } else {
          navigate('/');
        }
      }, 1000);
    } catch (err: any) {
      clearTimeout(stage1Timer);
      clearTimeout(stage2Timer);
      clearTimeout(stage3Timer);
      const msg = err.response?.data?.message || err.message || 'Analysis failed. Please check repository URL and permissions.';
      setAnalysisError(msg);
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-gray-900)' }}>
          Create New Analysis
        </h1>
        <p style={{ color: 'var(--color-gray-600)', marginTop: '4px' }}>
          Compare a job requirement specification against code in a GitHub repository
        </p>
      </div>

      {/* Step Indicators */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          borderBottom: '1px solid var(--color-gray-200)',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: currentStep >= 1 ? 'var(--color-primary)' : 'var(--color-gray-400)', fontWeight: 600 }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 1 ? 'var(--color-primary)' : 'var(--color-gray-200)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
            }}
          >
            1
          </div>
          <span>Job Requirements</span>
        </div>

        <ArrowRight size={16} style={{ color: 'var(--color-gray-300)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: currentStep >= 2 ? 'var(--color-primary)' : 'var(--color-gray-400)', fontWeight: 600 }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 2 ? 'var(--color-primary)' : 'var(--color-gray-200)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
            }}
          >
            2
          </div>
          <span>GitHub Repository</span>
        </div>

        <ArrowRight size={16} style={{ color: 'var(--color-gray-300)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: currentStep >= 3 ? 'var(--color-primary)' : 'var(--color-gray-400)', fontWeight: 600 }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 3 ? 'var(--color-primary)' : 'var(--color-gray-200)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.85rem',
            }}
          >
            3
          </div>
          <span>Run Analysis</span>
        </div>
      </div>

      {/* STEP 1: Job Requirements */}
      {currentStep === 1 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Briefcase size={22} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Step 1: Job Requirements</h2>
          </div>

          {jobError && (
            <ErrorAlert
              title="Job Source Error"
              message={jobError}
              onDismiss={() => setJobError(null)}
            />
          )}

          {/* Quick Reuse Previous Setup */}
          {recentAnalyses.length > 0 && (
            <div
              style={{
                marginBottom: '20px',
                padding: '12px 16px',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                <HistoryIcon size={14} /> Quick Reuse Previous Setup:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {recentAnalyses.map((past) => (
                  <button
                    key={past.id}
                    type="button"
                    onClick={() => handleReuseAnalysis(past)}
                    className="btn btn-sm btn-ghost"
                    style={{
                      border: '1px solid var(--color-gray-200)',
                      backgroundColor: '#ffffff',
                      fontSize: '0.8rem',
                      padding: '4px 10px',
                    }}
                    title="Click to autofill this job & repository"
                  >
                    <Github size={12} /> {past.repositoryOwner}/{past.repositoryName}
                    <span style={{ color: 'var(--color-gray-400)', marginLeft: '4px' }}>
                      ({past.jobSource?.requirements?.length || 0} skills)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Mode Selector */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              backgroundColor: 'var(--color-gray-100)',
              padding: '4px',
              borderRadius: 'var(--radius-md)',
              width: 'fit-content',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              className={`btn btn-sm ${inputMode === 'sample' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setInputMode('sample')}
            >
              <Sparkles size={14} /> Choose a sample job
            </button>
            <button
              type="button"
              className={`btn btn-sm ${inputMode === 'url' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setInputMode('url');
                setJobPreview(null);
              }}
            >
              <LinkIcon size={14} /> Use my job URL
            </button>
            <button
              type="button"
              className={`btn btn-sm ${inputMode === 'paste' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => {
                setInputMode('paste');
                setJobPreview(null);
              }}
            >
              <FileText size={14} /> Paste job description
            </button>
          </div>

          {/* Sample Jobs Mode */}
          {inputMode === 'sample' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-600)', margin: 0 }}>
                Select a verified student intern role to pre-fill requirements in one click:
              </p>

              {isLoadingSamples ? (
                <LoadingSpinner size="sm" message="Loading sample jobs..." />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  {sampleJobs.map((sample) => {
                    const isSelected = selectedSampleId === sample.id;
                    return (
                      <div
                        key={sample.id}
                        onClick={() => handleSelectSample(sample)}
                        style={{
                          border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-gray-200)',
                          backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.04)' : '#ffffff',
                          borderRadius: 'var(--radius-md)',
                          padding: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                backgroundColor: sample.category === 'frontend' ? '#e0f2fe' : sample.category === 'backend' ? '#fef3c7' : '#ede9fe',
                                color: sample.category === 'frontend' ? '#0369a1' : sample.category === 'backend' ? '#b45309' : '#6d28d9',
                              }}
                            >
                              {sample.category}
                            </span>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: 'var(--color-gray-500)',
                                backgroundColor: 'var(--color-gray-100)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {sample.verificationStatus === 'practice_sample' ? 'Practice Spec' : 'Live Verified'}
                            </span>
                          </div>

                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--color-gray-900)' }}>
                            {sample.title}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)', marginBottom: '8px' }}>
                            {sample.company}
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--color-gray-600)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                            {sample.summary}
                          </p>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-gray-100)', paddingTop: '8px' }}>
                            <a
                              href={sample.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-gray-500)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                textDecoration: 'none',
                              }}
                            >
                              Source <ExternalLink size={11} />
                            </a>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isSelected ? 'var(--color-primary)' : 'var(--color-gray-500)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {isSelected ? <><Check size={14} /> Selected</> : 'Select'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* URL or Paste Mode Form */}
          {inputMode !== 'sample' && (
            <form onSubmit={handlePreviewJob}>
              {inputMode === 'url' ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="jobUrlInput">
                    Job Posting URL
                    <span className="form-hint">Public link to job posting (LinkedIn, Indeed, greenhouse, etc.)</span>
                  </label>
                  <input
                    id="jobUrlInput"
                    type="url"
                    placeholder="https://jobs.example.com/software-engineer"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" htmlFor="jobDescInput">
                    Job Description & Requirements
                    <span className="form-hint">Paste full description or list of required skills</span>
                  </label>
                  <textarea
                    id="jobDescInput"
                    rows={7}
                    placeholder="Paste requirements, responsibilities, and qualifications..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="form-textarea"
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={isPreviewingJob}
                  className="btn btn-secondary"
                >
                  {isPreviewingJob ? (
                    <LoadingSpinner size="sm" message="Extracting requirements..." />
                  ) : (
                    <>
                      <Sparkles size={16} /> Preview Requirements
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Job Preview Section */}
          {jobPreview && (
            <div
              style={{
                marginTop: '28px',
                paddingTop: '20px',
                borderTop: '1px solid var(--color-gray-200)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                }}
              >
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-gray-900)' }}>
                  Extracted Requirements ({jobPreview.requirements?.length || 0})
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-gray-500)' }}>
                  Source: {jobPreview.retrievalMethod === 'url_fetch' ? 'Fetched from URL' : 'Pasted text'}
                </span>
              </div>

              <ul style={{ listStyleType: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {jobPreview.requirements?.map((req, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-gray-50)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.9rem',
                      color: 'var(--color-gray-800)',
                    }}
                  >
                    <CheckCircle2 size={16} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="btn btn-primary"
                >
                  Continue to Repository <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: GitHub Repository */}
      {currentStep === 2 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Github size={22} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Step 2: Connect GitHub Repository</h2>
          </div>

          {repoError && (
            repoError.toLowerCase().includes('rate limit') ? (
              <div
                style={{
                  marginBottom: '20px',
                  padding: '16px 20px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 'var(--radius-md)',
                  color: '#92400e',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
                  <AlertCircle size={18} color="#d97706" />
                  GitHub API Rate Limit Exceeded
                </div>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                  {repoError}
                </p>
                <div style={{ fontSize: '0.8rem', backgroundColor: '#fef3c7', padding: '10px 12px', borderRadius: '6px' }}>
                  <strong>How to unlock 5,000 requests/hour:</strong>
                  <ol style={{ margin: '6px 0 0 18px', padding: 0 }}>
                    <li>Create a free personal access token at <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={{ color: '#b45309', textDecoration: 'underline' }}>github.com/settings/tokens</a> (no special scopes needed for public repos).</li>
                    <li>Add <code>GITHUB_TOKEN=your_token_here</code> to <code>server/.env</code>.</li>
                    <li>Restart the server to enjoy 5,000 requests per hour.</li>
                  </ol>
                </div>
              </div>
            ) : (
              <ErrorAlert
                title="Repository Error"
                message={repoError}
                onDismiss={() => setRepoError(null)}
              />
            )
          )}

          <form onSubmit={handleValidateRepo}>
            <div className="form-group">
              <label className="form-label" htmlFor="repoUrlInput">
                GitHub Repository URL
                <span className="form-hint">Public repository containing your code</span>
              </label>
              <input
                id="repoUrlInput"
                type="text"
                placeholder="https://github.com/username/repository-name"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  setRepoMetadata(null);
                }}
                className="form-input"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                type="submit"
                disabled={isValidatingRepo || !repoUrl.trim()}
                className="btn btn-secondary"
              >
                {isValidatingRepo ? (
                  <LoadingSpinner size="sm" message="Validating repository..." />
                ) : (
                  <>
                    <Github size={16} /> Validate Repository
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Repo Metadata Preview */}
          {repoMetadata && (
            <div
              style={{
                marginTop: '24px',
                padding: '18px',
                backgroundColor: 'var(--color-gray-50)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-gray-200)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {repoMetadata.fullName || `${repoMetadata.owner}/${repoMetadata.name}`}
                </h3>
              </div>

              {repoMetadata.description && (
                <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-600)', marginBottom: '14px' }}>
                  {repoMetadata.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--color-gray-600)' }}>
                {repoMetadata.language && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Code2 size={14} /> {repoMetadata.language}
                  </span>
                )}
                {repoMetadata.stars !== undefined && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Star size={14} /> {repoMetadata.stars} stars
                  </span>
                )}
                {repoMetadata.lastPush && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} /> Last pushed: {new Date(repoMetadata.lastPush).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="btn btn-secondary"
            >
              <ArrowLeft size={16} /> Back
            </button>

            <button
              type="button"
              disabled={!repoMetadata}
              onClick={() => setCurrentStep(3)}
              className="btn btn-primary"
            >
              Continue to Analysis <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Run Analysis */}
      {currentStep === 3 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Sparkles size={22} style={{ color: 'var(--color-primary)' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Step 3: Review & Run Analysis</h2>
          </div>

          {analysisError && (
            <ErrorAlert
              title="Analysis Failed"
              message={analysisError}
              onRetry={handleRunAnalysis}
              onDismiss={() => setAnalysisError(null)}
            />
          )}

          {/* Summary Cards */}
          <div className="grid-2" style={{ marginBottom: '24px' }}>
            <div style={{ padding: '16px', border: '1px solid var(--color-gray-200)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-gray-600)' }}>
                <Briefcase size={16} />
                <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Target Job</span>
              </div>
              <p style={{ fontWeight: 600, color: 'var(--color-gray-900)', fontSize: '0.95rem' }}>
                {jobUrl || 'Pasted Job Specification'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', marginTop: '4px' }}>
                {jobPreview?.requirements.length || 0} requirements identified
              </p>
            </div>

            <div style={{ padding: '16px', border: '1px solid var(--color-gray-200)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-gray-600)' }}>
                <Github size={16} />
                <span style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Target Repository</span>
              </div>
              <p style={{ fontWeight: 600, color: 'var(--color-gray-900)', fontSize: '0.95rem' }}>
                {repoMetadata?.fullName || repoUrl}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)', marginTop: '4px' }}>
                {repoMetadata?.language || 'Codebase analysis ready'}
              </p>
            </div>
          </div>

          {/* Progress Tracker during active analysis */}
          {isAnalyzing ? (
            <div
              style={{
                padding: '24px',
                backgroundColor: 'var(--color-gray-50)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                margin: '24px 0',
              }}
            >
              <ProgressBar
                stages={stages}
                currentStage={analysisStage}
              />
              <div style={{ marginTop: '20px' }}>
                <LoadingSpinner size="md" message={`${stages[analysisStage - 1]?.label}...`} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn btn-secondary"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <button
                type="button"
                onClick={handleRunAnalysis}
                className="btn btn-primary btn-lg"
              >
                <Sparkles size={18} /> Run Assessment
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewAnalysisPage;
