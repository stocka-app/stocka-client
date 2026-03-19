// Hook
export { useOnboarding } from './hooks/useOnboarding';

// Guard
export { OnboardingGuard } from './guards/OnboardingGuard';

// Page (lazy-loaded from router — not exported here to avoid eager imports)
// Use: lazy(() => import('@/features/onboarding/pages/OnboardingPage'))

// Store (for advanced uses — prefer useOnboarding)
export { useOnboardingStore } from './store/onboarding.store';

// Types
export type {
  OnboardingStep,
  OnboardingPath,
  OnboardingState,
  OnboardingStore,
  OnboardingConsents,
  OnboardingPreferences,
  OnboardingBusinessProfile,
  InvitationSubStep,
} from './types/onboarding.types';
