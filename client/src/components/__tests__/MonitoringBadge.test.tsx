import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MonitoringBadge from '../MonitoringBadge';
import type { TrackedRepository } from '../../types';

describe('MonitoringBadge Component', () => {
  it('renders inactive status when tracking is null', () => {
    render(<MonitoringBadge tracking={null} />);
    expect(screen.getByText('Monitoring Inactive')).toBeInTheDocument();
  });

  it('renders active status with polling times', () => {
    const mockTracking: TrackedRepository = {
      id: 'track-1',
      analysisId: 'ana-1',
      repositoryUrl: 'https://github.com/owner/repo',
      owner: 'owner',
      repo: 'repo',
      lastKnownSha: 'sha1',
      lastAssessedSha: 'sha1',
      status: 'active',
      pollIntervalMinutes: 5,
      createdAt: '2026-10-16T10:00:00Z',
      updatedAt: '2026-10-16T10:00:00Z',
      lastPollAt: '2026-10-16T10:00:00Z',
      consecutiveErrors: 0,
    };

    render(<MonitoringBadge tracking={mockTracking} />);
    expect(screen.getByText('Monitoring Active')).toBeInTheDocument();
    expect(screen.getByText(/Last poll:/i)).toBeInTheDocument();
  });

  it('renders errors when consecutive errors exist', () => {
    const mockTracking: TrackedRepository = {
      id: 'track-2',
      analysisId: 'ana-2',
      repositoryUrl: 'https://github.com/owner/repo',
      owner: 'owner',
      repo: 'repo',
      lastKnownSha: 'sha1',
      lastAssessedSha: 'sha1',
      status: 'error',
      pollIntervalMinutes: 5,
      createdAt: '2026-10-16T10:00:00Z',
      updatedAt: '2026-10-16T10:00:00Z',
      consecutiveErrors: 2,
      lastError: 'Rate limit exceeded',
    };

    render(<MonitoringBadge tracking={mockTracking} />);
    expect(screen.getByText(/2 error\(s\) • Rate limit exceeded/i)).toBeInTheDocument();
  });
});
