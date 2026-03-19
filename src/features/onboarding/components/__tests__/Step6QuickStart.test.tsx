import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step6QuickStart } from '@/features/onboarding/components/steps/Step6QuickStart';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('Step6QuickStart', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onComplete = vi.fn().mockResolvedValue(undefined);
  const onSkip = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Given the user is on the quick start checklist step', () => {
    beforeEach(() => {
      render(
        <Step6QuickStart
          onComplete={onComplete}
          onSkip={onSkip}
          isLoading={false}
          error={null}
        />,
      );
    });

    it('Then all 4 checklist items are shown', () => {
      expect(screen.getByText('step6.item1')).toBeInTheDocument();
      expect(screen.getByText('step6.item2')).toBeInTheDocument();
      expect(screen.getByText('step6.item3')).toBeInTheDocument();
      expect(screen.getByText('step6.item4')).toBeInTheDocument();
    });

    it('Then the go to dashboard button is visible', () => {
      expect(screen.getByRole('button', { name: /step6.ctaButton/i })).toBeInTheDocument();
    });

    it('Then the skip link is visible', () => {
      expect(screen.getByRole('button', { name: /step6.skipLink/i })).toBeInTheDocument();
    });

    describe('When the user clicks go to dashboard', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step6.ctaButton/i }));
      });

      it('Then onComplete is called', () => {
        expect(onComplete).toHaveBeenCalledOnce();
      });
    });

    describe('When the user clicks skip', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step6.skipLink/i }));
      });

      it('Then onSkip is called', () => {
        expect(onSkip).toHaveBeenCalledOnce();
      });
    });
  });

  describe('Given an API error occurred', () => {
    beforeEach(() => {
      render(
        <Step6QuickStart
          onComplete={onComplete}
          onSkip={onSkip}
          isLoading={false}
          error="errors.onboardingCompleteFailed"
        />,
      );
    });

    it('Then the error alert is shown', () => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Given completion is in progress', () => {
    beforeEach(() => {
      render(
        <Step6QuickStart
          onComplete={onComplete}
          onSkip={onSkip}
          isLoading={true}
          error={null}
        />,
      );
    });

    it('Then the CTA button is disabled', () => {
      expect(screen.getByRole('button', { name: /step6.ctaButton/i })).toBeDisabled();
    });

    it('Then the skip button is disabled', () => {
      expect(screen.getByRole('button', { name: /step6.skipLink/i })).toBeDisabled();
    });
  });
});
