import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../store/onboarding.store';
import { useAuthenticationStore } from '@/features/authentication/store/authentication.store';
import { authenticationService } from '@/features/authentication/api/authentication.service';
import { onboardingService } from '../api/onboarding.service';
import { setAccessToken } from '@/shared/lib/axios';
import type {
  OnboardingStep,
  OnboardingConsents,
  OnboardingPreferences,
  OnboardingBusinessProfile,
  OnboardingContext,
  InvitationSubStep,
} from '../types/onboarding.types';
import type { SpaceConfig } from '../components/steps/Step4Spaces';
import type { InvitationDetails } from '../schemas/onboarding.schema';

// Module-level flag to prevent duplicate initialization caused by React StrictMode
// double-mount. Same pattern as `hydrationStarted` in providers.tsx.
let onboardingInitStarted = false;

/** @internal Exposed for testing — resets the StrictMode guard flag. */
export function _resetOnboardingInitFlag(): void {
  onboardingInitStarted = false;
}

/**
 * useOnboarding
 *
 * Central hook for the onboarding feature.
 * Orchestrates the Zustand store and the onboarding service.
 * Components never call the service directly — they go through this hook.
 *
 * State is persisted on the backend via PATCH /onboarding/progress.
 * On mount, initializeOnboarding() hydrates the store from GET /onboarding/status.
 */
