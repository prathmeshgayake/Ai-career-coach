import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  GitBranch, 
  ExternalLink, 
  Clock, 
  Layers, 
  Search,
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  RefreshCw,
  StopCircle,
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  FolderGit2,
  User,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import { useAnalysis } from '../hooks/useAnalysis';
import { apiClient } from '../api/client';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import SkillMatchChart from '../components/SkillMatchChart';
import CoverageGapChart from '../components/CoverageGapChart';
import RecommendationsPanel from '../components/RecommendationsPanel';
import PersonalizedActionPlan from '../components/PersonalizedActionPlan';
import type { StudentProfile, TrackedRepository, ActionPlan } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { analyses, isLoading, error, fetchAnalyses } = useAnalysis();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTrackingList, setActiveTrackingList] = useState<TrackedRepository[]>([]);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);

  // Fetch current authenticated student profile
  useEffect(() => {
    let isMounted = true;
    apiClient.getMe()
      .then((res) => {
        if (isMounted) setStudent(res.data);
      })
      .catch((err) => {
        console.error('Failed to load student profile', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchActiveTracking = useCallback(async () => {
    setIsLoadingTracking(true);
    try {
      const res = await apiClient.getTrackedRepos();
      const list = Array.isArray(res.data) ? res.data : [];
      setActiveTrackingList(list);
    } catch {
      setActiveTrackingList([]);
    } finally {
      setIsLoadingTracking(false);
    }
  }, []);

  const fetchActionPlan = useCallback(async () => {
    try {
      const res = await apiClient.getActionPlan();
      setActionPlan(res.data);
    } catch (err) {
      console.error('Failed to load action plan', err);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses();
    fetchActiveTracking();
    fetchActionPlan();
  }, [fetchAnalyses, fetchActiveTracking, fetchActionPlan]);

  const handleStopTrackingFromDashboard = async (trackingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.stopTracking(trackingId);
      await fetchActiveTracking();
    } catch (err) {
      console.error('Failed to stop tracking', err);
    }
  };

  // Derive metrics strictly from real data of this student
  const metrics = useMemo(() => {
    const total = analyses.length;
    let totalDemonstrated = 0;
    let totalPartial = 0;
    let totalSkills = 0;

    analyses.forEach((a) => {
      const assessments = a.latestAssessment?.assessments || [];
      assessments.forEach((s) => {
        totalSkills++;
        if (s.status === 'demonstrated') totalDemonstrated++;
        else if (s.status === 'partially_demonstrated') totalPartial++;
      });
    });

    return {
      totalAnalyses: total,
      totalDemonstrated,
      totalPartial,
      totalSkills,
      matchPercentage: totalSkills > 0 ? Math.round((totalDemonstrated / totalSkills) * 100) : 0,
    };
  }, [analyses]);

  // Aggregate or pick latest assessments for the visual charts
  const latestAnalysis = analyses[0];
  const latestAssessments = latestAnalysis?.latestAssessment?.assessments || [];
  const latestRecommendations = latestAnalysis?.latestAssessment?.recommendations || [];

  // Filter analyses
  const safeAnalyses = Array.isArray(analyses) ? analyses : [];
  const filteredAnalyses = safeAnalyses.filter((item) => {
    if (!item) return false;
    const q = searchQuery.toLowerCase();
    const repoMatch = `${item.repositoryOwner || ''}/${item.repositoryName || ''}`.toLowerCase().includes(q);
    const jobMatch = (item.jobSource?.url || item.jobSource?.pastedDescription || '').toLowerCase().includes(q);
    return repoMatch || jobMatch;
  });

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="dashboard-page">
      {/* Student Profile Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          padding: '20px 24px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#eef2ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 800,
            }}
          >
            {student?.name ? student.name.charAt(0) : 'S'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                {student?.name ? `${student.name}'s Dashboard` : 'Student Dashboard'}
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                }}
              >
                {student?.role || 'Developer'}
              </span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
              Targeting: <strong style={{ color: '#334155' }}>{student?.targetRoles?.join(', ') || 'Software Roles'}</strong> • GitHub: <code style={{ color: '#4f46e5', fontFamily: 'monospace' }}>@{student?.githubUsername || 'student'}</code>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => navigate('/new')}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#4f46e5' }}
          >
            <PlusCircle size={18} />
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {/* Real Metric Highlights (never fabricated) */}
      <div className="grid-4" style={{ gap: '16px', marginBottom: '32px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Your Analyses</span>
            <FolderGit2 size={18} color="#4f46e5" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            {metrics.totalAnalyses}
          </div>
          <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
            {metrics.totalAnalyses === 0 ? 'No analyses saved yet' : 'Persisted in student account'}
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Demonstrated Skills</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            {metrics.totalDemonstrated}
          </div>
          <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
            of {metrics.totalSkills} requirements evaluated
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Skill Gaps</span>
            <AlertTriangle size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            {metrics.totalSkills - metrics.totalDemonstrated}
          </div>
          <span style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
            {metrics.totalPartial} partially demonstrated
          </span>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Continuous Watchers</span>
            <Activity size={18} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>
            {activeTrackingList.length}
          </div>
          <span style={{ fontSize: '0.775rem', color: activeTrackingList.length > 0 ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
            {activeTrackingList.length > 0 ? 'Active 5-min server cron' : 'No repos currently watched'}
          </span>
        </div>
      </div>

      {/* Personalized Career Action Plan (Roadmap to target role) */}
      {actionPlan && (
        <section style={{ marginBottom: '36px' }}>
          <PersonalizedActionPlan actionPlan={actionPlan} />
        </section>
      )}

      {/* Visual Analytics Section (When assessments exist) */}
      {analyses.length > 0 && latestAssessments.length > 0 && (
        <section style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
                Visual Analytics & Recommendations
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                Interactive visual breakdown of your latest assessment: {latestAnalysis.repositoryOwner}/{latestAnalysis.repositoryName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/analysis/${latestAnalysis.id}`)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Full Assessment View</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
            {/* Donut Chart */}
            <SkillMatchChart
              assessments={latestAssessments}
              title={`Skill Match: ${latestAnalysis.repositoryName}`}
            />

            {/* Prioritized Recommendations */}
            <RecommendationsPanel
              recommendations={latestRecommendations}
              title="Prioritized Next Steps"
            />
          </div>

          {/* Full Width Skill Coverage & Gap Chart */}
          <CoverageGapChart
            assessments={latestAssessments}
            title={`Evidence Breakdown: ${latestAnalysis.repositoryOwner}/${latestAnalysis.repositoryName}`}
          />
        </section>
      )}

      {/* Active Autonomous Watchers Section */}
      {activeTrackingList.length > 0 && (
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulse-dot pulse-dot-green" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>
                Active Continuous Watchers ({activeTrackingList.length})
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Autonomous 5-min server scheduler
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeTrackingList.map((tr) => (
              <div
                key={tr.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 20px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GitBranch size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                        {tr.owner}/{tr.repo}
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: '9999px', fontSize: '0.725rem', fontWeight: 600, backgroundColor: '#dcfce7', color: '#15803d' }}>
                        Active Polling
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '3px', fontSize: '0.775rem', color: '#64748b' }}>
                      <span>Last SHA: <code style={{ fontFamily: 'monospace', color: '#334155' }}>{tr.lastKnownSha ? tr.lastKnownSha.substring(0, 7) : 'HEAD'}</code></span>
                      <span>•</span>
                      <span>Last Checked: {tr.lastPollAt ? new Date(tr.lastPollAt).toLocaleTimeString() : 'Awaiting cycle'}</span>
                      <span>•</span>
                      <span>Interval: Every {tr.pollIntervalMinutes || 5} min</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/analysis/${tr.analysisId}`)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    <span>View Analysis</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleStopTrackingFromDashboard(tr.id, e)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.8rem', color: '#ef4444', padding: '6px 10px' }}
                    title="Stop monitoring this repository"
                  >
                    <StopCircle size={14} />
                    <span>Stop</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Analysis Section */}
      <section>
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
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
              Your Saved Analyses
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '2px' }}>
              All evaluations saved for this student account
            </p>
          </div>

          {analyses.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="text"
                  placeholder="Filter repository or job..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '36px', fontSize: '0.875rem' }}
                  aria-label="Filter analyses"
                />
              </div>

              <Link to="/new" className="btn btn-secondary btn-sm">
                <PlusCircle size={15} />
                <span>New</span>
              </Link>
            </div>
          )}
        </div>

        {error && (
          <ErrorAlert
            title="Could not load analyses"
            message={error}
            onRetry={fetchAnalyses}
          />
        )}

        {isLoading ? (
          <LoadingSpinner message="Loading your assessments..." fullHeight />
        ) : analyses.length === 0 ? (
          /* TRUTHFUL EMPTY STATE FOR FRESH ACCOUNTS (Mandatory requirement) */
          <div
            className="card"
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              border: '1px dashed #cbd5e1',
              borderRadius: '12px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#eef2ff',
                color: '#4f46e5',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
              }}
            >
              <FolderGit2 size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              No analyses yet for {student?.name || 'this student'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
              Your dashboard calculates statistics strictly from your own persisted evaluations. Connect a GitHub repository and a target job to uncover verified skill matches and actionable next steps.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/new')}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#4f46e5' }}
              >
                <PlusCircle size={18} />
                <span>Analyze a Repository</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/new')}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
              >
                <Briefcase size={18} />
                <span>Explore Curated Jobs</span>
              </button>
            </div>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <EmptyState
            title="No matching assessments"
            description={`No assessment matches "${searchQuery}".`}
            actionText="Clear Filter"
            onAction={() => setSearchQuery('')}
          />
        ) : (
          <div className="grid-2" style={{ gap: '20px' }}>
            {filteredAnalyses.map((item) => {
              const assessments = item.latestAssessment?.assessments || [];
              const demonstratedCount = assessments.filter(a => a.status === 'demonstrated').length;
              const totalSkills = assessments.length;
              const engine = item.latestAssessment?.assessmentEngine || 'heuristic_fallback';

              return (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid #e2e8f0',
                  }}
                  onClick={() => navigate(`/analysis/${item.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/analysis/${item.id}`);
                    }
                  }}
                >
                  <div>
                    {/* Top row */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <GitBranch size={16} color="#4f46e5" />
                          <h3
                            style={{
                              fontSize: '1.1rem',
                              fontWeight: 700,
                              color: '#0f172a',
                            }}
                          >
                            {item.repositoryOwner}/{item.repositoryName}
                          </h3>
                        </div>

                        {item.jobSource?.url ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              color: '#64748b',
                              marginTop: '4px',
                            }}
                          >
                            {item.jobSource.url.replace(/^https?:\/\//, '').split('?')[0].substring(0, 40)}...
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                            Custom Job Requirements ({totalSkills} skills)
                          </span>
                        )}
                      </div>

                      <StatusBadge status={item.status} />
                    </div>

                    {/* Skill Match Score Bar */}
                    {totalSkills > 0 ? (
                      <div style={{ marginBlock: '16px' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '6px',
                            fontSize: '0.85rem',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: '#334155' }}>Skill Match</span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {demonstratedCount} of {totalSkills} Demonstrated (
                            {Math.round((demonstratedCount / totalSkills) * 100)}%)
                          </span>
                        </div>
                        <div
                          style={{
                            height: '8px',
                            backgroundColor: '#e2e8f0',
                            borderRadius: '9999px',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${(demonstratedCount / totalSkills) * 100}%`,
                              backgroundColor: demonstratedCount === totalSkills ? '#10b981' : '#4f46e5',
                              borderRadius: '9999px',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginBlock: '16px', fontSize: '0.85rem', color: '#64748b' }}>
                        {item.status === 'analyzing' ? 'Analysis in progress...' : 'No skills evaluated'}
                      </div>
                    )}
                  </div>

                  {/* Bottom row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #f1f5f9',
                      paddingTop: '12px',
                      marginTop: '8px',
                      fontSize: '0.8rem',
                      color: '#64748b',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Layers size={13} />
                        v{item.currentVersion}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#4f46e5',
                        fontWeight: 600,
                      }}
                    >
                      View Report <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
