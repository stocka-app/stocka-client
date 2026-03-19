import { api } from '@/shared/lib/axios';
import {
  UpdatePreferencesResponseSchema,
  UpdateBusinessProfileResponseSchema,
  CompleteOnboardingResponseSchema,
  ValidateInvitationResponseSchema,
  AcceptInvitationResponseSchema,
  type PreferencesFormData,
  type BusinessProfileFormData,
  type UpdatePreferencesResponse,
  type UpdateBusinessProfileResponse,
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
   * Update user language, currency and theme preferences
   * PATCH /api/users/me/preferences
   */
  async updatePreferences(preferences: PreferencesFormData): Promise<UpdatePreferencesResponse> {
    const response = await api.patch('/users/me/preferences', preferences);
    return UpdatePreferencesResponseSchema.parse(response.data);
  },

  /**
   * Update tenant business profile (name, type, state)
   * PATCH /api/tenants/me/profile
   */
  async updateBusinessProfile(
    profile: BusinessProfileFormData,
  ): Promise<UpdateBusinessProfileResponse> {
    const response = await api.patch('/tenants/me/profile', profile);
    return UpdateBusinessProfileResponseSchema.parse(response.data);
  },

  /**
   * Mark onboarding as complete
   * POST /api/tenant/onboarding/complete
   */
  async completeOnboarding(): Promise<CompleteOnboardingResponse> {
    const response = await api.post('/tenant/onboarding/complete');
    return CompleteOnboardingResponseSchema.parse(response.data);
  },

  /**
   * Validate an invitation code
   * POST /api/invitations/validate
   */
  async validateInvitation(code: string): Promise<ValidateInvitationResponse> {
    const response = await api.post('/invitations/validate', { code });
    return ValidateInvitationResponseSchema.parse(response.data);
  },

  /**
   * Accept a validated invitation
   * POST /api/invitations/accept
   */
  async acceptInvitation(code: string): Promise<AcceptInvitationResponse> {
    const response = await api.post('/invitations/accept', { code });
    return AcceptInvitationResponseSchema.parse(response.data);
  },
};
