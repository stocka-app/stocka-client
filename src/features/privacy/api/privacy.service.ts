import { api } from '@/shared/lib/axios';
import type { ConsentRecord } from '../types/privacy.types';

/**
 * Privacy service
 *
 * All API calls for the privacy settings feature.
 * Network errors propagate to the caller (hook) which handles them gracefully.
 */
export const privacyService = {
  /**
   * Fetch the current user's consent records
   * GET /api/users/me/consents
   */
  async getConsents(): Promise<ConsentRecord[]> {
    const response = await api.get('/users/me/consents');
    return response.data.data.consents;
  },

  /**
   * Update consent preferences.
   * The backend requires `terms: true` on every call.
   * We always send the full set so we don't accidentally revoke a consent.
   *
   * POST /api/users/me/consents
   */
  async updateConsents(marketing: boolean, analytics: boolean): Promise<void> {
    await api.post('/users/me/consents', {
      terms: true,
      marketing,
      analytics,
    });
  },
};
