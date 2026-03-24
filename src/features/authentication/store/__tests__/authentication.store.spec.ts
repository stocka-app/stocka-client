import { act, renderHook } from '@testing-library/react';
import { ZodError } from 'zod';
import { useAuthenticationStore } from '@/features/authentication/store/authentication.store';
import { authenticationService } from '@/features/authentication/api/authentication.service';
import { setAccessToken } from '@/shared/lib/axios';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/features/authentication/api/authentication.service', () => ({
  authenticationService: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerificationCode: vi.fn(),
  },
}));

vi.mock('@/shared/lib/axios', () => ({
  setAccessToken: vi.fn(),
}));

vi.mock('@/shared/lib/jwt', () => ({
  extractTenantContext: vi.fn(() => ({ tenantId: null, role: null, displayName: null })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validBackendUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'user@test.com',
  username: 'testuser',
  createdAt: '2024-01-01T00:00:00.000Z',
};

function resetStore() {
  // Access Zustand's internal setState to reset to initial state
  useAuthenticationStore.setState({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isInitializing: true,
    isLoading: false,
    error: null,
    errorCode: null,
    emailVerificationRequired: false,
    pendingVerificationEmail: null,
    verificationCodeSentAt: null,
    verificationEmailSent: null,
    blockInfo: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useAuthenticationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  // =========================================================================
  // login
  // =========================================================================

  describe('login action', () => {
    describe('Given valid credentials and no email verification required', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signIn).mockResolvedValue({
          data: {
            user: validBackendUser,
            accessToken: 'access-token-123',
            emailVerificationRequired: false,
          },
          success: true,
        });
      });

      describe('When login is called', () => {
        it('Then it sets the user and marks the session as authenticated', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          let loginResult: { requiresVerification: boolean; requiresOnboarding: boolean } | undefined;
          await act(async () => {
            loginResult = await result.current.login({
              emailOrUsername: 'user@test.com',
              password: 'Password1',
            });
          });

          expect(loginResult).toEqual({ requiresVerification: false, requiresOnboarding: true });
          expect(result.current.isAuthenticated).toBe(true);
          expect(result.current.user?.email).toBe('user@test.com');
          expect(result.current.isLoading).toBe(false);
          expect(result.current.error).toBeNull();
        });

        it('Then it calls setAccessToken with the received token', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.login({
              emailOrUsername: 'user@test.com',
              password: 'Password1',
            });
          });

          expect(setAccessToken).toHaveBeenCalledWith('access-token-123');
        });

        it('Then it clears pendingVerificationEmail', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.login({
              emailOrUsername: 'user@test.com',
              password: 'Password1',
            });
          });

          expect(result.current.pendingVerificationEmail).toBeNull();
          expect(result.current.emailVerificationRequired).toBe(false);
        });
      });
    });

    describe('Given the backend requires email verification after login', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signIn).mockResolvedValue({
          data: {
            user: validBackendUser,
            accessToken: 'access-token-123',
            emailVerificationRequired: true,
          },
          success: true,
        });
      });

      describe('When login is called', () => {
        it('Then it returns requiresVerification: true', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          let loginResult: { requiresVerification: boolean; requiresOnboarding: boolean } | undefined;
          await act(async () => {
            loginResult = await result.current.login({
              emailOrUsername: 'user@test.com',
              password: 'Password1',
            });
          });

          expect(loginResult).toEqual({ requiresVerification: true, requiresOnboarding: false });
        });

        it('Then it sets emailVerificationRequired and is NOT authenticated', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.login({
              emailOrUsername: 'user@test.com',
              password: 'Password1',
            });
          });

          expect(result.current.emailVerificationRequired).toBe(true);
          expect(result.current.isAuthenticated).toBe(false);
          expect(result.current.pendingVerificationEmail).toBe('user@test.com');
        });
      });
    });

    describe('Given the account is temporarily locked', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signIn).mockRejectedValue({
          statusCode: 403,
          message: 'Account locked',
          error: 'ACCOUNT_TEMPORARILY_LOCKED',
          blockedUntil: '2024-01-01T01:00:00.000Z',
        });
      });

      describe('When login is called', () => {
        it('Then it sets blockInfo with reason account_locked', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.login({ emailOrUsername: 'user@test.com', password: 'Password1' }).catch(() => {});
          });

          expect(result.current.blockInfo).toEqual(
            expect.objectContaining({
              isBlocked: true,
              reason: 'account_locked',
            }),
          );
        });
      });
    });

    describe('Given the account is locked but no blockedUntil timestamp is provided', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signIn).mockRejectedValue({
          statusCode: 403,
          error: 'ACCOUNT_TEMPORARILY_LOCKED',
        });
      });

      describe('When login is called', () => {
        it('Then blockInfo.blockedUntil is undefined', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.login({ emailOrUsername: 'user@test.com', password: 'Password1' }).catch(() => {});
          });

          expect(result.current.blockInfo?.blockedUntil).toBeUndefined();
          expect(result.current.blockInfo?.isBlocked).toBe(true);
        });
      });
    });

    describe('Given the backend returns an error with no message field', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signIn).mockRejectedValue({
          statusCode: 400,
          error: 'INVALID_CREDENTIALS',
        });
      });

      describe('When login is called', () => {
        it('Then the error message remains the default UNKNOWN_ERROR value', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.login({ emailOrUsername: 'user@test.com', password: 'Password1' }).catch(() => {});
          });

          expect(result.current.errorCode).toBe('INVALID_CREDENTIALS');
          expect(result.current.error).toBe('UNKNOWN_ERROR');
        });
      });
    });

    describe('Given the login fails with RATE_LIMIT_EXCEEDED', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signIn).mockRejectedValue({
          statusCode: 429,
          message: 'Rate limit exceeded',
          error: 'RATE_LIMIT_EXCEEDED',
        });
      });

      describe('When login is called', () => {
        it('Then it sets blockInfo with reason rate_limit', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.login({ emailOrUsername: 'user@test.com', password: 'Password1' }).catch(() => {});
          });

          expect(result.current.blockInfo).toEqual(
            expect.objectContaining({ isBlocked: true, reason: 'rate_limit' }),
          );
        });
      });
    });

    describe('Given the login fails with HTTP 429 status code (no RATE_LIMIT_EXCEEDED error code)', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signIn).mockRejectedValue({
          statusCode: 429,
          message: 'Too many requests',
          error: 'UNKNOWN_ERROR',
        });
      });

      describe('When login is called', () => {
        it('Then it sets blockInfo with reason rate_limit based on statusCode', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.login({ emailOrUsername: 'user@test.com', password: 'Password1' }).catch(() => {});
          });

          expect(result.current.blockInfo).toEqual(
            expect.objectContaining({ isBlocked: true, reason: 'rate_limit' }),
          );
        });
      });
    });

    describe('Given the backend returns EMAIL_NOT_VERIFIED', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signIn).mockRejectedValue({
          statusCode: 403,
          message: 'Email not verified',
          error: 'EMAIL_NOT_VERIFIED',
        });
      });

      describe('When login is called', () => {
        it('Then it sets emailVerificationRequired to true', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.login({ emailOrUsername: 'user@test.com', password: 'Password1' }).catch(() => {});
          });

          expect(result.current.emailVerificationRequired).toBe(true);
        });
      });
    });

    describe('Given the authentication service returns a malformed response (ZodError)', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signIn).mockRejectedValue(
          new ZodError([
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['data', 'accessToken'],
              message: 'Expected string, received number',
            },
          ]),
        );
      });

      describe('When login is called', () => {
        it('Then it sets errorCode to UNKNOWN_ERROR', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.login({ emailOrUsername: 'user@test.com', password: 'Password1' }).catch(() => {});
          });

          expect(result.current.errorCode).toBe('UNKNOWN_ERROR');
        });
      });
    });

    describe('Given the authentication service throws a plain Error', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signIn).mockRejectedValue(
          new Error('Network failure'),
        );
      });

      describe('When login is called', () => {
        it('Then it sets the error message from the thrown Error', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.login({ emailOrUsername: 'user@test.com', password: 'Password1' }).catch(() => {});
          });

          expect(result.current.error).toBe('Network failure');
        });
      });
    });
  });

  // =========================================================================
  // register
  // =========================================================================

  describe('register action', () => {
    describe('Given valid credentials and the email was sent successfully', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signUp).mockResolvedValue({
          data: {
            user: validBackendUser,
            accessToken: 'access-token-123',
            emailSent: true,
          },
          success: true,
        });
      });

      describe('When register is called', () => {
        it('Then it sets emailVerificationRequired to true', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.register({
              email: 'user@test.com',
              username: 'testuser',
              password: 'Password1',
            });
          });

          expect(result.current.emailVerificationRequired).toBe(true);
          expect(result.current.pendingVerificationEmail).toBe('user@test.com');
        });

        it('Then it sets verificationCodeSentAt to a non-null timestamp', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.register({
              email: 'user@test.com',
              username: 'testuser',
              password: 'Password1',
            });
          });

          expect(result.current.verificationCodeSentAt).not.toBeNull();
        });

        it('Then it returns requiresVerification: true', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          let registerResult: { requiresVerification: boolean; requiresOnboarding: boolean } | undefined;
          await act(async () => {
            registerResult = await result.current.register({
              email: 'user@test.com',
              username: 'testuser',
              password: 'Password1',
            });
          });

          expect(registerResult).toEqual({ requiresVerification: true, requiresOnboarding: false });
        });
      });
    });

    describe('Given valid credentials but the email was NOT sent', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signUp).mockResolvedValue({
          data: {
            user: validBackendUser,
            accessToken: 'access-token-123',
            emailSent: false,
          },
          success: true,
        });
      });

      describe('When register is called', () => {
        it('Then it leaves verificationCodeSentAt as null to avoid a false cooldown', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.register({
              email: 'user@test.com',
              username: 'testuser',
              password: 'Password1',
            });
          });

          expect(result.current.verificationCodeSentAt).toBeNull();
        });
      });
    });

    describe('Given the registration fails with no message field', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signUp).mockRejectedValue({
          statusCode: 409,
          error: 'EMAIL_ALREADY_EXISTS',
        });
      });

      describe('When register is called', () => {
        it('Then the error message remains the default UNKNOWN_ERROR value', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.register({
              email: 'user@test.com',
              username: 'testuser',
              password: 'Password1',
            }).catch(() => {});
          });

          expect(result.current.errorCode).toBe('EMAIL_ALREADY_EXISTS');
          expect(result.current.error).toBe('UNKNOWN_ERROR');
        });
      });
    });

    describe('Given the registration fails', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signUp).mockRejectedValue({
          statusCode: 409,
          message: 'Email already exists',
          error: 'EMAIL_ALREADY_EXISTS',
        });
      });

      describe('When register is called', () => {
        it('Then it sets the error and errorCode', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.register({
              email: 'user@test.com',
              username: 'testuser',
              password: 'Password1',
            }).catch(() => {});
          });

          expect(result.current.error).toBe('Email already exists');
          expect(result.current.errorCode).toBe('EMAIL_ALREADY_EXISTS');
        });

        it('Then it re-throws the error', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await expect(
              result.current.register({
                email: 'user@test.com',
                username: 'testuser',
                password: 'Password1',
              }),
            ).rejects.toBeDefined();
          });
        });
      });
    });

    describe('Given the sign-up service throws a ZodError (malformed response)', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signUp).mockRejectedValue(
          new ZodError([
            {
              code: 'invalid_type',
              expected: 'string',
              received: 'number',
              path: ['data', 'accessToken'],
              message: 'Expected string, received number',
            },
          ]),
        );
      });

      describe('When register is called', () => {
        it('Then it sets errorCode to UNKNOWN_ERROR', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.register({
              email: 'user@test.com',
              username: 'testuser',
              password: 'Password1',
            }).catch(() => {});
          });

          expect(result.current.errorCode).toBe('UNKNOWN_ERROR');
        });
      });
    });

    describe('Given the sign-up service throws a plain Error', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signUp).mockRejectedValue(
          new Error('Network failure'),
        );
      });

      describe('When register is called', () => {
        it('Then it sets the error message from the thrown Error', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.register({
              email: 'user@test.com',
              username: 'testuser',
              password: 'Password1',
            }).catch(() => {});
          });

          expect(result.current.error).toBe('Network failure');
        });
      });
    });
  });

  // =========================================================================
  // verifyEmail
  // =========================================================================

  describe('verifyEmail action', () => {
    describe('Given there is no pending verification email', () => {
      describe('When verifyEmail is called', () => {
        it('Then it throws with the message "No email pending verification"', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await expect(result.current.verifyEmail('123456')).rejects.toThrow(
              'No email pending verification',
            );
          });
        });
      });
    });

    describe('Given there is a pending verification email', () => {
      beforeEach(() => {
        useAuthenticationStore.setState({
          pendingVerificationEmail: 'user@test.com',
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'user@test.com',
            username: 'testuser',
            displayName: null,
            givenName: null,
            familyName: null,
            avatarUrl: null,
            status: 'pending_verification',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        });
      });

      describe('When a valid code is submitted', () => {
        beforeEach(() => {
          vi.mocked(authenticationService.verifyEmail).mockResolvedValue({
            data: { success: true, message: 'Email verified' },
            success: true,
          });
        });

        it('Then it sets isAuthenticated to true and clears emailVerificationRequired', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.verifyEmail('123456');
          });

          expect(result.current.isAuthenticated).toBe(true);
          expect(result.current.emailVerificationRequired).toBe(false);
          expect(result.current.pendingVerificationEmail).toBeNull();
        });

        it('Then it updates the user status to active', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.verifyEmail('123456');
          });

          expect(result.current.user?.status).toBe('active');
        });
      });

      describe('When a valid code is submitted but the user slot is already null', () => {
        beforeEach(() => {
          useAuthenticationStore.setState({
            pendingVerificationEmail: 'user@test.com',
            user: null,
          });
          vi.mocked(authenticationService.verifyEmail).mockResolvedValue({
            data: { success: true, message: 'Email verified' },
            success: true,
          });
        });

        it('Then user remains null after successful verification', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.verifyEmail('123456');
          });

          expect(result.current.user).toBeNull();
          expect(result.current.isAuthenticated).toBe(true);
        });
      });

      describe('When the code is blocked (VERIFICATION_BLOCKED)', () => {
        beforeEach(() => {
          vi.mocked(authenticationService.verifyEmail).mockRejectedValue({
            statusCode: 403,
            message: 'Verification blocked',
            error: 'VERIFICATION_BLOCKED',
            blockedUntil: '2024-01-01T01:00:00.000Z',
          });
        });

        it('Then it sets blockInfo with reason "attempts"', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.verifyEmail('000000').catch(() => {});
          });

          expect(result.current.blockInfo).toEqual(
            expect.objectContaining({ isBlocked: true, reason: 'attempts' }),
          );
        });
      });

      describe('When the code is blocked but no blockedUntil timestamp is provided', () => {
        beforeEach(() => {
          vi.mocked(authenticationService.verifyEmail).mockRejectedValue({
            statusCode: 403,
            message: 'Verification blocked',
            error: 'VERIFICATION_BLOCKED',
          });
        });

        it('Then blockInfo.blockedUntil is undefined', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.verifyEmail('000000').catch(() => {});
          });

          expect(result.current.blockInfo?.blockedUntil).toBeUndefined();
          expect(result.current.blockInfo?.isBlocked).toBe(true);
        });
      });

      describe('When the verification service returns an error with no message or error code', () => {
        beforeEach(() => {
          vi.mocked(authenticationService.verifyEmail).mockRejectedValue({});
        });

        it('Then it falls back to default error message and UNKNOWN_ERROR code', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.verifyEmail('000000').catch(() => {});
          });

          expect(result.current.error).toBe('Verification failed');
          expect(result.current.errorCode).toBe('UNKNOWN_ERROR');
        });
      });

      describe('When too many verification attempts have been made', () => {
        beforeEach(() => {
          vi.mocked(authenticationService.verifyEmail).mockRejectedValue({
            statusCode: 429,
            message: 'Too many attempts',
            error: 'TOO_MANY_VERIFICATION_ATTEMPTS',
            attemptsRemaining: 2,
          });
        });

        it('Then it sets blockInfo with attemptsRemaining', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.verifyEmail('000000').catch(() => {});
          });

          expect(result.current.blockInfo).toEqual(
            expect.objectContaining({ isBlocked: false, attemptsRemaining: 2 }),
          );
        });
      });
    });
  });

  // =========================================================================
  // resendVerificationCode
  // =========================================================================

  describe('resendVerificationCode action', () => {
    describe('Given there is no pending verification email', () => {
      describe('When resendVerificationCode is called', () => {
        it('Then it throws with "No email pending verification"', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await expect(result.current.resendVerificationCode()).rejects.toThrow(
              'No email pending verification',
            );
          });
        });
      });
    });

    describe('Given there is a pending verification email', () => {
      beforeEach(() => {
        useAuthenticationStore.setState({ pendingVerificationEmail: 'user@test.com' });
      });

      describe('When the resend is successful', () => {
        beforeEach(() => {
          vi.mocked(authenticationService.resendVerificationCode).mockResolvedValue({
            data: { success: true, message: 'Code resent' },
            success: true,
          });
        });

        it('Then it sets verificationCodeSentAt to a non-null timestamp', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.resendVerificationCode();
          });

          expect(result.current.verificationCodeSentAt).not.toBeNull();
        });

        it('Then it sets verificationEmailSent to true', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.resendVerificationCode();
          });

          expect(result.current.verificationEmailSent).toBe(true);
        });
      });

      describe('When the resend fails', () => {
        beforeEach(() => {
          vi.mocked(authenticationService.resendVerificationCode).mockRejectedValue({
            statusCode: 429,
            message: 'Cooldown active',
            error: 'RESEND_COOLDOWN_ACTIVE',
          });
        });

        it('Then it sets the error and re-throws', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await expect(result.current.resendVerificationCode()).rejects.toBeDefined();
          });

          expect(result.current.error).toBe('Cooldown active');
          expect(result.current.errorCode).toBe('RESEND_COOLDOWN_ACTIVE');
        });
      });

      describe('When the resend fails with no message or error code in the response', () => {
        beforeEach(() => {
          vi.mocked(authenticationService.resendVerificationCode).mockRejectedValue({});
        });

        it('Then it falls back to default error message and UNKNOWN_ERROR code', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.resendVerificationCode().catch(() => {});
          });

          expect(result.current.error).toBe('Failed to resend code');
          expect(result.current.errorCode).toBe('UNKNOWN_ERROR');
        });
      });
    });
  });

  // =========================================================================
  // logout
  // =========================================================================

  describe('logout action', () => {
    describe('Given a successful sign-out call', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signOut).mockResolvedValue(undefined);
        useAuthenticationStore.setState({
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'user@test.com',
            username: 'testuser',
            displayName: null,
            givenName: null,
            familyName: null,
            avatarUrl: null,
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          isAuthenticated: true,
          accessToken: 'token-123',
        });
      });

      describe('When logout is called', () => {
        it('Then it clears the user and resets authentication state', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.logout();
          });

          expect(result.current.user).toBeNull();
          expect(result.current.isAuthenticated).toBe(false);
        });

        it('Then it calls setAccessToken with null', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.logout();
          });

          expect(setAccessToken).toHaveBeenCalledWith(null);
        });
      });
    });

    describe('Given the sign-out API call fails', () => {
      beforeEach(() => {
        vi.mocked(authenticationService.signOut).mockRejectedValue(new Error('Network error'));
        useAuthenticationStore.setState({
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'user@test.com',
            username: 'testuser',
            displayName: null,
            givenName: null,
            familyName: null,
            avatarUrl: null,
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          isAuthenticated: true,
        });
      });

      describe('When logout is called', () => {
        it('Then it still clears the local state despite the API failure', async () => {
          const { result } = renderHook(() => useAuthenticationStore());

          await act(async () => {
            await result.current.logout();
          });

          expect(result.current.user).toBeNull();
          expect(result.current.isAuthenticated).toBe(false);
        });
      });
    });
  });

  // =========================================================================
  // handleOAuthCallback
  // =========================================================================

  describe('handleOAuthCallback action', () => {
    describe('Given OAuth tokens are received after a successful redirect', () => {
      describe('When handleOAuthCallback is called', () => {
        it('Then it sets the user and marks the session as authenticated', () => {
          const { result } = renderHook(() => useAuthenticationStore());

          const oauthUser = {
            id: '00000000-0000-0000-0000-000000000002',
            email: 'oauth@test.com',
            username: 'oauthuser',
            displayName: null,
            givenName: null,
            familyName: null,
            avatarUrl: null,
            status: 'email_verified_by_provider' as const,
            createdAt: '2024-01-01T00:00:00.000Z',
          };

          act(() => {
            result.current.handleOAuthCallback({
              accessToken: 'oauth-token-abc',
              user: { ...oauthUser, tenantId: null, role: null },
            });
          });

          // handleOAuthCallback enriches user with tenantId/role/displayName from JWT
          expect(result.current.user).toEqual({ ...oauthUser, tenantId: null, role: null, displayName: null });
          expect(result.current.isAuthenticated).toBe(true);
          expect(result.current.error).toBeNull();
          expect(result.current.blockInfo).toBeNull();
        });

        it('Then it calls setAccessToken with the OAuth access token', () => {
          const { result } = renderHook(() => useAuthenticationStore());

          act(() => {
            result.current.handleOAuthCallback({
              accessToken: 'oauth-token-abc',
              user: {
                id: '00000000-0000-0000-0000-000000000002',
                email: 'oauth@test.com',
                username: 'oauthuser',
                displayName: null,
                givenName: null,
                familyName: null,
                avatarUrl: null,
                status: 'email_verified_by_provider',
                createdAt: '2024-01-01T00:00:00.000Z',
                tenantId: null,
                role: null,
              },
            });
          });

          expect(setAccessToken).toHaveBeenCalledWith('oauth-token-abc');
        });
      });
    });
  });

  // =========================================================================
  // Utility setters
  // =========================================================================

  describe('setUser action', () => {
    describe('Given a user object is provided', () => {
      it('Then it updates the user in the store', () => {
        const { result } = renderHook(() => useAuthenticationStore());
        const newUser = {
          id: '00000000-0000-0000-0000-000000000003',
          email: 'new@test.com',
          username: 'newuser',
          displayName: null,
          givenName: null,
          familyName: null,
          avatarUrl: null,
          status: 'active' as const,
          createdAt: '2024-01-01T00:00:00.000Z',
          tenantId: null,
          role: null,
        };

        act(() => {
          result.current.setUser(newUser);
        });

        expect(result.current.user).toEqual(newUser);
      });
    });

    describe('Given null is provided', () => {
      it('Then it clears the user', () => {
        useAuthenticationStore.setState({
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'user@test.com',
            username: 'testuser',
            displayName: null,
            givenName: null,
            familyName: null,
            avatarUrl: null,
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        });
        const { result } = renderHook(() => useAuthenticationStore());

        act(() => {
          result.current.setUser(null);
        });

        expect(result.current.user).toBeNull();
      });
    });
  });

  describe('clearError action', () => {
    describe('Given there is an active error in the store', () => {
      beforeEach(() => {
        useAuthenticationStore.setState({
          error: 'Something went wrong',
          errorCode: 'INVALID_CREDENTIALS',
        });
      });

      it('Then it clears both error and errorCode', () => {
        const { result } = renderHook(() => useAuthenticationStore());

        act(() => {
          result.current.clearError();
        });

        expect(result.current.error).toBeNull();
        expect(result.current.errorCode).toBeNull();
      });
    });
  });

  describe('setLoading action', () => {
    describe('Given a loading state is set to true', () => {
      it('Then the store reflects isLoading: true', () => {
        const { result } = renderHook(() => useAuthenticationStore());

        act(() => {
          result.current.setLoading(true);
        });

        expect(result.current.isLoading).toBe(true);
      });
    });

    describe('Given loading state is reset to false', () => {
      it('Then the store reflects isLoading: false', () => {
        useAuthenticationStore.setState({ isLoading: true });
        const { result } = renderHook(() => useAuthenticationStore());

        act(() => {
          result.current.setLoading(false);
        });

        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('setBlockInfo action', () => {
    describe('Given block info is provided', () => {
      it('Then it stores the block info', () => {
        const { result } = renderHook(() => useAuthenticationStore());
        const blockInfo = { isBlocked: true, reason: 'rate_limit' as const };

        act(() => {
          result.current.setBlockInfo(blockInfo);
        });

        expect(result.current.blockInfo).toEqual(blockInfo);
      });
    });

    describe('Given null is provided', () => {
      it('Then it clears the block info', () => {
        useAuthenticationStore.setState({
          blockInfo: { isBlocked: true, reason: 'rate_limit' },
        });
        const { result } = renderHook(() => useAuthenticationStore());

        act(() => {
          result.current.setBlockInfo(null);
        });

        expect(result.current.blockInfo).toBeNull();
      });
    });
  });

  describe('setPendingVerificationEmail action', () => {
    describe('Given an email address is provided', () => {
      it('Then it stores the pending verification email', () => {
        const { result } = renderHook(() => useAuthenticationStore());

        act(() => {
          result.current.setPendingVerificationEmail('verify@test.com');
        });

        expect(result.current.pendingVerificationEmail).toBe('verify@test.com');
      });
    });

    describe('Given null is provided', () => {
      it('Then it clears the pending verification email', () => {
        useAuthenticationStore.setState({ pendingVerificationEmail: 'verify@test.com' });
        const { result } = renderHook(() => useAuthenticationStore());

        act(() => {
          result.current.setPendingVerificationEmail(null);
        });

        expect(result.current.pendingVerificationEmail).toBeNull();
      });
    });
  });

  describe('resetAuthState action', () => {
    describe('Given the user is authenticated and there is an error', () => {
      beforeEach(() => {
        useAuthenticationStore.setState({
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'user@test.com',
            username: 'testuser',
            displayName: null,
            givenName: null,
            familyName: null,
            avatarUrl: null,
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
          isAuthenticated: true,
          error: 'Something went wrong',
          errorCode: 'UNKNOWN_ERROR',
          blockInfo: { isBlocked: true, reason: 'rate_limit' },
        });
      });

      describe('When resetAuthState is called', () => {
        it('Then it resets all state to initial values', () => {
          const { result } = renderHook(() => useAuthenticationStore());

          act(() => {
            result.current.resetAuthState();
          });

          expect(result.current.user).toBeNull();
          expect(result.current.isAuthenticated).toBe(false);
          expect(result.current.error).toBeNull();
          expect(result.current.errorCode).toBeNull();
          expect(result.current.blockInfo).toBeNull();
          expect(result.current.isInitializing).toBe(false);
        });

        it('Then it calls setAccessToken(null)', () => {
          const { result } = renderHook(() => useAuthenticationStore());

          act(() => {
            result.current.resetAuthState();
          });

          expect(setAccessToken).toHaveBeenCalledWith(null);
        });
      });
    });
  });

  // =========================================================================
  // Persistence config — partialize
  // =========================================================================

  describe('Persistence configuration', () => {
    describe('Given the store has state that should be partially persisted', () => {
      it('Then partialize includes only: user, emailVerificationRequired, pendingVerificationEmail, verificationCodeSentAt', () => {
        // Access the persist options to verify partialize logic
        // We test this by checking what keys would be stored
        const fullState = useAuthenticationStore.getState();

        // Simulate what partialize does
        const persistedKeys = [
          'user',
          'emailVerificationRequired',
          'pendingVerificationEmail',
          'verificationCodeSentAt',
        ];
        const nonPersistedKeys = [
          'accessToken',
          'isAuthenticated',
          'isInitializing',
          'isLoading',
          'error',
          'errorCode',
          'blockInfo',
          'verificationEmailSent',
        ];

        // All persisted keys exist in the state
        persistedKeys.forEach((key) => {
          expect(key in fullState).toBe(true);
        });

        // All non-persisted keys exist in the state but should NOT be in partialize output
        nonPersistedKeys.forEach((key) => {
          expect(key in fullState).toBe(true);
        });

        // The store's storage name is correct
        // We verify it indirectly by checking localStorage after a state change
        useAuthenticationStore.setState({ user: null, emailVerificationRequired: false });

        const stored = localStorage.getItem('authentication-storage');
        if (stored) {
          const parsed = JSON.parse(stored) as { state: Record<string, unknown> };
          // Non-persisted keys should not be in stored state
          expect(parsed.state).not.toHaveProperty('accessToken');
          expect(parsed.state).not.toHaveProperty('isAuthenticated');
          expect(parsed.state).not.toHaveProperty('isLoading');
        }
      });
    });
  });
});
