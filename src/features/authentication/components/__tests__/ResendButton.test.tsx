import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResendButton } from '../ResendButton';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('ResendButton', () => {
  const mockOnResend = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.clearAllMocks();
    mockOnResend.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Initial render ────────────────────────────────────────────────

  describe('Given default state (no cooldown, resends available)', () => {
    beforeEach(() => {
      render(<ResendButton onResend={mockOnResend} />);
    });

    it('Then the "Resend code" button is shown', () => {
      expect(screen.getByRole('button')).toHaveTextContent('verifyEmail.resendCode');
    });

    it('Then the button is enabled', () => {
      expect(screen.getByRole('button')).not.toBeDisabled();
    });
  });

  // ── Click triggers onResend ───────────────────────────────────────

  describe('Given the user clicks resend', () => {
    it('Then onResend is called', async () => {
      vi.useRealTimers();
      const realUser = userEvent.setup();
      render(<ResendButton onResend={mockOnResend} />);
      await realUser.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(mockOnResend).toHaveBeenCalledOnce();
      });
      vi.useFakeTimers();
    });
  });

  // ── Cooldown state ────────────────────────────────────────────────

  describe('Given initialCooldown is 30', () => {
    beforeEach(() => {
      render(<ResendButton onResend={mockOnResend} initialCooldown={30} />);
    });

    it('Then the button shows the countdown text', () => {
      expect(screen.getByRole('button')).toHaveTextContent('verifyEmail.resendIn');
    });

    it('Then the button is disabled', () => {
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('Then after cooldown expires the button becomes enabled', () => {
      act(() => {
        vi.advanceTimersByTime(30_000);
      });
      expect(screen.getByRole('button')).not.toBeDisabled();
      expect(screen.getByRole('button')).toHaveTextContent('verifyEmail.resendCode');
    });
  });

  // ── No resends left ──────────────────────────────────────────────

  describe('Given remaining resends is 0', () => {
    beforeEach(() => {
      render(
        <ResendButton onResend={mockOnResend} initialRemainingResends={0} />,
      );
    });

    it('Then the button shows "no resends" text', () => {
      expect(screen.getByRole('button')).toHaveTextContent('verifyEmail.noResends');
    });

    it('Then the button is disabled', () => {
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  // ── Remaining resends display ─────────────────────────────────────

  describe('Given remaining resends is 3', () => {
    beforeEach(() => {
      render(
        <ResendButton onResend={mockOnResend} initialRemainingResends={3} />,
      );
    });

    it('Then the remaining resends text is shown', () => {
      expect(screen.getByText(/verifyEmail\.remainingResends_other/)).toBeInTheDocument();
    });
  });

  // ── Externally disabled ──────────────────────────────────────────

  describe('Given disabled is true', () => {
    beforeEach(() => {
      render(<ResendButton onResend={mockOnResend} disabled />);
    });

    it('Then the button is disabled', () => {
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  // ── onResend returns cooldown ─────────────────────────────────────

  describe('Given onResend returns a cooldown value', () => {
    it('Then the button enters cooldown state', async () => {
      vi.useRealTimers();
      const realUser = userEvent.setup();
      mockOnResend.mockResolvedValue({ cooldownSeconds: 45, remainingResends: 2 });
      render(<ResendButton onResend={mockOnResend} />);
      await realUser.click(screen.getByRole('button'));
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeDisabled();
        expect(screen.getByRole('button')).toHaveTextContent('verifyEmail.resendIn');
      });
      vi.useFakeTimers();
    });
  });
});
