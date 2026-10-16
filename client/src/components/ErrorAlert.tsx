import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  title?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  onDismiss,
  onRetry,
  title = 'Something went wrong',
}) => {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        padding: '16px',
        backgroundColor: 'var(--color-error-light)',
        border: '1px solid #fca5a5',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-error)',
        marginBottom: '20px',
      }}
    >
      <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px', color: '#991b1b' }}>
          {title}
        </h4>
        <p style={{ fontSize: '0.9rem', color: '#7f1d1d', lineHeight: 1.4 }}>
          {message}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="btn btn-sm"
            style={{
              marginTop: '10px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
            }}
          >
            <RefreshCw size={14} /> Retry
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          style={{
            color: '#991b1b',
            background: 'none',
            border: 'none',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
