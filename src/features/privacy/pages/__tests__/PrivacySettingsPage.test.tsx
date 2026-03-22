import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrivacySettingsPage from '../PrivacySettingsPage';
import type { ConsentsState } from '../../types/privacy.types';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mockToggleMarketing = vi.fn();
const mockToggleAnalytics = vi.fn();
const mockRetry = vi.fn();

let mockHookReturn: Record<string, unknown> = {};

vi.mock('../../hooks/usePrivacy', () => ({
  usePrivacy: () => mockHookReturn,
}));

// ── Helpers ───────────────────────────────────────────────────────────

const defaultConsents: ConsentsState = {
  marketing: true,
  analytics: false,
  termsAcceptedAt: '2026-01-15T00:00:00Z',
  privacyAcceptedAt: '2026-02-01T00:00:00Z',
};

function buildHookReturn(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    consents: defaultConsents,
    isLoading: false,
    isSaving: false,
    error: null,
    updateError: null,
    toggleMarketing: mockToggleMarketing,
    toggleAnalytics: mockToggleAnalytics,
    retry: mockRetry,
    ...overrides,
  };
}

describe('PrivacySettingsPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  // ── Loading state ─────────────────────────────────────────────────

  describe('Given the page is loading', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn({ isLoading: true, consents: null });
      render(<PrivacySettingsPage />);
    });

    it('Then the skeleton placeholder is shown', () => {
      // Skeleton renders multiple placeholder elements; check the container exists
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('Then consent toggles are not shown', () => {
      expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    });
  });

  // ── Fetch error state ─────────────────────────────────────────────

  describe('Given the fetch failed', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn({
        isLoading: false,
        consents: null,
        error: 'errors.fetchFailed',
      });
      render(<PrivacySettingsPage />);
    });

    it('Then an error alert is shown', () => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('Then the error message is displayed', () => {
      expect(screen.getByText('errors.fetchFailed')).toBeInTheDocument();
    });

    it('Then the retry button shows "Retry" fallback when error matches fetchFailed key', () => {
      // error='errors.fetchFailed' so t('errors.fetchFailed') === t(error) => 'Retry'
      const retryButton = screen.getByRole('alert').querySelector('button');
      expect(retryButton).toHaveTextContent('Retry');
    });

    describe('When the user clicks retry', () => {
      beforeEach(async () => {
        const retryButton = screen.getByRole('alert').querySelector('button');
        await user.click(retryButton!);
      });

      it('Then retry is called', () => {
        expect(mockRetry).toHaveBeenCalledOnce();
      });
    });
  });

  // ── Non-standard fetch error (covers the other ternary branch) ──

  describe('Given a non-standard fetch error', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn({
        isLoading: false,
        consents: null,
        error: 'errors.someOtherError',
      });
      render(<PrivacySettingsPage />);
    });

    it('Then the retry button shows the fetchFailed label instead of "Retry"', () => {
      // error='errors.someOtherError' so t('errors.fetchFailed') !== t(error) => shows t('errors.fetchFailed')
      const retryButton = screen.getByRole('alert').querySelector('button');
      expect(retryButton).toHaveTextContent('errors.fetchFailed');
    });
  });

  // ── Happy path ────────────────────────────────────────────────────

  describe('Given consents are loaded successfully', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn();
      render(<PrivacySettingsPage />);
    });

    it('Then the page title is shown', () => {
      expect(screen.getByText('pageTitle')).toBeInTheDocument();
    });

    it('Then the page description is shown', () => {
      expect(screen.getByText('pageDescription')).toBeInTheDocument();
    });

    it('Then the consents section header is shown', () => {
      expect(screen.getByText('sections.consents')).toBeInTheDocument();
    });

    it('Then the legal section header is shown', () => {
      expect(screen.getByText('sections.legal')).toBeInTheDocument();
    });

    it('Then the marketing toggle is shown and checked', () => {
      const marketingSwitch = screen.getByRole('switch', { name: /marketing\.label/i });
      expect(marketingSwitch).toBeInTheDocument();
      expect(marketingSwitch).toBeChecked();
    });

    it('Then the analytics toggle is shown and unchecked', () => {
      const analyticsSwitch = screen.getByRole('switch', { name: /analytics\.label/i });
      expect(analyticsSwitch).toBeInTheDocument();
      expect(analyticsSwitch).not.toBeChecked();
    });

    it('Then the terms of service label is shown', () => {
      expect(screen.getByText('terms.label')).toBeInTheDocument();
    });

    it('Then the privacy policy label is shown', () => {
      expect(screen.getByText('privacy.label')).toBeInTheDocument();
    });

    it('Then the terms view document link is shown', () => {
      expect(screen.getByText('terms.viewDocument')).toBeInTheDocument();
    });

    it('Then the privacy view document link is shown', () => {
      expect(screen.getByText('privacy.viewDocument')).toBeInTheDocument();
    });

    it('Then legal document links point to the correct hrefs', () => {
      const termsLink = screen.getByText('terms.viewDocument').closest('a');
      const privacyLink = screen.getByText('privacy.viewDocument').closest('a');

      expect(termsLink).toHaveAttribute('href', '/legal/terms');
      expect(privacyLink).toHaveAttribute('href', '/legal/privacy');
    });

    it('Then legal document links open in a new tab', () => {
      const termsLink = screen.getByText('terms.viewDocument').closest('a');
      expect(termsLink).toHaveAttribute('target', '_blank');
      expect(termsLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('Then the terms accepted date is displayed', () => {
      // The template uses {{date}} replacement; the i18n mock returns the key,
      // and the component replaces {{date}} in the template string
      const dateText = screen.getByText(/terms\.acceptedOn/);
      expect(dateText).toBeInTheDocument();
    });

    describe('When the user toggles marketing', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('switch', { name: /marketing\.label/i }));
      });

      it('Then toggleMarketing is called', () => {
        expect(mockToggleMarketing).toHaveBeenCalledOnce();
      });
    });

    describe('When the user toggles analytics', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('switch', { name: /analytics\.label/i }));
      });

      it('Then toggleAnalytics is called', () => {
        expect(mockToggleAnalytics).toHaveBeenCalledOnce();
      });
    });
  });

  // ── Update error ──────────────────────────────────────────────────

  describe('Given an update error occurred', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn({ updateError: 'errors.updateFailed' });
      render(<PrivacySettingsPage />);
    });

    it('Then the update error alert is shown', () => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    it('Then the update error message is displayed', () => {
      expect(screen.getByText('errors.updateFailed')).toBeInTheDocument();
    });
  });

  // ── Saving indicator ─────────────────────────────────────────────

  describe('Given isSaving is true', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn({ isSaving: true });
      render(<PrivacySettingsPage />);
    });

    it('Then the saving indicator is shown', () => {
      expect(screen.getByText('saving')).toBeInTheDocument();
    });

    it('Then the toggles are disabled', () => {
      const switches = screen.getAllByRole('switch');
      switches.forEach((s) => {
        expect(s).toBeDisabled();
      });
    });
  });

  // ── Legal doc row without accepted date ───────────────────────────

  describe('Given terms have no accepted date', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn({
        consents: { ...defaultConsents, termsAcceptedAt: null },
      });
      render(<PrivacySettingsPage />);
    });

    it('Then the accepted-on text is not shown for terms', () => {
      // The terms.acceptedOn template with {{date}} should NOT appear
      // when termsAcceptedAt is null. The label should still be there.
      expect(screen.getByText('terms.label')).toBeInTheDocument();
      // With no date, the LegalDocRow skips the formattedDate paragraph
      const termsSection = screen.getByText('terms.label').closest('.flex');
      const dateText = termsSection?.querySelector('.text-xs.text-neutral-500');
      expect(dateText).toBeNull();
    });
  });

  describe('Given privacy policy has no accepted date', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn({
        consents: { ...defaultConsents, privacyAcceptedAt: null },
      });
      render(<PrivacySettingsPage />);
    });

    it('Then the accepted-on text is not shown for privacy', () => {
      expect(screen.getByText('privacy.label')).toBeInTheDocument();
      const privacySection = screen.getByText('privacy.label').closest('.flex');
      const dateText = privacySection?.querySelector('.text-xs.text-neutral-500');
      expect(dateText).toBeNull();
    });
  });

  // ── No content when consents is null and not loading ──────────────

  describe('Given consents is null and not loading and no error', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn({ consents: null });
      render(<PrivacySettingsPage />);
    });

    it('Then the consent cards are not rendered', () => {
      expect(screen.queryByText('sections.consents')).not.toBeInTheDocument();
    });
  });
});
