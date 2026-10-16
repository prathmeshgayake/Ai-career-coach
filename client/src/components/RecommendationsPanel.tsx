import React, { useState } from 'react';
import { 
  Lightbulb, 
  ArrowRight, 
  CheckCircle, 
  Flame, 
  Clock, 
  Tag, 
  Sparkles,
  Check
} from 'lucide-react';
import type { Recommendation } from '../types';

interface RecommendationsPanelProps {
  recommendations?: Recommendation[];
  title?: string;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations = [],
  title = 'Actionable Next Steps & Career Recommendations',
}) => {
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const toggleTaskCompleted = (id: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filtered = React.useMemo(() => {
    if (filterPriority === 'all') return recommendations;
    return recommendations.filter((r) => r.priority === filterPriority);
  }, [recommendations, filterPriority]);

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="card" style={{ padding: '24px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#15803d' }}>
          <CheckCircle size={22} />
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>All Requirements Demonstrated!</h4>
            <p style={{ fontSize: '0.85rem', color: '#166534', marginTop: '2px' }}>
              Your repository provides verifiable evidence for all key skills in this role posting.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getPriorityBadge = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'high':
        return {
          label: 'High Priority',
          bg: '#fee2e2',
          color: '#b91c1c',
          border: '#fecaca',
          icon: <Flame size={12} />,
        };
      case 'medium':
        return {
          label: 'Medium Priority',
          bg: '#fef3c7',
          color: '#b45309',
          border: '#fde68a',
          icon: <Clock size={12} />,
        };
      default:
        return {
          label: 'Low Priority',
          bg: '#f1f5f9',
          color: '#475569',
          border: '#e2e8f0',
          icon: <Tag size={12} />,
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#eef2ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lightbulb size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Prioritized improvements linked directly to your unverified or missing skills.
            </p>
          </div>
        </div>

        {/* Priority Filter */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['all', 'high', 'medium', 'low'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setFilterPriority(p)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid',
                borderColor: filterPriority === p ? '#4f46e5' : '#e2e8f0',
                backgroundColor: filterPriority === p ? '#eef2ff' : '#ffffff',
                color: filterPriority === p ? '#4f46e5' : '#64748b',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map((rec) => {
          const badge = getPriorityBadge(rec.priority);
          const isDone = completedTaskIds.has(rec.id);

          return (
            <div
              key={rec.id}
              style={{
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: isDone ? '#bbf7d0' : '#e2e8f0',
                backgroundColor: isDone ? '#f0fdf4' : '#ffffff',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                    }}
                  >
                    {badge.icon}
                    <span>{badge.label}</span>
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>
                    Skill: <strong style={{ color: '#0f172a' }}>{rec.skillName}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleTaskCompleted(rec.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: isDone ? '#86efac' : '#cbd5e1',
                    backgroundColor: isDone ? '#dcfce7' : '#f8fafc',
                    color: isDone ? '#15803d' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  <Check size={12} />
                  <span>{isDone ? 'Marked Complete' : 'Mark Done'}</span>
                </button>
              </div>

              <h4
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: isDone ? '#166534' : '#0f172a',
                  textDecoration: isDone ? 'line-through' : 'none',
                  marginBottom: '6px',
                }}
              >
                {rec.actionTitle}
              </h4>

              <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, marginBottom: '10px' }}>
                {rec.explanation}
              </p>

              {rec.suggestedTask && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: isDone ? '#ffffff' : '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <Sparkles size={14} color="#4f46e5" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: '#334155' }}>Suggested Code Action: </strong>
                    <span style={{ color: '#64748b' }}>{rec.suggestedTask}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendationsPanel;
