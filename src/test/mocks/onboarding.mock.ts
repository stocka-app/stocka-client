import type { useOnboarding } from '@/features/onboarding/hooks/useOnboarding';

/**
 * Reusable mock for the useOnboarding hook.
 *
 * Usage in test files:
 *   vi.mock('@/features/onboarding', async () => {
 *     const { mockUseOnboarding } = await import('@/test/mocks/onboarding.mock');
 *     return { useOnboarding: mockUseOnboarding };
 *   });
 */
export const mockUseOnboarding: ReturnType<typeof useOnboarding> = {
  currentStep: 0,
  path: null,
  consents: null,
  preferences: null,
  businessProfile: null,
  invitationCode: null,
  context: null,
  completedAt: null,
  isLoading: false,
  error: null,
  invitationDetails: null,
  invitationSubStep: 'code-entry',
  goToNextStep: vi.fn(),
  goToPreviousStep: vi.fn(),
  goToStep: vi.fn(),
  selectPath: vi.fn(),
  submitConsents: vi.fn().mockResolvedValue(undefined),
  submitPreferences: vi.fn().mockResolvedValue(undefined),
  submitBusinessProfile: vi.fn().mockResolvedValue(undefined),
  submitContext: vi.fn().mockResolvedValue(undefined),
  completeOnboarding: vi.fn().mockResolvedValue(undefined),
  validateInvitationCode: vi.fn().mockResolvedValue(undefined),
  acceptInvitation: vi.fn().mockResolvedValue(undefined),
  setInvitationSubStep: vi.fn(),
  clearError: vi.fn(),
  reset: vi.fn(),
};
