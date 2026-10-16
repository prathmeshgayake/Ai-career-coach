import React, { useEffect, useState } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { useAnalysis } from '../hooks/useAnalysis';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { analyses, isLoading, error, fetchAnalyses } = useAnalysis();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

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
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '48px 32px',
          marginBottom: '40px',
          border: '1px solid #dbeafe',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary-dark)',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          <Sparkles size={16} />
          <span>AI-Powered Career Gap Analysis</span>
        </div>

        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: 'var(--color-gray-900)',
            marginBottom: '16px',
            lineHeight: 1.2,
          }}
        >
          Validate Your Skills Against Real Jobs
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--color-gray-600)',
            maxWidth: '680px',
            margin: '0 auto 28px',
            lineHeight: 1.6,
          }}
        >
          Compare real job descriptions against evidence extracted directly from your GitHub repositories.
          Identify skill gaps with verified code references and monitor progress on every commit.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/new')}
            className="btn btn-primary btn-lg"
          >
            <PlusCircle size={20} />
            <span>Start New Analysis</span>
          </button>
        </div>
      </section>

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
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-gray-900)' }}>
              Your Analyses
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-gray-500)', marginTop: '2px' }}>
              Tracked repositories and job matches
            </p>
          </div>

          {analyses.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-gray-400)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search repository or job..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '36px', fontSize: '0.9rem' }}
                  aria-label="Search analyses"
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
          <LoadingSpinner message="Loading your analyses..." fullHeight />
        ) : analyses.length === 0 ? (
          <EmptyState
            title="No analyses yet"
            description="Start by connecting a GitHub repository and a job description to discover your skill evidence."
            actionText="Start First Analysis"
            onAction={() => navigate('/new')}
          />
        ) : filteredAnalyses.length === 0 ? (
          <EmptyState
            title="No matching analyses"
            description={`No analysis matches the filter "${searchQuery}".`}
            actionText="Clear Filter"
            onAction={() => setSearchQuery('')}
          />
        ) : (
          <div className="grid-2">
            {filteredAnalyses.map((item) => {
              const assessments = item.latestAssessment?.assessments || [];
              const demonstratedCount = assessments.filter(a => a.status === 'demonstrated').length;
              const totalSkills = assessments.length;

              return (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
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
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginBottom: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GitBranch size={18} style={{ color: 'var(--color-primary)' }} />
                        <h3
                          style={{
                            fontSize: '1.15rem',
                            fontWeight: 600,
                            color: 'var(--color-gray-900)',
                          }}
                        >
                          {item.repositoryOwner}/{item.repositoryName}
                        </h3>
                      </div>
                      <StatusBadge status={item.status} size="sm" />
                    </div>

                    <p
                      style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-gray-600)',
                        marginBottom: '16px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.jobSource?.url ? (
                        <span>
                          <strong>Job URL:</strong> {item.jobSource.url}
                        </span>
                      ) : (
                        <span>
                          <strong>Description:</strong> {item.jobSource?.pastedDescription || 'Pasted job requirements'}
                        </span>
                      )}
                    </p>

                    {totalSkills > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          backgroundColor: 'var(--color-gray-50)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '16px',
                          fontSize: '0.85rem',
                        }}
                      >
                        <CheckCircle2 size={16} style={{ color: 'var(--color-success)' }} />
                        <span>
                          <strong>{demonstratedCount}</strong> of <strong>{totalSkills}</strong> skills demonstrated
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid var(--color-gray-100)',
                      paddingTop: '14px',
                      fontSize: '0.8rem',
                      color: 'var(--color-gray-500)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />
                        {formatDate(item.createdAt)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Layers size={13} />
                        v{item.currentVersion || 1}
                      </span>
                    </div>

                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: 'var(--color-primary)',
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

export default HomePage;
