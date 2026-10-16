import React from 'react';
import { Activity, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import type { TrackedRepository } from '../types';

interface MonitoringBadgeProps {
  tracking: TrackedRepository | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const MonitoringBadge: React.FC<MonitoringBadgeProps> = ({
  tracking,
  onRefresh,
  isRefreshing = false,
}) => {
  if (!tracking) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: 'var(--color-gray-100)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-gray-600)',
          fontSize: '0.85rem',
        }}
      >
        <Clock size={15} />
        <span>Monitoring Inactive</span>
      </div>
    );
  }

  const isActive = tracking.status === 'active';
  const hasErrors = (tracking.consecutiveErrors || 0) > 0 || !!tracking.lastError;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not yet polled';
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const getNextPollTime = () => {
    if (!tracking.lastPollAt || !isActive) return 'Pending schedule';
    try {
      const last = new Date(tracking.lastPollAt);
      const next = new Date(last.getTime() + (tracking.pollIntervalMinutes || 5) * 60 * 1000);
      return next.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Every 5m';
    }
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '10px 14px',
        backgroundColor: isActive ? 'var(--color-success-light)' : 'var(--color-gray-100)',
        border: `1px solid ${isActive ? '#a7f3d0' : 'var(--color-gray-200)'}`,
        borderRadius: 'var(--radius-md)',
        fontSize: '0.85rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isActive ? (
            <span className="pulse-dot pulse-dot-green" />
          ) : (
            <Activity size={15} style={{ color: 'var(--color-gray-500)' }} />
          )}
          <span style={{ fontWeight: 600, color: isActive ? 'var(--color-success)' : 'var(--color-gray-700)' }}>
            {isActive ? 'Monitoring Active' : `Monitoring: ${tracking.status}`}
          </span>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Refresh tracking status"
            title="Refresh tracking status"
            style={{
              padding: '2px',
              color: 'var(--color-gray-600)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          color: 'var(--color-gray-600)',
          fontSize: '0.8rem',
        }}
      >
        <span>
          <strong>Last poll:</strong> {formatDate(tracking.lastPollAt)}
        </span>
        {isActive && (
          <span>
            <strong>Next:</strong> {getNextPollTime()}
          </span>
        )}
      </div>

      {hasErrors && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--color-error)',
            fontSize: '0.775rem',
            marginTop: '2px',
          }}
        >
          <AlertTriangle size={13} />
          <span>
            {tracking.consecutiveErrors} error(s) {tracking.lastError ? `• ${tracking.lastError}` : ''}
          </span>
        </div>
      )}
    </div>
  );
};

export default MonitoringBadge;
