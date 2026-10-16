import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, GitCommit } from 'lucide-react';
import type { AssessmentVersion } from '../types';

interface ProgressChartProps {
  versions: AssessmentVersion[];
  title?: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  versions,
  title = 'Progress Over Time',
}) => {
  // Sort versions by version number ascending
  const sortedVersions = React.useMemo(() => {
    return [...versions].sort((a, b) => a.version - b.version);
  }, [versions]);

  const data = React.useMemo(() => {
    return sortedVersions.map((v) => {
      let demonstrated = 0;
      let partial = 0;
      let gaps = 0;

      (v.assessments || []).forEach((a) => {
        if (a.status === 'demonstrated') demonstrated++;
        else if (a.status === 'partially_demonstrated') partial++;
        else gaps++;
      });

      const total = (v.assessments || []).length;
      const matchScore = total > 0 ? Math.round((demonstrated / total) * 100) : 0;

      return {
        versionLabel: `v${v.version} (${(v.commitSha || '').substring(0, 7)})`,
        version: v.version,
        demonstrated,
        partial,
        gaps,
        total,
        matchScore,
        date: new Date(v.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
      };
    });
  }, [sortedVersions]);

  if (versions.length <= 1) {
    return (
      <div className="card" style={{ padding: '20px', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
          <TrendingUp size={18} />
          <span style={{ fontSize: '0.85rem' }}>
            Progress chart requires at least 2 commit assessment versions. Push a commit or re-trigger to view historical trends.
          </span>
        </div>
      </div>
    );
  }

  const latestScore = data[data.length - 1]?.matchScore || 0;
  const initialScore = data[0]?.matchScore || 0;
  const diff = latestScore - initialScore;

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} color="#4f46e5" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{title}</h3>
        </div>
        <span
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: diff >= 0 ? '#dcfce7' : '#fee2e2',
            color: diff >= 0 ? '#15803d' : '#b91c1c',
          }}
        >
          {diff >= 0 ? `+${diff}%` : `${diff}%`} since v1
        </span>
      </div>

      <div style={{ width: '100%', height: '260px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="versionLabel" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 100]} unit="%" />
            <Tooltip
              formatter={(val: any, name: any) => [
                name === 'matchScore' ? `${val}%` : val,
                name === 'matchScore' ? 'Match Score' : name === 'demonstrated' ? 'Demonstrated' : name,
              ]}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.85rem',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="matchScore"
              name="Match Score (%)"
              stroke="#4f46e5"
              strokeWidth={3}
              dot={{ r: 5, fill: '#4f46e5' }}
              activeDot={{ r: 7 }}
            />
            <Line
              type="monotone"
              dataKey="demonstrated"
              name="Demonstrated Skills"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressChart;
