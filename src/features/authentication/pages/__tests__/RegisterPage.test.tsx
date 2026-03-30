import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RegisterPage from '../RegisterPage';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

vi.mock('react-router-dom', () => ({
  Link: ({
    children,
    to,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

const mockClearError = vi.fn();
let mockHookReturn: Record<string, unknown> = {};

vi.mock('../../hooks/useAuthentication', () => ({
  useAuthentication: () => mockHookReturn,
}));

vi.mock('../../components', () => ({
  RegisterForm: () => <div data-testid="register-form">RegisterForm</div>,
}));

// ── Helpers ───────────────────────────────────────────────────────────

function buildHookReturn(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    isLoading: false,
    clearError: mockClearError,
    ...overrides,
  };
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookReturn = buildHookReturn();
  });

  // ── Render ──────────────────────────────────────────────────────────

  describe('Given the page loads', () => {
    beforeEach(() => {
      render(<RegisterPage />);
    });

    it('Then the create account heading is shown', () => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('createYourAccount');
    });

    it('Then the "have account" text is shown', () => {
      expect(screen.getByText(/haveAccount/)).toBeInTheDocument();
    });

    it('Then the sign-in link points to sign-in', () => {
      const link = screen.getByText('signIn').closest('a');
      expect(link).toHaveAttribute('href', '/authentication/sign-in');
    });

    it('Then the RegisterForm is rendered', () => {
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    it('Then clearError is called on mount', () => {
      expect(mockClearError).toHaveBeenCalledOnce();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────

  describe('Given the hook is loading', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn({ isLoading: true });
      render(<RegisterPage />);
    });

    it('Then the sign-in link has disabled styles', () => {
      const link = screen.getByText('signIn').closest('a');
      expect(link?.className).toContain('pointer-events-none');
    });
  });
});
