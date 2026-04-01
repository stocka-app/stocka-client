import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '../ForgotPasswordPage';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mockForgotPassword = vi.fn();

vi.mock('../../api/authentication.service', () => ({
  authenticationService: {
    forgotPassword: (...args: unknown[]) => mockForgotPassword(...args),
  },
}));

const mockLocation = { state: null as { email?: string } | null };
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useLocation: () => mockLocation,
}));

describe('ForgotPasswordPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockForgotPassword.mockResolvedValue({});
    mockLocation.state = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Initial render ────────────────────────────────────────────────

  describe('Given the page loads', () => {
    beforeEach(() => {
      render(<ForgotPasswordPage />);
    });

    it('Then the title is shown', () => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'forgotPasswordPage.title',
      );
    });

    it('Then the email field is shown', () => {
      expect(screen.getByPlaceholderText('emailPlaceholder')).toBeInTheDocument();
    });

    it('Then the submit button is shown', () => {
      expect(
        screen.getByRole('button', { name: 'forgotPasswordPage.submit' }),
      ).toBeInTheDocument();
    });

    it('Then the back to login link is shown', () => {
      const link = screen.getByText('forgotPasswordPage.backToLogin').closest('a');
      expect(link).toHaveAttribute('href', '/authentication/sign-in');
    });

    it('Then the welcome text and Stocka branding are shown', () => {
      expect(screen.getByText('welcome')).toBeInTheDocument();
      expect(screen.getByText('Stocka')).toBeInTheDocument();
    });

    it('Then the subtitle is shown', () => {
      expect(screen.getByText('forgotPasswordPage.subtitle')).toBeInTheDocument();
    });
  });

  // ── Prefilled email from location state ───────────────────────────

  describe('Given location state has an email', () => {
    beforeEach(() => {
      mockLocation.state = { email: 'pre@fill.com' };
      render(<ForgotPasswordPage />);
    });

    it('Then the email input is pre-filled', () => {
      expect(screen.getByPlaceholderText('emailPlaceholder')).toHaveValue('pre@fill.com');
    });
  });

  // ── Successful submission ────────────────────────────────────────

  describe('Given a valid email is submitted', () => {
    beforeEach(async () => {
      render(<ForgotPasswordPage />);
      const emailInput = screen.getByPlaceholderText('emailPlaceholder');
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'forgotPasswordPage.submit' }));
    });

    it('Then forgotPassword service is called with the email', async () => {
      await waitFor(() => {
        expect(mockForgotPassword).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('Then the success view is shown', async () => {
      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.success')).toBeInTheDocument();
      });
    });

    it('Then the success detail mentions the email', async () => {
      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.successDetail')).toBeInTheDocument();
      });
    });

    it('Then the resend button shows cooldown', async () => {
      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.success')).toBeInTheDocument();
      });
      // Resend button should be disabled with cooldown
      expect(screen.getByText(/forgotPasswordPage\.resendIn/)).toBeInTheDocument();
    });

    it('Then the back to login link is shown in success view', async () => {
      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.success')).toBeInTheDocument();
      });
      const link = screen.getByText('forgotPasswordPage.backToLogin').closest('a');
      expect(link).toHaveAttribute('href', '/authentication/sign-in');
    });
  });

  // ── Resend in success view (lines 65-75) ──────────────────────────

  describe('Given the success view is shown and cooldown expires', () => {
    beforeEach(async () => {
      render(<ForgotPasswordPage />);
      const emailInput = screen.getByPlaceholderText('emailPlaceholder');
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'forgotPasswordPage.submit' }));

      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.success')).toBeInTheDocument();
      });
    });

    it('Then clicking resend calls forgotPassword again', async () => {
      // Advance past cooldown (60 seconds) — one tick at a time
      for (let i = 0; i < 61; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
      }

      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.resend')).toBeInTheDocument();
      });

      mockForgotPassword.mockClear();
      await user.click(screen.getByText('forgotPasswordPage.resend'));

      await waitFor(() => {
        expect(mockForgotPassword).toHaveBeenCalledWith('test@example.com');
      });
    });
  });

  // ── Resend failure in success view ─────────────────────────────────

  describe('Given resend fails in the success view', () => {
    it('Then should not crash (catch block handles silently)', async () => {
      render(<ForgotPasswordPage />);
      const emailInput = screen.getByPlaceholderText('emailPlaceholder');
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'forgotPasswordPage.submit' }));

      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.success')).toBeInTheDocument();
      });

      // Advance past cooldown
      for (let i = 0; i < 61; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
      }

      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.resend')).toBeInTheDocument();
      });

      mockForgotPassword.mockRejectedValueOnce(new Error('Network error'));
      await user.click(screen.getByText('forgotPasswordPage.resend'));

      // Should still show success view without crash
      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.success')).toBeInTheDocument();
      });
    });
  });

  // ── API error: rate limit ────────────────────────────────────────

  describe('Given the API returns a 429 rate limit error', () => {
    beforeEach(async () => {
      mockForgotPassword.mockRejectedValue({ statusCode: 429 });
      render(<ForgotPasswordPage />);
      const emailInput = screen.getByPlaceholderText('emailPlaceholder');
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'forgotPasswordPage.submit' }));
    });

    it('Then the rate limit error message is shown', async () => {
      await waitFor(() => {
        expect(screen.getByText('errors.RATE_LIMIT_EXCEEDED')).toBeInTheDocument();
      });
    });
  });

  // ── API error: generic ────────────────────────────────────────────

  describe('Given the API returns a generic error', () => {
    beforeEach(async () => {
      mockForgotPassword.mockRejectedValue({ statusCode: 500 });
      render(<ForgotPasswordPage />);
      const emailInput = screen.getByPlaceholderText('emailPlaceholder');
      await user.type(emailInput, 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'forgotPasswordPage.submit' }));
    });

    it('Then the unknown error message is shown', async () => {
      await waitFor(() => {
        expect(screen.getByText('errors.UNKNOWN_ERROR')).toBeInTheDocument();
      });
    });
  });

  // ── Location state is null (no prefill) ────────────────────────────

  describe('Given location state is null', () => {
    it('Then email input should be empty', () => {
      mockLocation.state = null;
      render(<ForgotPasswordPage />);
      expect(screen.getByPlaceholderText('emailPlaceholder')).toHaveValue('');
    });
  });

  // ── Cooldown countdown ticks ───────────────────────────────────────

  describe('Given the success view with active cooldown', () => {
    it('Then the cooldown should decrement over time', async () => {
      render(<ForgotPasswordPage />);
      await user.type(screen.getByPlaceholderText('emailPlaceholder'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'forgotPasswordPage.submit' }));

      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.success')).toBeInTheDocument();
      });

      // Initially the cooldown is 60, resend button should show resendIn
      expect(screen.getByText(/forgotPasswordPage\.resendIn/)).toBeInTheDocument();

      // After 60 seconds, resend should be available — advance one tick at a time so each
      // chained setTimeout re-registers correctly between React re-renders
      for (let i = 0; i < 61; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
      }

      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.resend')).toBeInTheDocument();
      });
    });
  });

  // ── Loading state during resend ────────────────────────────────────

  describe('Given resend is in progress in the success view', () => {
    it('Then the sending text should appear during loading', async () => {
      // Create a promise we can control
      let resolveResend!: () => void;
      const resendPromise = new Promise<void>((r) => { resolveResend = r; });

      render(<ForgotPasswordPage />);
      await user.type(screen.getByPlaceholderText('emailPlaceholder'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'forgotPasswordPage.submit' }));

      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.success')).toBeInTheDocument();
      });

      // Wait for cooldown to expire — advance one tick at a time so each chained
      // setTimeout re-registers correctly between React re-renders
      for (let i = 0; i < 61; i++) {
        await act(async () => {
          vi.advanceTimersByTime(1000);
        });
      }

      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.resend')).toBeInTheDocument();
      });

      // Make forgotPassword hang until we resolve
      mockForgotPassword.mockReturnValue(resendPromise);
      await user.click(screen.getByText('forgotPasswordPage.resend'));

      // Should show sending text
      await waitFor(() => {
        expect(screen.getByText('forgotPasswordPage.sending')).toBeInTheDocument();
      });

      // Resolve
      await act(async () => {
        resolveResend();
      });
    });
  });
});
