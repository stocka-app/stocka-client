import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  SignInRequestSchema,
  SignUpRequestSchema,
  VerifyEmailRequestSchema,
  ResendVerificationCodeRequestSchema,
  RefreshSessionRequestSchema,
  SignOutRequestSchema,
  BackendUserSchema,
  SignUpResponseSchema,
  SignInResponseSchema,
  RefreshSessionResponseSchema,
  GetMeResponseSchema,
  VerifyEmailResponseSchema,
  ResendVerificationCodeResponseSchema,
  ForgotPasswordResponseSchema,
  ResetPasswordResponseSchema,
  ApiErrorResponseSchema,
} from '@/features/authentication/schemas/authentication.schema';

// =============================================================================
// loginSchema
// =============================================================================

describe('loginSchema', () => {
  const validInput = { emailOrUsername: 'user@test.com', password: 'Password1' };

  describe('Given valid credentials', () => {
    it('Then it parses successfully', () => {
      expect(() => loginSchema.parse(validInput)).not.toThrow();
    });
  });

  describe('Given an empty emailOrUsername', () => {
    it('Then it fails with a validation error on emailOrUsername', () => {
      const result = loginSchema.safeParse({ ...validInput, emailOrUsername: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('emailOrUsername');
      }
    });
  });

  describe('Given an empty password', () => {
    it('Then it fails with a validation error on password', () => {
      const result = loginSchema.safeParse({ ...validInput, password: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });
  });

  describe('Given a password shorter than 8 characters', () => {
    it('Then it fails with a validation error on password', () => {
      const result = loginSchema.safeParse({ ...validInput, password: 'Pass1' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password');
      }
    });
  });
});

// =============================================================================
// registerSchema
// =============================================================================

describe('registerSchema', () => {
  const validInput = {
    fullName: 'Alice',
    email: 'alice@test.com',
    username: 'alice99',
    password: 'Password1',
    confirmPassword: 'Password1',
  };

  describe('Given valid registration data', () => {
    it('Then it parses successfully', () => {
      expect(() => registerSchema.parse(validInput)).not.toThrow();
    });
  });

  describe('Given an empty fullName', () => {
    it('Then it fails with a validation error on fullName', () => {
      const result = registerSchema.safeParse({ ...validInput, fullName: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('fullName');
      }
    });
  });

  describe('Given an email without the @ symbol', () => {
    it('Then it fails with a validation error on email', () => {
      const result = registerSchema.safeParse({ ...validInput, email: 'notanemail' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('email'))).toBe(true);
      }
    });
  });

  describe('Given a username shorter than 3 characters', () => {
    it('Then it fails with a validation error on username', () => {
      const result = registerSchema.safeParse({ ...validInput, username: 'ab' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('username'))).toBe(true);
      }
    });
  });

  describe('Given a username containing a space (special character)', () => {
    it('Then it fails with a validation error on username', () => {
      const result = registerSchema.safeParse({ ...validInput, username: 'ali ce' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('username'))).toBe(true);
      }
    });
  });

  describe('Given a password without an uppercase letter', () => {
    it('Then it fails with a validation error on password', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'password1',
        confirmPassword: 'password1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('password'))).toBe(true);
      }
    });
  });

  describe('Given a password without a number', () => {
    it('Then it fails with a validation error on password', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        password: 'PasswordOnly',
        confirmPassword: 'PasswordOnly',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('password'))).toBe(true);
      }
    });
  });

  describe('Given a confirmPassword that does not match password', () => {
    it('Then it fails with a validation error on confirmPassword', () => {
      const result = registerSchema.safeParse({
        ...validInput,
        confirmPassword: 'DifferentPass1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('confirmPassword'))).toBe(true);
      }
    });
  });
});

// =============================================================================
// forgotPasswordSchema
// =============================================================================

