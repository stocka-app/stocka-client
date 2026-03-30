import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VerifyEmailPage from '../VerifyEmailPage';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  Navigate: ({ to }: { to: string }) => {
    mockNavigate(to);
    return null;
  },
}));

const mockClearError = vi.fn();
let mockStoreReturn: Record<string, unknown> = {};

vi.mock('../../store/authentication.store', () => ({
  useAuthenticationStore: () => mockStoreReturn,
}));

vi.mock('../../components/VerifyEmailForm', () => ({
  VerifyEmailForm: ({ email }: { email: string }) => (
    <div data-testid="verify-email-form" data-email={email}>
      VerifyEmailForm
    </div>
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────

function buildStoreReturn(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    emailVerificationRequired: true,
    pendingVerificationEmail: 'test@example.com',
    isAuthenticated: false,
    verificationEmailSent: true,
    clearError: mockClearError,
    ...overrides,
  };
}

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreReturn = buildStoreReturn();
  });

  // ── Happy path ────────────────────────────────────────────────────

  describe('Given a pending verification email exists', () => {
    beforeEach(() => {
      render(<VerifyEmailPage />);
    });

    it('Then the verify email title is shown', () => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('verifyEmail.title');
    });

    it('Then the pending email is displayed', () => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('Then the VerifyEmailForm receives the email prop', () => {
      const form = screen.getByTestId('verify-email-form');
      expect(form).toHaveAttribute('data-email', 'test@example.com');
    });

    it('Then the spam check note is shown', () => {
      expect(screen.getByText('verifyEmail.checkSpam')).toBeInTheDocument();
    });

    it('Then clearError is called on mount', () => {
      expect(mockClearError).toHaveBeenCalledOnce();
    });
  });

  // ── Redirect: already authenticated ──────────────────────────────

  describe('Given the user is authenticated without pending verification', () => {
    beforeEach(() => {
      mockStoreReturn = buildStoreReturn({
        isAuthenticated: true,
        emailVerificationRequired: false,
      });
      render(<VerifyEmailPage />);
    });

    it('Then the user is redirected to dashboard', () => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  // ── Redirect: no pending email ────────────────────────────────────

  describe('Given there is no pending verification email', () => {
    beforeEach(() => {
      mockStoreReturn = buildStoreReturn({
        pendingVerificationEmail: null,
      });
      render(<VerifyEmailPage />);
    });

    it('Then the user is redirected to sign-in', () => {
      expect(mockNavigate).toHaveBeenCalledWith('/authentication/sign-in');
    });
  });

  // ── Email not delivered warning ───────────────────────────────────

  describe('Given the verification email was not delivered', () => {
    beforeEach(() => {
      mockStoreReturn = buildStoreReturn({
        verificationEmailSent: false,
      });
      render(<VerifyEmailPage />);
    });

    it('Then the not-delivered warning is shown', () => {
      expect(screen.getByText('verifyEmail.emailNotDelivered')).toBeInTheDocument();
    });
  });
});
