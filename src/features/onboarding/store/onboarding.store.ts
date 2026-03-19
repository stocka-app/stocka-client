import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  OnboardingStore,
  OnboardingState,
  OnboardingStep,
  OnboardingConsents,
  OnboardingPreferences,
  OnboardingBusinessProfile,
  OnboardingContext,
  InvitationSubStep,
} from '../types/onboarding.types';
import type { InvitationDetails } from '../schemas/onboarding.schema';

const initialState: OnboardingState = {
  // Persisted
  step: 0,
  path: null,
  consents: null,
  preferences: null,
  businessProfile: null,
  invitationCode: null,
  context: null,
  completedAt: null,

  // Ephemeral — not persisted
  isLoading: false,
  error: null,
  invitationDetails: null,
  invitationSubStep: 'code-entry',
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step: OnboardingStep): void => {
        set({ step });
      },

      setPath: (path: 'create' | 'invitation'): void => {
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

      reset: (): void => {
        set(initialState);
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        step: state.step,
        path: state.path,
        consents: state.consents,
        preferences: state.preferences,
        businessProfile: state.businessProfile,
        invitationCode: state.invitationCode,
        context: state.context,
        completedAt: state.completedAt,
        // NOT persisted: isLoading, error, invitationDetails (ephemeral)
      }),
    },
  ),
);
