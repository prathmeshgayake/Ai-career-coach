import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Clock, Activity } from 'lucide-react';
import type { SkillStatus } from '../types';

interface StatusBadgeProps {
  status: SkillStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeConfig = (st: string) => {
    switch (st) {
      case 'demonstrated':
        return {
          label: 'Demonstrated',
          className: 'badge-demonstrated',
          icon: <CheckCircle2 size={size === 'sm' ? 12 : 14} />,
        };
      case 'partially_demonstrated':
        return {
          label: 'Partially Demonstrated',
          className: 'badge-partially_demonstrated',
          icon: <AlertTriangle size={size === 'sm' ? 12 : 14} />,
        };
      case 'not_demonstrated_in_scope':
        return {
          label: 'Not Demonstrated',
          className: 'badge-not_demonstrated_in_scope',
          icon: <XCircle size={size === 'sm' ? 12 : 14} />,
        };
      case 'unable_to_verify':
        return {
          label: 'Unable to Verify',
          className: 'badge-unable_to_verify',
          icon: <HelpCircle size={size === 'sm' ? 12 : 14} />,
        };
      case 'completed':
        return {
          label: 'Completed',
          className: 'badge-demonstrated',
          icon: <CheckCircle2 size={size === 'sm' ? 12 : 14} />,
        };
      case 'analyzing':
        return {
          label: 'Analyzing',
          className: 'badge-partially_demonstrated',
          icon: <Activity size={size === 'sm' ? 12 : 14} />,
        };
      case 'pending':
        return {
          label: 'Pending',
          className: 'badge-not_demonstrated_in_scope',
          icon: <Clock size={size === 'sm' ? 12 : 14} />,
        };
      case 'failed':
      case 'error':
        return {
          label: 'Failed',
          className: 'badge-status-failed',
          icon: <XCircle size={size === 'sm' ? 12 : 14} />,
        };
      case 'active':
        return {
          label: 'Active',
          className: 'badge-demonstrated',
          icon: <span className="pulse-dot pulse-dot-green" />,
        };
      case 'stopped':
        return {
          label: 'Stopped',
          className: 'badge-not_demonstrated_in_scope',
          icon: <XCircle size={size === 'sm' ? 12 : 14} />,
        };
      default:
        return {
          label: st.replace(/_/g, ' '),
          className: 'badge-not_demonstrated_in_scope',
          icon: null,
        };
    }
  };

  const config = getBadgeConfig(status);

  return (
    <span
      className={`badge ${config.className}`}
      style={{
        fontSize: size === 'sm' ? '0.75rem' : '0.825rem',
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
      }}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
