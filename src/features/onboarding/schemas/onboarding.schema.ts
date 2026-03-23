import { z } from 'zod';

// =============================================================================
// ENUMS
// =============================================================================

export const BusinessTypeSchema = z.enum([
  'RETAIL',
  'RESTAURANT',
  'WORKSHOP',
  'SERVICES',
  'HEALTH',
  'EDUCATION',
  'EVENTS',
  'AGRICULTURE',
  'OTHER',
]);

export const OnboardingPathSchema = z.enum(['create', 'invitation']);

export const LanguageSchema = z.enum(['es', 'en']);

export const CurrencySchema = z.enum(['MXN', 'USD', 'EUR']);

export const ThemeSchema = z.enum(['light', 'dark']);

export const TierSchema = z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']);

export const TeamSizeSchema = z.enum(['solo', '2-5', '6-20', '21-50', '50+']);

export const MonthlyRevenueSchema = z.enum(['<50k', '50-200k', '200k-1M', '>1M']);

export const InvitationErrorCodeSchema = z.enum([
  'INVALID_CODE',
  'EXPIRED_CODE',
  'ALREADY_USED',
  'UNKNOWN',
]);

// =============================================================================
// FORM SCHEMAS
// =============================================================================

/**
 * Step 0 — Path selection schema
 */
export const pathSelectionSchema = z.object({
  path: OnboardingPathSchema,
});

/**
 * Step 1 — Consent schema
 * terms is required (must be true); marketing is optional
 */
export const consentSchema = z.object({
  terms: z.boolean().refine((val) => val === true, {
    message: 'step1.termsRequired',
  }),
  marketing: z.boolean().default(true),
  analytics: z.boolean().default(true),
});

/**
 * Step 2 — Preferences schema
 */
export const preferencesSchema = z.object({
  language: LanguageSchema,
  currency: CurrencySchema,
  theme: ThemeSchema,
});

/**
 * Step 3 — Business profile schema
 */
export const businessProfileSchema = z.object({
  businessName: z
    .string()
    .min(1, 'step3.businessNameRequired')
    .min(2, 'step3.businessNameTooShort')
    .max(100, 'step3.businessNameTooLong'),
  businessType: BusinessTypeSchema.refine((val) => val !== undefined, {
    message: 'step3.businessTypeRequired',
  }),
  otherBusinessType: z.string().max(100).optional(),
  country: z.string().min(1, 'step3.countryRequired'),
  cityRegion: z.string().max(100).optional(),
});

/**
 * Invitation code schema — 8 alphanumeric characters
 */
export const invitationCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'invitation.codeEntry.codeRequired')
    .length(8, 'invitation.codeEntry.codeInvalid')
    .regex(/^[A-Z0-9]{8}$/, 'invitation.codeEntry.codeInvalid'),
});

/**
 * Step 5 — Context schema (optional fields)
 */
export const contextSchema = z.object({
  teamSize: TeamSizeSchema.optional(),
  monthlyRevenue: MonthlyRevenueSchema.optional(),
});

// =============================================================================
// API RESPONSE SCHEMAS
// =============================================================================

/**
 * Response: POST /api/users/me/consents
 */
export const RecordConsentsResponseSchema = z.object({
  data: z.object({
    recorded: z.boolean(),
  }),
  success: z.boolean(),
});

/**
 * Response: POST /api/onboarding/start
 */
export const StartOnboardingResponseSchema = z.object({
  data: z.object({
    status: z.enum(['IN_PROGRESS', 'COMPLETED']),
    currentStep: z.number(),
    path: z.enum(['CREATE', 'JOIN']).nullable(),
  }),
  success: z.boolean(),
});

/**
 * Response: GET /api/onboarding/status
 */
export const OnboardingStatusResponseSchema = z.object({
  data: z.object({
    status: z.enum(['IN_PROGRESS', 'COMPLETED']).nullable(),
    currentStep: z.number().nullable(),
    path: z.enum(['CREATE', 'JOIN']).nullable(),
    stepData: z.record(z.string(), z.unknown()).nullable(),
  }),
  success: z.boolean(),
});

/**
 * Response: PATCH /api/onboarding/progress
 */
export const SaveStepResponseSchema = z.object({
  data: z.object({
    status: z.enum(['IN_PROGRESS', 'COMPLETED']),
    currentStep: z.number(),
    path: z.enum(['CREATE', 'JOIN']).nullable(),
  }),
  success: z.boolean(),
});

/**
 * Response: POST /api/onboarding/complete
 */
export const CompleteOnboardingResponseSchema = z.object({
  data: z.object({
    path: z.enum(['CREATE', 'JOIN']),
    tenantId: z.string().nullable(),
    tenantName: z.string().nullable(),
    role: z.string().nullable(),
  }),
  success: z.boolean(),
});

/**
 * Invitation details as returned by the API
 */
export const InvitationDetailsSchema = z.object({
  id: z.string(),
  tenantName: z.string(),
  email: z.string(),
  role: z.string(),
  expiresAt: z.string(),
});

/**
 * Response: GET /api/tenant/invitations/:token
 */
export const ValidateInvitationResponseSchema = z.object({
  data: InvitationDetailsSchema,
  success: z.boolean(),
});

/**
 * Response: POST /api/tenant/invitations/:token/accept
 */
export const AcceptInvitationResponseSchema = z.object({
  data: z.object({
    tenantUUID: z.string(),
    tenantName: z.string(),
    role: z.string(),
    joinedAt: z.string(),
  }),
  success: z.boolean(),
});

// =============================================================================
// INFERRED TYPES
// =============================================================================

export type BusinessType = z.infer<typeof BusinessTypeSchema>;
export type OnboardingPath = z.infer<typeof OnboardingPathSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type Currency = z.infer<typeof CurrencySchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type Tier = z.infer<typeof TierSchema>;
export type TeamSize = z.infer<typeof TeamSizeSchema>;
export type MonthlyRevenue = z.infer<typeof MonthlyRevenueSchema>;
export type InvitationErrorCode = z.infer<typeof InvitationErrorCodeSchema>;

export type PathSelectionFormData = z.infer<typeof pathSelectionSchema>;
export type ConsentFormData = z.infer<typeof consentSchema>;
export type PreferencesFormData = z.infer<typeof preferencesSchema>;
export type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;
export type InvitationCodeFormData = z.infer<typeof invitationCodeSchema>;
export type ContextFormData = z.infer<typeof contextSchema>;

export type InvitationDetails = z.infer<typeof InvitationDetailsSchema>;
export type RecordConsentsResponse = z.infer<typeof RecordConsentsResponseSchema>;
export type StartOnboardingResponse = z.infer<typeof StartOnboardingResponseSchema>;
export type OnboardingStatusResponse = z.infer<typeof OnboardingStatusResponseSchema>;
export type SaveStepResponse = z.infer<typeof SaveStepResponseSchema>;
export type CompleteOnboardingResponse = z.infer<typeof CompleteOnboardingResponseSchema>;
export type ValidateInvitationResponse = z.infer<typeof ValidateInvitationResponseSchema>;
export type AcceptInvitationResponse = z.infer<typeof AcceptInvitationResponseSchema>;
