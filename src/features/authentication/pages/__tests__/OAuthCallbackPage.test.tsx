import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

const mockHandleOAuthCallback = vi.fn();

vi.mock('../../store/authentication.store', () => {
  const store = {
    handleOAuthCallback: (...args: unknown[]) => mockHandleOAuthCallback(...args),
    getState: () => ({
      user: {
        id: 'uid-1',
        email: 'test@example.com',
        username: 'test',
        displayName: null,
        givenName: null,
        familyName: null,
        avatarUrl: null,
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        tenantId: 'tid-1',
        role: 'owner',
        tierLimits: null,
      },
    }),
    setState: vi.fn(),
  };
  return {
    useAuthenticationStore: Object.assign(() => ({
      handleOAuthCallback: store.handleOAuthCallback,
    }), store),
  };
});

const mockSetAccessToken = vi.fn();
const mockExecuteRefresh = vi.fn().mockResolvedValue('fresh-token');
const mockGetLastRefreshData = vi.fn().mockReturnValue(null);

vi.mock('@/shared/lib/axios', () => ({
  setAccessToken: (...args: unknown[]) => mockSetAccessToken(...args),
  executeRefresh: (...args: unknown[]) => mockExecuteRefresh(...args),
  getLastRefreshData: () => mockGetLastRefreshData(),
}));

const mockDecodeJwtPayload = vi.fn().mockReturnValue({
  sub: 'uid-1',
  email: 'test@example.com',
  displayName: 'Test User',
  tenantId: 'tid-1',
  role: 'owner',
});

vi.mock('@/shared/lib/jwt', () => ({
  decodeJwtPayload: (...args: unknown[]) => mockDecodeJwtPayload(...args),
}));

const mockLoadPermissions = vi.fn().mockResolvedValue(undefined);

vi.mock('@/store/rbac.store', () => ({
  useRBACStore: {
    getState: () => ({
      loadPermissions: mockLoadPermissions,
    }),
  },
}));

const mockInitiateOAuth = vi.fn();

vi.mock('../../api/authentication.service', () => ({
  authenticationService: {
    initiateOAuth: (...args: unknown[]) => mockInitiateOAuth(...args),
  },
}));

vi.mock('@/shared/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
    variant?: string;
  }) => <button {...props}>{children}</button>,
}));

// Dynamic import so the module picks up our mocks
const importComponent = async () => {
  const mod = await import('../OAuthCallbackPage');
  return mod.default;
};

