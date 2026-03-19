import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step1Welcome } from '@/features/onboarding/components/steps/Step1Welcome';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('Step1Welcome', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onSubmit = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Given the user is on the welcome and consent step', () => {
    beforeEach(() => {
      render(
        <Step1Welcome
          onSubmit={onSubmit}
          isLoading={false}
          error={null}
        />,
      );
    });

    it('Then both consent checkboxes are visible', () => {
      expect(screen.getByRole('checkbox', { name: /step1.termsLabel/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /step1.marketingLabel/i })).toBeInTheDocument();
    });

    it('Then the submit button is present', () => {
      expect(screen.getByRole('button', { name: /step1.ctaButton/i })).toBeInTheDocument();
    });

    describe('When the user tries to submit without accepting the terms', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step1.ctaButton/i }));
      });

      it('Then onSubmit is NOT called', () => {
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });

    describe('When the user checks and then unchecks the terms checkbox', () => {
      beforeEach(async () => {
        const termsCheckbox = screen.getByRole('checkbox', { name: /step1.termsLabel/i });
        await user.click(termsCheckbox);
        await user.click(termsCheckbox);
      });

      it('Then the terms checkbox is unchecked', () => {
        expect(screen.getByRole('checkbox', { name: /step1.termsLabel/i })).not.toBeChecked();
      });
    });

    describe('When the user accepts the terms and submits', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('checkbox', { name: /step1.termsLabel/i }));
        await user.click(screen.getByRole('button', { name: /step1.ctaButton/i }));
      });

      it('Then onSubmit is called with terms=true and marketing=false', () => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ terms: true, marketing: false }),
        );
      });
    });

    describe('When the user accepts terms and opts into marketing', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('checkbox', { name: /step1.termsLabel/i }));
        await user.click(screen.getByRole('checkbox', { name: /step1.marketingLabel/i }));
        await user.click(screen.getByRole('button', { name: /step1.ctaButton/i }));
      });

      it('Then onSubmit is called with marketing=true', () => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ terms: true, marketing: true }),
        );
      });
    });
  });

  describe('Given an API error occurred on a previous submission attempt', () => {
    beforeEach(() => {
      render(
        <Step1Welcome
          onSubmit={onSubmit}
          isLoading={false}
          error="errors.onboardingCompleteFailed"
        />,
      );
    });

    it('Then the error message is displayed', () => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Given a submission is in progress', () => {
    beforeEach(() => {
      render(
        <Step1Welcome
          onSubmit={onSubmit}
          isLoading={true}
          error={null}
        />,
      );
    });

    it('Then the submit button is disabled', () => {
      expect(screen.getByRole('button', { name: /step1.ctaButton/i })).toBeDisabled();
    });
  });
});
