import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthenticationStore } from '@/features/authentication/store/authentication.store';
import { ProtectedRoute } from '@/features/authentication/guards/ProtectedRoute';
import { PublicRoute } from '@/features/authentication/guards/PublicRoute';
import { EmailVerifiedGuard } from '@/features/authentication/guards/EmailVerifiedGuard';
import { VerificationRoute } from '@/features/authentication/guards/VerificationRoute';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/features/authentication/store/authentication.store');
vi.mock('@/app/page-loader', () => ({
  PageLoader: () => null,
}));

// ---------------------------------------------------------------------------
// Store state factories
// ---------------------------------------------------------------------------

type StoreState = ReturnType<typeof useAuthenticationStore>;

function buildStoreState(overrides: Partial<StoreState> = {}): StoreState {
  return {
    user: null,
    isAuthenticated: false,
    isInitializing: false,
    isLoading: false,
    error: null,
    errorCode: null,
    blockInfo: null,
    emailVerificationRequired: false,
    pendingVerificationEmail: null,
    verificationCodeSentAt: null,
    verificationEmailSent: null,
    accessToken: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerificationCode: vi.fn(),
    handleOAuthCallback: vi.fn(),
    setUser: vi.fn(),
    clearError: vi.fn(),
    setLoading: vi.fn(),
    setBlockInfo: vi.fn(),
    setPendingVerificationEmail: vi.fn(),
    resetAuthState: vi.fn(),
    ...overrides,
  } as StoreState;
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

function renderWithRouter(ui: React.ReactElement, initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="*" element={ui} />
        <Route path="/authentication/sign-in" element={<div>Login Page</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/authentication/verify-email" element={<div>Verify Email Page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// ProtectedRoute
// ---------------------------------------------------------------------------

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Given the app is still initializing (silent refresh in progress)', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue(
        buildStoreState({ isInitializing: true, isAuthenticated: false }),
      );
    });

    it('Then it renders the page loader', () => {
      const { container } = renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );
      // PageLoader is mocked to return null — children should not appear
      expect(container.textContent).not.toContain('Protected Content');
    });
  });

  describe('Given the user is not authenticated and the app has finished initializing', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue(
        buildStoreState({ isInitializing: false, isAuthenticated: false }),
      );
    });

    it('Then it redirects to the login page', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('Then it does not render the protected children', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Given the user is authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue(
        buildStoreState({ isInitializing: false, isAuthenticated: true }),
      );
    });

    it('Then it renders the protected children', () => {
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
      );
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// PublicRoute
// ---------------------------------------------------------------------------

describe('PublicRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Given the app is still initializing', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue(
        buildStoreState({ isInitializing: true, isAuthenticated: false }),
      );
    });

    it('Then it renders the page loader and not the public children', () => {
      const { container } = renderWithRouter(
        <PublicRoute>
          <div>Public Content</div>
        </PublicRoute>,
      );
      expect(container.textContent).not.toContain('Public Content');
    });
  });

  describe('Given the user is already authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue(
        buildStoreState({ isInitializing: false, isAuthenticated: true }),
      );
    });

    it('Then it redirects to the dashboard', () => {
      renderWithRouter(
        <PublicRoute>
          <div>Public Content</div>
        </PublicRoute>,
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('Then it does not render the public route children', () => {
      renderWithRouter(
        <PublicRoute>
          <div>Public Content</div>
        </PublicRoute>,
      );
      expect(screen.queryByText('Public Content')).not.toBeInTheDocument();
    });
  });

  describe('Given the user is not authenticated and the app has finished initializing', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue(
        buildStoreState({ isInitializing: false, isAuthenticated: false }),
      );
    });

    it('Then it renders the public route children', () => {
      renderWithRouter(
        <PublicRoute>
          <div>Public Content</div>
        </PublicRoute>,
      );
      expect(screen.getByText('Public Content')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// EmailVerifiedGuard
// ---------------------------------------------------------------------------

describe('EmailVerifiedGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Given the user is not authenticated and has no email verification pending', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue(
        buildStoreState({
          isAuthenticated: false,
          emailVerificationRequired: false,
          pendingVerificationEmail: null,
        }),
      );
    });

    it('Then it redirects to the login page', () => {
      renderWithRouter(
        <EmailVerifiedGuard>
          <div>Verified Content</div>
        </EmailVerifiedGuard>,
      );
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('Given email verification is required and a pending email is set', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue(
        buildStoreState({
          isAuthenticated: false,
          emailVerificationRequired: true,
          pendingVerificationEmail: 'user@test.com',
        }),
      );
    });

    it('Then it redirects to the verify-email page', () => {
      renderWithRouter(
        <EmailVerifiedGuard>
          <div>Verified Content</div>
        </EmailVerifiedGuard>,
      );
      expect(screen.getByText('Verify Email Page')).toBeInTheDocument();
    });
  });

  describe('Given the user is fully authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue(
        buildStoreState({
          isAuthenticated: true,
          emailVerificationRequired: false,
          pendingVerificationEmail: null,
        }),
      );
    });

    it('Then it renders the protected children', () => {
      renderWithRouter(
        <EmailVerifiedGuard>
          <div>Verified Content</div>
        </EmailVerifiedGuard>,
      );
      expect(screen.getByText('Verified Content')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// VerificationRoute
// ---------------------------------------------------------------------------

describe('VerificationRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Given email verification is not required', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue(
        buildStoreState({
          emailVerificationRequired: false,
          pendingVerificationEmail: null,
        }),
      );
    });

    it('Then it redirects to the dashboard', () => {
      renderWithRouter(
        <VerificationRoute>
          <div>Verification Content</div>
        </VerificationRoute>,
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Given email verification is required but no pending email is set', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue(
        buildStoreState({
          emailVerificationRequired: true,
          pendingVerificationEmail: null,
        }),
      );
    });

    it('Then it redirects to the dashboard', () => {
      renderWithRouter(
        <VerificationRoute>
          <div>Verification Content</div>
        </VerificationRoute>,
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Given email verification is required and a pending email is set', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue(
        buildStoreState({
          emailVerificationRequired: true,
          pendingVerificationEmail: 'user@test.com',
        }),
      );
    });

    it('Then it renders the verification route children', () => {
      renderWithRouter(
        <VerificationRoute>
          <div>Verification Content</div>
        </VerificationRoute>,
      );
      expect(screen.getByText('Verification Content')).toBeInTheDocument();
    });
  });
});
