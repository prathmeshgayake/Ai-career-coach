import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  GitCommit, 
  Layers, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  FileDiff, 
  Sparkles,
  GitBranch,
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useAnalysis } from '../hooks/useAnalysis';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import type { AssessmentVersion } from '../types';

export const HistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentAnalysis, history, isLoading, error, fetchAnalysis, fetchHistory } = useAnalysis();
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchAnalysis(id);
      fetchHistory(id);
    }
  }, [id, fetchAnalysis, fetchHistory]);

  const toggleExpand = (versionId: string) => {
    setExpandedVersionId(prev => (prev === versionId ? null : versionId));
  };

  // Sort versions descending (newest version first)
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => b.version - a.version);
  }, [history]);

  if (isLoading && history.length === 0) {
    return <LoadingSpinner message="Loading assessment history..." fullHeight />;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link to={`/analysis/${id}`} className="btn btn-ghost btn-sm">
          <ArrowLeft size={16} /> Back to Analysis
        </Link>
      </div>

      {error && (
        <ErrorAlert
          title="Could not load history"
          message={error}
          onRetry={() => {
            if (id) {
              fetchAnalysis(id);
              fetchHistory(id);
            }
          }}
        />
      )}

      {/* Header Info */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <GitBranch size={20} style={{ color: 'var(--color-primary)' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-gray-900)' }}>
            Assessment Version History
          </h1>
        </div>
        {currentAnalysis && (
          <p style={{ color: 'var(--color-gray-600)', fontSize: '0.95rem' }}>
            Repository: <strong>{currentAnalysis.repositoryOwner}/{currentAnalysis.repositoryName}</strong> • Current Version: <strong>v{currentAnalysis.currentVersion || 1}</strong>
          </p>
        )}
      </div>

      {sortedHistory.length === 0 ? (
        <EmptyState
          title="No history recorded yet"
          description="Version history will appear here once new commits are analyzed or monitored."
        />
      ) : (
        <div style={{ position: 'relative', paddingLeft: '24px' }}>
          {/* Vertical timeline spine line */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              bottom: '20px',
              left: '11px',
              width: '2px',
              backgroundColor: 'var(--color-gray-300)',
              zIndex: 0,
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {sortedHistory.map((ver: AssessmentVersion) => {
              const isExpanded = expandedVersionId === ver.id;
              const shortSha = ver.commitSha ? ver.commitSha.substring(0, 7) : 'HEAD';
              const demonstratedCount = ver.assessments?.filter(a => a.status === 'demonstrated').length || 0;
              const totalSkills = ver.assessments?.length || 0;

              return (
                <div
                  key={ver.id || ver.version}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {/* Timeline dot icon */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '20px',
                      left: '-24px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: ver.trigger === 'commit_change' ? 'var(--color-primary)' : 'var(--color-success)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 0 4px var(--color-bg)',
                    }}
                  >
                    <Layers size={13} />
                  </div>

                  {/* Version Card */}
                  <div className="card" style={{ padding: '20px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                      onClick={() => toggleExpand(ver.id)}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '1.2rem',
                              fontWeight: 700,
                              color: 'var(--color-gray-900)',
                            }}
                          >
                            Version {ver.version}
                          </span>

                          <span
                            className={`badge ${
                              ver.trigger === 'commit_change'
                                ? 'badge-partially_demonstrated'
                                : 'badge-demonstrated'
                            }`}
                            style={{ fontSize: '0.75rem' }}
                          >
                            {ver.trigger === 'commit_change' ? 'Commit Change' : 'Initial Assessment'}
                          </span>

                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.8rem',
                              color: 'var(--color-gray-600)',
                              backgroundColor: 'var(--color-gray-100)',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-sm)',
                            }}
                          >
                            <GitCommit size={13} /> {shortSha}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            marginTop: '8px',
                            fontSize: '0.85rem',
                            color: 'var(--color-gray-500)',
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} /> {new Date(ver.createdAt).toLocaleString()}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>{demonstratedCount}/{totalSkills}</strong> demonstrated
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        aria-label={isExpanded ? 'Collapse version details' : 'Expand version details'}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>

                    {/* Expandable details */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: '20px',
                          paddingTop: '20px',
                          borderTop: '1px solid var(--color-gray-200)',
                        }}
                      >
                        {/* Changed files list if any */}
                        {ver.changedFiles && ver.changedFiles.length > 0 && (
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--color-gray-700)', fontWeight: 600, fontSize: '0.9rem' }}>
                              <FileDiff size={16} />
                              <span>Changed Files ({ver.changedFiles.length})</span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '6px',
                                maxHeight: '120px',
                                overflowY: 'auto',
                                padding: '8px',
                                backgroundColor: 'var(--color-gray-50)',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              {ver.changedFiles.map((file, fIdx) => (
                                <code
                                  key={fIdx}
                                  className="inline-code"
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  {file}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Skill Assessment Breakdown */}
                        <h4
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--color-gray-500)',
                            marginBottom: '12px',
                          }}
                        >
                          Skill Assessment Status in this Version
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {ver.assessments?.map((a, aIdx) => (
                            <div
                              key={aIdx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                backgroundColor: 'var(--color-gray-50)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.9rem',
                              }}
                            >
                              <span style={{ fontWeight: 500, color: 'var(--color-gray-800)' }}>
                                {a.skillName}
                              </span>
                              <StatusBadge status={a.status} size="sm" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
