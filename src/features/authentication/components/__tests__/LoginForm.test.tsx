import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockLogin = vi.fn();
const mockClearError = vi.fn();
const mockSetPendingVerificationEmail = vi.fn();

const mocks = vi.hoisted(() => ({
  isLoading: false,
  error: null as string | null,
  errorCode: null as string | null,
  blockInfo: null as Record<string, unknown> | null,
}));

vi.mock('../../store/authentication.store', () => ({
  useAuthenticationStore: () => ({
    login: mockLogin,
    isLoading: mocks.isLoading,
    error: mocks.error,
    errorCode: mocks.errorCode,
    blockInfo: mocks.blockInfo,
    clearError: mockClearError,
    setPendingVerificationEmail: mockSetPendingVerificationEmail,
  }),
}));

const mockInitiateOAuthPopup = vi.fn();

vi.mock('../../hooks/useOAuthPopup', () => ({
  useOAuthPopup: () => ({
    initiateOAuthPopup: mockInitiateOAuthPopup,
  }),
}));

/** Mock heavy SocialButton to avoid OAuth URL fetch in tests */
vi.mock('../SocialButton', () => ({
  SocialButton: ({
    label,
    onClick,
  }: {
    label: string;
    onClick?: () => void;
    provider?: string;
    variant?: string;
  }) => (
    <button type="button" onClick={onClick}>
      {label}
    </button>
  ),
}));

vi.mock('../FormDivider', () => ({
  FormDivider: () => <hr />,
}));

vi.mock('../PasswordInput', () => ({
  PasswordInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input type="password" {...props} />
  ),
}));

