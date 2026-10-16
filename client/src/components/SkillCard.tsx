import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileCode } from 'lucide-react';
import type { SkillAssessment } from '../types';
import StatusBadge from './StatusBadge';
import EvidenceCard from './EvidenceCard';

interface SkillCardProps {
  assessment: SkillAssessment;
  defaultExpanded?: boolean;
}

export const SkillCard: React.FC<SkillCardProps> = ({
  assessment,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const hasEvidence = assessment.evidence && assessment.evidence.length > 0;

  return (
    <div
      className="card"
      style={{
        padding: '20px',
        marginBottom: '16px',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--color-gray-900)',
              }}
            >
              {assessment.skillName}
            </h3>
            <StatusBadge status={assessment.status} />
          </div>

          <p
            style={{
              fontSize: '0.925rem',
              color: 'var(--color-gray-700)',
              lineHeight: 1.5,
              marginTop: '4px',
            }}
          >
            {assessment.reasoning}
          </p>
        </div>

        {hasEvidence && (
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className="btn btn-secondary btn-sm"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} evidence for ${assessment.skillName}`}
            style={{
              alignSelf: 'flex-start',
              whiteSpace: 'nowrap',
            }}
          >
            <FileCode size={14} />
            <span>
              {assessment.evidence.length} {assessment.evidence.length === 1 ? 'Evidence' : 'Evidences'}
            </span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {hasEvidence && isExpanded && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-gray-100)' }}>
          <h4
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--color-gray-500)',
              marginBottom: '8px',
            }}
          >
            Supporting Evidence ({assessment.evidence.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {assessment.evidence.map((item, idx) => (
              <EvidenceCard key={item.id || idx} evidence={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillCard;
