import type { onboardingService } from './onboarding.service';

/**
 * Mock of onboardingService for use in unit tests.
 *
 * Usage:
 *   vi.mock('@/features/onboarding/api/onboarding.service', async () => {
 *     const { mockOnboardingService } = await import('@/features/onboarding/api/onboarding.mock');
 *     return { onboardingService: mockOnboardingService };
 *   });
 */
export const mockOnboardingService: typeof onboardingService = {
  startOnboarding: vi.fn().mockResolvedValue({
    status: 'IN_PROGRESS',
    currentStep: 0,
    path: null,
  }),
  getOnboardingStatus: vi.fn().mockResolvedValue({
    status: null,
    currentStep: null,
    path: null,
    stepData: null,
  }),
  saveProgress: vi.fn().mockResolvedValue({
    status: 'IN_PROGRESS',
    currentStep: 0,
    path: null,
  }),
  recordConsents: vi.fn().mockResolvedValue({
    data: { recorded: true },
    success: true,
  }),
  completeOnboarding: vi.fn().mockResolvedValue({
    path: 'CREATE',
    tenantId: 'tenant-uuid-001',
    tenantName: 'Test Business',
    role: 'OWNER',
  }),
  validateInvitation: vi.fn().mockResolvedValue({
    data: {
      code: 'ABC12345',
      businessName: 'Test Corp',
      inviterName: 'John Doe',
      role: 'EMPLOYEE',
      expiresAt: '2026-12-31T00:00:00.000Z',
    },
    success: true,
  }),
  acceptInvitation: vi.fn().mockResolvedValue({
    data: { tenantId: 'tenant-uuid-001', role: 'EMPLOYEE' },
    success: true,
  }),
};
