import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SkillCard from '../SkillCard';
import type { SkillAssessment } from '../../types';

describe('SkillCard Component', () => {
  const mockAssessment: SkillAssessment = {
    skillName: 'TypeScript & Express',
    status: 'demonstrated',
    reasoning: 'Repository exhibits strong typed architecture with Express routes.',
    evidence: [
      {
        id: 'ev-1',
        filePath: 'src/routes/api.ts',
        excerpt: 'router.post("/items", createItem);',
        commitSha: 'c0ffee123456',
        githubUrl: 'https://github.com/test/repo',
        explanation: 'API route declaration',
      },
    ],
  };

  it('renders skill name, status badge, and reasoning', () => {
    render(<SkillCard assessment={mockAssessment} />);
    expect(screen.getByText('TypeScript & Express')).toBeInTheDocument();
    expect(screen.getByText('Demonstrated')).toBeInTheDocument();
    expect(screen.getByText(/Repository exhibits strong typed architecture/i)).toBeInTheDocument();
  });

  it('toggles evidence section visibility on button click', () => {
    render(<SkillCard assessment={mockAssessment} />);
    const toggleButton = screen.getByRole('button', { name: /expand evidence for typescript & express/i });
    expect(screen.queryByText('src/routes/api.ts')).not.toBeInTheDocument();

    fireEvent.click(toggleButton);
    expect(screen.getByText('src/routes/api.ts')).toBeInTheDocument();
    expect(screen.getByText('router.post("/items", createItem);')).toBeInTheDocument();
  });
});
