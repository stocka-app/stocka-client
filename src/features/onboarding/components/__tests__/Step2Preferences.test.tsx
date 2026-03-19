import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step2Preferences } from '@/features/onboarding/components/steps/Step2Preferences';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('Step2Preferences', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onBack = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Given the user is on the preferences step', () => {
    beforeEach(() => {
      render(
        <Step2Preferences
          onSubmit={onSubmit}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
    });

    it('Then language, currency, and theme controls are visible', () => {
      expect(screen.getByRole('combobox', { name: /step2.languageLabel/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /step2.currencyLabel/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /step2.themeLabel/i })).toBeInTheDocument();
    });

    it('Then the language selector shows the correct label', () => {
      const languageSelect = screen.getByRole('combobox', { name: /step2.languageLabel/i });
      expect(languageSelect).toBeInTheDocument();
    });

    it('Then the back button is visible', () => {
      expect(screen.getByRole('button', { name: /common.back/i })).toBeInTheDocument();
    });

    describe('When the user clicks the back button', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /common.back/i }));
      });

      it('Then onBack is called', () => {
        expect(onBack).toHaveBeenCalledOnce();
      });
    });

    describe('When the user selects the dark theme', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step2.themeDark/i }));
      });

      it('Then the dark theme button is pressed', () => {
        expect(screen.getByRole('button', { name: /step2.themeDark/i })).toHaveAttribute(
          'aria-pressed',
          'true',
        );
      });

      describe('When the user switches back to the light theme', () => {
        beforeEach(async () => {
          await user.click(screen.getByRole('button', { name: /step2.themeLight/i }));
        });

        it('Then the light theme button becomes pressed again', () => {
          expect(screen.getByRole('button', { name: /step2.themeLight/i })).toHaveAttribute(
            'aria-pressed',
            'true',
          );
        });
      });
    });

    describe('When the user submits the default preferences', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step2.ctaButton/i }));
      });

      it('Then onSubmit is called with the form values', () => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            language: 'es',
            currency: 'MXN',
            theme: 'light',
          }),
        );
      });
    });
  });

  describe('Given an API error occurred', () => {
    beforeEach(() => {
      render(
        <Step2Preferences
          onSubmit={onSubmit}
          onBack={onBack}
          isLoading={false}
          error="errors.preferencesUpdateFailed"
        />,
      );
    });

    it('Then the error alert is shown', () => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Given a submission is in progress', () => {
    beforeEach(() => {
      render(
        <Step2Preferences
          onSubmit={onSubmit}
          onBack={onBack}
          isLoading={true}
          error={null}
        />,
      );
    });

    it('Then the submit button is disabled', () => {
      expect(screen.getByRole('button', { name: /step2.ctaButton/i })).toBeDisabled();
    });

    it('Then the back button is also disabled', () => {
      expect(screen.getByRole('button', { name: /common.back/i })).toBeDisabled();
    });
  });
});
