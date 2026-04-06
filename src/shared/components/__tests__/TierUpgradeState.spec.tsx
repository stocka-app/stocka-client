import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TierUpgradeState } from '../TierUpgradeState';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.feature !== undefined) return `${key} ${opts.feature}`;
      return key;
    },
  }),
}));

vi.mock('@/shared/components/StateComposition', () => ({
  StateComposition: ({
    title,
    description,
    actions,
  }: {
    title: string;
    description: string;
    actions?: React.ReactNode;
  }) => (
    <div data-testid="state-composition">
      <span data-testid="title">{title}</span>
      <span data-testid="description">{description}</span>
      <div data-testid="actions">{actions}</div>
    </div>
  ),
}));

vi.mock('@/shared/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

// ─────────────────────────────────────────────────────────────────────────────
// TierUpgradeState
// ─────────────────────────────────────────────────────────────────────────────

describe('Given a feature completely locked on the current tier', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnUpgrade = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('When TierUpgradeState renders without an onBack handler', () => {
    beforeEach(() => {
      render(<TierUpgradeState feature="Bodegas" onUpgrade={mockOnUpgrade} />);
    });

    it('Then renders the StateComposition with the feature name in the title', () => {
      expect(screen.getByTestId('title').textContent).toContain('Bodegas');
    });

    it('Then renders the upgrade CTA button', () => {
      expect(screen.getByRole('button', { name: /tierUpgrade\.cta/i })).toBeInTheDocument();
    });

    it('Then does not render the back button', () => {
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(1);
    });
  });

  describe('When TierUpgradeState renders with an onBack handler', () => {
    beforeEach(() => {
      render(
        <TierUpgradeState feature="Bodegas" onUpgrade={mockOnUpgrade} onBack={mockOnBack} />,
      );
    });

    it('Then renders both the upgrade CTA and the back button', () => {
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });
  });

  describe('When the user clicks the upgrade CTA', () => {
    beforeEach(async () => {
      render(<TierUpgradeState feature="Bodegas" onUpgrade={mockOnUpgrade} />);
      await user.click(screen.getByRole('button'));
    });

    it('Then calls onUpgrade', () => {
      expect(mockOnUpgrade).toHaveBeenCalledOnce();
    });
  });

  describe('When the user clicks the back button', () => {
    beforeEach(async () => {
      render(
        <TierUpgradeState feature="Bodegas" onUpgrade={mockOnUpgrade} onBack={mockOnBack} />,
      );
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[1]);
    });

    it('Then calls onBack', () => {
      expect(mockOnBack).toHaveBeenCalledOnce();
    });
  });
});
