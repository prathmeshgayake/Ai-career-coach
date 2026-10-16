import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  FileCode, 
  ExternalLink 
} from 'lucide-react';
import type { SkillAssessment } from '../types';

interface CoverageGapChartProps {
  assessments: SkillAssessment[];
  title?: string;
}

export const CoverageGapChart: React.FC<CoverageGapChartProps> = ({
  assessments,
  title = 'Skill Coverage & Gap Breakdown',
}) => {
  const [filter, setFilter] = useState<'all' | 'demonstrated' | 'gaps'>('all');
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

  const filteredAssessments = React.useMemo(() => {
    if (filter === 'demonstrated') {
      return assessments.filter((a) => a.status === 'demonstrated');
    }
    if (filter === 'gaps') {
      return assessments.filter(
        (a) => a.status === 'partially_demonstrated' || a.status === 'not_demonstrated_in_scope'
      );
    }
    return assessments;
  }, [assessments, filter]);

  const getStatusBadge = (status: SkillAssessment['status']) => {
    switch (status) {
      case 'demonstrated':
        return {
          label: 'Demonstrated',
          icon: <CheckCircle2 size={14} color="#15803d" />,
          bg: '#dcfce7',
          color: '#15803d',
          border: '#bbf7d0',
          barColor: '#10b981',
          percent: 100,
        };
      case 'partially_demonstrated':
        return {
          label: 'Partially Demonstrated',
          icon: <AlertTriangle size={14} color="#b45309" />,
          bg: '#fef3c7',
          color: '#b45309',
          border: '#fde68a',
          barColor: '#f59e0b',
          percent: 50,
        };
      case 'not_demonstrated_in_scope':
        return {
          label: 'Not In Inspected Code',
          icon: <XCircle size={14} color="#b91c1c" />,
          bg: '#fee2e2',
          color: '#b91c1c',
          border: '#fecaca',
          barColor: '#ef4444',
          percent: 15,
        };
      default:
        return {
          label: 'Unable to Verify',
          icon: <HelpCircle size={14} color="#475569" />,
          bg: '#f1f5f9',
          color: '#475569',
          border: '#e2e8f0',
          barColor: '#94a3b8',
          percent: 0,
        };
    }
  };

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
            Inspect requirements against verified repository evidence. Click any skill to inspect code references.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'demonstrated', 'gaps'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: filter === tab ? '#4f46e5' : '#e2e8f0',
                backgroundColor: filter === tab ? '#eef2ff' : '#ffffff',
                color: filter === tab ? '#4f46e5' : '#64748b',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'all' ? `All (${assessments.length})` : tab === 'demonstrated' ? 'Demonstrated' : 'Skill Gaps'}
            </button>
          ))}
        </div>
      </div>

      {filteredAssessments.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
          No skills match the selected filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredAssessments.map((item) => {
            const statusInfo = getStatusBadge(item.status);
            const isExpanded = expandedSkill === item.skillName;
            const evidenceCount = item.evidence?.length || 0;

            return (
              <div
                key={item.skillName}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.15s ease',
                }}
              >
                <div
                  onClick={() => setExpandedSkill(isExpanded ? null : item.skillName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    backgroundColor: isExpanded ? '#f8fafc' : '#ffffff',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, marginRight: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                        {item.skillName}
                      </span>
                      {evidenceCount > 0 && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#e0e7ff',
                            color: '#4338ca',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <FileCode size={11} />
                          {evidenceCount} {evidenceCount === 1 ? 'file' : 'files'}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '9999px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${statusInfo.percent}%`,
                          height: '100%',
                          backgroundColor: statusInfo.barColor,
                          borderRadius: '9999px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        backgroundColor: statusInfo.bg,
                        color: statusInfo.color,
                        border: `1px solid ${statusInfo.border}`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </span>

                    {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '16px',
                      backgroundColor: '#f8fafc',
                      borderTop: '1px solid #e2e8f0',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <strong style={{ color: '#334155', display: 'block', marginBottom: '4px' }}>
                        Evaluator Reasoning:
                      </strong>
                      <p style={{ color: '#475569', lineHeight: 1.5 }}>{item.reasoning}</p>
                    </div>

                    {evidenceCount > 0 ? (
                      <div>
                        <strong style={{ color: '#334155', display: 'block', marginBottom: '8px' }}>
                          Repository Evidence:
                        </strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {item.evidence.map((ev, idx) => (
                            <div
                              key={ev.id || idx}
                              style={{
                                padding: '10px 12px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '6px',
                                }}
                              >
                                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#4f46e5' }}>
                                  {ev.filePath}
                                </span>
                                {ev.githubUrl && (
                                  <a
                                    href={ev.githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      color: '#64748b',
                                      fontSize: '0.75rem',
                                      textDecoration: 'none',
                                    }}
                                  >
                                    <span>View on GitHub</span>
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                              </div>
                              <pre
                                style={{
                                  backgroundColor: '#f1f5f9',
                                  padding: '8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  overflowX: 'auto',
                                  color: '#0f172a',
                                  marginBottom: '6px',
                                }}
                              >
                                <code>{ev.excerpt}</code>
                              </pre>
                              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{ev.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.8rem' }}>
                        No code files in the inspected repository satisfied this requirement.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoverageGapChart;
