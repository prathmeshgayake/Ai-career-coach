import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '../StatusBadge';

describe('StatusBadge Component', () => {
  it('renders demonstrated status correctly', () => {
    render(<StatusBadge status="demonstrated" />);
    expect(screen.getByText('Demonstrated')).toBeInTheDocument();
  });

  it('renders partially demonstrated status correctly', () => {
    render(<StatusBadge status="partially_demonstrated" />);
    expect(screen.getByText('Partially Demonstrated')).toBeInTheDocument();
  });

  it('renders not demonstrated status correctly', () => {
    render(<StatusBadge status="not_demonstrated_in_scope" />);
    expect(screen.getByText('Not Demonstrated')).toBeInTheDocument();
  });

  it('renders unable to verify status correctly', () => {
    render(<StatusBadge status="unable_to_verify" />);
    expect(screen.getByText('Unable to Verify')).toBeInTheDocument();
  });

  it('renders active status with pulse dot', () => {
    render(<StatusBadge status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
