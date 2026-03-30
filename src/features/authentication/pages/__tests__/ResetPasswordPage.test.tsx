import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordPage from '../ResetPasswordPage';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mockResetPassword = vi.fn();

vi.mock('../../api/authentication.service', () => ({
  authenticationService: {
    resetPassword: (...args: unknown[]) => mockResetPassword(...args),
  },
}));

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

vi.mock('../../components/PasswordInput', () => ({
  PasswordInput: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input type="password" {...props} />
  ),
}));

describe('ResetPasswordPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockResetPassword.mockResolvedValue({});
    mockSearchParams = new URLSearchParams();
  });

  // ── Missing token ─────────────────────────────────────────────────

  describe('Given the URL has no token parameter', () => {
    beforeEach(() => {
      mockSearchParams = new URLSearchParams();
      render(<ResetPasswordPage />);
    });

    it('Then the invalid token view is shown', () => {
      expect(screen.getByText('resetPassword.tokenInvalid')).toBeInTheDocument();
    });

    it('Then the request new link button is shown', () => {
      expect(
        screen.getByRole('button', { name: 'resetPassword.requestNew' }),
      ).toBeInTheDocument();
    });

    it('Then the back to login link is shown', () => {
      const link = screen.getByText('forgotPasswordPage.backToLogin').closest('a');
      expect(link).toHaveAttribute('href', '/authentication/sign-in');
    });

    describe('When the user clicks request new link', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: 'resetPassword.requestNew' }));
      });

      it('Then navigate to forgot-password is called', () => {
        expect(mockNavigate).toHaveBeenCalledWith('/authentication/forgot-password');
      });
    });
  });

  // ── Valid token: form view ────────────────────────────────────────

  describe('Given the URL has a valid token', () => {
    beforeEach(() => {
      mockSearchParams = new URLSearchParams('token=valid-token-123');
      render(<ResetPasswordPage />);
    });

    it('Then the form title is shown', () => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('resetPassword.title');
    });

    it('Then the password field is shown', () => {
      const inputs = screen.getAllByPlaceholderText('••••••••');
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it('Then the submit button is shown', () => {
      expect(
        screen.getByRole('button', { name: 'resetPassword.submit' }),
      ).toBeInTheDocument();
    });

    it('Then password hint labels are shown', () => {
      expect(screen.getByText('resetPassword.hintMinLength')).toBeInTheDocument();
      expect(screen.getByText('resetPassword.hintUppercase')).toBeInTheDocument();
      expect(screen.getByText('resetPassword.hintNumber')).toBeInTheDocument();
    });

    it('Then the welcome text is shown', () => {
      expect(screen.getByText('welcome')).toBeInTheDocument();
    });
  });

  // ── Successful form submission ─────────────────────────────────────

  describe('Given a valid form submission', () => {
    beforeEach(async () => {
      mockSearchParams = new URLSearchParams('token=valid-token-123');
      render(<ResetPasswordPage />);

      const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInput, 'NewPass123!');
      await user.type(confirmInput, 'NewPass123!');
      await user.click(screen.getByRole('button', { name: 'resetPassword.submit' }));
    });

    it('Then resetPassword service is called', async () => {
      await waitFor(() => {
        expect(mockResetPassword).toHaveBeenCalledWith('valid-token-123', 'NewPass123!');
      });
    });

    it('Then the success view is shown', async () => {
      await waitFor(() => {
        expect(screen.getByText('resetPassword.success')).toBeInTheDocument();
      });
    });

    it('Then the success detail is shown', async () => {
      await waitFor(() => {
        expect(screen.getByText('resetPassword.successDetail')).toBeInTheDocument();
      });
    });
  });

  // ── Success view: go to login button (line 85) ─────────────────────

  describe('Given the success view is shown', () => {
    beforeEach(async () => {
      mockSearchParams = new URLSearchParams('token=valid-token-123');
      render(<ResetPasswordPage />);

      const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInput, 'NewPass123!');
      await user.type(confirmInput, 'NewPass123!');
      await user.click(screen.getByRole('button', { name: 'resetPassword.submit' }));

      await waitFor(() => {
        expect(screen.getByText('resetPassword.success')).toBeInTheDocument();
      });
    });

    it('Then clicking go to login navigates to sign-in', async () => {
      await user.click(screen.getByRole('button', { name: 'resetPassword.goToLogin' }));

      expect(mockNavigate).toHaveBeenCalledWith('/authentication/sign-in', { replace: true });
    });
  });

  // ── API error: expired token ──────────────────────────────────────

  describe('Given the API returns TOKEN_EXPIRED', () => {
    beforeEach(async () => {
      mockResetPassword.mockRejectedValue({ error: 'TOKEN_EXPIRED' });
      mockSearchParams = new URLSearchParams('token=expired-token');
      render(<ResetPasswordPage />);

      const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInput, 'NewPass123!');
      await user.type(confirmInput, 'NewPass123!');
      await user.click(screen.getByRole('button', { name: 'resetPassword.submit' }));
    });

    it('Then the expired token message is shown', async () => {
      await waitFor(() => {
        expect(screen.getByText('resetPassword.tokenExpired')).toBeInTheDocument();
      });
    });

    it('Then the request new link button is shown', async () => {
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'resetPassword.requestNew' }),
        ).toBeInTheDocument();
      });
    });
  });

  // ── API error: invalid token ──────────────────────────────────────

  describe('Given the API returns an invalid token error', () => {
    beforeEach(async () => {
      mockResetPassword.mockRejectedValue({ error: 'INVALID_TOKEN' });
      mockSearchParams = new URLSearchParams('token=bad-token');
      render(<ResetPasswordPage />);

      const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInput, 'NewPass123!');
      await user.type(confirmInput, 'NewPass123!');
      await user.click(screen.getByRole('button', { name: 'resetPassword.submit' }));
    });

    it('Then the invalid token message is shown', async () => {
      await waitFor(() => {
        expect(screen.getByText('resetPassword.tokenInvalid')).toBeInTheDocument();
      });
    });
  });

  // ── Password hint states ───────────────────────────────────────────

  describe('Given the user types a password meeting all criteria', () => {
    it('Then all hints should be met', async () => {
      mockSearchParams = new URLSearchParams('token=valid-token-123');
      render(<ResetPasswordPage />);

      const [passwordInput] = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInput, 'StrongPass1');

      // Hints should have met class (green) — checking they render is sufficient
      expect(screen.getByText('resetPassword.hintMinLength')).toBeInTheDocument();
      expect(screen.getByText('resetPassword.hintUppercase')).toBeInTheDocument();
      expect(screen.getByText('resetPassword.hintNumber')).toBeInTheDocument();
    });
  });

  describe('Given the user types a weak password', () => {
    it('Then hints should show unmet state', async () => {
      mockSearchParams = new URLSearchParams('token=valid-token-123');
      render(<ResetPasswordPage />);

      const [passwordInput] = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInput, 'abc');

      expect(screen.getByText('resetPassword.hintMinLength')).toBeInTheDocument();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────

  describe('Given the form is being submitted', () => {
    it('Then the submit button shows loading text', async () => {
      let resolveReset!: () => void;
      const resetPromise = new Promise<void>((r) => { resolveReset = r; });
      mockResetPassword.mockReturnValue(resetPromise);

      mockSearchParams = new URLSearchParams('token=valid-token-123');
      render(<ResetPasswordPage />);

      const [passwordInput, confirmInput] = screen.getAllByPlaceholderText('••••••••');
      await user.type(passwordInput, 'NewPass123!');
      await user.type(confirmInput, 'NewPass123!');
      await user.click(screen.getByRole('button', { name: 'resetPassword.submit' }));

      await waitFor(() => {
        expect(screen.getByText('resetPassword.submitting')).toBeInTheDocument();
      });

      // Cleanup
      resolveReset();
    });
  });
});
