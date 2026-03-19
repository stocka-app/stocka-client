import { useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../store/onboarding.store';
import { onboardingService } from '../api/onboarding.service';
import type {
  OnboardingStep,
  OnboardingConsents,
  OnboardingPreferences,
  OnboardingBusinessProfile,
  OnboardingContext,
  InvitationSubStep,
} from '../types/onboarding.types';
import type { InvitationDetails } from '../schemas/onboarding.schema';

/**
 * useOnboarding
 *
 * Central hook for the onboarding feature.
 * Orchestrates the Zustand store and the onboarding service.
 * Components never call the service directly — they go through this hook.
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
  isLoading: boolean;
  error: string | null;
  invitationDetails: InvitationDetails | null;
  invitationSubStep: InvitationSubStep;

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
    setLoading,
    setError,
    setInvitationDetails,
    setInvitationSubStep,
    reset,
  } = useOnboardingStore();

  const goToNextStep = (): void => {
    if (step < 7) {
      setStep((step + 1) as OnboardingStep);
    }
  };

  const goToPreviousStep = (): void => {
    // No backtracking once onboarding is completed
    if (completedAt !== null) return;
    if (step > 0) {
      setStep((step - 1) as OnboardingStep);
    }
  };

  const goToStep = (targetStep: OnboardingStep): void => {
    setStep(targetStep);
  };

  const selectPath = (selectedPath: 'create' | 'invitation'): void => {
    setPath(selectedPath);
    setStep(1);
  };

  const submitConsents = async (data: OnboardingConsents): Promise<void> => {
    setConsents(data);
    goToNextStep();
  };

  const submitPreferences = async (data: OnboardingPreferences): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await onboardingService.updatePreferences(data);
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
    try {
      await onboardingService.updateBusinessProfile(data);
      setBusinessProfile(data);
      goToNextStep();
    } catch {
      setError('errors.profileUpdateFailed');
    } finally {
      setLoading(false);
    }
  };

  const submitContext = async (data: OnboardingContext): Promise<void> => {
    setContext(data);
    goToNextStep();
  };

  const completeOnboarding = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await onboardingService.completeOnboarding();
      setCompletedAt(response.data.completedAt);
      navigate('/dashboard');
    } catch {
      setError('errors.onboardingCompleteFailed');
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
    } catch (err: unknown) {
      const apiError = err as { error?: string };
      const errorCode = apiError?.error;

      if (errorCode === 'EXPIRED_CODE') {
        setError('invitation.codeEntry.errors.EXPIRED_CODE');
      } else if (errorCode === 'ALREADY_USED') {
        setError('invitation.codeEntry.errors.ALREADY_USED');
      } else if (errorCode === 'INVALID_CODE') {
        setError('invitation.codeEntry.errors.INVALID_CODE');
      } else {
        setError('invitation.codeEntry.errors.UNKNOWN');
      }
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (): Promise<void> => {
    if (!invitationCode) return;
    setLoading(true);
    setError(null);
    try {
      await onboardingService.acceptInvitation(invitationCode);
      setCompletedAt(new Date().toISOString());
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

  return {
    currentStep: step,
    path,
    consents,
    preferences,
    businessProfile,
    invitationCode,
    context,
    completedAt,
    isLoading,
    error,
    invitationDetails,
    invitationSubStep,
    goToNextStep,
    goToPreviousStep,
    goToStep,
    selectPath,
    submitConsents,
    submitPreferences,
    submitBusinessProfile,
    submitContext,
    completeOnboarding,
    validateInvitationCode,
    acceptInvitation,
    setInvitationSubStep,
    clearError,
    reset,
  };
}