describe('forgotPasswordSchema', () => {
  describe('Given a valid email address', () => {
    it('Then it parses successfully', () => {
      expect(() => forgotPasswordSchema.parse({ email: 'user@test.com' })).not.toThrow();
    });
  });

  describe('Given an empty email field', () => {
    it('Then it fails with a validation error on email', () => {
      const result = forgotPasswordSchema.safeParse({ email: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });
  });

  describe('Given a non-email string', () => {
    it('Then it fails with a validation error on email', () => {
      const result = forgotPasswordSchema.safeParse({ email: 'not-an-email' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });
  });
});

// =============================================================================
// resetPasswordSchema
// =============================================================================

describe('resetPasswordSchema', () => {
  const validInput = { password: 'NewPass1', confirmPassword: 'NewPass1' };

  describe('Given valid matching passwords', () => {
    it('Then it parses successfully', () => {
      expect(() => resetPasswordSchema.parse(validInput)).not.toThrow();
    });
  });

  describe('Given mismatched passwords', () => {
    it('Then it fails with a validation error on confirmPassword', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'NewPass1',
        confirmPassword: 'OtherPass2',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('confirmPassword'))).toBe(true);
      }
    });
  });

  describe('Given a password without an uppercase letter', () => {
    it('Then it fails with a validation error on password', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'newpass1',
        confirmPassword: 'newpass1',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes('password'))).toBe(true);
      }
    });
  });
});

// =============================================================================
// API Request Schemas
// =============================================================================

describe('SignInRequestSchema', () => {
  describe('Given valid sign-in fields', () => {
    it('Then it parses successfully', () => {
      expect(() =>
        SignInRequestSchema.parse({ emailOrUsername: 'user@test.com', password: 'pass' }),
      ).not.toThrow();
    });
  });

  describe('Given missing fields', () => {
    it('Then it fails when emailOrUsername is missing', () => {
      const result = SignInRequestSchema.safeParse({ password: 'pass' });
      expect(result.success).toBe(false);
    });
  });
});