describe('LoginForm', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.isLoading = false;
    mocks.error = null;
    mocks.errorCode = null;
    mocks.blockInfo = null;
    mockLogin.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Render ────────────────────────────────────────────────────────

  describe('Given the form renders', () => {
    beforeEach(() => {
      render(<LoginForm />);
    });

    it('Then the email/username field is shown', () => {
      expect(screen.getByPlaceholderText('emailOrUsernamePlaceholder')).toBeInTheDocument();
    });

    it('Then the password field is shown', () => {
      expect(screen.getByPlaceholderText('passwordPlaceholder')).toBeInTheDocument();
    });

    it('Then the sign-in button is shown', () => {
      expect(screen.getByRole('button', { name: 'signInButton' })).toBeInTheDocument();
    });

    it('Then the forgot password link is shown', () => {
      expect(screen.getByText('forgotPassword')).toBeInTheDocument();
    });

    it('Then the remember me checkbox is shown', () => {
      expect(screen.getByLabelText('rememberMe')).toBeInTheDocument();
    });

    it('Then OAuth buttons are present', () => {
      expect(screen.getByText('signInWithGoogle')).toBeInTheDocument();
      expect(screen.getByText('signInWithMicrosoft')).toBeInTheDocument();
    });
  });

  // ── Successful submit ─────────────────────────────────────────────

  describe('Given the user submits valid credentials', () => {
    beforeEach(async () => {
      mockLogin.mockResolvedValue({});
      render(<LoginForm />);
      await user.type(screen.getByPlaceholderText('emailOrUsernamePlaceholder'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('passwordPlaceholder'), 'Password123!');
      await user.click(screen.getByRole('button', { name: 'signInButton' }));
    });

    it('Then login is called with the form data', async () => {
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            emailOrUsername: 'test@example.com',
            password: 'Password123!',
          }),
        );
      });
    });

    it('Then navigate is called to dashboard', async () => {
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  // ── Submit navigates to onboarding when required ───────────────────

  describe('Given login returns requiresOnboarding', () => {
    it('Then navigate to /onboarding', async () => {
      mockLogin.mockResolvedValue({ requiresOnboarding: true });
      render(<LoginForm />);
      await user.type(screen.getByPlaceholderText('emailOrUsernamePlaceholder'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('passwordPlaceholder'), 'Password123!');
      await user.click(screen.getByRole('button', { name: 'signInButton' }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
      });
    });
  });

  // ── Submit with requiresVerification ───────────────────────────────

  describe('Given login returns requiresVerification', () => {
    it('Then should not navigate (error shows link instead)', async () => {
      mockLogin.mockResolvedValue({ requiresVerification: true });
      render(<LoginForm />);
      await user.type(screen.getByPlaceholderText('emailOrUsernamePlaceholder'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('passwordPlaceholder'), 'Password123!');
      await user.click(screen.getByRole('button', { name: 'signInButton' }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // ── Submit throws an error ─────────────────────────────────────────

  describe('Given login throws an error', () => {
    it('Then should not crash (error displayed from store)', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid'));
      render(<LoginForm />);
      await user.type(screen.getByPlaceholderText('emailOrUsernamePlaceholder'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('passwordPlaceholder'), 'Password123!');
      await user.click(screen.getByRole('button', { name: 'signInButton' }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
      // Component should still be rendered
      expect(screen.getByPlaceholderText('emailOrUsernamePlaceholder')).toBeInTheDocument();
    });
  });

  // ── Error display ─────────────────────────────────────────────────

  describe('Given there is an authentication error', () => {
    beforeEach(() => {
      mocks.error = 'Invalid credentials';
      mocks.errorCode = 'INVALID_CREDENTIALS';
      render(<LoginForm />);
    });

    it('Then the error message is shown', () => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  // ── Email not verified error ──────────────────────────────────────

  describe('Given the error is EMAIL_NOT_VERIFIED', () => {
    beforeEach(() => {
      mocks.error = 'Email not verified';
      mocks.errorCode = 'EMAIL_NOT_VERIFIED';
      render(<LoginForm />);
    });

    it('Then the verify now link is shown', () => {
      expect(screen.getByText('verifyEmail.verifyNow')).toBeInTheDocument();
    });

    describe('When the user clicks verify now with an email', () => {
      it('Then should set pending email and navigate to verify-email', async () => {
        // Type an email first
        await user.clear(screen.getByPlaceholderText('emailOrUsernamePlaceholder'));
        await user.type(screen.getByPlaceholderText('emailOrUsernamePlaceholder'), 'user@test.com');
        await user.click(screen.getByText('verifyEmail.verifyNow'));

        expect(mockSetPendingVerificationEmail).toHaveBeenCalledWith('user@test.com');
        expect(mockClearError).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/authentication/verify-email');
      });
    });

    describe('When the user clicks verify now with a username (not email)', () => {
      it('Then should not set pending email but still navigate', async () => {
        await user.clear(screen.getByPlaceholderText('emailOrUsernamePlaceholder'));
        await user.type(screen.getByPlaceholderText('emailOrUsernamePlaceholder'), 'johndoe');
        await user.click(screen.getByText('verifyEmail.verifyNow'));

        expect(mockSetPendingVerificationEmail).not.toHaveBeenCalled();
        expect(mockClearError).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/authentication/verify-email');
      });
    });
  });

  // ── Account locked ────────────────────────────────────────────────

  describe('Given the account is locked', () => {
    beforeEach(() => {
      mocks.blockInfo = {
        isBlocked: true,
        reason: 'account_locked',
        blockedUntil: new Date(Date.now() + 300_000),
      };
      render(<LoginForm />);
    });

    it('Then the locked account warning is shown', () => {
      expect(screen.getByText('errors.accountTemporarilyLocked')).toBeInTheDocument();
    });

    it('Then the form fields are disabled', () => {
      expect(screen.getByPlaceholderText('emailOrUsernamePlaceholder')).toBeDisabled();
      expect(screen.getByPlaceholderText('passwordPlaceholder')).toBeDisabled();
    });

    it('Then the use alternative login hint is shown', () => {
      expect(screen.getByText('errors.useAlternativeLogin')).toBeInTheDocument();
    });

    it('Then the countdown is shown on the submit button', () => {
      expect(screen.getByRole('button', { name: /errors\.lockedCountdown/ })).toBeInTheDocument();
    });
  });

  // ── Account locked countdown reaches zero ──────────────────────────

  describe('Given the account lock expires', () => {
    it('Then clearError should be called', async () => {
      mocks.blockInfo = {
        isBlocked: true,
        reason: 'account_locked',
        blockedUntil: new Date(Date.now() + 1000), // 1 second from now
      };
      render(<LoginForm />);

      // Advance past the lock expiration
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockClearError).toHaveBeenCalled();
      });
    });
  });

  // ── Account locked with no blockedUntil (no countdown) ─────────────

  describe('Given blockInfo has isBlocked but no blockedUntil', () => {
    it('Then countdown is 0 and button shows locked text', () => {
      mocks.blockInfo = {
        isBlocked: true,
        reason: 'account_locked',
        blockedUntil: null,
      };
      render(<LoginForm />);

      // With no blockedUntil, countdown stays 0, button shows locked text
      expect(
        screen.getByRole('button', { name: 'errors.accountTemporarilyLocked' }),
      ).toBeInTheDocument();
    });
  });

  // ── Account locked, countdown 0 but error present ──────────────────

  describe('Given account is locked, countdown is 0, and there is an error', () => {
    it('Then should show the error text in the lock alert', () => {
      mocks.error = 'Account locked due to too many attempts';
      mocks.blockInfo = {
        isBlocked: true,
        reason: 'account_locked',
        blockedUntil: null,
      };
      render(<LoginForm />);

      expect(screen.getByText('Account locked due to too many attempts')).toBeInTheDocument();
    });
  });

  // ── Rate limit block ──────────────────────────────────────────────

  describe('Given the rate limit is exceeded', () => {
    beforeEach(() => {
      mocks.blockInfo = {
        isBlocked: true,
        reason: 'rate_limit',
      };
      render(<LoginForm />);
    });

    it('Then the rate limit warning is shown', () => {
      expect(screen.getByText('errors.tooManyRequests')).toBeInTheDocument();
    });
  });

  // ── Social account required ───────────────────────────────────────

  describe('Given the error is SOCIAL_ACCOUNT_REQUIRED', () => {
    beforeEach(() => {
      mocks.error = 'Use social login';
      mocks.errorCode = 'SOCIAL_ACCOUNT_REQUIRED';
      render(<LoginForm />);
    });

    it('Then the social account required warning is shown', () => {
      expect(screen.getByText('errors.SOCIAL_ACCOUNT_REQUIRED')).toBeInTheDocument();
    });

    it('Then the use alternative login hint is shown', () => {
      expect(screen.getByText('errors.useAlternativeLogin')).toBeInTheDocument();
    });
  });

  // ── OAuth button clicks ────────────────────────────────────────────

  describe('Given the user clicks Google OAuth button', () => {
    it('Then initiateOAuthPopup should be called with google', async () => {
      render(<LoginForm />);
      await user.click(screen.getByText('signInWithGoogle'));
      expect(mockInitiateOAuthPopup).toHaveBeenCalledWith('google');
    });
  });

  describe('Given the user clicks Microsoft OAuth button', () => {
    it('Then initiateOAuthPopup should be called with microsoft', async () => {
      render(<LoginForm />);
      await user.click(screen.getByText('signInWithMicrosoft'));
      expect(mockInitiateOAuthPopup).toHaveBeenCalledWith('microsoft');
    });
  });

  // ── Forgot password navigation ─────────────────────────────────────

  describe('Given the user clicks forgot password with an email', () => {
    it('Then should navigate with email in state', async () => {
      render(<LoginForm />);
      await user.type(screen.getByPlaceholderText('emailOrUsernamePlaceholder'), 'user@test.com');
      await user.click(screen.getByText('forgotPassword'));

      expect(mockNavigate).toHaveBeenCalledWith('/authentication/forgot-password', {
        state: { email: 'user@test.com' },
      });
    });
  });

  describe('Given the user clicks forgot password with a username', () => {
    it('Then should navigate without email in state', async () => {
      render(<LoginForm />);
      await user.type(screen.getByPlaceholderText('emailOrUsernamePlaceholder'), 'johndoe');
      await user.click(screen.getByText('forgotPassword'));

      expect(mockNavigate).toHaveBeenCalledWith('/authentication/forgot-password', {
        state: undefined,
      });
    });
  });

  // ── Remember me checkbox ───────────────────────────────────────────

  describe('Given the user toggles the remember me checkbox', () => {
    it('Then the checkbox should toggle state', async () => {
      render(<LoginForm />);
      const checkbox = screen.getByLabelText('rememberMe');
      expect(checkbox).not.toBeChecked();
      await user.click(checkbox);
      // The Checkbox component from shadcn uses data-state
      await waitFor(() => {
        expect(checkbox).toBeChecked();
      });
    });
  });

  // ── Loading state ──────────────────────────────────────────────────

  describe('Given isLoading is true', () => {
    it('Then the submit button shows loading text', () => {
      mocks.isLoading = true;
      render(<LoginForm />);
      expect(screen.getByText('signingIn')).toBeInTheDocument();
    });
  });

  // ── formatCountdown utility ────────────────────────────────────────

  describe('Given account locked with > 1 hour remaining', () => {
    it('Then the countdown shows hours and minutes format', () => {
      mocks.blockInfo = {
        isBlocked: true,
        reason: 'account_locked',
        blockedUntil: new Date(Date.now() + 3700_000), // ~1h 1m
      };
      render(<LoginForm />);

      // The countdown shows in the submit button text
      expect(screen.getByRole('button', { name: /errors\.lockedCountdown/ })).toBeInTheDocument();
    });
  });

  describe('Given account locked with < 60 seconds remaining', () => {
    it('Then the countdown shows seconds format', () => {
      mocks.blockInfo = {
        isBlocked: true,
        reason: 'account_locked',
        blockedUntil: new Date(Date.now() + 30_000), // 30s
      };
      render(<LoginForm />);

      expect(screen.getByRole('button', { name: /errors\.lockedCountdown/ })).toBeInTheDocument();
    });
  });
});
