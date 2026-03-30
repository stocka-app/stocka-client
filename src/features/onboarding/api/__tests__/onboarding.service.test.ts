import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/shared/lib/axios';
import { onboardingService } from '../onboarding.service';

vi.mock('@/shared/lib/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const startResponse = {
  data: {
    status: 'IN_PROGRESS' as const,
    currentStep: 0,
    path: null,
    stepData: null,
  },
  success: true,
};

const statusResponse = {
  data: {
    status: 'IN_PROGRESS' as const,
    currentStep: 2,
    path: 'CREATE' as const,
    stepData: { consents: { terms: true } },
  },
  success: true,
};

const saveStepResponse = {
  data: {
    status: 'IN_PROGRESS' as const,
    currentStep: 3,
    path: 'CREATE' as const,
  },
  success: true,
};

const recordConsentsResponse = {
  data: { recorded: true },
  success: true,
};

const completeResponse = {
  data: {
    path: 'CREATE' as const,
    tenantId: 'tenant-uuid-123',
    tenantName: 'Mi Negocio',
    role: 'OWNER',
  },
  success: true,
};

const invitationDetails = {
  data: {
    id: 'inv-uuid-1',
    tenantName: 'Stocka HQ',
    email: 'invite@stocka.mx',
    role: 'MANAGER',
    expiresAt: '2026-04-15T00:00:00Z',
  },
  success: true,
};

const acceptInvitationResponse = {
  data: {
    tenantUUID: 'tenant-uuid-456',
    tenantName: 'Stocka HQ',
    role: 'MANAGER',
    joinedAt: '2026-03-28T12:00:00Z',
  },
  success: true,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('onboardingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── startOnboarding ──────────────────────────────────────────────────────

  describe('startOnboarding', () => {
    it('calls POST /onboarding/start and returns Zod-parsed response', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: startResponse });

      const result = await onboardingService.startOnboarding();

      expect(mockedApi.post).toHaveBeenCalledWith('/onboarding/start');
      expect(result).toEqual(startResponse);
    });

    it('propagates errors to the caller', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(onboardingService.startOnboarding()).rejects.toThrow('Network error');
    });
  });

  // ── getOnboardingStatus ──────────────────────────────────────────────────

  describe('getOnboardingStatus', () => {
    it('calls GET /onboarding/status and returns Zod-parsed response', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: statusResponse });

      const result = await onboardingService.getOnboardingStatus();

      expect(mockedApi.get).toHaveBeenCalledWith('/onboarding/status');
      expect(result).toEqual(statusResponse);
    });
  });

  // ── saveProgress ─────────────────────────────────────────────────────────

  describe('saveProgress', () => {
    it('calls PATCH /onboarding/progress with section, data, and currentStep', async () => {
      mockedApi.patch.mockResolvedValueOnce({ data: saveStepResponse });

      const result = await onboardingService.saveProgress('consents', { terms: true }, 1);

      expect(mockedApi.patch).toHaveBeenCalledWith('/onboarding/progress', {
        section: 'consents',
        data: { terms: true },
        currentStep: 1,
      });
      expect(result).toEqual(saveStepResponse);
    });

    it('sends undefined currentStep when omitted', async () => {
      mockedApi.patch.mockResolvedValueOnce({ data: saveStepResponse });

      await onboardingService.saveProgress('preferences', { language: 'es' });

      expect(mockedApi.patch).toHaveBeenCalledWith('/onboarding/progress', {
        section: 'preferences',
        data: { language: 'es' },
        currentStep: undefined,
      });
    });
  });

  // ── recordConsents ───────────────────────────────────────────────────────

  describe('recordConsents', () => {
    it('calls POST /users/me/consents with consent data', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: recordConsentsResponse });

      const consents = { terms: true, marketing: true, analytics: false };
      const result = await onboardingService.recordConsents(consents);

      expect(mockedApi.post).toHaveBeenCalledWith('/users/me/consents', consents);
      expect(result).toEqual(recordConsentsResponse);
    });
  });

  // ── completeOnboarding ───────────────────────────────────────────────────

  describe('completeOnboarding', () => {
    it('calls POST /onboarding/complete and returns Zod-parsed response', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: completeResponse });

      const result = await onboardingService.completeOnboarding();

      expect(mockedApi.post).toHaveBeenCalledWith('/onboarding/complete');
      expect(result).toEqual(completeResponse);
    });
  });

  // ── validateInvitation ───────────────────────────────────────────────────

  describe('validateInvitation', () => {
    it('calls GET /tenant/invitations/:token with URL-encoded code', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: invitationDetails });

      const result = await onboardingService.validateInvitation('ABC12345');

      expect(mockedApi.get).toHaveBeenCalledWith('/tenant/invitations/ABC12345');
      expect(result).toEqual(invitationDetails);
    });

    it('encodes special characters in the invitation code', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: invitationDetails });

      await onboardingService.validateInvitation('A+B/C=D');

      expect(mockedApi.get).toHaveBeenCalledWith('/tenant/invitations/A%2BB%2FC%3DD');
    });
  });

  // ── acceptInvitation ─────────────────────────────────────────────────────

  describe('acceptInvitation', () => {
    it('calls POST /tenant/invitations/:token/accept', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: acceptInvitationResponse });

      const result = await onboardingService.acceptInvitation('ABC12345');

      expect(mockedApi.post).toHaveBeenCalledWith('/tenant/invitations/ABC12345/accept');
      expect(result).toEqual(acceptInvitationResponse);
    });

    it('encodes special characters in the invitation code', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: acceptInvitationResponse });

      await onboardingService.acceptInvitation('A+B/C=D');

      expect(mockedApi.post).toHaveBeenCalledWith('/tenant/invitations/A%2BB%2FC%3DD/accept');
    });
  });
});
