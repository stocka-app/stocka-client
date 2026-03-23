import { create } from 'zustand';
import type {
  OnboardingStore,
  OnboardingState,
  OnboardingStep,
  OnboardingConsents,
  OnboardingPreferences,
  OnboardingBusinessProfile,
  OnboardingContext,
  InvitationSubStep,
  OnboardingStatusResponse,
} from '../types/onboarding.types';
import type { InvitationDetails } from '../schemas/onboarding.schema';

const initialState: OnboardingState = {
  // Persisted on backend
  step: 0,
  path: null,
  consents: null,
  preferences: null,
  businessProfile: null,
  invitationCode: null,
  context: null,
  completedAt: null,

  // Ephemeral — in-memory only
  isHydrated: false,
  isLoading: false,
  error: null,
  invitationDetails: null,
  invitationSubStep: 'code-entry',
};

export const useOnboardingStore = create<OnboardingStore>()((set) => ({
  ...initialState,

  setStep: (step: OnboardingStep): void => {
    set({ step });
  },

  setPath: (path: 'create' | 'invitation' | null): void => {
    set({ path });
  },

  setConsents: (consents: OnboardingConsents): void => {
    set({ consents });
  },

  setPreferences: (preferences: OnboardingPreferences): void => {
    set({ preferences });
  },

  setBusinessProfile: (businessProfile: OnboardingBusinessProfile): void => {
    set({ businessProfile });
  },

  setInvitationCode: (invitationCode: string): void => {
    set({ invitationCode });
  },

  setContext: (context: OnboardingContext): void => {
    set({ context });
  },

  setCompletedAt: (completedAt: string): void => {
    set({ completedAt });
  },

  setHydrated: (isHydrated: boolean): void => {
    set({ isHydrated });
  },

  setLoading: (isLoading: boolean): void => {
    set({ isLoading });
  },

  setError: (error: string | null): void => {
    set({ error });
  },

  setInvitationDetails: (invitationDetails: InvitationDetails | null): void => {
    set({ invitationDetails });
  },

  setInvitationSubStep: (invitationSubStep: InvitationSubStep): void => {
    set({ invitationSubStep });
  },

  hydrateFromBackend: (data: OnboardingStatusResponse['data']): void => {
    // No session exists — first-time user
    if (data.status === null || data.currentStep === null) {
      set({ isHydrated: true });
      return;
    }

    const stepData = data.stepData ?? {};

    // Map path: backend uses CREATE/JOIN, frontend uses create/invitation
    let path: 'create' | 'invitation' | null = null;
    if (data.path === 'CREATE') path = 'create';
    if (data.path === 'JOIN') path = 'invitation';

    // Map consents section
    const consentsData = stepData['consents'] as Record<string, unknown> | undefined;
    const consents: OnboardingConsents | null = consentsData
      ? {
          terms: (consentsData.terms as boolean) ?? false,
          marketing: (consentsData.marketing as boolean) ?? false,
          analytics: (consentsData.analytics as boolean) ?? false,
        }
      : null;

    // Map preferences section
    const preferencesData = stepData['preferences'] as Record<string, unknown> | undefined;
    const preferences: OnboardingPreferences | null = preferencesData
      ? {
          language: (preferencesData.language as 'es' | 'en') ?? 'es',
          currency: (preferencesData.currency as 'MXN' | 'USD' | 'EUR') ?? 'MXN',
          theme: (preferencesData.theme as 'light' | 'dark') ?? 'light',
        }
      : null;

    // Map businessProfile section
    const businessProfileData = stepData['businessProfile'] as Record<string, unknown> | undefined;
    const businessProfile: OnboardingBusinessProfile | null = businessProfileData
      ? {
          businessName: (businessProfileData.name as string) ?? '',
          businessType: (businessProfileData.businessType as string) ?? '',
          otherBusinessType: businessProfileData.otherBusinessType as string | undefined,
          country: (businessProfileData.country as string) ?? 'MX',
          cityRegion: businessProfileData.cityRegion as string | undefined,
        }
      : null;

    // Map context section
    const contextData = stepData['context'] as Record<string, unknown> | undefined;
    const context: OnboardingContext | null = contextData
      ? {
          teamSize: contextData.teamSize as string | undefined,
          monthlyRevenue: contextData.monthlyRevenue as string | undefined,
        }
      : null;

    // Invitation code from path section
    const pathData = stepData['path'] as Record<string, unknown> | undefined;
    const invitationCode = (pathData?.invitationCode as string) ?? null;

    set({
      step: data.currentStep as OnboardingStep,
      path,
      consents,
      preferences,
      businessProfile,
      invitationCode,
      context,
      completedAt: data.status === 'COMPLETED' ? new Date().toISOString() : null,
      isHydrated: true,
    });
  },

  reset: (): void => {
    set(initialState);
  },
}));
