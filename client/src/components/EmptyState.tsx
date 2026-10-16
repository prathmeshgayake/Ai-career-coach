import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '56px 24px',
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--color-gray-300)',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-gray-100)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-gray-500)',
          marginBottom: '16px',
        }}
      >
        <Icon size={28} />
      </div>
      <h3
        style={{
          fontSize: '1.2rem',
          fontWeight: 600,
          color: 'var(--color-gray-900)',
          marginBottom: '8px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: 'var(--color-gray-500)',
          fontSize: '0.95rem',
          maxWidth: '420px',
          marginBottom: actionText && onAction ? '20px' : 0,
        }}
      >
        {description}
      </p>
      {actionText && onAction && (
        <button type="button" onClick={onAction} className="btn btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
