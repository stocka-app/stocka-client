import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step2Preferences } from '@/features/onboarding/components/steps/Step2Preferences';

const mockI18n = {
  language: 'es' as string,
  changeLanguage: vi.fn().mockResolvedValue(undefined),
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.defaultValue) return opts.defaultValue as string;
      return key;
    },
    i18n: mockI18n,
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

const mockThemeStore = vi.fn().mockReturnValue({ theme: 'light' as const });
vi.mock('@/store/theme.store', () => ({
  useThemeStore: (...args: unknown[]) => mockThemeStore(...args),
}));

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

    it('Then currency cards are visible as a radiogroup', () => {
      expect(screen.getByRole('radiogroup', { name: /step2.currencyLabel/i })).toBeInTheDocument();
    });

    it('Then all three currency options are visible', () => {
      expect(screen.getByRole('radio', { name: /MXN/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /USD/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /EUR/i })).toBeInTheDocument();
    });

    it('Then MXN is selected by default', () => {
      expect(screen.getByRole('radio', { name: /MXN/i })).toHaveAttribute(
        'aria-checked',
        'true',
      );
      expect(screen.getByRole('radio', { name: /USD/i })).toHaveAttribute(
        'aria-checked',
        'false',
      );
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

    describe('When the user selects USD', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('radio', { name: /USD/i }));
      });

      it('Then USD becomes the selected currency', () => {
        expect(screen.getByRole('radio', { name: /USD/i })).toHaveAttribute(
          'aria-checked',
          'true',
        );
        expect(screen.getByRole('radio', { name: /MXN/i })).toHaveAttribute(
          'aria-checked',
          'false',
        );
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

  describe('Given the user returns to the preferences step with previously saved values', () => {
    beforeEach(() => {
      render(
        <Step2Preferences
          onSubmit={onSubmit}
          onBack={onBack}
          isLoading={false}
          error={null}
          defaultValues={{ language: 'en', currency: 'USD', theme: 'dark' }}
        />,
      );
    });

    it('Then USD is selected based on the defaultValues', () => {
      expect(screen.getByRole('radio', { name: /USD/i })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    it('Then MXN is not selected', () => {
      expect(screen.getByRole('radio', { name: /MXN/i })).toHaveAttribute(
        'aria-checked',
        'false',
      );
    });

    describe('When the user submits without changing anything', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step2.ctaButton/i }));
      });

      it('Then onSubmit is called preserving the defaultValues currency', () => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            currency: 'USD',
          }),
        );
      });
    });
  });

  describe('Given defaultValues with EUR currency', () => {
    beforeEach(() => {
      render(
        <Step2Preferences
          onSubmit={onSubmit}
          onBack={onBack}
          isLoading={false}
          error={null}
          defaultValues={{ language: 'es', currency: 'EUR', theme: 'light' }}
        />,
      );
    });

    it('Then EUR is selected based on the defaultValues', () => {
      expect(screen.getByRole('radio', { name: /EUR/i })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });
  });

  describe('Given i18n language is undefined (edge case fallback)', () => {
    beforeEach(() => {
      mockI18n.language = undefined as unknown as string;
      render(
        <Step2Preferences
          onSubmit={onSubmit}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
    });

    afterEach(() => {
      mockI18n.language = 'es';
    });

    it('Then the form still renders with the fallback language es', () => {
      // The form should render normally, using 'es' as the fallback
      expect(screen.getByRole('radiogroup', { name: /step2.currencyLabel/i })).toBeInTheDocument();
    });
  });

  describe('Given the user language is English', () => {
    beforeEach(() => {
      mockI18n.language = 'en';
      render(
        <Step2Preferences
          onSubmit={onSubmit}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
    });

    afterEach(() => {
      mockI18n.language = 'es';
    });

    describe('When the user submits preferences', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step2.ctaButton/i }));
      });

      it('Then onSubmit is called with language en', () => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            language: 'en',
          }),
        );
      });
    });
  });

  describe('Given no defaultValues and the theme store returns null', () => {
    beforeEach(() => {
      mockThemeStore.mockReturnValue({ theme: null });
      render(
        <Step2Preferences
          onSubmit={onSubmit}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
    });

    afterEach(() => {
      mockThemeStore.mockReturnValue({ theme: 'light' as const });
    });

    it('Then the form renders with fallback defaults', () => {
      // MXN should be selected as default currency fallback
      expect(screen.getByRole('radio', { name: /MXN/i })).toHaveAttribute(
        'aria-checked',
        'true',
      );
    });

    describe('When the user submits with null theme fallback', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step2.ctaButton/i }));
      });

      it('Then onSubmit receives the theme from the global store (null in this case)', () => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            currency: 'MXN',
            theme: null,
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

    it('Then the saving text is shown instead of the CTA label', () => {
      expect(screen.getByText('step2.saving')).toBeInTheDocument();
    });

    it('Then the currency radio buttons are disabled', () => {
      const radios = screen.getAllByRole('radio');
      radios.forEach((radio) => {
        expect(radio).toBeDisabled();
      });
    });
  });
});
