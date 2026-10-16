import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AnalysisDetailPage from '../../pages/AnalysisDetailPage';

// Mock the API client
vi.mock('../../api/client', () => ({
  apiClient: {
    getHealth: vi.fn().mockResolvedValue({ data: { status: 'ok' } }),
    getAnalysis: vi.fn().mockResolvedValue({
      data: {
        id: 'test-analysis-123',
        repositoryOwner: 'testuser',
        repositoryName: 'testrepo',
        repositoryUrl: 'https://github.com/testuser/testrepo',
        currentVersion: 1,
        latestCommitSha: 'abc1234567890abcdef',
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        jobSource: {
          retrievalMethod: 'pasted',
          requirements: ['Node.js API Development'],
          pastedDescription: 'Job description test',
          fetchedAt: new Date().toISOString(),
        },
        latestAssessment: {
          id: 'v1-id',
          analysisId: 'test-analysis-123',
          version: 1,
          commitSha: 'abc1234567890abcdef',
          trigger: 'initial',
          createdAt: new Date().toISOString(),
          assessmentEngine: 'heuristic_fallback',
          assessments: [
            {
              skillName: 'Node.js API Development',
              status: 'not_demonstrated_in_scope',
              evidence: [],
              reasoning: 'No matching files found in repository.',
            },
          ],
        },
      },
    }),
    getTrackingStatus: vi.fn().mockRejectedValue(new Error('Not tracked')),
  },
}));

describe('AnalysisDetailPage Component', () => {
  it('renders analysis detail page and skill gaps without Sparkles error', async () => {
    render(
      <MemoryRouter initialEntries={['/analysis/test-analysis-123']}>
        <Routes>
          <Route path="/analysis/:id" element={<AnalysisDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify the page renders heading and repository name once data loads
    const heading = await screen.findByText(/Skill Gaps & Recommended Growth Actions/i);
    expect(heading).toBeInTheDocument();
    expect(screen.getAllByText('Node.js API Development').length).toBeGreaterThanOrEqual(1);
  });
});