export function useOnboarding(): {
  // State
  currentStep: OnboardingStep;
  path: 'create' | 'invitation' | null;
  consents: OnboardingConsents | null;
  preferences: OnboardingPreferences | null;
  businessProfile: OnboardingBusinessProfile | null;
  invitationCode: string | null;
  context: OnboardingContext | null;
  completedAt: string | null;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  invitationDetails: InvitationDetails | null;
  invitationSubStep: InvitationSubStep;

  // Initialization
  initializeOnboarding: () => Promise<void>;

  // Navigation
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: OnboardingStep) => void;

  // Path selection
  selectPath: (path: 'create' | 'invitation') => void;

  // Step submissions
  submitConsents: (consents: OnboardingConsents) => Promise<void>;
  submitPreferences: (preferences: OnboardingPreferences) => Promise<void>;
  submitBusinessProfile: (profile: OnboardingBusinessProfile) => Promise<void>;
  submitSpaces: (spaces: SpaceConfig[]) => Promise<void>;
  submitContext: (context: OnboardingContext) => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // Invitation flow
  validateInvitationCode: (code: string) => Promise<void>;
  acceptInvitation: () => Promise<void>;
  setInvitationSubStep: (subStep: InvitationSubStep) => void;

  // Utilities
  clearError: () => void;
  reset: () => void;
} {
  const navigate = useNavigate();
  const {
    step,
    path,
    consents,
    preferences,
    businessProfile,
    invitationCode,
    context,
    completedAt,
    isHydrated,
    isLoading,
    error,
    invitationDetails,
    invitationSubStep,
    setStep,
    setPath,
    setConsents,
    setPreferences,
    setBusinessProfile,
    setInvitationCode,
    setContext,
    setCompletedAt,
    setHydrated,
    setLoading,
    setError,
    setInvitationDetails,
    setInvitationSubStep,
    hydrateFromBackend,
    reset,
  } = useOnboardingStore();

  const initializeOnboarding = useCallback(async (): Promise<void> => {
    // Prevent double initialization caused by StrictMode double-mount
    if (onboardingInitStarted) return;
    onboardingInitStarted = true;

    // Reset store to initial state before hydrating from backend.
    // This prevents stale in-memory state from a previous session
    // (e.g. user was on step 6, logged out, logged back in).
    reset();

    try {
      // Start (or resume) session — now returns stepData, so we hydrate directly
      // without a separate GET /status call.
      const response = await onboardingService.startOnboarding();
      hydrateFromBackend(response.data);
    } catch {
      // If initialization fails, still mark hydrated to unblock UI
      setHydrated(true);
    }

    // Cleanup legacy localStorage
    localStorage.removeItem('onboarding-storage');
  }, [reset, hydrateFromBackend, setHydrated]);

  const goToNextStep = (): void => {
    if (step < 7) {
      setError(null);
      setStep((step + 1) as OnboardingStep);
    }
  };

  const goToPreviousStep = (): void => {
    if (completedAt !== null) return;
    if (step > 0) {
      setError(null);
      // Going back to step 1 (path selection) — clear path so the selector shows again
      if (step === 2) {
        setPath(null);
      }
      const previousStep = (step - 1) as OnboardingStep;
      // Skip step 0 (consents) if already accepted — consent is immutable once given
      if (previousStep === 0 && consents !== null) return;
      setStep(previousStep);
    }
  };

  const goToStep = (targetStep: OnboardingStep): void => {
    setError(null);
    setStep(targetStep);
  };

  const submitConsents = async (data: OnboardingConsents): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      // Persist consents to onboarding session
      await onboardingService.saveProgress('consents', data as unknown as Record<string, unknown>, 0);
      // Also record consents in the user domain (legal requirement)
      // Non-blocking: don't let consent recording failure prevent onboarding progress
      onboardingService.recordConsents(data).catch((err) => {
        console.warn('[Stocka] recordConsents failed (non-blocking):', err);
      });
      setConsents(data);
      setPath(null);
      setStep(1);
    } catch (err) {
      console.error('[Stocka] submitConsents failed:', err);
      setError('errors.consentsRecordFailed');
    } finally {
      setLoading(false);
    }
  };

  const selectPath = (selectedPath: 'create' | 'invitation'): void => {
    setError(null);
    setPath(selectedPath);
    setStep(2);

    // Persist path selection to backend
    const backendPath = selectedPath === 'create' ? 'CREATE' : 'JOIN';
    onboardingService.saveProgress('path', { path: backendPath }, 1).catch(() => {});
  };

  const submitPreferences = async (data: OnboardingPreferences): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await onboardingService.saveProgress('preferences', data as unknown as Record<string, unknown>, 2);
      setPreferences(data);
      goToNextStep();
    } catch {
      setError('errors.preferencesUpdateFailed');
    } finally {
      setLoading(false);
    }
  };

  const submitBusinessProfile = async (data: OnboardingBusinessProfile): Promise<void> => {
    setLoading(true);
    setError(null);

    // Map frontend business types to backend BusinessTypeEnum values
    const businessTypeMap: Record<string, string> = {
      RETAIL: 'retail',
      RESTAURANT: 'food',
      WORKSHOP: 'manufacturing',
      SERVICES: 'services',
      HEALTH: 'healthcare',
      EDUCATION: 'education',
      EVENTS: 'services',
      AGRICULTURE: 'other',
      OTHER: 'other',
    };

    try {
      await onboardingService.saveProgress('businessProfile', {
        name: data.businessName,
        businessType: businessTypeMap[data.businessType] ?? 'other',
        otherBusinessType: data.otherBusinessType,
        country: data.country,
        cityRegion: data.cityRegion,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }, 3);
      setBusinessProfile(data);
      goToNextStep();
    } catch {
      setError('errors.profileUpdateFailed');
    } finally {
      setLoading(false);
    }
  };

  const submitSpaces = async (spaces: SpaceConfig[]): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await onboardingService.saveProgress('spaces', { spaces } as unknown as Record<string, unknown>, 4);
      goToNextStep();
    } catch {
      setError('errors.profileUpdateFailed');
    } finally {
      setLoading(false);
    }
  };

  const submitContext = async (data: OnboardingContext): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await onboardingService.saveProgress('context', data as unknown as Record<string, unknown>, 5);
      setContext(data);
      goToNextStep();
    } catch {
      // Context is optional — advance even on failure
      setContext(data);
      goToNextStep();
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await onboardingService.completeOnboarding();

      // Update auth store with the new tenantId so RequiresTenantRoute
      // won't redirect back to /onboarding when Step 7 navigates to /dashboard
      const currentUser = useAuthenticationStore.getState().user;
      if (currentUser && response.data.tenantId) {
        useAuthenticationStore.setState({
          user: {
            ...currentUser,
            tenantId: response.data.tenantId,
            role: response.data.role ?? currentUser.role,
          },
        });
      }

      // Rotate the refresh token so the next session gets a JWT with tenantId from DB
      try {
        const refreshResponse = await authenticationService.refreshSession();
        setAccessToken(refreshResponse.data.accessToken);
        useAuthenticationStore.setState({ accessToken: refreshResponse.data.accessToken });
      } catch {
        // Non-critical: auth store already has the correct tenantId from the completeOnboarding response
      }

      setCompletedAt(new Date().toISOString());
      setStep(7);
    } catch (err: unknown) {
      const apiError = err as { error?: string };
      if (apiError?.error === 'ONBOARDING_ALREADY_COMPLETED') {
        setCompletedAt(new Date().toISOString());
        setStep(7);
      } else {
        setError('errors.onboardingCompleteFailed');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateInvitationCode = async (code: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await onboardingService.validateInvitation(code);
      setInvitationCode(code);
      setInvitationDetails(response.data);
      setInvitationSubStep('confirmation');

      // Persist invitation code to backend
      onboardingService.saveProgress('path', { path: 'JOIN', invitationCode: code }, 1).catch(() => {});
    } catch (err: unknown) {
      const apiError = err as { error?: string };
      const errorCode = apiError?.error;

      const errorMap: Record<string, string> = {
        INVITATION_NOT_FOUND: 'invitation.codeEntry.errors.INVALID_CODE',
        INVITATION_EXPIRED: 'invitation.codeEntry.errors.EXPIRED_CODE',
        INVITATION_ALREADY_USED: 'invitation.codeEntry.errors.ALREADY_USED',
        INVITATION_EMAIL_MISMATCH: 'invitation.codeEntry.errors.INVALID_CODE',
        NETWORK_ERROR: 'errors.networkError',
        REQUEST_TIMEOUT: 'errors.networkError',
      };

      console.error('[Stocka] validateInvitationCode failed:', { errorCode, err });
      setError(errorMap[errorCode ?? ''] ?? 'invitation.codeEntry.errors.UNKNOWN');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (): Promise<void> => {
    if (!invitationCode) return;
    setLoading(true);
    setError(null);
    try {
      const response = await onboardingService.acceptInvitation(invitationCode);

      // Update auth store with tenant context so RequiresTenantRoute allows /dashboard
      const currentUser = useAuthenticationStore.getState().user;
      if (currentUser) {
        useAuthenticationStore.setState({
          user: { ...currentUser, tenantId: response.data.tenantUUID, role: response.data.role },
        });
      }

      setCompletedAt(new Date().toISOString());

      // Rotate the refresh token so the next session gets a JWT with tenantId from DB
      try {
        const refreshResponse = await authenticationService.refreshSession();
        setAccessToken(refreshResponse.data.accessToken);
        useAuthenticationStore.setState({ accessToken: refreshResponse.data.accessToken });
      } catch {
        // Non-critical: user.tenantId is already set above, navigate will succeed
      }

      navigate('/dashboard');
    } catch {
      setError('errors.invitationAcceptFailed');
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const resetWithFlag = (): void => {
    onboardingInitStarted = false;
    reset();
  };

  return {
    currentStep: step,
    path,
    consents,
    preferences,
    businessProfile,
    invitationCode,
    context,
    completedAt,
    isHydrated,
    isLoading,
    error,
    invitationDetails,
    invitationSubStep,
    initializeOnboarding,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    selectPath,
    submitConsents,
    submitPreferences,
    submitBusinessProfile,
    submitSpaces,
    submitContext,
    completeOnboarding,
    validateInvitationCode,
    acceptInvitation,
    setInvitationSubStep,
    clearError,
    reset: resetWithFlag,
  };
}
