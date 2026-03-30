import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step1Welcome } from '@/features/onboarding/components/steps/Step1Welcome';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return {
    ...i18nMock,
    // Override Trans to render its components prop so link onClick handlers are exercised
    Trans: ({ i18nKey, components }: { i18nKey: string; components?: Record<string, React.ReactElement<Record<string, unknown>>> }) => {
      if (!components) return i18nKey;
      return React.createElement(
        'span',
        { 'data-testid': `trans-${i18nKey}` },
        i18nKey,
        ...Object.entries(components).map(([key, element]) =>
          React.cloneElement(element, { key, children: key }),
        ),
      );
    },
  };
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

    it('Then all three consent checkboxes are visible', () => {
      expect(screen.getByRole('checkbox', { name: /step1.termsLabel/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /step1.marketingLabel/i })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /step1.analyticsLabel/i })).toBeInTheDocument();
    });

    it('Then marketing and analytics are checked by default', () => {
      expect(screen.getByRole('checkbox', { name: /step1.marketingLabel/i })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: /step1.analyticsLabel/i })).toBeChecked();
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

      it('Then onSubmit is called with terms=true and optional consents at defaults', () => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ terms: true, marketing: true, analytics: true }),
        );
      });
    });

    describe('When the user accepts terms but unchecks marketing and analytics', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('checkbox', { name: /step1.termsLabel/i }));
        await user.click(screen.getByRole('checkbox', { name: /step1.marketingLabel/i }));
        await user.click(screen.getByRole('checkbox', { name: /step1.analyticsLabel/i }));
        await user.click(screen.getByRole('button', { name: /step1.ctaButton/i }));
      });

      it('Then onSubmit is called with marketing=false and analytics=false', () => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ terms: true, marketing: false, analytics: false }),
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

  describe('Given the terms label renders legal links via Trans component', () => {
    beforeEach(() => {
      render(
        <Step1Welcome
          onSubmit={onSubmit}
          isLoading={false}
          error={null}
        />,
      );
    });

    it('Then the terms link and privacy link are rendered inside the label', () => {
      const transContainer = screen.getByTestId('trans-step1.termsLabel');
      const links = within(transContainer).getAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute('href', '/legal/terms');
      expect(links[1]).toHaveAttribute('href', '/legal/privacy');
    });

    it('Then clicking the terms link calls stopPropagation to prevent checkbox toggle', async () => {
      const transContainer = screen.getByTestId('trans-step1.termsLabel');
      const links = within(transContainer).getAllByRole('link');
      const termsLink = links[0];

      const stopPropagationSpy = vi.fn();
      termsLink.addEventListener('click', (e) => {
        stopPropagationSpy();
        e.preventDefault(); // prevent jsdom navigation
      });

      await user.click(termsLink);
      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('Then clicking the privacy link calls stopPropagation to prevent checkbox toggle', async () => {
      const transContainer = screen.getByTestId('trans-step1.termsLabel');
      const links = within(transContainer).getAllByRole('link');
      const privacyLink = links[1];

      const stopPropagationSpy = vi.fn();
      privacyLink.addEventListener('click', (e) => {
        stopPropagationSpy();
        e.preventDefault();
      });

      await user.click(privacyLink);
      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });
});
