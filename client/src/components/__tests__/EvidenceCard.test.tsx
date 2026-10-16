import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import EvidenceCard from '../EvidenceCard';
import type { Evidence } from '../../types';

describe('EvidenceCard Component', () => {
  const mockEvidence: Evidence = {
    id: 'ev-1',
    filePath: 'src/services/auth.service.ts',
    excerpt: 'export class AuthService { login() {} }',
    commitSha: 'a1b2c3d4e5f6',
    githubUrl: 'https://github.com/test/repo/blob/a1b2c3d4e5f6/src/services/auth.service.ts',
    explanation: 'Demonstrates authentication implementation in TypeScript',
  };

  it('renders file path and shortened commit sha', () => {
    render(<EvidenceCard evidence={mockEvidence} />);
    expect(screen.getByText('src/services/auth.service.ts')).toBeInTheDocument();
    expect(screen.getByText('a1b2c3d')).toBeInTheDocument();
  });

  it('renders code excerpt', () => {
    render(<EvidenceCard evidence={mockEvidence} />);
    expect(screen.getByText('export class AuthService { login() {} }')).toBeInTheDocument();
  });

  it('renders explanation text', () => {
    render(<EvidenceCard evidence={mockEvidence} />);
    expect(screen.getByText(/Demonstrates authentication implementation in TypeScript/i)).toBeInTheDocument();
  });

  it('renders link to github', () => {
    render(<EvidenceCard evidence={mockEvidence} />);
    const link = screen.getByRole('link', { name: /view on github/i });
    expect(link).toHaveAttribute('href', mockEvidence.githubUrl);
  });
});
