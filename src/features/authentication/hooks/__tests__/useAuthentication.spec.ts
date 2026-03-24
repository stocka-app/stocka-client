import { renderHook } from '@testing-library/react';
import { useAuthentication } from '@/features/authentication/hooks/useAuthentication';
import { useAuthenticationStore } from '@/features/authentication/store/authentication.store';

vi.mock('@/features/authentication/store/authentication.store');

const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
const mockClearError = vi.fn();
const mockSetPendingVerificationEmail = vi.fn();

const mockStoreState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  errorCode: null,
  login: mockLogin,
  register: mockRegister,
  logout: mockLogout,
  clearError: mockClearError,
  setPendingVerificationEmail: mockSetPendingVerificationEmail,
};

describe('useAuthentication hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthenticationStore).mockReturnValue(mockStoreState as ReturnType<typeof useAuthenticationStore>);
  });

  describe('Given the authentication store returns its state and actions', () => {
    describe('When the hook is called', () => {
      it('Then it exposes the user from the store', () => {
        const { result } = renderHook(() => useAuthentication());
        expect(result.current.user).toBe(mockStoreState.user);
      });

      it('Then it exposes isAuthenticated from the store', () => {
        const { result } = renderHook(() => useAuthentication());
        expect(result.current.isAuthenticated).toBe(mockStoreState.isAuthenticated);
      });

      it('Then it exposes isLoading from the store', () => {
        const { result } = renderHook(() => useAuthentication());
        expect(result.current.isLoading).toBe(mockStoreState.isLoading);
      });

      it('Then it exposes error from the store', () => {
        const { result } = renderHook(() => useAuthentication());
        expect(result.current.error).toBe(mockStoreState.error);
      });

      it('Then it exposes errorCode from the store', () => {
        const { result } = renderHook(() => useAuthentication());
        expect(result.current.errorCode).toBe(mockStoreState.errorCode);
      });

      it('Then it exposes the login action from the store', () => {
        const { result } = renderHook(() => useAuthentication());
        expect(result.current.login).toBe(mockLogin);
      });

      it('Then it exposes the register action from the store', () => {
        const { result } = renderHook(() => useAuthentication());
        expect(result.current.register).toBe(mockRegister);
      });

      it('Then it exposes the logout action from the store', () => {
        const { result } = renderHook(() => useAuthentication());
        expect(result.current.logout).toBe(mockLogout);
      });

      it('Then it exposes the clearError action from the store', () => {
        const { result } = renderHook(() => useAuthentication());
        expect(result.current.clearError).toBe(mockClearError);
      });

      it('Then it exposes the setPendingVerificationEmail action from the store', () => {
        const { result } = renderHook(() => useAuthentication());
        expect(result.current.setPendingVerificationEmail).toBe(mockSetPendingVerificationEmail);
      });
    });
  });

  describe('Given the user is authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue({
        ...mockStoreState,
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'user@test.com',
          username: 'testuser',
          displayName: null,
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
        isAuthenticated: true,
      } as ReturnType<typeof useAuthenticationStore>);
    });

    it('Then it exposes the authenticated user object', () => {
      const { result } = renderHook(() => useAuthentication());
      expect(result.current.user?.email).toBe('user@test.com');
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('Given the store has an active error', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue({
        ...mockStoreState,
        error: 'Invalid credentials',
        errorCode: 'INVALID_CREDENTIALS',
      } as ReturnType<typeof useAuthenticationStore>);
    });

    it('Then it exposes the error message', () => {
      const { result } = renderHook(() => useAuthentication());
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('Then it exposes the error code', () => {
      const { result } = renderHook(() => useAuthentication());
      expect(result.current.errorCode).toBe('INVALID_CREDENTIALS');
    });
  });
});
