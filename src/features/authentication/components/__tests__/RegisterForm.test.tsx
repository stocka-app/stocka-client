import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RegisterForm } from '../RegisterForm';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
}));

const mockRegister = vi.fn();
const mockClearError = vi.fn();

const mocks = vi.hoisted(() => ({
  isLoading: false,
  error: null as string | null,
  errorCode: null as string | null,
}));

vi.mock('../../hooks/useAuthentication', () => ({
  useAuthentication: () => ({
    register: mockRegister,
    isLoading: mocks.isLoading,
    error: mocks.error,
    errorCode: mocks.errorCode,
    clearError: mockClearError,
  }),
}));

const mockInitiateOAuthPopup = vi.fn();

vi.mock('../../hooks/useOAuthPopup', () => ({
  useOAuthPopup: () => ({
    initiateOAuthPopup: mockInitiateOAuthPopup,
  }),
}));

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

describe('RegisterForm', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mocks.isLoading = false;
    mocks.error = null;
    mocks.errorCode = null;
    mockRegister.mockResolvedValue({});
  });

  // ── Render ────────────────────────────────────────────────────────

  describe('Given the form renders', () => {
    beforeEach(() => {
      render(<RegisterForm />);
    });

    it('Then the full name field is shown', () => {
      expect(screen.getByPlaceholderText('fullNamePlaceholder')).toBeInTheDocument();
    });

    it('Then the username field is shown', () => {
      expect(screen.getByPlaceholderText('usernamePlaceholder')).toBeInTheDocument();
    });

    it('Then the email field is shown', () => {
      expect(screen.getByPlaceholderText('emailPlaceholder')).toBeInTheDocument();
    });

    it('Then the password field is shown', () => {
      expect(screen.getByPlaceholderText('passwordPlaceholder')).toBeInTheDocument();
    });

    it('Then the confirm password field is shown', () => {
      expect(screen.getByPlaceholderText('confirmPasswordPlaceholder')).toBeInTheDocument();
    });

    it('Then the sign-up button is shown', () => {
      expect(screen.getByRole('button', { name: 'signUpButton' })).toBeInTheDocument();
    });

    it('Then OAuth buttons are present', () => {
      expect(screen.getByText('signUpWithGoogle')).toBeInTheDocument();
      expect(screen.getByText('signUpWithMicrosoft')).toBeInTheDocument();
    });
  });

  // ── Successful submit ─────────────────────────────────────────────

  describe('Given the user fills and submits valid data', () => {
    beforeEach(async () => {
      mockRegister.mockResolvedValue({});
      render(<RegisterForm />);

      await user.type(screen.getByPlaceholderText('fullNamePlaceholder'), 'John Doe');
      await user.type(screen.getByPlaceholderText('usernamePlaceholder'), 'johndoe');
      await user.type(screen.getByPlaceholderText('emailPlaceholder'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('passwordPlaceholder'), 'Password123!');
      await user.type(screen.getByPlaceholderText('confirmPasswordPlaceholder'), 'Password123!');
      await user.click(screen.getByRole('button', { name: 'signUpButton' }));
    });

    it('Then register is called with form data', async () => {
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'john@example.com',
            username: 'johndoe',
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

  // ── Requires verification ─────────────────────────────────────────

  describe('Given registration requires email verification', () => {
    beforeEach(async () => {
      mockRegister.mockResolvedValue({ requiresVerification: true });
      render(<RegisterForm />);

      await user.type(screen.getByPlaceholderText('fullNamePlaceholder'), 'John Doe');
      await user.type(screen.getByPlaceholderText('usernamePlaceholder'), 'johndoe');
      await user.type(screen.getByPlaceholderText('emailPlaceholder'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('passwordPlaceholder'), 'Password123!');
      await user.type(screen.getByPlaceholderText('confirmPasswordPlaceholder'), 'Password123!');
      await user.click(screen.getByRole('button', { name: 'signUpButton' }));
    });

    it('Then navigate is called to verify-email', async () => {
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/authentication/verify-email');
      });
    });
  });

  // ── Error display ─────────────────────────────────────────────────

  describe('Given there is an error', () => {
    beforeEach(() => {
      mocks.error = 'Email taken';
      mocks.errorCode = 'EMAIL_ALREADY_EXISTS';
      render(<RegisterForm />);
    });

    it('Then the error message is shown', () => {
      expect(screen.getByText('Email taken')).toBeInTheDocument();
    });

    it('Then the sign-in link is shown for email conflict', () => {
      const signInLink = screen.getByText('signIn').closest('a');
      expect(signInLink).toHaveAttribute('href', '/authentication/sign-in');
    });
  });

  // ── Non-EMAIL_ALREADY_EXISTS error (no sign-in link) ───────────────

  describe('Given there is an error that is not EMAIL_ALREADY_EXISTS', () => {
    it('Then the sign-in link should not be shown', () => {
      mocks.error = 'Username taken';
      mocks.errorCode = 'USERNAME_ALREADY_EXISTS';
      render(<RegisterForm />);

      expect(screen.getByText('Username taken')).toBeInTheDocument();
      expect(screen.queryByText('signIn')).not.toBeInTheDocument();
    });
  });

  // ── OAuth button clicks (lines 65-66) ──────────────────────────────

  describe('Given the user clicks Google OAuth button', () => {
    it('Then initiateOAuthPopup should be called with google', async () => {
      render(<RegisterForm />);
      await user.click(screen.getByText('signUpWithGoogle'));
      expect(mockInitiateOAuthPopup).toHaveBeenCalledWith('google');
    });
  });

  describe('Given the user clicks Microsoft OAuth button', () => {
    it('Then initiateOAuthPopup should be called with microsoft', async () => {
      render(<RegisterForm />);
      await user.click(screen.getByText('signUpWithMicrosoft'));
      expect(mockInitiateOAuthPopup).toHaveBeenCalledWith('microsoft');
    });
  });

  // ── Register throws an error ───────────────────────────────────────

  describe('Given register throws an error', () => {
    it('Then should not crash (error displayed from store)', async () => {
      mockRegister.mockRejectedValue(new Error('Server error'));
      render(<RegisterForm />);

      await user.type(screen.getByPlaceholderText('fullNamePlaceholder'), 'John Doe');
      await user.type(screen.getByPlaceholderText('usernamePlaceholder'), 'johndoe');
      await user.type(screen.getByPlaceholderText('emailPlaceholder'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('passwordPlaceholder'), 'Password123!');
      await user.type(screen.getByPlaceholderText('confirmPasswordPlaceholder'), 'Password123!');
      await user.click(screen.getByRole('button', { name: 'signUpButton' }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
      // Component should still be rendered
      expect(screen.getByPlaceholderText('emailPlaceholder')).toBeInTheDocument();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────

  describe('Given isLoading is true', () => {
    it('Then the submit button shows loading text', () => {
      mocks.isLoading = true;
      render(<RegisterForm />);
      expect(screen.getByText('creatingAccount')).toBeInTheDocument();
    });

    it('Then the form fields are disabled', () => {
      mocks.isLoading = true;
      render(<RegisterForm />);
      expect(screen.getByPlaceholderText('fullNamePlaceholder')).toBeDisabled();
      expect(screen.getByPlaceholderText('usernamePlaceholder')).toBeDisabled();
      expect(screen.getByPlaceholderText('emailPlaceholder')).toBeDisabled();
    });
  });

  // ── Sign-in link onClick clears error ──────────────────────────────

  describe('Given error is EMAIL_ALREADY_EXISTS and user clicks sign-in link', () => {
    it('Then clearError should be called', async () => {
      mocks.error = 'Email taken';
      mocks.errorCode = 'EMAIL_ALREADY_EXISTS';
      render(<RegisterForm />);

      await user.click(screen.getByText('signIn'));
      expect(mockClearError).toHaveBeenCalled();
    });
  });
});
