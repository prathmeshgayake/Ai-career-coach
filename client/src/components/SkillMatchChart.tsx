import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import type { SkillAssessment } from '../types';

interface SkillMatchChartProps {
  assessments: SkillAssessment[];
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG = {
  demonstrated: {
    label: 'Demonstrated',
    color: '#10b981', // Emerald green
    icon: CheckCircle2,
    badgeBg: '#dcfce7',
    badgeText: '#15803d',
  },
  partially_demonstrated: {
    label: 'Partially Demonstrated',
    color: '#f59e0b', // Amber
    icon: AlertTriangle,
    badgeBg: '#fef3c7',
    badgeText: '#b45309',
  },
  not_demonstrated_in_scope: {
    label: 'Not Demonstrated',
    color: '#ef4444', // Red
    icon: XCircle,
    badgeBg: '#fee2e2',
    badgeText: '#b91c1c',
  },
  unable_to_verify: {
    label: 'Unable to Verify',
    color: '#94a3b8', // Slate grey
    icon: HelpCircle,
    badgeBg: '#f1f5f9',
    badgeText: '#475569',
  },
};

export const SkillMatchChart: React.FC<SkillMatchChartProps> = ({
  assessments,
  title = 'Skill Match Breakdown',
  size = 'md',
}) => {
  const counts = React.useMemo(() => {
    const c = {
      demonstrated: 0,
      partially_demonstrated: 0,
      not_demonstrated_in_scope: 0,
      unable_to_verify: 0,
    };
    assessments.forEach((a) => {
      if (a.status in c) {
        c[a.status as keyof typeof c]++;
      } else {
        c.unable_to_verify++;
      }
    });
    return c;
  }, [assessments]);

  const total = assessments.length;

  const data = React.useMemo(() => {
    return [
      { name: 'Demonstrated', value: counts.demonstrated, status: 'demonstrated', color: STATUS_CONFIG.demonstrated.color },
      { name: 'Partially Demonstrated', value: counts.partially_demonstrated, status: 'partially_demonstrated', color: STATUS_CONFIG.partially_demonstrated.color },
      { name: 'Not Demonstrated', value: counts.not_demonstrated_in_scope, status: 'not_demonstrated_in_scope', color: STATUS_CONFIG.not_demonstrated_in_scope.color },
      { name: 'Unable to Verify', value: counts.unable_to_verify, status: 'unable_to_verify', color: STATUS_CONFIG.unable_to_verify.color },
    ].filter((item) => item.value > 0);
  }, [counts]);

  const matchPercentage = total > 0 ? Math.round((counts.demonstrated / total) * 100) : 0;

  if (total === 0) {
    return (
      <div className="card" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
        <p>No skill assessment data available for chart</p>
      </div>
    );
  }

  const height = size === 'sm' ? 220 : size === 'lg' ? 320 : 260;

  return (
    <div className="card" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: matchPercentage >= 70 ? '#dcfce7' : matchPercentage >= 40 ? '#fef3c7' : '#fee2e2',
            color: matchPercentage >= 70 ? '#15803d' : matchPercentage >= 40 ? '#b45309' : '#b91c1c',
          }}
        >
          {matchPercentage}% Match
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={size === 'sm' ? 45 : 60}
              outerRadius={size === 'sm' ? 75 : 90}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [
                `${value} requirements (${Math.round((Number(value) / total) * 100)}%)`,
                name,
              ]}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.85rem',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center score */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
            {matchPercentage}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
            {counts.demonstrated}/{total} Verified
          </div>
        </div>
      </div>

      {/* Legend & Stats list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '16px' }}>
        {(['demonstrated', 'partially_demonstrated', 'not_demonstrated_in_scope', 'unable_to_verify'] as const).map(
          (statusKey) => {
            const conf = STATUS_CONFIG[statusKey];
            const count = counts[statusKey];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div
                key={statusKey}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #f1f5f9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: conf.color,
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                    {conf.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{count}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({pct}%)</span>
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
};

export default SkillMatchChart;
