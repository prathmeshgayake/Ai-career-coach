import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message,
  size = 'md',
  fullHeight = false,
}) => {
  const pixelSizes = {
    sm: 18,
    md: 28,
    lg: 44,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: fullHeight ? '64px 24px' : '24px',
        minHeight: fullHeight ? '300px' : 'auto',
        color: 'var(--color-gray-600)',
      }}
    >
      <Loader2
        size={pixelSizes[size]}
        style={{
          animation: 'spin 1s linear infinite',
          color: 'var(--color-primary)',
        }}
      />
      {message && (
        <p style={{ fontSize: '0.925rem', fontWeight: 500, color: 'var(--color-gray-600)' }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
