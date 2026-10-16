import React from 'react';
import { Check } from 'lucide-react';

interface Stage {
  id: number;
  label: string;
}

interface ProgressBarProps {
  progress?: number; // 0 to 100
  stages?: Stage[];
  currentStage?: number; // 1-indexed
  height?: number;
  color?: string;
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  stages,
  currentStage = 1,
  height = 8,
  color = 'var(--color-primary)',
  showLabel = true,
}) => {
  // If stages are provided, render a multi-step indicator
  if (stages && stages.length > 0) {
    return (
      <div style={{ width: '100%', margin: '24px 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            marginBottom: '16px',
          }}
        >
          {/* Connecting line behind icons */}
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '20px',
              right: '20px',
              height: '3px',
              backgroundColor: 'var(--color-gray-200)',
              zIndex: 0,
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: 'var(--color-primary)',
                width: `${((Math.max(currentStage - 1, 0)) / (stages.length - 1)) * 100}%`,
                transition: 'width 0.4s ease',
              }}
            />
          </div>

          {stages.map((stage) => {
            const isCompleted = stage.id < currentStage;
            const isCurrent = stage.id === currentStage;

            return (
              <div
                key={stage.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 1,
                  position: 'relative',
                  width: `${100 / stages.length}%`,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted
                      ? 'var(--color-primary)'
                      : isCurrent
                      ? '#ffffff'
                      : 'var(--color-gray-100)',
                    border: `2px solid ${
                      isCompleted || isCurrent ? 'var(--color-primary)' : 'var(--color-gray-300)'
                    }`,
                    color: isCompleted
                      ? '#ffffff'
                      : isCurrent
                      ? 'var(--color-primary)'
                      : 'var(--color-gray-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    boxShadow: isCurrent ? 'var(--shadow-focus)' : 'none',
                    transition: 'var(--transition)',
                  }}
                >
                  {isCompleted ? <Check size={16} /> : stage.id}
                </div>
                <span
                  style={{
                    marginTop: '8px',
                    fontSize: '0.825rem',
                    fontWeight: isCurrent ? 600 : 500,
                    color: isCurrent
                      ? 'var(--color-primary)'
                      : isCompleted
                      ? 'var(--color-gray-800)'
                      : 'var(--color-gray-500)',
                    maxWidth: '140px',
                  }}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Linear progress bar
  const validProgress = Math.min(100, Math.max(0, progress ?? 0));

  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '6px',
            fontSize: '0.85rem',
            fontWeight: 500,
            color: 'var(--color-gray-600)',
          }}
        >
          <span>Progress</span>
          <span>{Math.round(validProgress)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={validProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: 'var(--color-gray-200)',
          borderRadius: `${height / 2}px`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${validProgress}%`,
            backgroundColor: color,
            borderRadius: `${height / 2}px`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
