import { api } from '@/shared/lib/axios';
import {
  RecordConsentsResponseSchema,
  StartOnboardingResponseSchema,
  OnboardingStatusResponseSchema,
  SaveStepResponseSchema,
  CompleteOnboardingResponseSchema,
  ValidateInvitationResponseSchema,
  AcceptInvitationResponseSchema,
  type ConsentFormData,
  type RecordConsentsResponse,
  type StartOnboardingResponse,
  type OnboardingStatusResponse,
  type SaveStepResponse,
  type CompleteOnboardingResponse,
  type ValidateInvitationResponse,
  type AcceptInvitationResponse,
} from '../schemas/onboarding.schema';

/**
 * Onboarding service
 *
 * All API calls for the onboarding feature.
 * Responses are validated with Zod — invalid responses throw a ZodError.
 * Network errors propagate to the caller (hook) which handles them gracefully.
 */
export const onboardingService = {
  /**
   * Start or resume an onboarding session (idempotent)
   * POST /api/onboarding/start
   */
  async startOnboarding(): Promise<StartOnboardingResponse> {
    const response = await api.post('/onboarding/start');
    return StartOnboardingResponseSchema.parse(response.data);
  },

  /**
   * Get current onboarding status with all step data
   * GET /api/onboarding/status
   */
  async getOnboardingStatus(): Promise<OnboardingStatusResponse> {
    const response = await api.get('/onboarding/status');
    return OnboardingStatusResponseSchema.parse(response.data);
  },

  /**
   * Save progress for an onboarding section
   * PATCH /api/onboarding/progress
   */
  async saveProgress(section: string, data: Record<string, unknown>, currentStep?: number): Promise<SaveStepResponse> {
    const response = await api.patch('/onboarding/progress', { section, data, currentStep });
    return SaveStepResponseSchema.parse(response.data);
  },

  /**
   * Record user consent preferences (terms, marketing, analytics)
   * POST /api/users/me/consents
   */
  async recordConsents(consents: ConsentFormData): Promise<RecordConsentsResponse> {
    const response = await api.post('/users/me/consents', consents);
    return RecordConsentsResponseSchema.parse(response.data);
  },

  /**
   * Complete onboarding — creates tenant + default storage or joins via invitation
   * POST /api/onboarding/complete
   */
  async completeOnboarding(): Promise<CompleteOnboardingResponse> {
    const response = await api.post('/onboarding/complete');
    return CompleteOnboardingResponseSchema.parse(response.data);
  },

  /**
   * Validate an invitation by token (public endpoint)
   * GET /api/tenant/invitations/:token
   */
  async validateInvitation(code: string): Promise<ValidateInvitationResponse> {
    const response = await api.get(`/tenant/invitations/${encodeURIComponent(code)}`);
    return ValidateInvitationResponseSchema.parse(response.data);
  },

  /**
   * Accept an invitation by token (requires auth)
   * POST /api/tenant/invitations/:token/accept
   */
  async acceptInvitation(code: string): Promise<AcceptInvitationResponse> {
    const response = await api.post(`/tenant/invitations/${encodeURIComponent(code)}/accept`);
    return AcceptInvitationResponseSchema.parse(response.data);
  },
};
