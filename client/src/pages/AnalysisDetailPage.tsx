import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  GitBranch, 
  GitCommit, 
  ExternalLink, 
  Layers, 
  Clock, 
  Trash2, 
  Play, 
  Square, 
  History, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle,
  Search,
  Filter,
  RefreshCw,
  AlertOctagon,
  Sparkles
} from 'lucide-react';
import { useAnalysis } from '../hooks/useAnalysis';
import { useMonitoring } from '../hooks/useMonitoring';
import { usePolling } from '../hooks/usePolling';
import { apiClient } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import StatusBadge from '../components/StatusBadge';
import MonitoringBadge from '../components/MonitoringBadge';
import SkillCard from '../components/SkillCard';
import SkillMatchChart from '../components/SkillMatchChart';
import RecommendationsPanel from '../components/RecommendationsPanel';
import ProgressChart from '../components/ProgressChart';
import type { SkillStatus, SkillAssessment, AssessmentVersion } from '../types';

export const AnalysisDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    currentAnalysis,
    isLoading: isAnalysisLoading,
    error: analysisError,
    fetchAnalysis,
    deleteAnalysis,
  } = useAnalysis();

  const {
    tracking,
    setTracking,
    isLoading: isMonitoringLoading,
    error: monitoringError,
    fetchTrackingStatus,
    startTracking,
    stopTracking,
    isTrackingActive,
  } = useMonitoring();

  // Skill filter and search state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [skillSearch, setSkillSearch] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [historyVersions, setHistoryVersions] = useState<AssessmentVersion[]>([]);

  // Initial load
  const loadData = useCallback(async () => {
    if (!id) return;
    const analysis = await fetchAnalysis(id);
    if (analysis) {
      // Also try fetching tracking status if there is an associated tracking
      fetchTrackingStatus(id);

      // Fetch version history for progress chart
      try {
        const histRes = await apiClient.getAnalysisHistory(id);
        const vList = (histRes.data && 'versions' in histRes.data) 
          ? (histRes.data as any).versions 
          : Array.isArray(histRes.data) ? histRes.data : [];
        setHistoryVersions(vList);
      } catch (e) {
        // Continue if history is empty
      }
    }
  }, [id, fetchAnalysis, fetchTrackingStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh when monitoring is active (every 30 seconds)
  const refreshPoll = useCallback(async () => {
    if (!id) return;
    setIsRefreshing(true);
    try {
      await fetchAnalysis(id);
      if (tracking?.id) {
        await fetchTrackingStatus(tracking.id);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [id, fetchAnalysis, tracking?.id, fetchTrackingStatus]);

  usePolling(refreshPoll, {
    intervalMs: 30000,
    enabled: isTrackingActive,
    immediate: false,
  });

  // Handle start monitoring
  const handleStartTracking = async () => {
    if (!id) return;
    try {
      await startTracking(id);
    } catch {
      // error handled in hook
    }
  };

  // Handle stop monitoring
  const handleStopTracking = async () => {
    const trackingId = tracking?.id || id;
    if (!trackingId) return;
    try {
      await stopTracking(trackingId);
    } catch {
      // error handled in hook
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteAnalysis(id);
      navigate('/dashboard');
    } catch {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // Skill assessments list
  const assessments: SkillAssessment[] = useMemo(() => {
    return currentAnalysis?.latestAssessment?.assessments || [];
  }, [currentAnalysis]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = assessments.length;
    const demonstrated = assessments.filter(a => a.status === 'demonstrated').length;
    const partially = assessments.filter(a => a.status === 'partially_demonstrated').length;
    const notDemonstrated = assessments.filter(a => a.status === 'not_demonstrated_in_scope').length;
    const unableToVerify = assessments.filter(a => a.status === 'unable_to_verify').length;

    return {
      total,
      demonstrated,
      partially,
      notDemonstrated,
      unableToVerify,
      score: total > 0 ? Math.round((demonstrated / total) * 100) : 0,
    };
  }, [assessments]);

  // Filtered skills
  const filteredAssessments = useMemo(() => {
    return assessments.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesSearch = item.skillName.toLowerCase().includes(skillSearch.toLowerCase()) ||
        item.reasoning.toLowerCase().includes(skillSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [assessments, statusFilter, skillSearch]);

  if (isAnalysisLoading && !currentAnalysis) {
    return <LoadingSpinner message="Loading analysis details..." fullHeight />;
  }

  if (analysisError && !currentAnalysis) {
    return (
      <div>
        <ErrorAlert
          title="Analysis Not Found"
          message={analysisError}
          onRetry={loadData}
        />
        <Link to="/dashboard" className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!currentAnalysis) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 20px' }}>
        <h2>Analysis not found</h2>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const shortCommit = currentAnalysis.latestCommitSha 
    ? currentAnalysis.latestCommitSha.substring(0, 7)
    : currentAnalysis.latestAssessment?.commitSha 
    ? currentAnalysis.latestAssessment.commitSha.substring(0, 7)
    : 'HEAD';

  const commitUrl = currentAnalysis.repositoryUrl && shortCommit !== 'HEAD'
    ? `${currentAnalysis.repositoryUrl.replace(/\.git$/, '')}/commit/${currentAnalysis.latestCommitSha || currentAnalysis.latestAssessment?.commitSha}`
    : currentAnalysis.repositoryUrl;

  return (
    <div>
      {/* Top Breadcrumb & Actions Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={refreshPoll}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            title="Refresh latest data"
          >
            <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>

          <Link
            to={`/analysis/${currentAnalysis.id}/history`}
            className="btn btn-secondary btn-sm"
          >
            <History size={15} />
            <span>View History (v{currentAnalysis.currentVersion || 1})</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-danger btn-sm"
            aria-label="Delete analysis"
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {monitoringError && (
        <ErrorAlert
          title="Monitoring Error"
          message={monitoringError}
        />
      )}

      {/* Main Header Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <GitBranch size={22} style={{ color: 'var(--color-primary)' }} />
              <h1 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                {currentAnalysis.repositoryOwner}/{currentAnalysis.repositoryName}
              </h1>
              <StatusBadge status={currentAnalysis.status} />
              <span className="badge badge-unable_to_verify">
                <Layers size={13} /> v{currentAnalysis.currentVersion || 1}
              </span>
              <span 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  backgroundColor: currentAnalysis.latestAssessment?.assessmentEngine === 'gemini' ? '#e0e7ff' : '#f1f5f9',
                  color: currentAnalysis.latestAssessment?.assessmentEngine === 'gemini' ? '#3730a3' : '#475569',
                  border: `1px solid ${currentAnalysis.latestAssessment?.assessmentEngine === 'gemini' ? '#c7d2fe' : '#e2e8f0'}`,
                }}
                title={currentAnalysis.latestAssessment?.assessmentEngine === 'gemini' ? 'Evaluated via Google Gemini' : 'Evaluated via Deterministic Heuristic Engine'}
              >
                <Sparkles size={12} />
                <span>{currentAnalysis.latestAssessment?.assessmentEngine === 'gemini' ? `Gemini (${currentAnalysis.latestAssessment?.modelUsed || '1.5-flash'})` : 'Heuristic Rules Engine'}</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--color-gray-600)' }}>
              {commitUrl && (
                <a
                  href={commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}
                >
                  <GitCommit size={14} /> {shortCommit} <ExternalLink size={12} />
                </a>
              )}

              {currentAnalysis.jobSource?.url ? (
                <a
                  href={currentAnalysis.jobSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Job Posting <ExternalLink size={12} />
                </a>
              ) : (
                <span style={{ color: 'var(--color-gray-500)' }}>
                  Pasted Job Requirements ({currentAnalysis.jobSource?.requirements?.length || 0} skills)
                </span>
              )}

              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> Created: {new Date(currentAnalysis.createdAt).toLocaleDateString()}
              </span>

              {currentAnalysis.latestAssessment?.stageDurations?.totalDurationMs ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--color-primary)',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                  title={`Stage Durations:\n• Job extraction: ${currentAnalysis.latestAssessment.stageDurations.jobRetrievalMs || 0}ms\n• GitHub fetch: ${currentAnalysis.latestAssessment.stageDurations.githubRetrievalMs || 0}ms\n• AI Inference: ${currentAnalysis.latestAssessment.stageDurations.llmRequestMs || 0}ms\n• Evidence validation: ${currentAnalysis.latestAssessment.stageDurations.evidenceValidationMs || 0}ms\n• Database write: ${currentAnalysis.latestAssessment.stageDurations.dbPersistenceMs || 0}ms`}
                >
                  ⚡ Analyzed in {(currentAnalysis.latestAssessment.stageDurations.totalDurationMs / 1000).toFixed(2)}s
                </span>
              ) : null}
            </div>
          </div>

          {/* Monitoring Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <MonitoringBadge
              tracking={tracking}
              onRefresh={refreshPoll}
              isRefreshing={isRefreshing}
            />

            <div>
              {isTrackingActive ? (
                <button
                  type="button"
                  onClick={handleStopTracking}
                  disabled={isMonitoringLoading}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--color-error)' }}
                >
                  <Square size={14} /> Stop Monitoring
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartTracking}
                  disabled={isMonitoringLoading}
                  className="btn btn-primary btn-sm"
                >
                  <Play size={14} /> Start Monitoring
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <div
          className="card"
          style={{
            padding: '16px 20px',
            borderLeft: '4px solid var(--color-success)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-600)' }}>Demonstrated</span>
            <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '8px' }}>
            {stats.demonstrated}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
            Strong code evidence in repository
          </span>
        </div>

        <div
          className="card"
          style={{
            padding: '16px 20px',
            borderLeft: '4px solid var(--color-warning)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-600)' }}>Partially Demonstrated</span>
            <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '8px' }}>
            {stats.partially}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
            Partial usage or peripheral evidence
          </span>
        </div>

        <div
          className="card"
          style={{
            padding: '16px 20px',
            borderLeft: '4px solid var(--color-gray-400)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-600)' }}>Not In Scope</span>
            <XCircle size={18} style={{ color: 'var(--color-gray-400)' }} />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-gray-700)', marginTop: '8px' }}>
            {stats.notDemonstrated}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
            No trace found in current files
          </span>
        </div>

        <div
          className="card"
          style={{
            padding: '16px 20px',
            borderLeft: '4px solid var(--color-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-gray-600)' }}>Unable to Verify</span>
            <HelpCircle size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '8px' }}>
            {stats.unableToVerify}
          </p>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-gray-500)' }}>
            Requires non-code credentials
          </span>
        </div>
      </div>

      {/* Visual Analytics & Recommendations */}
      <div className="grid-2" style={{ gap: '20px', marginBottom: '28px' }}>
        <SkillMatchChart
          assessments={assessments}
          title="Skill Match Distribution"
        />
        <RecommendationsPanel
          recommendations={currentAnalysis.latestAssessment?.recommendations || []}
          title="Actionable Next Steps"
        />
      </div>

      {historyVersions.length > 1 && (
        <div style={{ marginBottom: '28px' }}>
          <ProgressChart
            versions={historyVersions}
            title="Evidence & Demonstration Trend Across Commits"
          />
        </div>
      )}

      {/* Skills Assessment List Header & Filter Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-gray-900)' }}>
            Skill Assessments ({filteredAssessments.length})
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-gray-500)' }}>
            Evidence-backed gap analysis against target requirements
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-gray-400)',
              }}
            />
            <input
              type="text"
              placeholder="Filter skills..."
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.85rem', paddingBlock: '8px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={15} style={{ color: 'var(--color-gray-500)' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{ fontSize: '0.85rem', paddingBlock: '8px', width: '180px' }}
              aria-label="Filter by skill status"
            >
              <option value="all">All Statuses ({assessments.length})</option>
              <option value="demonstrated">Demonstrated ({stats.demonstrated})</option>
              <option value="partially_demonstrated">Partially ({stats.partially})</option>
              <option value="not_demonstrated_in_scope">Not In Scope ({stats.notDemonstrated})</option>
              <option value="unable_to_verify">Unable to Verify ({stats.unableToVerify})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Skill Cards Grid */}
      {filteredAssessments.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            color: 'var(--color-gray-500)',
          }}
        >
          <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-gray-800)', marginBottom: '6px' }}>
            No skills found
          </p>
          <p style={{ fontSize: '0.9rem' }}>
            No assessments match your current filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setSkillSearch('');
            }}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '16px' }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div>
          {filteredAssessments.map((item, index) => (
            <SkillCard key={item.skillName || index} assessment={item} />
          ))}
        </div>
      )}

      {/* Concrete Improvement Suggestions Grounded in Missing Evidence */}
      {(stats.partially > 0 || stats.notDemonstrated > 0) && (
        <div
          style={{
            marginTop: '32px',
            padding: '24px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Sparkles size={18} color="#4f46e5" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
              Skill Gaps & Recommended Growth Actions
            </h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '18px', lineHeight: 1.5 }}>
            The following requirements had missing or partial evidence within the inspected files at commit <code>{shortCommit}</code>. Implement the recommended code examples and push to your repository to trigger automatic server reassessment.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assessments
              .filter(a => a.status === 'not_demonstrated_in_scope' || a.status === 'partially_demonstrated')
              .map((gap, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '14px 16px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ marginTop: '2px' }}>
                    {gap.status === 'partially_demonstrated' ? (
                      <AlertTriangle size={16} color="#d97706" />
                    ) : (
                      <XCircle size={16} color="#64748b" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{gap.skillName}</strong>
                      <StatusBadge status={gap.status} size="sm" />
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                      {gap.reasoning}
                    </p>
                    <div style={{ fontSize: '0.8rem', color: '#4f46e5', fontWeight: 500 }}>
                      💡 Recommended Action: Add a working implementation or unit test demonstrating {gap.skillName} and push a commit.
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="deleteModalTitle">
          <div className="modal-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', color: 'var(--color-error)' }}>
              <AlertOctagon size={24} />
              <h3 id="deleteModalTitle" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-gray-900)' }}>
                Delete Analysis?
              </h3>
            </div>

            <p style={{ color: 'var(--color-gray-600)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '24px' }}>
              Are you sure you want to delete the analysis for <strong>{currentAnalysis.repositoryOwner}/{currentAnalysis.repositoryName}</strong>?
              This will permanently remove all version histories, evidence records, and active monitoring schedules.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn btn-danger"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisDetailPage;