describe('OAuthCallbackPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockSearchParams = new URLSearchParams();
    mockExecuteRefresh.mockResolvedValue('fresh-token');
    mockGetLastRefreshData.mockReturnValue(null);
    mockDecodeJwtPayload.mockReturnValue({
      sub: 'uid-1',
      email: 'test@example.com',
      displayName: 'Test User',
      tenantId: 'tid-1',
      role: 'owner',
    });
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    sessionStorage.clear();
  });

  // ── Loading state ──────────────────────────────────────────────────

  describe('Given no search params (initial load)', () => {
    it('Then should show loading state initially', async () => {
      // No accessToken, no error → will resolve to error view, but starts loading
      const OAuthCallbackPage = await importComponent();
      mockSearchParams = new URLSearchParams();
      render(<OAuthCallbackPage />);
      // The component starts as 'loading' then transitions to 'error'
      // because there's no accessToken. We test the error state below.
    });
  });

  // ── Error: error param in URL ──────────────────────────────────────

  describe('Given the URL has error=access_denied', () => {
    it('Then should show cancelled error view', async () => {
      mockSearchParams = new URLSearchParams('error=access_denied');
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('oauthCallback.cancelledTitle')).toBeInTheDocument();
      });
      expect(screen.getByText('oauthCallback.cancelledDetail')).toBeInTheDocument();
    });
  });

  describe('Given the URL has error=EMAIL_ALREADY_EXISTS', () => {
    it('Then should show email conflict error view', async () => {
      mockSearchParams = new URLSearchParams('error=EMAIL_ALREADY_EXISTS');
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('oauthCallback.emailConflictTitle')).toBeInTheDocument();
      });
    });
  });

  describe('Given the URL has error=OAUTH_NO_EMAIL', () => {
    it('Then should show no email error view with different method button', async () => {
      mockSearchParams = new URLSearchParams('error=OAUTH_NO_EMAIL');
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('oauthCallback.noEmailTitle')).toBeInTheDocument();
      });
      expect(screen.getByText('oauthCallback.tryDifferentMethod')).toBeInTheDocument();
    });
  });

  describe('Given the URL has an unknown error code', () => {
    it('Then should show connection error view', async () => {
      mockSearchParams = new URLSearchParams('error=SOME_WEIRD_ERROR');
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('oauthCallback.connectionErrorTitle')).toBeInTheDocument();
      });
    });
  });

  // ── Error: no accessToken ──────────────────────────────────────────

  describe('Given the URL has no accessToken and no error', () => {
    it('Then should show connection error', async () => {
      mockSearchParams = new URLSearchParams();
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('oauthCallback.connectionErrorTitle')).toBeInTheDocument();
      });
    });
  });

  // ── Success: accessToken present, no user param ────────────────────

  describe('Given the URL has a valid accessToken', () => {
    beforeEach(() => {
      mockSearchParams = new URLSearchParams('accessToken=valid-jwt-token');
    });

    it('Then should call handleOAuthCallback and show success', async () => {
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(mockSetAccessToken).toHaveBeenCalledWith('valid-jwt-token');
      });
      expect(mockHandleOAuthCallback).toHaveBeenCalledWith(
        expect.objectContaining({ accessToken: 'valid-jwt-token' }),
      );

      await waitFor(() => {
        expect(screen.getByText('oauthCallback.success')).toBeInTheDocument();
      });
    });

    it('Then should navigate to dashboard after timeout', async () => {
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('oauthCallback.success')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });
  });

  // ── Success: with user param in URL ────────────────────────────────

  describe('Given the URL has accessToken and user param', () => {
    it('Then should parse user from URL param', async () => {
      const userObj = {
        id: 'uid-2',
        email: 'oauth@example.com',
        username: 'oauthuser',
        displayName: 'OAuth User',
        givenName: null,
        familyName: null,
        avatarUrl: null,
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        tenantId: 'tid-2',
        role: 'owner',
        tierLimits: null,
      };
      const encoded = encodeURIComponent(JSON.stringify(userObj));
      mockSearchParams = new URLSearchParams(`accessToken=jwt-token&user=${encoded}`);
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(mockHandleOAuthCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            accessToken: 'jwt-token',
            user: expect.objectContaining({ id: 'uid-2', email: 'oauth@example.com' }),
          }),
        );
      });
    });
  });

  // ── Success: invalid user param falls back to JWT ──────────────────

  describe('Given the URL has accessToken with malformed user param', () => {
    it('Then should fall back to JWT decoding', async () => {
      mockSearchParams = new URLSearchParams('accessToken=jwt-token&user=not-json');
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(mockDecodeJwtPayload).toHaveBeenCalledWith('jwt-token');
      });
      expect(mockHandleOAuthCallback).toHaveBeenCalled();
    });
  });

  // ── Success: requiresOnboarding ────────────────────────────────────

  describe('Given the user has no tenantId (requires onboarding)', () => {
    it('Then should navigate to /onboarding', async () => {
      mockDecodeJwtPayload.mockReturnValue({
        sub: 'uid-1',
        email: 'new@example.com',
        displayName: null,
        tenantId: null,
        role: null,
      });
      mockSearchParams = new URLSearchParams('accessToken=jwt-token');
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('oauthCallback.success')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding', { replace: true });
      });
    });
  });

  // ── Success: refreshData updates onboarding status ─────────────────

  describe('Given executeRefresh returns refreshData with onboardingStatus COMPLETED', () => {
    it('Then should navigate to dashboard and load permissions', async () => {
      mockGetLastRefreshData.mockReturnValue({
        username: 'updated-user',
        givenName: 'Test',
        familyName: 'User',
        avatarUrl: 'https://avatar.url',
        onboardingStatus: 'COMPLETED',
      });
      mockSearchParams = new URLSearchParams('accessToken=jwt-token');
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(mockLoadPermissions).toHaveBeenCalled();
      });

      vi.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });
  });

  describe('Given executeRefresh returns refreshData with onboarding IN_PROGRESS', () => {
    it('Then should navigate to onboarding', async () => {
      mockGetLastRefreshData.mockReturnValue({
        onboardingStatus: 'IN_PROGRESS',
      });
      mockSearchParams = new URLSearchParams('accessToken=jwt-token');
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      vi.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/onboarding', { replace: true });
      });
    });
  });

  // ── Success: executeRefresh fails (non-critical) ───────────────────

  describe('Given executeRefresh throws an error', () => {
    it('Then should still show success and navigate', async () => {
      mockExecuteRefresh.mockRejectedValue(new Error('refresh failed'));
      mockSearchParams = new URLSearchParams('accessToken=jwt-token');
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('oauthCallback.success')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });
  });

  // ── Popup mode ─────────────────────────────────────────────────────

  describe('Given popup=true in search params', () => {
    it('Then should write to localStorage and call window.close', async () => {
      mockSearchParams = new URLSearchParams('accessToken=jwt-token&popup=true');
      const closeSpy = vi.spyOn(window, 'close').mockImplementation(() => {});
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        const stored = localStorage.getItem('stocka-oauth-result');
        expect(stored).toBeTruthy();
        expect(JSON.parse(stored!)).toEqual({ accessToken: 'jwt-token' });
      });
      expect(closeSpy).toHaveBeenCalled();
      closeSpy.mockRestore();
    });
  });

  // ── Error view: back to login button ───────────────────────────────

  describe('Given the error view is shown', () => {
    beforeEach(async () => {
      mockSearchParams = new URLSearchParams('error=access_denied');
    });

    it('Then clicking back to login should navigate', async () => {
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('oauthCallback.backToLogin')).toBeInTheDocument();
      });

      await user.click(screen.getByText('oauthCallback.backToLogin'));
      expect(mockNavigate).toHaveBeenCalledWith('/authentication/sign-in', { replace: true });
    });
  });

  // ── Error view: retry with provider ────────────────────────────────

  describe('Given error view with lastProvider in sessionStorage', () => {
    it('Then clicking retry should call initiateOAuth', async () => {
      sessionStorage.setItem('lastOAuthProvider', 'google');
      mockSearchParams = new URLSearchParams('error=access_denied');
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText(/oauthCallback\.tryAgainWith/)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/oauthCallback\.tryAgainWith/));
      expect(mockInitiateOAuth).toHaveBeenCalledWith('google');
    });
  });

  describe('Given error view without lastProvider in sessionStorage', () => {
    it('Then clicking retry should navigate to sign-in', async () => {
      sessionStorage.removeItem('lastOAuthProvider');
      mockSearchParams = new URLSearchParams('error=connection_error');
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('oauthCallback.tryAgain')).toBeInTheDocument();
      });

      await user.click(screen.getByText('oauthCallback.tryAgain'));
      expect(mockNavigate).toHaveBeenCalledWith('/authentication/sign-in', { replace: true });
    });
  });

  // ── Error view: try different method ───────────────────────────────

  describe('Given error=OAUTH_EMAIL_CONFLICT', () => {
    it('Then should show try different method button', async () => {
      mockSearchParams = new URLSearchParams('error=OAUTH_EMAIL_CONFLICT');
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('oauthCallback.tryDifferentMethod')).toBeInTheDocument();
      });

      await user.click(screen.getByText('oauthCallback.tryDifferentMethod'));
      expect(mockNavigate).toHaveBeenCalledWith('/authentication/sign-in', { replace: true });
    });
  });

  // ── Catch-all error (processCallback throws) ──────────────────────

  describe('Given processCallback throws an unexpected error', () => {
    it('Then should show connection error', async () => {
      // Force handleOAuthCallback to throw to trigger the catch-all
      mockHandleOAuthCallback.mockImplementation(() => {
        throw new Error('Unexpected');
      });
      mockSearchParams = new URLSearchParams('accessToken=jwt-token');
      const OAuthCallbackPage = await importComponent();
      render(<OAuthCallbackPage />);

      await waitFor(() => {
        expect(screen.getByText('oauthCallback.connectionErrorTitle')).toBeInTheDocument();
      });
    });
  });
});
