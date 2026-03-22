import { describe, it, expect, beforeEach, vi } from 'vitest';
import { privacyService } from '../privacy.service';
import { api } from '@/shared/lib/axios';
import type { ConsentRecord } from '../../types/privacy.types';

vi.mock('@/shared/lib/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

// ── Fixtures ──────────────────────────────────────────────────────────

const consentRecords: ConsentRecord[] = [
  { consentType: 'terms_of_service', granted: true, documentVersion: '1.0', grantedAt: '2026-01-15T00:00:00Z' },
  { consentType: 'privacy_policy', granted: true, documentVersion: '1.0', grantedAt: '2026-01-15T00:00:00Z' },
  { consentType: 'marketing_communications', granted: true, documentVersion: '1.0', grantedAt: '2026-01-15T00:00:00Z' },
  { consentType: 'anonymous_analytics', granted: false, documentVersion: '1.0', grantedAt: '2026-01-15T00:00:00Z' },
];

describe('privacyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getConsents ───────────────────────────────────────────────────

  describe('getConsents', () => {
    describe('Given the API returns consent records', () => {
      beforeEach(() => {
        mockedApi.get.mockResolvedValue({
          data: { data: { consents: consentRecords } },
        });
      });

      it('Then it calls GET /users/me/consents', async () => {
        await privacyService.getConsents();

        expect(mockedApi.get).toHaveBeenCalledWith('/users/me/consents');
      });

      it('Then it returns the parsed consent records', async () => {
        const result = await privacyService.getConsents();

        expect(result).toEqual(consentRecords);
      });
    });

    describe('Given the API call fails', () => {
      beforeEach(() => {
        mockedApi.get.mockRejectedValue(new Error('Network error'));
      });

      it('Then the error propagates to the caller', async () => {
        await expect(privacyService.getConsents()).rejects.toThrow('Network error');
      });
    });
  });

  // ── updateConsents ────────────────────────────────────────────────

  describe('updateConsents', () => {
    describe('Given marketing=true and analytics=false', () => {
      beforeEach(() => {
        mockedApi.post.mockResolvedValue({ data: {} });
      });

      it('Then it calls POST /users/me/consents with terms always true', async () => {
        await privacyService.updateConsents(true, false);

        expect(mockedApi.post).toHaveBeenCalledWith('/users/me/consents', {
          terms: true,
          marketing: true,
          analytics: false,
        });
      });
    });

    describe('Given marketing=false and analytics=true', () => {
      beforeEach(() => {
        mockedApi.post.mockResolvedValue({ data: {} });
      });

      it('Then it sends the correct payload', async () => {
        await privacyService.updateConsents(false, true);

        expect(mockedApi.post).toHaveBeenCalledWith('/users/me/consents', {
          terms: true,
          marketing: false,
          analytics: true,
        });
      });
    });

    describe('Given the API call fails', () => {
      beforeEach(() => {
        mockedApi.post.mockRejectedValue(new Error('Server error'));
      });

      it('Then the error propagates to the caller', async () => {
        await expect(privacyService.updateConsents(true, true)).rejects.toThrow('Server error');
      });
    });
  });
});
