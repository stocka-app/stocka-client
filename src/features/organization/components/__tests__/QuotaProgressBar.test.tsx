import { render, screen } from '@testing-library/react';
import { QuotaProgressBar } from '@/features/organization/components/QuotaProgressBar';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('QuotaProgressBar', () => {
  // =========================================================================
  // Unlimited quota (max === -1)
  // =========================================================================

  describe('Given the quota has no maximum limit', () => {
    describe('When the component renders with max of -1', () => {
      it('Then the progress bar track is not rendered', () => {
        render(<QuotaProgressBar label="Bodegas" used={5} max={-1} />);
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      it('Then the unlimited label is shown', () => {
        render(<QuotaProgressBar label="Bodegas" used={5} max={-1} />);
        expect(screen.getByText(/limits\.unlimited/)).toBeInTheDocument();
      });

      it('Then the label is visible', () => {
        render(<QuotaProgressBar label="Bodegas" used={5} max={-1} />);
        expect(screen.getByText('Bodegas')).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Limited quota — color thresholds
  // =========================================================================

  describe('Given a quota that is under 50% used', () => {
    describe('When the component renders with 1 out of 3 used', () => {
      it('Then the progress bar is rendered', () => {
        render(<QuotaProgressBar label="Bodegas" used={1} max={3} />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      it('Then the progress bar shows green color', () => {
        render(<QuotaProgressBar label="Bodegas" used={1} max={3} />);
        const bar = screen.getByRole('progressbar').firstChild as HTMLElement;
        expect(bar.className).toContain('emerald');
      });

      it('Then the used / max text is visible', () => {
        render(<QuotaProgressBar label="Bodegas" used={1} max={3} />);
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
      });
    });
  });

  describe('Given a quota that is between 50% and 75% used', () => {
    describe('When the component renders with 2 out of 3 used (66%)', () => {
      it('Then the progress bar shows amber color', () => {
        render(<QuotaProgressBar label="Miembros" used={2} max={3} />);
        const bar = screen.getByRole('progressbar').firstChild as HTMLElement;
        expect(bar.className).toContain('amber');
      });
    });

    describe('When the component renders at exactly 50% used', () => {
      it('Then the progress bar shows amber color (boundary)', () => {
        render(<QuotaProgressBar label="Miembros" used={1} max={2} />);
        const bar = screen.getByRole('progressbar').firstChild as HTMLElement;
        expect(bar.className).toContain('amber');
      });
    });

    describe('When the component renders at exactly 75% used', () => {
      it('Then the progress bar shows amber color (boundary)', () => {
        render(<QuotaProgressBar label="Miembros" used={3} max={4} />);
        const bar = screen.getByRole('progressbar').firstChild as HTMLElement;
        expect(bar.className).toContain('amber');
      });
    });
  });

  describe('Given a quota that is over 75% used', () => {
    describe('When the component renders with 4 out of 5 used (80%)', () => {
      it('Then the progress bar shows red color', () => {
        render(<QuotaProgressBar label="Productos" used={4} max={5} />);
        const bar = screen.getByRole('progressbar').firstChild as HTMLElement;
        expect(bar.className).toContain('red');
      });
    });

    describe('When the component renders at 100% used', () => {
      it('Then the progress bar shows red color', () => {
        render(<QuotaProgressBar label="Productos" used={100} max={100} />);
        const bar = screen.getByRole('progressbar').firstChild as HTMLElement;
        expect(bar.className).toContain('red');
      });

      it('Then aria-valuenow is capped at 100', () => {
        render(<QuotaProgressBar label="Productos" used={100} max={100} />);
        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toHaveAttribute('aria-valuenow', '100');
      });
    });
  });

  // =========================================================================
  // Accessibility
  // =========================================================================

  describe('Given any quota with a defined maximum', () => {
    describe('When the progress bar renders', () => {
      it('Then it has the correct aria attributes', () => {
        render(<QuotaProgressBar label="Bodegas" used={1} max={3} />);
        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toHaveAttribute('aria-valuemin', '0');
        expect(progressbar).toHaveAttribute('aria-valuemax', '100');
        expect(progressbar).toHaveAttribute('aria-label', 'Bodegas');
      });
    });
  });
});
