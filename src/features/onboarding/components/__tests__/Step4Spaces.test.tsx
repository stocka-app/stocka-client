import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step4Spaces } from '@/features/onboarding/components/steps/Step4Spaces';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('Step4Spaces', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onContinue = vi.fn();
  const onSkip = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Given the user is on the FREE tier', () => {
    beforeEach(() => {
      render(
        <Step4Spaces
          tier="FREE"
          onContinue={onContinue}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
        />,
      );
    });

    it('Then the Pro badge is visible', () => {
      expect(screen.getByText('step4.proBadge')).toBeInTheDocument();
    });

    it('Then the locked message is shown', () => {
      expect(screen.getByText('step4.lockedMessage')).toBeInTheDocument();
    });

    it('Then the continue button is enabled (user can still proceed)', () => {
      expect(screen.getByRole('button', { name: /step4.ctaButton/i })).not.toBeDisabled();
    });

    it('Then the skip link is visible', () => {
      expect(screen.getByRole('button', { name: /step4.skipLink/i })).toBeInTheDocument();
    });

    describe('When the user clicks continue', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step4.ctaButton/i }));
      });

      it('Then onContinue is called', () => {
        expect(onContinue).toHaveBeenCalledOnce();
      });
    });

    describe('When the user clicks the skip link', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step4.skipLink/i }));
      });

      it('Then onSkip is called', () => {
        expect(onSkip).toHaveBeenCalledOnce();
      });
    });
  });

  describe('Given the user has no tier set (null)', () => {
    beforeEach(() => {
      render(
        <Step4Spaces
          tier={null}
          onContinue={onContinue}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
        />,
      );
    });

    it('Then the Pro badge is shown (defaults to FREE behavior)', () => {
      expect(screen.getByText('step4.proBadge')).toBeInTheDocument();
    });
  });

  describe('Given the user is on a paid tier (STARTER)', () => {
    beforeEach(() => {
      render(
        <Step4Spaces
          tier="STARTER"
          onContinue={onContinue}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
        />,
      );
    });

    it('Then the Pro badge is NOT shown', () => {
      expect(screen.queryByText('step4.proBadge')).not.toBeInTheDocument();
    });

    it('Then the warehouse card title is shown', () => {
      expect(screen.getByText('step4.warehouseCardTitle')).toBeInTheDocument();
    });
  });

  describe('When the user clicks the back button', () => {
    beforeEach(async () => {
      render(
        <Step4Spaces
          tier="FREE"
          onContinue={onContinue}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
        />,
      );
      await user.click(screen.getByRole('button', { name: /common.back/i }));
    });

    it('Then onBack is called', () => {
      expect(onBack).toHaveBeenCalledOnce();
    });
  });
});
