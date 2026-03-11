/**
 * Shared mocks for auth feature tests.
 *
 * Usage in test file:
 *   vi.mock('../store/authentication.store', () => authenticationStoreMock);
 *   vi.mock('../api/authentication.service', () => authenticationServiceMock);
 *   vi.mock('../components/SocialButton', () => socialButtonMock);
 */
export const authenticationStoreMock = {
  useAuthenticationStore: () => ({
    login: vi.fn(),
    isLoading: false,
    error: null,
    errorCode: null,
    blockInfo: null,
    clearError: vi.fn(),
    setPendingVerificationEmail: vi.fn(),
  }),
};

export const authenticationServiceMock = {
  authenticationService: {
    forgotPassword: vi.fn().mockResolvedValue({}),
  },
};

/** SocialButton triggers OAuth URL fetch — silence it in unit tests. */
export const socialButtonMock = {
  SocialButton: () => null,
};
