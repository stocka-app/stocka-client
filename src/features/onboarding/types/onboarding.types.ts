export type {
  BusinessType,
  OnboardingPath,
  Language,
  Currency,
  Theme,
  Tier,
  TeamSize,
  MonthlyRevenue,
  InvitationErrorCode,
  InvitationDetails,
  ConsentFormData,
  PreferencesFormData,
  BusinessProfileFormData,
  InvitationCodeFormData,
  ContextFormData,
  OnboardingStatusResponse,
} from '../schemas/onboarding.schema';

// =============================================================================
// ONBOARDING STEPS
// =============================================================================

/**
 * Step 0: path selection (no progress bar)
 * Steps 1-6: main onboarding flow (with progress bar)
 * Step 7: internal "completed" state (auto-redirects to dashboard)
 * The invitation sub-flow replaces steps 1-6 when path === 'invitation'
 */
export type OnboardingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type InvitationSubStep = 'code-entry' | 'confirmation';

// =============================================================================
// PERSISTED STATE
// =============================================================================

export interface OnboardingConsents {
  terms: boolean;
  marketing: boolean;
  analytics: boolean;
}

export interface OnboardingPreferences {
  language: 'es' | 'en';
  currency: 'MXN' | 'USD' | 'EUR';
  theme: 'light' | 'dark';
}

export interface OnboardingBusinessProfile {
  businessName: string;
  businessType: string;
  otherBusinessType?: string;
  country: string;
  cityRegion?: string;
}

export interface OnboardingContext {
  teamSize?: string;
  monthlyRevenue?: string;
}

// =============================================================================
// STORE STATE
// =============================================================================

/**
 * Persisted portion of the onboarding store
 * Survives page refresh via localStorage
 */
export interface OnboardingPersistedState {
  step: OnboardingStep;
  path: 'create' | 'invitation' | null;
  consents: OnboardingConsents | null;
  preferences: OnboardingPreferences | null;
  businessProfile: OnboardingBusinessProfile | null;
  invitationCode: string | null;
  context: OnboardingContext | null;
  completedAt: string | null;
}

/**
 * Ephemeral portion — NOT persisted
 */
export interface OnboardingEphemeralState {
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  invitationDetails: import('../schemas/onboarding.schema').InvitationDetails | null;
  invitationSubStep: InvitationSubStep;
}

export type OnboardingState = OnboardingPersistedState & OnboardingEphemeralState;

// =============================================================================
// STORE ACTIONS
// =============================================================================

export interface OnboardingActions {
  setStep: (step: OnboardingStep) => void;
  setPath: (path: 'create' | 'invitation' | null) => void;
  setConsents: (consents: OnboardingConsents) => void;
  setPreferences: (preferences: OnboardingPreferences) => void;
  setBusinessProfile: (profile: OnboardingBusinessProfile) => void;
  setInvitationCode: (code: string) => void;
  setContext: (context: OnboardingContext) => void;
  setCompletedAt: (completedAt: string) => void;
  setHydrated: (isHydrated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setInvitationDetails: (
    details: import('../schemas/onboarding.schema').InvitationDetails | null,
  ) => void;
  setInvitationSubStep: (subStep: InvitationSubStep) => void;
  hydrateFromBackend: (data: OnboardingStatusResponse['data']) => void;
  reset: () => void;
}

export type OnboardingStore = OnboardingState & OnboardingActions;
