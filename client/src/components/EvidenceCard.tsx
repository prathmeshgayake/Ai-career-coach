import React, { useState } from 'react';
import { ExternalLink, FileCode, GitCommit, Copy, Check } from 'lucide-react';
import type { Evidence } from '../types';

interface EvidenceCardProps {
  evidence: Evidence;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(evidence.excerpt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortSha = evidence.commitSha ? evidence.commitSha.substring(0, 7) : '';

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-gray-200)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        marginTop: '12px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: 'var(--color-gray-50)',
          borderBottom: '1px solid var(--color-gray-200)',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <FileCode size={16} style={{ color: 'var(--color-gray-500)', flexShrink: 0 }} />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--color-gray-800)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={evidence.filePath}
          >
            {evidence.filePath}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          {evidence.commitSha && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--color-gray-600)',
              }}
            >
              <GitCommit size={14} />
              {shortSha}
            </span>
          )}

          {evidence.githubUrl && (
            <a
              href={evidence.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="View on GitHub"
              aria-label="View on GitHub"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--color-primary)',
                fontSize: '0.8rem',
                fontWeight: 500,
              }}
            >
              GitHub <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={copyCode}
          aria-label="Copy code excerpt"
          title="Copy code excerpt"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid #334155',
            color: '#cbd5e1',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            fontSize: '0.75rem',
            zIndex: 2,
          }}
        >
          {copied ? <Check size={13} style={{ color: '#4ade80' }} /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        <pre
          className="code-block"
          style={{
            margin: 0,
            borderRadius: 0,
            maxHeight: '260px',
            fontSize: '0.825rem',
          }}
        >
          <code>{evidence.excerpt}</code>
        </pre>
      </div>

      {evidence.explanation && (
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--color-surface)',
            borderTop: '1px solid var(--color-gray-200)',
            fontSize: '0.875rem',
            color: 'var(--color-gray-700)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--color-gray-900)', fontWeight: 600 }}>Why this applies: </strong>
          {evidence.explanation}
        </div>
      )}
    </div>
  );
};

export default EvidenceCard;
