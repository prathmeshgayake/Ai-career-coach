import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flame, 
  Tag, 
  GitCommit, 
  Sparkles, 
  Target, 
  ShieldCheck, 
  BookOpen, 
  ChevronRight,
  ListTodo,
  ExternalLink
} from 'lucide-react';
import type { ActionPlan, ActionPlanPhase, ActionPlanTask } from '../types';

interface PersonalizedActionPlanProps {
  actionPlan: ActionPlan;
}

export const PersonalizedActionPlan: React.FC<PersonalizedActionPlanProps> = ({ actionPlan }) => {
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());

  // Load completed tasks from localStorage for this student
  useEffect(() => {
    try {
      const storageKey = `action_plan_completed_${actionPlan.studentId}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCompletedTaskIds(new Set(JSON.parse(saved)));
      }
    } catch {
      // Ignore storage errors
    }
  }, [actionPlan.studentId]);

  const toggleTaskCompleted = (taskId: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      try {
        const storageKey = `action_plan_completed_${actionPlan.studentId}`;
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const currentPhase: ActionPlanPhase | undefined = actionPlan.phases[activePhaseIndex];
  const allTasks = actionPlan.phases.flatMap((p) => p.tasks);
  const totalCompleted = allTasks.filter((t) => completedTaskIds.has(t.id)).length;
  const overallProgressPct = allTasks.length > 0 ? Math.round((totalCompleted / allTasks.length) * 100) : 0;

  const currentPhaseCompleted = currentPhase?.tasks.filter((t) => completedTaskIds.has(t.id)).length || 0;
  const currentPhaseTotal = currentPhase?.tasks.length || 0;
  const currentPhaseProgressPct = currentPhaseTotal > 0 ? Math.round((currentPhaseCompleted / currentPhaseTotal) * 100) : 0;

  const getPriorityStyle = (priority: ActionPlanTask['priority']) => {
    switch (priority) {
      case 'high':
        return {
          bg: '#fee2e2',
          color: '#b91c1c',
          border: '#fecaca',
          label: 'High Priority',
          icon: <Flame size={12} />,
        };
      case 'medium':
        return {
          bg: '#fef3c7',
          color: '#b45309',
          border: '#fde68a',
          label: 'Medium Priority',
          icon: <Clock size={12} />,
        };
      default:
        return {
          bg: '#f1f5f9',
          color: '#475569',
          border: '#e2e8f0',
          label: 'Low Priority',
          icon: <Tag size={12} />,
        };
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: '28px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#eef2ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Personalized Career Action Plan
              </h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                }}
              >
                Target: {actionPlan.targetRole}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
              Tailored roadmap to turn verified code evidence into candidate shortlists.
            </p>
          </div>
        </div>

        {/* Overall Completion Metric */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Action Plan Progress
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              {totalCompleted} of {allTasks.length} Done ({overallProgressPct}%)
            </div>
          </div>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: `conic-gradient(#4f46e5 ${overallProgressPct * 3.6}deg, #e2e8f0 0deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#4f46e5',
              }}
            >
              {overallProgressPct}%
            </div>
          </div>
        </div>
      </div>

      {/* Phase Selection Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {actionPlan.phases.map((phase, idx) => {
          const isSelected = activePhaseIndex === idx;
          const phaseDone = phase.tasks.filter((t) => completedTaskIds.has(t.id)).length;
          return (
            <button
              key={phase.phaseNumber}
              type="button"
              onClick={() => setActivePhaseIndex(idx)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
                backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: isSelected ? '#4f46e5' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {phase.timeframe}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isSelected ? '#4338ca' : '#94a3b8' }}>
                  {phaseDone}/{phase.tasks.length} Done
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: isSelected ? '#1e1b4b' : '#0f172a',
                }}
              >
                {phase.phaseTitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Phase Objective & Checklist */}
      {currentPhase && (
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              padding: '12px 18px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Phase Objective: </strong>
              <span style={{ fontSize: '0.85rem', color: '#475569' }}>{currentPhase.objective}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {currentPhaseCompleted} of {currentPhaseTotal} completed
              </span>
              <div
                style={{
                  width: '80px',
                  height: '6px',
                  backgroundColor: '#e2e8f0',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${currentPhaseProgressPct}%`,
                    height: '100%',
                    backgroundColor: '#10b981',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Tasks List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {currentPhase.tasks.map((task) => {
              const isDone = completedTaskIds.has(task.id);
              const pStyle = getPriorityStyle(task.priority);

              return (
                <div
                  key={task.id}
                  style={{
                    padding: '18px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: isDone ? '#bbf7d0' : '#e2e8f0',
                    backgroundColor: isDone ? '#f0fdf4' : '#ffffff',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleTaskCompleted(task.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        marginTop: '2px',
                        color: isDone ? '#15803d' : '#94a3b8',
                      }}
                      title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                    </button>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                          marginBottom: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              color: isDone ? '#166534' : '#0f172a',
                              textDecoration: isDone ? 'line-through' : 'none',
                            }}
                          >
                            {task.title}
                          </span>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: pStyle.bg,
                              color: pStyle.color,
                              border: `1px solid ${pStyle.border}`,
                            }}
                          >
                            {pStyle.icon}
                            <span>{pStyle.label}</span>
                          </span>
                        </div>

                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                          Est: {task.estimatedHours} hrs
                        </span>
                      </div>

                      <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, marginBottom: '10px' }}>
                        {task.description}
                      </p>

                      {/* Code action and GitHub instructions */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                          gap: '10px',
                          padding: '10px 14px',
                          backgroundColor: isDone ? '#ffffff' : '#f8fafc',
                          borderRadius: '8px',
                          border: '1px dashed #cbd5e1',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <Sparkles size={14} color="#4f46e5" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong style={{ color: '#334155' }}>Code Task: </strong>
                            <span style={{ color: '#475569' }}>{task.codeTask}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <GitCommit size={14} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div>
                            <strong style={{ color: '#334155' }}>GitHub Action: </strong>
                            <span style={{ color: '#475569' }}>{task.githubGuidance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strategic Advice Box */}
      {actionPlan.keyAdvice && actionPlan.keyAdvice.length > 0 && (
        <div
          style={{
            padding: '18px 20px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#166534' }}>
            <ShieldCheck size={18} />
            <h4 style={{ fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>
              Strategic Recruiter & Interview Advice for {actionPlan.targetRole}
            </h4>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.825rem', color: '#15803d', lineHeight: 1.6 }}>
            {actionPlan.keyAdvice.map((advice, i) => (
              <li key={i}>{advice}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PersonalizedActionPlan;
