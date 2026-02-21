/**
 * Shared mocks for auth feature tests.
 *
 * Usage in test file:
 *   vi.mock('../store/auth.store', () => authStoreMock);
 *   vi.mock('../api/auth.service', () => authServiceMock);
 *   vi.mock('../components/SocialButton', () => socialButtonMock);
 */
export const authStoreMock = {
  useAuthStore: () => ({
    login: vi.fn(),
    isLoading: false,
    error: null,
    errorCode: null,
    blockInfo: null,
    clearError: vi.fn(),
    setPendingVerificationEmail: vi.fn(),
  }),
};

export const authServiceMock = {
  authService: {
    forgotPassword: vi.fn().mockResolvedValue({}),
  },
};

/** SocialButton triggers OAuth URL fetch — silence it in unit tests. */
export const socialButtonMock = {
  SocialButton: () => null,
};