describe('SignUpRequestSchema', () => {
  describe('Given valid sign-up fields', () => {
    it('Then it parses successfully', () => {
      expect(() =>
        SignUpRequestSchema.parse({
          email: 'user@test.com',
          username: 'usertest',
          password: 'Password1',
        }),
      ).not.toThrow();
    });
  });

  describe('Given an invalid email', () => {
    it('Then it fails on email', () => {
      const result = SignUpRequestSchema.safeParse({
        email: 'not-an-email',
        username: 'usertest',
        password: 'Password1',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('VerifyEmailRequestSchema', () => {
  describe('Given a valid email and a 6-character code', () => {
    it('Then it parses successfully', () => {
      expect(() =>
        VerifyEmailRequestSchema.parse({ email: 'user@test.com', code: '123456' }),
      ).not.toThrow();
    });
  });

  describe('Given a code that is not 6 characters', () => {
    it('Then it fails on code', () => {
      const result = VerifyEmailRequestSchema.safeParse({
        email: 'user@test.com',
        code: '12345',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('ResendVerificationCodeRequestSchema', () => {
  describe('Given a valid email', () => {
    it('Then it parses successfully', () => {
      expect(() =>
        ResendVerificationCodeRequestSchema.parse({ email: 'user@test.com' }),
      ).not.toThrow();
    });
  });

  describe('Given an invalid email', () => {
    it('Then it fails', () => {
      expect(
        ResendVerificationCodeRequestSchema.safeParse({ email: 'invalid' }).success,
      ).toBe(false);
    });
  });
});

describe('RefreshSessionRequestSchema', () => {
  describe('Given an empty object', () => {
    it('Then it parses successfully', () => {
      expect(() => RefreshSessionRequestSchema.parse({})).not.toThrow();
    });
  });
});

describe('SignOutRequestSchema', () => {
  describe('Given an empty object', () => {
    it('Then it parses successfully', () => {
      expect(() => SignOutRequestSchema.parse({})).not.toThrow();
    });
  });
});

// =============================================================================
// API Response Schemas
// =============================================================================

const validBackendUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@test.com',
  username: 'testuser',
  createdAt: '2024-01-01T00:00:00.000Z',
};

describe('BackendUserSchema', () => {
  describe('Given a valid backend user object', () => {
    it('Then it parses successfully', () => {
      expect(() => BackendUserSchema.parse(validBackendUser)).not.toThrow();
    });
  });

  describe('Given a non-UUID id', () => {
    it('Then it fails on id', () => {
      const result = BackendUserSchema.safeParse({ ...validBackendUser, id: 'not-a-uuid' });
      expect(result.success).toBe(false);
    });
  });

  describe('Given an invalid email', () => {
    it('Then it fails on email', () => {
      const result = BackendUserSchema.safeParse({ ...validBackendUser, email: 'bad-email' });
      expect(result.success).toBe(false);
    });
  });
});

describe('SignUpResponseSchema', () => {
  const validResponse = {
    data: { user: validBackendUser, accessToken: 'token123', emailSent: true },
    success: true,
  };

  describe('Given a valid sign-up response', () => {
    it('Then it parses successfully', () => {
      expect(() => SignUpResponseSchema.parse(validResponse)).not.toThrow();
    });
  });

  describe('Given a response missing the emailSent field', () => {
    it('Then it fails', () => {
      const result = SignUpResponseSchema.safeParse({
        data: { user: validBackendUser, accessToken: 'token123' },
        success: true,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('SignInResponseSchema', () => {
  const validResponse = {
    data: {
      user: validBackendUser,
      accessToken: 'token123',
      emailVerificationRequired: false,
    },
    success: true,
  };

  describe('Given a valid sign-in response', () => {
    it('Then it parses successfully', () => {
      expect(() => SignInResponseSchema.parse(validResponse)).not.toThrow();
    });
  });

  describe('Given a response missing emailVerificationRequired', () => {
    it('Then it fails', () => {
      const result = SignInResponseSchema.safeParse({
        data: { user: validBackendUser, accessToken: 'token123' },
        success: true,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('RefreshSessionResponseSchema', () => {
  describe('Given a valid refresh response', () => {
    it('Then it parses successfully', () => {
      expect(() =>
        RefreshSessionResponseSchema.parse({ data: { accessToken: 'newtoken' }, success: true }),
      ).not.toThrow();
    });
  });

  describe('Given a response missing accessToken', () => {
    it('Then it fails', () => {
      expect(RefreshSessionResponseSchema.safeParse({ data: {}, success: true }).success).toBe(
        false,
      );
    });
  });
});

describe('GetMeResponseSchema', () => {
  const validResponse = {
    data: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@test.com',
      username: 'testuser',
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    success: true,
  };

  describe('Given a valid getMe response', () => {
    it('Then it parses successfully', () => {
      expect(() => GetMeResponseSchema.parse(validResponse)).not.toThrow();
    });
  });

  describe('Given all valid user statuses', () => {
    const statuses = [
      'pending_verification',
      'active',
      'email_verified_by_provider',
      'archived',
      'blocked',
    ] as const;

    statuses.forEach((status) => {
      it(`Then it parses successfully with status "${status}"`, () => {
        expect(() =>
          GetMeResponseSchema.parse({ data: { ...validResponse.data, status }, success: true }),
        ).not.toThrow();
      });
    });
  });

  describe('Given an invalid status', () => {
    it('Then it fails on status', () => {
      const result = GetMeResponseSchema.safeParse({
        data: { ...validResponse.data, status: 'unknown_status' },
        success: true,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('VerifyEmailResponseSchema', () => {
  describe('Given a valid verify email response', () => {
    it('Then it parses successfully', () => {
      expect(() =>
        VerifyEmailResponseSchema.parse({
          data: { success: true, message: 'Email verified' },
          success: true,
        }),
      ).not.toThrow();
    });
  });
});

describe('ResendVerificationCodeResponseSchema', () => {
  describe('Given a minimal valid response', () => {
    it('Then it parses successfully without optional fields', () => {
      expect(() =>
        ResendVerificationCodeResponseSchema.parse({
          data: { success: true, message: 'Code resent' },
          success: true,
        }),
      ).not.toThrow();
    });
  });

  describe('Given a response with optional cooldown fields', () => {
    it('Then it parses successfully with all optional fields', () => {
      expect(() =>
        ResendVerificationCodeResponseSchema.parse({
          data: {
            success: true,
            message: 'Code resent',
            cooldownSeconds: 60,
            remainingResends: 2,
          },
          success: true,
        }),
      ).not.toThrow();
    });
  });
});

describe('ForgotPasswordResponseSchema', () => {
  describe('Given a valid forgot password response', () => {
    it('Then it parses successfully', () => {
      expect(() =>
        ForgotPasswordResponseSchema.parse({
          data: { message: 'Email sent if account exists' },
          success: true,
        }),
      ).not.toThrow();
    });
  });
});

describe('ResetPasswordResponseSchema', () => {
  describe('Given a valid reset password response', () => {
    it('Then it parses successfully', () => {
      expect(() =>
        ResetPasswordResponseSchema.parse({
          data: { message: 'Password reset successfully' },
          success: true,
        }),
      ).not.toThrow();
    });
  });
});

describe('ApiErrorResponseSchema', () => {
  const baseError = {
    statusCode: 401,
    message: 'Invalid credentials',
    error: 'INVALID_CREDENTIALS',
  };

  describe('Given a minimal valid API error', () => {
    it('Then it parses successfully', () => {
      expect(() => ApiErrorResponseSchema.parse(baseError)).not.toThrow();
    });
  });

  describe('Given an error with optional metadata fields', () => {
    it('Then it parses successfully with attemptsRemaining', () => {
      expect(() =>
        ApiErrorResponseSchema.parse({ ...baseError, error: 'TOO_MANY_VERIFICATION_ATTEMPTS', attemptsRemaining: 2 }),
      ).not.toThrow();
    });

    it('Then it parses successfully with minutesRemaining and blockedUntil', () => {
      expect(() =>
        ApiErrorResponseSchema.parse({
          ...baseError,
          error: 'VERIFICATION_BLOCKED',
          minutesRemaining: 15,
          blockedUntil: '2024-01-01T01:00:00.000Z',
        }),
      ).not.toThrow();
    });

    it('Then it parses successfully with details array', () => {
      expect(() =>
        ApiErrorResponseSchema.parse({
          ...baseError,
          details: [{ field: 'email', message: 'Required' }],
        }),
      ).not.toThrow();
    });
  });

  describe('Given all valid error codes', () => {
    const validErrorCodes = [
      'INVALID_CREDENTIALS',
      'EMAIL_ALREADY_EXISTS',
      'USERNAME_ALREADY_EXISTS',
      'EMAIL_NOT_VERIFIED',
      'INVALID_VERIFICATION_CODE',
      'VERIFICATION_CODE_EXPIRED',
      'TOO_MANY_VERIFICATION_ATTEMPTS',
      'VERIFICATION_BLOCKED',
      'RESEND_COOLDOWN_ACTIVE',
      'MAX_RESENDS_EXCEEDED',
      'USER_ALREADY_VERIFIED',
      'RATE_LIMIT_EXCEEDED',
      'ACCOUNT_TEMPORARILY_LOCKED',
      'ACCOUNT_DEACTIVATED',
      'TOKEN_EXPIRED',
      'INVALID_TOKEN',
      'TOKEN_ALREADY_USED',
      'UNKNOWN_ERROR',
    ] as const;

    validErrorCodes.forEach((code) => {
      it(`Then it parses with error code "${code}"`, () => {
        expect(() =>
          ApiErrorResponseSchema.parse({ ...baseError, error: code }),
        ).not.toThrow();
      });
    });
  });

  describe('Given an unknown error code', () => {
    it('Then it fails on error', () => {
      const result = ApiErrorResponseSchema.safeParse({
        ...baseError,
        error: 'TOTALLY_UNKNOWN_CODE',
      });
      expect(result.success).toBe(false);
    });
  });
});
