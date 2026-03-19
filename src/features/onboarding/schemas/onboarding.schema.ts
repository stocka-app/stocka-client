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
  marketing: z.boolean().default(false),
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
  state: z.string().min(1, 'step3.stateRequired'),
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
 * Response: PATCH /api/users/me/preferences
 */
export const UpdatePreferencesResponseSchema = z.object({
  data: z.object({
    language: LanguageSchema,
    currency: CurrencySchema,
    theme: ThemeSchema,
  }),
  success: z.boolean(),
});

/**
 * Response: PATCH /api/tenants/me/profile
 */
export const UpdateBusinessProfileResponseSchema = z.object({
  data: z.object({
    businessName: z.string(),
    businessType: BusinessTypeSchema,
    state: z.string(),
  }),
  success: z.boolean(),
});

/**
 * Response: POST /api/tenant/onboarding/complete
 */
export const CompleteOnboardingResponseSchema = z.object({
  data: z.object({
    completedAt: z.string(),
  }),
  success: z.boolean(),
});

/**
 * Invitation details as returned by the API
 */
export const InvitationDetailsSchema = z.object({
  code: z.string(),
  businessName: z.string(),
  inviterName: z.string(),
  role: z.string(),
  expiresAt: z.string(),
});

/**
 * Response: POST /api/invitations/validate
 */
export const ValidateInvitationResponseSchema = z.object({
  data: InvitationDetailsSchema,
  success: z.boolean(),
});

/**
 * Response: POST /api/invitations/accept
 */
export const AcceptInvitationResponseSchema = z.object({
  data: z.object({
    tenantId: z.string(),
    role: z.string(),
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
export type UpdatePreferencesResponse = z.infer<typeof UpdatePreferencesResponseSchema>;
export type UpdateBusinessProfileResponse = z.infer<typeof UpdateBusinessProfileResponseSchema>;
export type CompleteOnboardingResponse = z.infer<typeof CompleteOnboardingResponseSchema>;
export type ValidateInvitationResponse = z.infer<typeof ValidateInvitationResponseSchema>;
export type AcceptInvitationResponse = z.infer<typeof AcceptInvitationResponseSchema>;
