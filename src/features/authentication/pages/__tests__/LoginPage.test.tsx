import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginPage from '../LoginPage';

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
  LoginForm: () => <div data-testid="login-form">LoginForm</div>,
}));

// ── Helpers ───────────────────────────────────────────────────────────

function buildHookReturn(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    isLoading: false,
    clearError: mockClearError,
    ...overrides,
  };
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookReturn = buildHookReturn();
  });

  // ── Render ──────────────────────────────────────────────────────────

  describe('Given the page loads', () => {
    beforeEach(() => {
      render(<LoginPage />);
    });

    it('Then the sign-in heading is shown', () => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('signIn');
    });

    it('Then the "no account" text is shown', () => {
      expect(screen.getByText(/noAccount/)).toBeInTheDocument();
    });

    it('Then the create account link points to sign-up', () => {
      const link = screen.getByText('createAccount').closest('a');
      expect(link).toHaveAttribute('href', '/authentication/sign-up');
    });

    it('Then the LoginForm is rendered', () => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('Then clearError is called on mount', () => {
      expect(mockClearError).toHaveBeenCalledOnce();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────

  describe('Given the hook is loading', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn({ isLoading: true });
      render(<LoginPage />);
    });

    it('Then the create account link has disabled styles', () => {
      const link = screen.getByText('createAccount').closest('a');
      expect(link?.className).toContain('pointer-events-none');
    });
  });
});
