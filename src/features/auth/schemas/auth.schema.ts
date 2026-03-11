import { z } from 'zod';

// =============================================================================
// REQUEST SCHEMAS (Form Validation)
// =============================================================================

/**
 * Schema de login para validación de formulario
 */
export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'errors.emailOrUsernameRequired'),
  password: z.string().min(1, 'errors.passwordRequired').min(8, 'errors.passwordMinLength'),
});

/**
 * Schema de registro para validación de formulario
 */
export const registerSchema = z
  .object({
    fullName: z.string().min(1, 'errors.fullNameRequired'),
    email: z.string().min(1, 'errors.emailRequired').email('errors.emailInvalid'),
    username: z
      .string()
      .min(1, 'errors.usernameRequired')
      .min(3, 'errors.usernameMinLength')
      .regex(/^[a-zA-Z0-9_]+$/, 'errors.usernamePattern'),
    password: z
      .string()
      .min(1, 'errors.passwordRequired')
      .min(8, 'errors.passwordMinLength')
      .regex(/^(?=.*[A-Z])(?=.*[0-9])/, 'errors.passwordPattern'),
    confirmPassword: z.string().min(1, 'errors.confirmPasswordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'errors.passwordsDoNotMatch',
    path: ['confirmPassword'],
  });

/**
 * Schema de forgot password para validación de formulario
 */
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'errors.emailRequired').email('errors.emailInvalid'),
});

/**
 * Schema de reset password para validación de formulario
 */
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'errors.passwordRequired')
      .min(8, 'errors.passwordMinLength')
      .regex(/^(?=.*[A-Z])(?=.*[0-9])/, 'errors.passwordPattern'),
    confirmPassword: z.string().min(1, 'errors.passwordRequired'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'errors.passwordsDoNotMatch',
    path: ['confirmPassword'],
  });

// =============================================================================
// REQUEST CONTRACTS (API Payloads)
// =============================================================================

/**
 * Contrato: POST /auth/sign-in request
 */
export const SignInRequestSchema = z.object({
  emailOrUsername: z.string(),
  password: z.string(),
});

/**
 * Contrato: POST /auth/sign-up request
 */
export const SignUpRequestSchema = z.object({
  email: z.string().email(),
  username: z.string(),
  password: z.string(),
});

/**
 * Contrato: POST /auth/verify-email request
 */
export const VerifyEmailRequestSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

/**
 * Contrato: POST /auth/resend-verification-code request
 */
export const ResendVerificationCodeRequestSchema = z.object({
  email: z.string().email(),
});

/**
 * Contrato: POST /auth/refresh request
 * No body — el refresh_token viaja via httpOnly cookie automáticamente
 */
export const RefreshSessionRequestSchema = z.object({});

/**
 * Contrato: POST /auth/sign-out request
 * No body — el refresh_token viaja via httpOnly cookie automáticamente
 */
export const SignOutRequestSchema = z.object({});

// =============================================================================
// RESPONSE CONTRACTS (API Responses)
// =============================================================================

/**
 * Usuario como viene del backend
 */
export const BackendUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string(),
  createdAt: z.string(),
});

/**
 * Contrato: POST /auth/sign-up response
 * Estructura real del backend: { data: { user, accessToken }, success: true }
 * El refreshToken ya no viene en el body — viaja en httpOnly cookie
 */
export const SignUpResponseSchema = z.object({
  data: z.object({
    user: BackendUserSchema,
    accessToken: z.string(),
  }),
  success: z.boolean(),
});

/**
 * Contrato: POST /auth/sign-in response
 * Estructura real del backend: { data: { user, accessToken, emailVerificationRequired }, success: true }
 * El refreshToken ya no viene en el body — viaja en httpOnly cookie
 */
export const SignInResponseSchema = z.object({
  data: z.object({
    user: BackendUserSchema,
    accessToken: z.string(),
    emailVerificationRequired: z.boolean(),
  }),
  success: z.boolean(),
});

/**
 * Contrato: POST /auth/refresh response
 * El nuevo refreshToken se setea como httpOnly cookie en el response del BE
 */
export const RefreshSessionResponseSchema = z.object({
  data: z.object({
    accessToken: z.string(),
  }),
  success: z.boolean(),
});

/**
 * Contrato: GET /auth/me response
 */
export const GetMeResponseSchema = z.object({
  data: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    username: z.string(),
    status: z.enum([
      'pending_verification',
      'active',
      'email_verified_by_provider',
      'archived',
      'blocked',
    ]),
    createdAt: z.string(),
  }),
  success: z.boolean(),
});

/**
 * Contrato: POST /auth/verify-email response
 */
export const VerifyEmailResponseSchema = z.object({
  data: z.object({
    success: z.boolean(),
    message: z.string(),
  }),
  success: z.boolean(),
});

/**
 * Contrato: POST /auth/resend-verification-code response
 */
export const ResendVerificationCodeResponseSchema = z.object({
  data: z.object({
    success: z.boolean(),
    message: z.string(),
    cooldownSeconds: z.number().optional(),
    remainingResends: z.number().optional(),
  }),
  success: z.boolean(),
});

/**
 * Contrato: POST /auth/forgot-password response
 */
export const ForgotPasswordResponseSchema = z.object({
  data: z.object({ message: z.string() }),
  success: z.boolean(),
});

/**
 * Contrato: POST /auth/reset-password response
 */
export const ResetPasswordResponseSchema = z.object({
  data: z.object({ message: z.string() }),
  success: z.boolean(),
});

/**
 * Contrato: Error response del API
 * Incluye campos de metadata específicos según el tipo de error
 */
export const ApiErrorResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  error: z.enum([
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
  ]),
  details: z
    .array(
      z.object({
        field: z.string(),
        message: z.string(),
      }),
    )
    .optional(),
  // Campos de metadata según el tipo de error
  attemptsRemaining: z.number().optional(), // TOO_MANY_VERIFICATION_ATTEMPTS
  minutesRemaining: z.number().optional(), // VERIFICATION_BLOCKED
  blockedUntil: z.string().optional(), // VERIFICATION_BLOCKED, ACCOUNT_TEMPORARILY_LOCKED
});

// =============================================================================
// INFERRED TYPES
// =============================================================================

// Form validation types
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Request types
export type SignInRequest = z.infer<typeof SignInRequestSchema>;
export type SignUpRequest = z.infer<typeof SignUpRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof VerifyEmailRequestSchema>;
export type ResendVerificationCodeRequest = z.infer<typeof ResendVerificationCodeRequestSchema>;
export type RefreshSessionRequest = z.infer<typeof RefreshSessionRequestSchema>;
export type SignOutRequest = z.infer<typeof SignOutRequestSchema>;

// Response types
export type BackendUser = z.infer<typeof BackendUserSchema>;
export type SignUpResponse = z.infer<typeof SignUpResponseSchema>;
export type SignInResponse = z.infer<typeof SignInResponseSchema>;
export type RefreshSessionResponse = z.infer<typeof RefreshSessionResponseSchema>;
export type GetMeResponse = z.infer<typeof GetMeResponseSchema>;
export type VerifyEmailResponse = z.infer<typeof VerifyEmailResponseSchema>;
export type ResendVerificationCodeResponse = z.infer<typeof ResendVerificationCodeResponseSchema>;
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponseSchema>;
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
