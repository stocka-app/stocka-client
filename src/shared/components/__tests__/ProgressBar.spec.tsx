import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';

describe('Given ProgressBar renders a loading indicator', () => {
  it('Then it renders a progressbar role element', () => {
    render(<ProgressBar />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('Then it has aria-busy set to true', () => {
    render(<ProgressBar />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-busy', 'true');
  });

  it('Then it has an accessible label of Loading', () => {
    render(<ProgressBar />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Loading');
  });

  it('Then it applies the provided className', () => {
    render(<ProgressBar className="mt-4" />);
    expect(screen.getByRole('progressbar')).toHaveClass('mt-4');
  });
});
