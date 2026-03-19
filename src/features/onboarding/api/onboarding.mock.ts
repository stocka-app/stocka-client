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
  updatePreferences: vi.fn().mockResolvedValue({
    data: { language: 'es', currency: 'MXN', theme: 'light' },
    success: true,
  }),
  updateBusinessProfile: vi.fn().mockResolvedValue({
    data: { businessName: 'Test Business', businessType: 'RETAIL', state: 'Jalisco' },
    success: true,
  }),
  completeOnboarding: vi.fn().mockResolvedValue({
    data: { completedAt: '2026-01-01T00:00:00.000Z' },
    success: true,
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
