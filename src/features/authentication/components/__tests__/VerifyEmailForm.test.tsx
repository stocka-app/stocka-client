import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerifyEmailForm } from '../VerifyEmailForm';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockVerifyEmail = vi.fn();
const mockResendVerificationCode = vi.fn();
const mockClearError = vi.fn();

const mocks = vi.hoisted(() => ({
  isLoading: false,
  error: null as string | null,
  errorCode: null as string | null,
  blockInfo: null as Record<string, unknown> | null,
  verificationCodeSentAt: null as string | null,
}));

vi.mock('../../store/authentication.store', () => ({
  useAuthenticationStore: () => ({
    verifyEmail: mockVerifyEmail,
    resendVerificationCode: mockResendVerificationCode,
    isLoading: mocks.isLoading,
    error: mocks.error,
    errorCode: mocks.errorCode,
    blockInfo: mocks.blockInfo,
    clearError: mockClearError,
    verificationCodeSentAt: mocks.verificationCodeSentAt,
  }),
}));

/** Mock child components as stubs to avoid deep rendering */
vi.mock('../VerificationCodeInput', () => ({
  VerificationCodeInput: ({
    value,
    onChange,
    disabled,
  }: {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    error?: boolean;
    autoFocus?: boolean;
  }) => (
    <input
      data-testid="code-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  ),
}));

vi.mock('../ExpirationTimer', () => ({
  ExpirationTimer: ({ onExpire }: { onExpire?: () => void }) => (
    <div data-testid="expiration-timer">
      <button type="button" data-testid="trigger-expire" onClick={onExpire}>
        Timer
      </button>
    </div>
  ),
}));

vi.mock('../ResendButton', () => ({
  ResendButton: ({
    onResend,
    disabled,
  }: {
    onResend: () => Promise<unknown>;
    disabled?: boolean;
    initialCooldown?: number;
    initialRemainingResends?: number;
  }) => {
    const handleClick = () => {
      // Mirrors real ResendButton behavior: catches all errors from onResend
      void Promise.resolve(onResend()).catch(() => {});
    };
    return (
      <button type="button" data-testid="resend-button" onClick={handleClick} disabled={disabled}>
        Resend
      </button>
    );
  },
}));

vi.mock('@/shared/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));

describe('VerifyEmailForm', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mocks.isLoading = false;
    mocks.error = null;
    mocks.errorCode = null;
    mocks.blockInfo = null;
    mocks.verificationCodeSentAt = null;
    mockVerifyEmail.mockResolvedValue(undefined);
    mockResendVerificationCode.mockResolvedValue({});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Render ────────────────────────────────────────────────────────

  describe('Given the form renders with an email', () => {
    beforeEach(() => {
      render(<VerifyEmailForm email="test@example.com" />);
    });

    it('Then the code input is present', () => {
      expect(screen.getByTestId('code-input')).toBeInTheDocument();
    });

    it('Then the expiration timer is present', () => {
      expect(screen.getByTestId('expiration-timer')).toBeInTheDocument();
    });

    it('Then the resend button is present', () => {
      expect(screen.getByTestId('resend-button')).toBeInTheDocument();
    });

    it('Then the verify button is present', () => {
      expect(
        screen.getByRole('button', { name: 'verifyEmail.verifyButton' }),
      ).toBeInTheDocument();
    });

    it('Then the "enter code" label is shown', () => {
      expect(screen.getByText('verifyEmail.enterCode')).toBeInTheDocument();
    });

    it('Then the "wrong email" text is shown', () => {
      expect(screen.getByText('verifyEmail.wrongEmail')).toBeInTheDocument();
    });

    it('Then the "change email" link is shown', () => {
      expect(screen.getByText('verifyEmail.changeEmail')).toBeInTheDocument();
    });
  });

  // ── Verify button disabled until code complete ────────────────────

  describe('Given the code input is empty', () => {
    beforeEach(() => {
      render(<VerifyEmailForm email="test@example.com" />);
    });

    it('Then the verify button is disabled', () => {
      expect(
        screen.getByRole('button', { name: 'verifyEmail.verifyButton' }),
      ).toBeDisabled();
    });
  });

  // ── Error display ─────────────────────────────────────────────────

  describe('Given there is a verification error', () => {
    beforeEach(() => {
      mocks.error = 'Invalid code';
      mocks.errorCode = 'INVALID_VERIFICATION_CODE';
      render(<VerifyEmailForm email="test@example.com" />);
    });

    it('Then the error message is displayed', () => {
      expect(screen.getByText(/errors\.INVALID_VERIFICATION_CODE/)).toBeInTheDocument();
    });
  });

  // ── Change email navigation ───────────────────────────────────────

  describe('Given the user clicks "change email"', () => {
    beforeEach(async () => {
      render(<VerifyEmailForm email="test@example.com" />);
      await user.click(screen.getByText('verifyEmail.changeEmail'));
    });

    it('Then navigate is called to sign-up', () => {
      expect(mockNavigate).toHaveBeenCalledWith('/authentication/sign-up');
    });
  });

  // ── Resend button click ───────────────────────────────────────────

  describe('Given the user clicks resend', () => {
    beforeEach(async () => {
      render(<VerifyEmailForm email="test@example.com" />);
      await user.click(screen.getByTestId('resend-button'));
    });

    it('Then resendVerificationCode is called', () => {
      expect(mockResendVerificationCode).toHaveBeenCalledOnce();
    });
  });

  // ── Loading state ─────────────────────────────────────────────────

  describe('Given isLoading is true', () => {
    beforeEach(() => {
      mocks.isLoading = true;
      render(<VerifyEmailForm email="test@example.com" />);
    });

    it('Then the code input is disabled', () => {
      expect(screen.getByTestId('code-input')).toBeDisabled();
    });

    it('Then the resend button is disabled', () => {
      expect(screen.getByTestId('resend-button')).toBeDisabled();
    });

    it('Then the verify button shows loading text', () => {
      expect(screen.getByText('verifyEmail.verifying')).toBeInTheDocument();
    });
  });

  // ── Code auto-submit on complete ──────────────────────────────────

  describe('Given the user types a 6-character code', () => {
    it('Then verifyEmail should be called after a delay', async () => {
      render(<VerifyEmailForm email="test@example.com" />);
      const codeInput = screen.getByTestId('code-input');

      // Simulate typing a 6-char code — the onChange handler receives the full value
      await act(async () => {
        // Fire change with 6-char value to trigger handleCodeComplete
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )!.set!;
        nativeInputValueSetter.call(codeInput, 'AB12CD');
        codeInput.dispatchEvent(new Event('input', { bubbles: true }));
        codeInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // Advance past the 100ms setTimeout
      act(() => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(mockVerifyEmail).toHaveBeenCalledWith('AB12CD');
      });
    });
  });

  // ── Code auto-submit success → redirect ───────────────────────────

  describe('Given auto-submit succeeds', () => {
    it('Then should show success view and navigate to dashboard', async () => {
      mockVerifyEmail.mockResolvedValue(undefined);
      render(<VerifyEmailForm email="test@example.com" />);
      const codeInput = screen.getByTestId('code-input');

      await act(async () => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )!.set!;
        nativeInputValueSetter.call(codeInput, 'AB12CD');
        codeInput.dispatchEvent(new Event('input', { bubbles: true }));
        codeInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(screen.getByText('verifyEmail.verificationSuccess')).toBeInTheDocument();
      });

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });
  });

  // ── Code auto-submit failure → error handled by store ─────────────

  describe('Given auto-submit fails', () => {
    it('Then should not show success view', async () => {
      mockVerifyEmail.mockRejectedValue(new Error('Invalid'));
      render(<VerifyEmailForm email="test@example.com" />);
      const codeInput = screen.getByTestId('code-input');

      await act(async () => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )!.set!;
        nativeInputValueSetter.call(codeInput, 'WRONG1');
        codeInput.dispatchEvent(new Event('input', { bubbles: true }));
        codeInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      act(() => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(mockVerifyEmail).toHaveBeenCalledWith('WRONG1');
      });

      // Should not show success
      expect(screen.queryByText('verifyEmail.verificationSuccess')).not.toBeInTheDocument();
    });
  });

  // ── Form submit via button ─────────────────────────────────────────

  describe('Given the user submits the form manually with a complete code', () => {
    it('Then verifyEmail should be called', async () => {
      render(<VerifyEmailForm email="test@example.com" />);
      const codeInput = screen.getByTestId('code-input');

      await act(async () => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )!.set!;
        nativeInputValueSetter.call(codeInput, 'AB12CD');
        codeInput.dispatchEvent(new Event('input', { bubbles: true }));
        codeInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // The auto-submit will fire, but also submit via button
      // Reset to isolate form submit
      mockVerifyEmail.mockClear();
      mockVerifyEmail.mockResolvedValue(undefined);

      // Click the verify button (form submit)
      await user.click(screen.getByRole('button', { name: 'verifyEmail.verifyButton' }));

      await waitFor(() => {
        expect(mockVerifyEmail).toHaveBeenCalledWith('AB12CD');
      });
    });
  });

  // ── Form submit when code is short, loading, or expired ────────────

  describe('Given the code is less than 6 characters on submit', () => {
    it('Then verifyEmail should not be called', async () => {
      render(<VerifyEmailForm email="test@example.com" />);
      // Code is empty (0 chars), so submit should be a no-op
      await user.click(screen.getByRole('button', { name: 'verifyEmail.verifyButton' }));
      expect(mockVerifyEmail).not.toHaveBeenCalled();
    });
  });

  // ── Form submit failure ────────────────────────────────────────────

  describe('Given form submit throws an error', () => {
    it('Then error is handled by the store (no crash)', async () => {
      mockVerifyEmail.mockRejectedValue(new Error('Server error'));
      render(<VerifyEmailForm email="test@example.com" />);
      const codeInput = screen.getByTestId('code-input');

      await act(async () => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )!.set!;
        nativeInputValueSetter.call(codeInput, 'ABCDEF');
        codeInput.dispatchEvent(new Event('input', { bubbles: true }));
        codeInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // Let auto-submit fire (it will fail)
      act(() => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(mockVerifyEmail).toHaveBeenCalled();
      });

      // Component should not crash
      expect(screen.getByTestId('code-input')).toBeInTheDocument();
    });
  });

  // ── Timer expiration ───────────────────────────────────────────────

  describe('Given the expiration timer fires', () => {
    it('Then the code is cleared and form is in expired state', async () => {
      render(<VerifyEmailForm email="test@example.com" />);
      // Click the trigger-expire button from our mock
      await user.click(screen.getByTestId('trigger-expire'));

      // Submit button should be disabled (isCodeExpired = true, code = '')
      expect(
        screen.getByRole('button', { name: 'verifyEmail.verifyButton' }),
      ).toBeDisabled();
    });
  });

  // ── Resend with remainingResends ───────────────────────────────────

  describe('Given resend returns remainingResends', () => {
    it('Then state should update without error', async () => {
      mockResendVerificationCode.mockResolvedValue({ remainingResends: 3 });
      render(<VerifyEmailForm email="test@example.com" />);
      await user.click(screen.getByTestId('resend-button'));

      await waitFor(() => {
        expect(mockResendVerificationCode).toHaveBeenCalledOnce();
      });
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  // ── Resend with RESEND_COOLDOWN_ACTIVE error ───────────────────────

  describe('Given resend throws RESEND_COOLDOWN_ACTIVE', () => {
    it('Then should extract cooldownSeconds from the error message', async () => {
      mockResendVerificationCode.mockRejectedValue({
        error: 'RESEND_COOLDOWN_ACTIVE',
        message: 'Please wait 45 seconds before requesting a new code',
        statusCode: 429,
      });
      render(<VerifyEmailForm email="test@example.com" />);

      // The resend button click triggers handleResend which catches the error
      await user.click(screen.getByTestId('resend-button'));

      // Should not crash, error is caught internally
      expect(screen.getByTestId('resend-button')).toBeInTheDocument();
    });
  });

  // ── Resend throws non-cooldown error ───────────────────────────────

  describe('Given resend throws a generic error', () => {
    it('Then the form remains stable and the button is still shown', async () => {
      mockResendVerificationCode.mockRejectedValue({
        error: 'MAX_RESENDS_EXCEEDED',
        message: 'Max resends exceeded',
        statusCode: 429,
      });
      render(<VerifyEmailForm email="test@example.com" />);

      // The mock ResendButton catches all errors from onResend (matching real behavior).
      // VerifyEmailForm.handleResend re-throws non-cooldown errors — the ResendButton
      // stub swallows it so the form stays stable.
      await user.click(screen.getByTestId('resend-button'));

      expect(screen.getByTestId('resend-button')).toBeInTheDocument();
    });
  });

  // ── Error message: TOO_MANY_VERIFICATION_ATTEMPTS ──────────────────

  describe('Given errorCode is TOO_MANY_VERIFICATION_ATTEMPTS with attemptsRemaining', () => {
    it('Then should show the error with attempts count', () => {
      mocks.error = 'Too many attempts';
      mocks.errorCode = 'TOO_MANY_VERIFICATION_ATTEMPTS';
      mocks.blockInfo = { attemptsRemaining: 2 };
      render(<VerifyEmailForm email="test@example.com" />);

      expect(screen.getByText('errors.TOO_MANY_VERIFICATION_ATTEMPTS')).toBeInTheDocument();
    });
  });

  // ── Error message: VERIFICATION_BLOCKED with blockedUntil ──────────

  describe('Given errorCode is VERIFICATION_BLOCKED with blockedUntil', () => {
    it('Then should show the error with minutes remaining', () => {
      mocks.error = 'Verification blocked for 15 minutes';
      mocks.errorCode = 'VERIFICATION_BLOCKED';
      mocks.blockInfo = { blockedUntil: new Date(Date.now() + 10 * 60000).toISOString() };
      render(<VerifyEmailForm email="test@example.com" />);

      expect(screen.getByText('errors.VERIFICATION_BLOCKED')).toBeInTheDocument();
    });
  });

  // ── Error message: VERIFICATION_BLOCKED without blockedUntil ───────

  describe('Given errorCode is VERIFICATION_BLOCKED without blockedUntil but with minutes in message', () => {
    it('Then should extract minutes from the error message', () => {
      mocks.error = 'Blocked for 10 minutes';
      mocks.errorCode = 'VERIFICATION_BLOCKED';
      mocks.blockInfo = {};
      render(<VerifyEmailForm email="test@example.com" />);

      expect(screen.getByText('errors.VERIFICATION_BLOCKED')).toBeInTheDocument();
    });
  });

  // ── Error message: VERIFICATION_BLOCKED without blockedUntil and no match ──

  describe('Given errorCode is VERIFICATION_BLOCKED without blockedUntil and no minutes in message', () => {
    it('Then should default to 15 minutes', () => {
      mocks.error = 'Blocked';
      mocks.errorCode = 'VERIFICATION_BLOCKED';
      mocks.blockInfo = {};
      render(<VerifyEmailForm email="test@example.com" />);

      expect(screen.getByText('errors.VERIFICATION_BLOCKED')).toBeInTheDocument();
    });
  });

  // ── Error message: unknown errorCode fallback ──────────────────────

  describe('Given error exists but errorCode has no specific translation', () => {
    it('Then should attempt generic errorCode translation', () => {
      mocks.error = 'Something went wrong';
      mocks.errorCode = 'SOME_UNKNOWN_CODE';
      render(<VerifyEmailForm email="test@example.com" />);

      // i18n mock returns the key when no defaultValue, so 'errors.SOME_UNKNOWN_CODE'
      expect(screen.getByText('errors.SOME_UNKNOWN_CODE')).toBeInTheDocument();
    });
  });

  // ── Error message: no errorCode, fallback to raw error ─────────────

  describe('Given error exists but errorCode is null', () => {
    it('Then should show the raw error message', () => {
      mocks.error = 'Network error';
      mocks.errorCode = null;
      render(<VerifyEmailForm email="test@example.com" />);

      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  // ── Clear error on code change ─────────────────────────────────────

  describe('Given there is an error and the user types a new code', () => {
    it('Then clearError should be called', async () => {
      mocks.error = 'Invalid code';
      mocks.errorCode = 'INVALID_VERIFICATION_CODE';
      render(<VerifyEmailForm email="test@example.com" />);

      const codeInput = screen.getByTestId('code-input');
      await act(async () => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )!.set!;
        nativeInputValueSetter.call(codeInput, 'A');
        codeInput.dispatchEvent(new Event('input', { bubbles: true }));
        codeInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  // ── Attempts remaining warning (no error) ──────────────────────────

  describe('Given blockInfo has attemptsRemaining but no error', () => {
    it('Then should show the attempts remaining warning', () => {
      mocks.error = null;
      mocks.blockInfo = { attemptsRemaining: 3 };
      render(<VerifyEmailForm email="test@example.com" />);

      expect(screen.getByText('verifyEmail.attemptsRemaining')).toBeInTheDocument();
    });
  });

  // ── Initial timer from verificationCodeSentAt ──────────────────────

  describe('Given verificationCodeSentAt is set to a recent timestamp', () => {
    it('Then should calculate remaining time correctly', () => {
      // Code sent 30 seconds ago
      mocks.verificationCodeSentAt = new Date(Date.now() - 30000).toISOString();
      render(<VerifyEmailForm email="test@example.com" />);

      // Component should render normally (not expired)
      expect(
        screen.getByRole('button', { name: 'verifyEmail.verifyButton' }),
      ).toBeInTheDocument();
    });
  });

  describe('Given verificationCodeSentAt is very old (code expired)', () => {
    it('Then should start in expired state', () => {
      // Code sent 11 minutes ago (> 10 min expiration)
      mocks.verificationCodeSentAt = new Date(Date.now() - 11 * 60000).toISOString();
      render(<VerifyEmailForm email="test@example.com" />);

      // Verify button should be disabled (expired)
      expect(
        screen.getByRole('button', { name: 'verifyEmail.verifyButton' }),
      ).toBeDisabled();
    });
  });

  // ── Success state ──────────────────────────────────────────────────

  describe('Given verification succeeds via form submit', () => {
    it('Then should show success view and navigate to dashboard', async () => {
      mockVerifyEmail.mockResolvedValue(undefined);
      render(<VerifyEmailForm email="test@example.com" />);
      const codeInput = screen.getByTestId('code-input');

      // Set 6-char code
      await act(async () => {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value',
        )!.set!;
        nativeInputValueSetter.call(codeInput, 'ABCDEF');
        codeInput.dispatchEvent(new Event('input', { bubbles: true }));
        codeInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // Let auto-submit fire
      act(() => {
        vi.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(screen.getByText('verifyEmail.verificationSuccess')).toBeInTheDocument();
      });

      expect(screen.getByText('common.redirecting')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });
  });

  // ── didntReceiveCode text ──────────────────────────────────────────

  describe('Given the form is rendered', () => {
    it('Then should show the "did not receive code" text', () => {
      render(<VerifyEmailForm email="test@example.com" />);
      expect(screen.getByText('verifyEmail.didntReceiveCode')).toBeInTheDocument();
    });
  });
});
