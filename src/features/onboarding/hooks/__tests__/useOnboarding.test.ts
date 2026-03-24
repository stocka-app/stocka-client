import { renderHook, act } from '@testing-library/react';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store';
import { useAuthenticationStore } from '@/features/authentication/store/authentication.store';
import { onboardingService } from '@/features/onboarding/api/onboarding.service';
import { authenticationService } from '@/features/authentication/api/authentication.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/features/onboarding/api/onboarding.service', () => ({
  onboardingService: {
    startOnboarding: vi.fn(),
    getOnboardingStatus: vi.fn(),
    saveProgress: vi.fn(),
    recordConsents: vi.fn(),
    completeOnboarding: vi.fn(),
    validateInvitation: vi.fn(),
    acceptInvitation: vi.fn(),
  },
}));

vi.mock('@/features/authentication/api/authentication.service', () => ({
  authenticationService: {
    refreshSession: vi.fn().mockResolvedValue({
      data: { accessToken: 'rotated-token' },
      success: true,
    }),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore(): void {
  useOnboardingStore.setState({
    step: 0,
    path: null,
    consents: null,
    preferences: null,
    businessProfile: null,
    invitationCode: null,
    context: null,
    completedAt: null,
    isHydrated: false,
    isLoading: false,
    error: null,
    invitationDetails: null,
    invitationSubStep: 'code-entry',
  });
}

// ---------------------------------------------------------------------------
// Import hook after mocks are set up
// ---------------------------------------------------------------------------

async function getHook() {
  const { useOnboarding } = await import('@/features/onboarding/hooks/useOnboarding');
  return useOnboarding;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  // =========================================================================
  // initializeOnboarding
  // =========================================================================

  describe('initializeOnboarding', () => {
    describe('Given the user has an in-progress session on step 2', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.startOnboarding).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 2, path: 'CREATE' },
          success: true,
        });
        vi.mocked(onboardingService.getOnboardingStatus).mockResolvedValue({
          data: {
            status: 'IN_PROGRESS',
            currentStep: 2,
            path: 'CREATE',
            stepData: {
              'consents': { terms: true, marketing: false, analytics: true },
              'preferences': { language: 'es', currency: 'MXN', theme: 'dark' },
            },
          },
          success: true,
        });
      });

      describe('When initializeOnboarding is called', () => {
        it('Then the store is hydrated from the backend', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.initializeOnboarding();
          });

          expect(result.current.isHydrated).toBe(true);
          expect(result.current.currentStep).toBe(2);
          expect(result.current.path).toBe('create');
          expect(result.current.consents).toEqual({ terms: true, marketing: false, analytics: true });
          expect(result.current.preferences).toEqual({ language: 'es', currency: 'MXN', theme: 'dark' });
        });
      });
    });

    describe('Given the backend is unreachable during initialization', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.startOnboarding).mockRejectedValue(new Error('Network failure'));
      });

      describe('When initializeOnboarding is called and startOnboarding fails', () => {
        it('Then isHydrated is still set to true to unblock the UI', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.initializeOnboarding();
          });

          expect(result.current.isHydrated).toBe(true);
          expect(result.current.currentStep).toBe(0);
        });
      });
    });

    describe('Given initializeOnboarding has already been called once', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.startOnboarding).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 0, path: null },
          success: true,
        });
        vi.mocked(onboardingService.getOnboardingStatus).mockResolvedValue({
          data: { status: null, currentStep: null, path: null, stepData: null },
          success: true,
        });
      });

      describe('When initializeOnboarding is called a second time', () => {
        it('Then the second call is a no-op (double initialization prevention)', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.initializeOnboarding();
          });

          // Clear mocks to verify the second call does not invoke services
          vi.mocked(onboardingService.startOnboarding).mockClear();
          vi.mocked(onboardingService.getOnboardingStatus).mockClear();

          await act(async () => {
            await result.current.initializeOnboarding();
          });

          expect(onboardingService.startOnboarding).not.toHaveBeenCalled();
          expect(onboardingService.getOnboardingStatus).not.toHaveBeenCalled();
        });
      });
    });

    describe('Given the user has no existing session', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.startOnboarding).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 0, path: null },
          success: true,
        });
        vi.mocked(onboardingService.getOnboardingStatus).mockResolvedValue({
          data: { status: null, currentStep: null, path: null, stepData: null },
          success: true,
        });
      });

      describe('When initializeOnboarding is called', () => {
        it('Then isHydrated is true and step stays at 0', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.initializeOnboarding();
          });

          expect(result.current.isHydrated).toBe(true);
          expect(result.current.currentStep).toBe(0);
        });
      });
    });
  });

  // =========================================================================
  // Navigation
  // =========================================================================

  describe('goToNextStep', () => {
    describe('Given the user is on step 0', () => {
      describe('When goToNextStep is called', () => {
        it('Then the current step advances to 1', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.goToNextStep();
          });
          expect(result.current.currentStep).toBe(1);
        });
      });
    });

    describe('Given the user is on step 6', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ step: 6 });
      });

      describe('When goToNextStep is called', () => {
        it('Then the step advances to 7', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.goToNextStep();
          });
          expect(result.current.currentStep).toBe(7);
        });
      });
    });

    describe('Given the user is already on step 7', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ step: 7 });
      });

      describe('When goToNextStep is called', () => {
        it('Then the step does not advance beyond 7', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.goToNextStep();
          });
          expect(result.current.currentStep).toBe(7);
        });
      });
    });
  });

  describe('goToStep', () => {
    describe('Given the user needs to jump directly to a specific step', () => {
      describe('When goToStep is called with step 4', () => {
        it('Then the current step is set to 4', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.goToStep(4);
          });
          expect(result.current.currentStep).toBe(4);
        });
      });
    });
  });

  describe('goToPreviousStep', () => {
    describe('Given the user is on step 3', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ step: 3 });
      });

      describe('When goToPreviousStep is called', () => {
        it('Then the step goes back to 2', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.goToPreviousStep();
          });
          expect(result.current.currentStep).toBe(2);
        });
      });
    });

    describe('Given the user is on step 2 with a path selected', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ step: 2, path: 'create' });
      });

      describe('When goToPreviousStep is called from step 2', () => {
        it('Then the path is cleared and the step goes back to 1', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.goToPreviousStep();
          });
          expect(result.current.currentStep).toBe(1);
          expect(result.current.path).toBeNull();
        });
      });
    });

    describe('Given the user has already completed onboarding', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ step: 7, completedAt: '2026-01-01T00:00:00.000Z' });
      });

      describe('When goToPreviousStep is called', () => {
        it('Then the step does not change (no backtracking after completion)', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.goToPreviousStep();
          });
          expect(result.current.currentStep).toBe(7);
        });
      });
    });

    describe('Given the user is on step 0', () => {
      describe('When goToPreviousStep is called', () => {
        it('Then the step stays at 0', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.goToPreviousStep();
          });
          expect(result.current.currentStep).toBe(0);
        });
      });
    });

    describe('Given the user is on step 1 and consents are already accepted', () => {
      beforeEach(() => {
        useOnboardingStore.setState({
          step: 1,
          consents: { terms: true, marketing: true, analytics: true },
        });
      });

      describe('When goToPreviousStep is called', () => {
        it('Then the step stays at 1 — consents cannot be re-visited once accepted', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.goToPreviousStep();
          });
          expect(result.current.currentStep).toBe(1);
        });
      });
    });

    describe('Given the user is on step 1 and consents are null', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ step: 1, consents: null });
      });

      describe('When goToPreviousStep is called', () => {
        it('Then the step goes back to 0 — consents have not been given yet', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.goToPreviousStep();
          });
          expect(result.current.currentStep).toBe(0);
        });
      });
    });
  });

  // =========================================================================
  // selectPath
  // =========================================================================

  describe('selectPath', () => {
    describe('Given the user is on the path selection screen', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 0, path: 'CREATE' },
          success: true,
        });
      });

      describe('When the user selects the create business path', () => {
        it('Then the path is set and the step advances to 2', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.selectPath('create');
          });
          expect(result.current.path).toBe('create');
          expect(result.current.currentStep).toBe(2);
        });
      });

      describe('When the user selects the invitation path', () => {
        it('Then the invitation path is set and the step advances to 2', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.selectPath('invitation');
          });
          expect(result.current.path).toBe('invitation');
          expect(result.current.currentStep).toBe(2);
        });
      });
    });

    describe('Given the backend rejects the path save (non-blocking)', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockRejectedValue(new Error('Network error'));
      });

      describe('When selectPath is called and the persist call fails', () => {
        it('Then the path is still set locally (fire-and-forget)', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          act(() => {
            result.current.selectPath('create');
          });

          // Let the rejected promise settle
          await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
          });

          expect(result.current.path).toBe('create');
          expect(result.current.currentStep).toBe(2);
        });
      });
    });
  });

  // =========================================================================
  // submitConsents
  // =========================================================================

  describe('submitConsents', () => {
    describe('Given the user has accepted the terms on step 0', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 0, path: 'CREATE' },
          success: true,
        });
        vi.mocked(onboardingService.recordConsents).mockResolvedValue({
          data: { recorded: true },
          success: true,
        });
        useOnboardingStore.setState({ step: 0 });
      });

      describe('When submitConsents is called', () => {
        it('Then both saveStep and recordConsents are called', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitConsents({ terms: true, marketing: false, analytics: true });
          });

          expect(onboardingService.saveProgress).toHaveBeenCalledWith('consents', {
            terms: true,
            marketing: false,
            analytics: true,
          }, 0);
          expect(onboardingService.recordConsents).toHaveBeenCalledWith({
            terms: true,
            marketing: false,
            analytics: true,
          });
          expect(result.current.consents).toEqual({ terms: true, marketing: false, analytics: true });
          expect(result.current.currentStep).toBe(1);
        });
      });
    });
  });

  describe('submitConsents — recordConsents non-blocking failure', () => {
    describe('Given saveProgress succeeds but recordConsents rejects', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 0, path: 'CREATE' },
          success: true,
        });
        vi.mocked(onboardingService.recordConsents).mockRejectedValue(new Error('Consent service down'));
        useOnboardingStore.setState({ step: 0 });
      });

      describe('When submitConsents is called', () => {
        it('Then the step still advances because recordConsents failure is non-blocking', async () => {
          const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitConsents({ terms: true, marketing: false, analytics: true });
          });

          // Wait for the non-blocking promise to settle
          await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
          });

          expect(result.current.consents).toEqual({ terms: true, marketing: false, analytics: true });
          expect(result.current.currentStep).toBe(1);
          expect(result.current.error).toBeNull();
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining('[Stocka] recordConsents failed'),
            expect.any(Error),
          );
          warnSpy.mockRestore();
        });
      });
    });
  });

  describe('submitConsents — failure path', () => {
    describe('Given saveProgress rejects when saving consents', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockRejectedValue(new Error('Network error'));
        useOnboardingStore.setState({ step: 0 });
      });

      describe('When submitConsents is called and the server is unreachable', () => {
        it('Then the consents error is set and the step does not advance', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitConsents({ terms: true, marketing: false, analytics: true });
          });

          expect(result.current.error).toBe('errors.consentsRecordFailed');
          expect(result.current.currentStep).toBe(0);
          expect(result.current.isLoading).toBe(false);
        });
      });
    });
  });

  // =========================================================================
  // submitPreferences
  // =========================================================================

  describe('submitPreferences', () => {
    describe('Given the API call succeeds', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 2, path: 'CREATE' },
          success: true,
        });
        useOnboardingStore.setState({ step: 2 });
      });

      describe('When the user submits valid preferences', () => {
        it('Then saveStep is called and the step advances', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitPreferences({ language: 'es', currency: 'MXN', theme: 'light' });
          });

          expect(onboardingService.saveProgress).toHaveBeenCalledWith('preferences', {
            language: 'es',
            currency: 'MXN',
            theme: 'light',
          }, 2);
          expect(result.current.preferences).toEqual({ language: 'es', currency: 'MXN', theme: 'light' });
          expect(result.current.currentStep).toBe(3);
        });

        it('Then isLoading returns to false after the call', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitPreferences({ language: 'es', currency: 'MXN', theme: 'light' });
          });

          expect(result.current.isLoading).toBe(false);
        });
      });
    });

    describe('Given the API call fails', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockRejectedValue(new Error('Network error'));
        useOnboardingStore.setState({ step: 2 });
      });

      describe('When the user submits preferences and the server is unavailable', () => {
        it('Then an error message is set', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitPreferences({ language: 'es', currency: 'MXN', theme: 'light' });
          });

          expect(result.current.error).toBe('errors.preferencesUpdateFailed');
        });

        it('Then the step does not advance', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitPreferences({ language: 'es', currency: 'MXN', theme: 'light' });
          });

          expect(result.current.currentStep).toBe(2);
        });
      });
    });
  });

  // =========================================================================
  // submitBusinessProfile
  // =========================================================================

  describe('submitBusinessProfile', () => {
    describe('Given the API call succeeds', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 3, path: 'CREATE' },
          success: true,
        });
        useOnboardingStore.setState({ step: 3 });
      });

      describe('When the user submits their business profile', () => {
        it('Then saveStep is called with mapped field names', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitBusinessProfile({
              businessName: 'Mi Tienda',
              businessType: 'RETAIL',
              country: 'MX',
            });
          });

          expect(onboardingService.saveProgress).toHaveBeenCalledWith('businessProfile', {
            name: 'Mi Tienda',
            businessType: 'retail',
            otherBusinessType: undefined,
            country: 'MX',
            cityRegion: undefined,
            timezone: expect.any(String),
          }, 3);
          expect(result.current.businessProfile).toEqual({
            businessName: 'Mi Tienda',
            businessType: 'RETAIL',
            country: 'MX',
          });
          expect(result.current.currentStep).toBe(4);
        });
      });
    });

    describe('Given the user submits a business type not in the mapping', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 3, path: 'CREATE' },
          success: true,
        });
        useOnboardingStore.setState({ step: 3 });
      });

      describe('When submitBusinessProfile is called with an unmapped type', () => {
        it('Then the fallback businessType "other" is sent to the API', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitBusinessProfile({
              businessName: 'Custom Biz',
              businessType: 'UNKNOWN_TYPE',
              country: 'MX',
            });
          });

          expect(onboardingService.saveProgress).toHaveBeenCalledWith('businessProfile', {
            name: 'Custom Biz',
            businessType: 'other',
            otherBusinessType: undefined,
            country: 'MX',
            cityRegion: undefined,
            timezone: expect.any(String),
          }, 3);
          expect(result.current.currentStep).toBe(4);
        });
      });
    });

    describe('Given the API call fails', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockRejectedValue(new Error('Server error'));
        useOnboardingStore.setState({ step: 3 });
      });

      describe('When the server rejects the business profile', () => {
        it('Then a profile update error is set', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitBusinessProfile({
              businessName: 'Mi Tienda',
              businessType: 'RETAIL',
              country: 'MX',
            });
          });

          expect(result.current.error).toBe('errors.profileUpdateFailed');
        });
      });
    });
  });

  // =========================================================================
  // submitContext
  // =========================================================================

  describe('submitContext', () => {
    describe('Given the user is on the context step', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 5, path: 'CREATE' },
          success: true,
        });
        useOnboardingStore.setState({ step: 5 });
      });

      describe('When the user submits context data', () => {
        it('Then the context is saved and the step advances to 6', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitContext({ teamSize: '2-5', monthlyRevenue: '<50k' });
          });

          expect(onboardingService.saveProgress).toHaveBeenCalledWith('context', {
            teamSize: '2-5',
            monthlyRevenue: '<50k',
          }, 5);
          expect(result.current.context).toEqual({ teamSize: '2-5', monthlyRevenue: '<50k' });
          expect(result.current.currentStep).toBe(6);
        });
      });

      describe('When the user skips context (empty object)', () => {
        it('Then empty context is saved and the step advances', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitContext({});
          });

          expect(result.current.context).toEqual({});
          expect(result.current.currentStep).toBe(6);
        });
      });
    });

    describe('Given the API call fails when saving context', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockRejectedValue(new Error('Server error'));
        useOnboardingStore.setState({ step: 5 });
      });

      describe('When saveProgress rejects for the context section', () => {
        it('Then the context is still saved locally and the step advances (context is optional)', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitContext({ teamSize: '2-5', monthlyRevenue: '<50k' });
          });

          expect(result.current.context).toEqual({ teamSize: '2-5', monthlyRevenue: '<50k' });
          expect(result.current.currentStep).toBe(6);
          expect(result.current.error).toBeNull();
          expect(result.current.isLoading).toBe(false);
        });
      });
    });
  });

  // =========================================================================
  // completeOnboarding
  // =========================================================================

  describe('completeOnboarding', () => {
    describe('Given the API call succeeds', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.completeOnboarding).mockResolvedValue({
          data: { path: 'CREATE', tenantId: 'tenant-uuid', tenantName: 'Mi Tienda', role: 'OWNER' },
          success: true,
        });
      });

      describe('When the user finishes the onboarding flow', () => {
        it('Then completedAt is set', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.completeOnboarding();
          });

          expect(result.current.completedAt).not.toBeNull();
        });

        it('Then the step advances to 7 (success screen)', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.completeOnboarding();
          });

          expect(result.current.currentStep).toBe(7);
        });
      });
    });

    describe('Given the API call fails', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.completeOnboarding).mockRejectedValue(new Error('Timeout'));
      });

      describe('When the server fails to complete the onboarding', () => {
        it('Then an error is shown and navigation does not happen', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.completeOnboarding();
          });

          expect(result.current.error).toBe('errors.onboardingCompleteFailed');
          expect(mockNavigate).not.toHaveBeenCalled();
        });
      });
    });
  });

  // =========================================================================
  // validateInvitationCode
  // =========================================================================

  describe('validateInvitationCode', () => {
    describe('Given the API returns a valid invitation', () => {
      const invitationDetails = {
        id: 'inv-001',
        tenantName: 'Tech Corp',
        email: 'ana@techcorp.com',
        role: 'EMPLOYEE',
        expiresAt: '2026-12-31T00:00:00.000Z',
      };

      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockResolvedValue({
          data: invitationDetails,
          success: true,
        });
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 0, path: 'JOIN' },
          success: true,
        });
      });

      describe('When the user submits a valid code', () => {
        it('Then invitation details are stored and the sub-step moves to confirmation', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.validateInvitationCode('ABC12345');
          });

          expect(result.current.invitationDetails).toEqual(invitationDetails);
          expect(result.current.invitationSubStep).toBe('confirmation');
          expect(result.current.invitationCode).toBe('ABC12345');
        });
      });
    });

    describe('Given the API returns a valid invitation but the path persist fails', () => {
      const invitationDetails = {
        id: 'inv-001',
        tenantName: 'Tech Corp',
        email: 'ana@techcorp.com',
        role: 'EMPLOYEE',
        expiresAt: '2026-12-31T00:00:00.000Z',
      };

      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockResolvedValue({
          data: invitationDetails,
          success: true,
        });
        vi.mocked(onboardingService.saveProgress).mockRejectedValue(new Error('Persist failed'));
      });

      describe('When the path persist is a fire-and-forget failure', () => {
        it('Then the invitation is still validated successfully', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.validateInvitationCode('ABC12345');
          });

          // Let the fire-and-forget catch settle
          await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
          });

          expect(result.current.invitationDetails).toEqual(invitationDetails);
          expect(result.current.invitationSubStep).toBe('confirmation');
        });
      });
    });

    describe('Given the API returns an INVITATION_EXPIRED error', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockRejectedValue({ error: 'INVITATION_EXPIRED' });
      });

      describe('When the user submits an expired code', () => {
        it('Then the expired code error is set', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.validateInvitationCode('OLD12345');
          });

          expect(result.current.error).toBe('invitation.codeEntry.errors.EXPIRED_CODE');
        });
      });
    });

    describe('Given the API returns an INVITATION_ALREADY_USED error', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockRejectedValue({ error: 'INVITATION_ALREADY_USED' });
      });

      describe('When the user submits an already used code', () => {
        it('Then the already used error is set', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.validateInvitationCode('USED1234');
          });

          expect(result.current.error).toBe('invitation.codeEntry.errors.ALREADY_USED');
        });
      });
    });

    describe('Given the API returns an INVITATION_NOT_FOUND error', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockRejectedValue({ error: 'INVITATION_NOT_FOUND' });
      });

      describe('When the user submits an invalid code', () => {
        it('Then the invalid code error is set', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.validateInvitationCode('BADCODE1');
          });

          expect(result.current.error).toBe('invitation.codeEntry.errors.INVALID_CODE');
        });
      });
    });

    describe('Given an unknown API error occurs', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockRejectedValue(new Error('Network failure'));
      });

      describe('When the server fails unexpectedly', () => {
        it('Then a generic unknown error is shown', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.validateInvitationCode('XYZ12345');
          });

          expect(result.current.error).toBe('invitation.codeEntry.errors.UNKNOWN');
        });
      });
    });
  });

  // =========================================================================
  // acceptInvitation
  // =========================================================================

  describe('acceptInvitation', () => {
    describe('Given the user has a valid invitation code stored', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ invitationCode: 'ABC12345' });
        vi.mocked(onboardingService.acceptInvitation).mockResolvedValue({
          data: {
            tenantUUID: 'tenant-uuid',
            tenantName: 'Test Corp',
            role: 'EMPLOYEE',
            joinedAt: '2026-01-01T00:00:00.000Z',
          },
          success: true,
        });
      });

      describe('When the user confirms they want to join the team', () => {
        it('Then completedAt is set and the user is navigated to the dashboard', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.acceptInvitation();
          });

          expect(result.current.completedAt).not.toBeNull();
          expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
      });
    });

    describe('Given there is no invitation code stored', () => {
      describe('When acceptInvitation is called without a prior validation', () => {
        it('Then the call is ignored and no navigation occurs', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.acceptInvitation();
          });

          expect(onboardingService.acceptInvitation).not.toHaveBeenCalled();
          expect(mockNavigate).not.toHaveBeenCalled();
        });
      });
    });

    describe('Given the API call fails when accepting the invitation', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ invitationCode: 'ABC12345' });
        vi.mocked(onboardingService.acceptInvitation).mockRejectedValue(new Error('Server error'));
      });

      describe('When the server rejects the accept request', () => {
        it('Then the invitation accept failed error is set', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.acceptInvitation();
          });

          expect(result.current.error).toBe('errors.invitationAcceptFailed');
          expect(mockNavigate).not.toHaveBeenCalled();
        });
      });
    });
  });

  // =========================================================================
  // acceptInvitation — auth store update
  // =========================================================================

  describe('acceptInvitation — auth store update', () => {
    describe('Given the user is authenticated with no tenant and accepts an invitation', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ invitationCode: 'INV-001' });
        useAuthenticationStore.setState({
          user: {
            id: 'user-1',
            email: 'invited@example.com',
            username: 'invited',
            displayName: null,
            givenName: null,
            familyName: null,
            avatarUrl: null,
            status: 'active',
            createdAt: '2026-01-01T00:00:00.000Z',
            tenantId: null,
            role: null,
          },
          isAuthenticated: true,
        });
        vi.mocked(onboardingService.acceptInvitation).mockResolvedValue({
          data: {
            tenantUUID: 'tenant-uuid-from-invite',
            tenantName: 'Tech Corp',
            role: 'EMPLOYEE',
            joinedAt: '2026-01-01T00:00:00.000Z',
          },
          success: true,
        });
      });

      afterEach(() => {
        useAuthenticationStore.setState({ user: null, isAuthenticated: false });
      });

      describe('When acceptInvitation succeeds', () => {
        it('Then the auth store user is updated with the tenantId and role from the invitation', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.acceptInvitation();
          });

          const updatedUser = useAuthenticationStore.getState().user;
          expect(updatedUser?.tenantId).toBe('tenant-uuid-from-invite');
          expect(updatedUser?.role).toBe('EMPLOYEE');
        });

        it('Then the refresh token is rotated and the new accessToken is stored', async () => {
          vi.mocked(authenticationService.refreshSession).mockResolvedValueOnce({
            data: { accessToken: 'new-rotated-token' },
            success: true,
          });

          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.acceptInvitation();
          });

          expect(authenticationService.refreshSession).toHaveBeenCalled();
          expect(useAuthenticationStore.getState().accessToken).toBe('new-rotated-token');
        });

        it('Then navigation to dashboard still occurs even if token rotation fails', async () => {
          vi.mocked(authenticationService.refreshSession).mockRejectedValueOnce(new Error('Network'));

          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.acceptInvitation();
          });

          expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
          expect(result.current.error).toBeNull();
        });
      });
    });
  });

  // =========================================================================
  // setInvitationSubStep
  // =========================================================================

  describe('setInvitationSubStep', () => {
    describe('Given the user is in the invitation flow at code-entry', () => {
      describe('When setInvitationSubStep is called with confirmation', () => {
        it('Then the invitation sub-step updates to confirmation', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          act(() => {
            result.current.setInvitationSubStep('confirmation');
          });

          expect(result.current.invitationSubStep).toBe('confirmation');
        });
      });
    });
  });

  // =========================================================================
  // clearError
  // =========================================================================

  describe('clearError', () => {
    describe('Given there is an active error message', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ error: 'errors.profileUpdateFailed' });
      });

      describe('When clearError is called', () => {
        it('Then the error is cleared', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          act(() => {
            result.current.clearError();
          });

          expect(result.current.error).toBeNull();
        });
      });
    });
  });

  // =========================================================================
  // reset
  // =========================================================================

  describe('reset', () => {
    describe('Given the user has partially completed onboarding', () => {
      beforeEach(() => {
        useOnboardingStore.setState({
          step: 4,
          path: 'create',
          businessProfile: { businessName: 'Test', businessType: 'RETAIL', country: 'MX' },
        });
      });

      describe('When reset is called', () => {
        it('Then the onboarding state returns to its initial state', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          act(() => {
            result.current.reset();
          });

          expect(result.current.currentStep).toBe(0);
          expect(result.current.path).toBeNull();
          expect(result.current.businessProfile).toBeNull();
        });
      });
    });
  });

  // =========================================================================
  // Step navigation flow (integration-style)
  // =========================================================================

  describe('Step navigation flow', () => {
    describe('Given the user is on step 0 (consents)', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 0, path: 'CREATE' },
          success: true,
        });
        vi.mocked(onboardingService.recordConsents).mockResolvedValue({
          data: { recorded: true },
          success: true,
        });
        useOnboardingStore.setState({ step: 0 });
      });

      describe('When submitConsents succeeds', () => {
        it('Then currentStep should be exactly 1 (explicit setStep, not relative)', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitConsents({ terms: true, marketing: false, analytics: true });
          });

          expect(result.current.currentStep).toBe(1);
        });
      });
    });

    describe('Given the user is on step 1 (path selection)', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 1, path: 'CREATE' },
          success: true,
        });
        useOnboardingStore.setState({ step: 1 });
      });

      describe('When selectPath("create") is called', () => {
        it('Then currentStep should be exactly 2', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          act(() => {
            result.current.selectPath('create');
          });

          expect(result.current.currentStep).toBe(2);
        });
      });
    });

    describe('Given the user is on step 2 (preferences)', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 2, path: 'CREATE' },
          success: true,
        });
        useOnboardingStore.setState({ step: 2 });
      });

      describe('When submitPreferences succeeds', () => {
        it('Then currentStep should be 3', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitPreferences({ language: 'es', currency: 'MXN', theme: 'light' });
          });

          expect(result.current.currentStep).toBe(3);
        });
      });
    });

    describe('Given the user is on step 3 (business profile)', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 3, path: 'CREATE' },
          success: true,
        });
        useOnboardingStore.setState({ step: 3 });
      });

      describe('When submitBusinessProfile succeeds', () => {
        it('Then currentStep should be 4', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitBusinessProfile({
              businessName: 'Mi Tienda',
              businessType: 'RETAIL',
              country: 'MX',
            });
          });

          expect(result.current.currentStep).toBe(4);
        });
      });
    });

    describe('Given the user is on step 5 (context)', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 5, path: 'CREATE' },
          success: true,
        });
        useOnboardingStore.setState({ step: 5 });
      });

      describe('When submitContext succeeds', () => {
        it('Then currentStep should be 6', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitContext({ teamSize: '2-5', monthlyRevenue: '<50k' });
          });

          expect(result.current.currentStep).toBe(6);
        });
      });
    });

    describe('Given the user is on step 5 and wants to go back', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ step: 5 });
      });

      describe('When goToPreviousStep is called', () => {
        it('Then currentStep should be 4', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          act(() => {
            result.current.goToPreviousStep();
          });

          expect(result.current.currentStep).toBe(4);
        });
      });
    });

    describe('Given the user is on step 4 and wants to go back', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ step: 4 });
      });

      describe('When goToPreviousStep is called', () => {
        it('Then currentStep should be 3', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          act(() => {
            result.current.goToPreviousStep();
          });

          expect(result.current.currentStep).toBe(3);
        });
      });
    });

    describe('Given the user is on step 3 and wants to go back', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ step: 3 });
      });

      describe('When goToPreviousStep is called', () => {
        it('Then currentStep should be 2', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          act(() => {
            result.current.goToPreviousStep();
          });

          expect(result.current.currentStep).toBe(2);
        });
      });
    });

    describe('Given the user is on step 2 with a path selected and wants to go back', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ step: 2, path: 'create' });
      });

      describe('When goToPreviousStep is called', () => {
        it('Then currentStep should be 1 and path should be null (so path selection shows)', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          act(() => {
            result.current.goToPreviousStep();
          });

          expect(result.current.currentStep).toBe(1);
          expect(result.current.path).toBeNull();
        });
      });
    });

    describe('Given the store was rehydrated to step 5 (simulating session restore)', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 5, path: 'CREATE' },
          success: true,
        });
        vi.mocked(onboardingService.recordConsents).mockResolvedValue({
          data: { recorded: true },
          success: true,
        });
        useOnboardingStore.setState({ step: 5 });
      });

      describe('When submitConsents is called from a rehydrated session', () => {
        it('Then currentStep should be exactly 1 (not 6) because submitConsents uses setStep(1)', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitConsents({ terms: true, marketing: false, analytics: true });
          });

          expect(result.current.currentStep).toBe(1);
        });
      });
    });

    // -----------------------------------------------------------------------
    // submitConsents clears stale path (regression: stale rehydrated path)
    // -----------------------------------------------------------------------

    describe('submitConsents clears stale path', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 0, path: null },
          success: true,
        });
        vi.mocked(onboardingService.recordConsents).mockResolvedValue({
          data: { recorded: true },
          success: true,
        });
      });

      describe('Given the store was rehydrated with path "invitation" from a previous session', () => {
        beforeEach(() => {
          useOnboardingStore.setState({ step: 0, path: 'invitation' });
        });

        describe('When submitConsents is called', () => {
          it('Then path is cleared to null and currentStep is 1 (user sees path selection, not invitation code entry)', async () => {
            const useOnboarding = await getHook();
            const { result } = renderHook(() => useOnboarding());

            await act(async () => {
              await result.current.submitConsents({ terms: true, marketing: false, analytics: true });
            });

            expect(result.current.path).toBeNull();
            expect(result.current.currentStep).toBe(1);
          });
        });
      });

      describe('Given the store was rehydrated with path "create" from a previous session', () => {
        beforeEach(() => {
          useOnboardingStore.setState({ step: 0, path: 'create' });
        });

        describe('When submitConsents is called', () => {
          it('Then path is cleared to null and currentStep is 1 (user sees path selection, not skipping ahead)', async () => {
            const useOnboarding = await getHook();
            const { result } = renderHook(() => useOnboarding());

            await act(async () => {
              await result.current.submitConsents({ terms: true, marketing: false, analytics: true });
            });

            expect(result.current.path).toBeNull();
            expect(result.current.currentStep).toBe(1);
          });
        });
      });

      describe('Given the store has no previous path (fresh session)', () => {
        beforeEach(() => {
          useOnboardingStore.setState({ step: 0, path: null });
        });

        describe('When submitConsents is called', () => {
          it('Then path remains null and currentStep is 1 (normal flow unaffected)', async () => {
            const useOnboarding = await getHook();
            const { result } = renderHook(() => useOnboarding());

            await act(async () => {
              await result.current.submitConsents({ terms: true, marketing: false, analytics: true });
            });

            expect(result.current.path).toBeNull();
            expect(result.current.currentStep).toBe(1);
          });
        });
      });
    });
  });

  // =========================================================================
  // Error clearing on navigation
  // =========================================================================

  describe('Error clearing on navigation', () => {
    describe('Given the store has an error on step 2', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ error: 'some error', step: 2 });
      });

      describe('When goToNextStep is called', () => {
        it('Then the error should be cleared and step should advance to 3', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          act(() => {
            result.current.goToNextStep();
          });

          expect(result.current.error).toBeNull();
          expect(result.current.currentStep).toBe(3);
        });
      });
    });

    describe('Given the store has an error on step 3', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ error: 'some error', step: 3 });
      });

      describe('When goToPreviousStep is called', () => {
        it('Then the error should be cleared and step should go back to 2', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          act(() => {
            result.current.goToPreviousStep();
          });

          expect(result.current.error).toBeNull();
          expect(result.current.currentStep).toBe(2);
        });
      });
    });

    describe('Given the store has an error on step 4', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ error: 'some error', step: 4 });
      });

      describe('When goToStep is called with step 2', () => {
        it('Then the error should be cleared and step should be 2', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          act(() => {
            result.current.goToStep(2);
          });

          expect(result.current.error).toBeNull();
          expect(result.current.currentStep).toBe(2);
        });
      });
    });

    describe('Given the store has an error from a previous action', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ error: 'some error' });
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 0, path: 'CREATE' },
          success: true,
        });
      });

      describe('When selectPath is called', () => {
        it('Then the error should be cleared', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          act(() => {
            result.current.selectPath('create');
          });

          expect(result.current.error).toBeNull();
        });
      });
    });

    describe('Given the store has an invitation error on step 1', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.startOnboarding).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 0, path: null },
          success: true,
        });
        vi.mocked(onboardingService.getOnboardingStatus).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 0, path: null, stepData: {} },
          success: true,
        });
      });

      describe('When initializeOnboarding is called (simulating re-entering the page)', () => {
        it('Then the invitation error should not persist after initialization completes', async () => {
          useOnboardingStore.setState({
            error: 'invitation.codeEntry.errors.INVALID_CODE',
            step: 1,
          });

          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.initializeOnboarding();
          });

          expect(result.current.error).toBeNull();
        });
      });
    });

    describe('Given the store has an error before submitting consents', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ error: 'some previous error', step: 0 });
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 0, path: 'CREATE' },
          success: true,
        });
        vi.mocked(onboardingService.recordConsents).mockResolvedValue({
          data: { recorded: true },
          success: true,
        });
      });

      describe('When submitConsents succeeds and navigates to step 1', () => {
        it('Then the error should be cleared after success', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitConsents({ terms: true, marketing: false, analytics: true });
          });

          expect(result.current.error).toBeNull();
          expect(result.current.currentStep).toBe(1);
        });
      });
    });
  });
});

// =============================================================================
// Onboarding flow — exhaustive scenarios
// =============================================================================

describe('Onboarding flow — exhaustive scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useOnboardingStore.setState({
      step: 0,
      path: null,
      consents: null,
      preferences: null,
      businessProfile: null,
      invitationCode: null,
      context: null,
      completedAt: null,
      isHydrated: false,
      isLoading: false,
      error: null,
      invitationDetails: null,
      invitationSubStep: 'code-entry',
    });
  });

  async function getHookFn() {
    const { useOnboarding } = await import('@/features/onboarding/hooks/useOnboarding');
    return useOnboarding;
  }

  // ===========================================================================
  // A. Fresh user — happy path (create business) — end-to-end integration
  // ===========================================================================

  describe('A. Happy path — create business (end-to-end)', () => {
    beforeEach(() => {
      vi.mocked(onboardingService.saveProgress).mockResolvedValue({
        data: { status: 'IN_PROGRESS', currentStep: 0, path: 'CREATE' },
        success: true,
      });
      vi.mocked(onboardingService.recordConsents).mockResolvedValue({
        data: { recorded: true },
        success: true,
      });
      vi.mocked(onboardingService.completeOnboarding).mockResolvedValue({
        data: { path: 'CREATE', tenantId: 'tenant-1', tenantName: 'My Business', role: 'OWNER' },
        success: true,
      });
    });

    it('should walk through every step from consents to dashboard', async () => {
      const useOnboarding = await getHookFn();
      const { result } = renderHook(() => useOnboarding());

      // Step 0 -> submitConsents -> step=1, path=null, error=null
      await act(async () => {
        await result.current.submitConsents({ terms: true, marketing: false, analytics: true });
      });
      expect(result.current.currentStep).toBe(1);
      expect(result.current.path).toBeNull();
      expect(result.current.error).toBeNull();

      // Step 1 -> selectPath('create') -> step=2, path='create', error=null
      act(() => {
        result.current.selectPath('create');
      });
      expect(result.current.currentStep).toBe(2);
      expect(result.current.path).toBe('create');
      expect(result.current.error).toBeNull();

      // Step 2 -> submitPreferences -> step=3
      await act(async () => {
        await result.current.submitPreferences({ language: 'es', currency: 'MXN', theme: 'dark' });
      });
      expect(result.current.currentStep).toBe(3);

      // Step 3 -> submitBusinessProfile -> step=4
      await act(async () => {
        await result.current.submitBusinessProfile({
          businessName: 'Tienda Test',
          businessType: 'RETAIL',
          country: 'MX',
        });
      });
      expect(result.current.currentStep).toBe(4);

      // Step 4 -> goToNextStep -> step=5
      act(() => {
        result.current.goToNextStep();
      });
      expect(result.current.currentStep).toBe(5);

      // Step 5 -> submitContext -> step=6
      await act(async () => {
        await result.current.submitContext({ teamSize: '2-5', monthlyRevenue: '<50k' });
      });
      expect(result.current.currentStep).toBe(6);

      // Step 6 -> completeOnboarding -> completedAt set, advances to step 7
      await act(async () => {
        await result.current.completeOnboarding();
      });
      expect(result.current.completedAt).not.toBeNull();
      expect(result.current.currentStep).toBe(7);
    });
  });

  // ===========================================================================
  // B. Fresh user — happy path (invitation) — end-to-end integration
  // ===========================================================================

  describe('B. Happy path — invitation (end-to-end)', () => {
    const invitationDetails = {
      id: 'inv-1',
      tenantName: 'Corp',
      email: 'a@b.com',
      role: 'EMPLOYEE',
      expiresAt: '2026-12-31T00:00:00.000Z',
    };

    beforeEach(() => {
      vi.mocked(onboardingService.saveProgress).mockResolvedValue({
        data: { status: 'IN_PROGRESS', currentStep: 0, path: 'JOIN' },
        success: true,
      });
      vi.mocked(onboardingService.recordConsents).mockResolvedValue({
        data: { recorded: true },
        success: true,
      });
      vi.mocked(onboardingService.validateInvitation).mockResolvedValue({
        data: invitationDetails,
        success: true,
      });
      vi.mocked(onboardingService.acceptInvitation).mockResolvedValue({
        data: { tenantUUID: 't-1', tenantName: 'Corp', role: 'EMPLOYEE', joinedAt: '2026-01-01T00:00:00.000Z' },
        success: true,
      });
    });

    it('should walk through consents, path selection, code validation, and acceptance', async () => {
      const useOnboarding = await getHookFn();
      const { result } = renderHook(() => useOnboarding());

      // Step 0 -> submitConsents -> step=1
      await act(async () => {
        await result.current.submitConsents({ terms: true, marketing: true, analytics: true });
      });
      expect(result.current.currentStep).toBe(1);
      expect(result.current.path).toBeNull();

      // Step 1 -> selectPath('invitation') -> path='invitation', invitationSubStep stays 'code-entry'
      act(() => {
        result.current.selectPath('invitation');
      });
      expect(result.current.path).toBe('invitation');
      expect(result.current.invitationSubStep).toBe('code-entry');

      // Validate invitation code -> subStep='confirmation', invitationDetails set
      await act(async () => {
        await result.current.validateInvitationCode('INV-CODE');
      });
      expect(result.current.invitationSubStep).toBe('confirmation');
      expect(result.current.invitationDetails).toEqual(invitationDetails);
      expect(result.current.invitationCode).toBe('INV-CODE');

      // Accept invitation -> completedAt set, navigates to /dashboard
      await act(async () => {
        await result.current.acceptInvitation();
      });
      expect(result.current.completedAt).not.toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    describe('B6 — Invitation confirmation cancel returns to code-entry', () => {
      it('should set invitationSubStep back to code-entry when cancel is triggered', async () => {
        useOnboardingStore.setState({
          path: 'invitation',
          invitationSubStep: 'confirmation',
          invitationCode: 'INV-CODE',
          invitationDetails,
        });

        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.setInvitationSubStep('code-entry');
        });

        expect(result.current.invitationSubStep).toBe('code-entry');
        expect(result.current.path).toBe('invitation');
      });
    });

    describe('B8 — Invitation code-entry back returns to path selection', () => {
      it('should clear path and go to step 1 when back is triggered from code-entry', async () => {
        useOnboardingStore.setState({
          step: 2,
          path: 'invitation',
          invitationSubStep: 'code-entry',
        });

        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        // Simulate the onBack handler from OnboardingPage:
        // setInvitationSubStep('code-entry'), goToStep(1), setPath(null)
        act(() => {
          result.current.setInvitationSubStep('code-entry');
          result.current.goToStep(1);
        });
        // setPath is called on the store directly in the page component
        act(() => {
          useOnboardingStore.setState({ path: null });
        });

        expect(result.current.currentStep).toBe(1);
        expect(result.current.path).toBeNull();
      });
    });
  });

  // ===========================================================================
  // C. Rehydration scenarios
  // ===========================================================================

  describe('C. Rehydration scenarios', () => {
    describe('C3 — Backend returns path=JOIN with invitation code', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.startOnboarding).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 1, path: 'JOIN' },
          success: true,
        });
        vi.mocked(onboardingService.getOnboardingStatus).mockResolvedValue({
          data: {
            status: 'IN_PROGRESS',
            currentStep: 1,
            path: 'JOIN',
            stepData: {
              consents: { terms: true, marketing: false, analytics: true },
              path: { path: 'JOIN', invitationCode: 'REHYDRATED-CODE' },
            },
          },
          success: true,
        });
      });

      it('should hydrate with path=invitation and the invitation code', async () => {
        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        await act(async () => {
          await result.current.initializeOnboarding();
        });

        expect(result.current.isHydrated).toBe(true);
        expect(result.current.path).toBe('invitation');
        expect(result.current.invitationCode).toBe('REHYDRATED-CODE');
        expect(result.current.currentStep).toBe(1);
      });
    });

    describe('C4 — Backend returns COMPLETED status', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.startOnboarding).mockResolvedValue({
          data: { status: 'COMPLETED', currentStep: 7, path: 'CREATE' },
          success: true,
        });
        vi.mocked(onboardingService.getOnboardingStatus).mockResolvedValue({
          data: {
            status: 'COMPLETED',
            currentStep: 7,
            path: 'CREATE',
            stepData: {
              consents: { terms: true, marketing: true, analytics: true },
              preferences: { language: 'es', currency: 'MXN', theme: 'light' },
              businessProfile: { name: 'Done', businessType: 'RETAIL', country: 'Jalisco' },
            },
          },
          success: true,
        });
      });

      it('should set completedAt when status is COMPLETED', async () => {
        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        await act(async () => {
          await result.current.initializeOnboarding();
        });

        expect(result.current.isHydrated).toBe(true);
        expect(result.current.completedAt).not.toBeNull();
        expect(result.current.currentStep).toBe(7);
      });
    });

    describe('C — Rehydration step=3 with full stepData', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.startOnboarding).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 3, path: 'CREATE' },
          success: true,
        });
        vi.mocked(onboardingService.getOnboardingStatus).mockResolvedValue({
          data: {
            status: 'IN_PROGRESS',
            currentStep: 3,
            path: 'CREATE',
            stepData: {
              consents: { terms: true, marketing: false, analytics: true },
              preferences: { language: 'en', currency: 'USD', theme: 'light' },
              businessProfile: { name: 'Shop', businessType: 'SERVICES', country: 'Nuevo Leon' },
            },
          },
          success: true,
        });
      });

      it('should hydrate all step data including businessProfile with mapped field names', async () => {
        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        await act(async () => {
          await result.current.initializeOnboarding();
        });

        expect(result.current.currentStep).toBe(3);
        expect(result.current.path).toBe('create');
        expect(result.current.consents).toEqual({ terms: true, marketing: false, analytics: true });
        expect(result.current.preferences).toEqual({ language: 'en', currency: 'USD', theme: 'light' });
        expect(result.current.businessProfile).toEqual({
          businessName: 'Shop',
          businessType: 'SERVICES',
          country: 'Nuevo Leon',
          cityRegion: undefined,
          otherBusinessType: undefined,
        });
      });
    });
  });

  // ===========================================================================
  // D. Error persistence edge cases
  // ===========================================================================

  describe('D. Error persistence edge cases', () => {
    describe('D1 — submitPreferences fails then goToPreviousStep clears error', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockRejectedValue(new Error('fail'));
        useOnboardingStore.setState({ step: 2, path: 'create' });
      });

      it('should clear the preferences error when navigating back', async () => {
        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        await act(async () => {
          await result.current.submitPreferences({ language: 'es', currency: 'MXN', theme: 'light' });
        });
        expect(result.current.error).toBe('errors.preferencesUpdateFailed');
        expect(result.current.currentStep).toBe(2);

        act(() => {
          result.current.goToPreviousStep();
        });
        expect(result.current.error).toBeNull();
        expect(result.current.currentStep).toBe(1);
      });
    });

    describe('D2 — submitBusinessProfile fails then goToPreviousStep clears error', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockRejectedValue(new Error('fail'));
        useOnboardingStore.setState({ step: 3, path: 'create' });
      });

      it('should clear the profile error when navigating back', async () => {
        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        await act(async () => {
          await result.current.submitBusinessProfile({
            businessName: 'X',
            businessType: 'RETAIL',
            country: 'MX',
          });
        });
        expect(result.current.error).toBe('errors.profileUpdateFailed');

        act(() => {
          result.current.goToPreviousStep();
        });
        expect(result.current.error).toBeNull();
        expect(result.current.currentStep).toBe(2);
      });
    });

    describe('D3 — completeOnboarding fails, retry, fails again', () => {
      it('should clear error on retry then set it again on second failure', async () => {
        vi.mocked(onboardingService.completeOnboarding).mockRejectedValue(new Error('Timeout'));
        useOnboardingStore.setState({ step: 6 });

        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        // First attempt
        await act(async () => {
          await result.current.completeOnboarding();
        });
        expect(result.current.error).toBe('errors.onboardingCompleteFailed');
        expect(result.current.completedAt).toBeNull();

        // Second attempt — error should be cleared at the start, then set again
        await act(async () => {
          await result.current.completeOnboarding();
        });
        expect(result.current.error).toBe('errors.onboardingCompleteFailed');
        expect(result.current.completedAt).toBeNull();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    describe('D4 — validateInvitationCode error then back to path selection clears error', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockRejectedValue({ error: 'INVITATION_NOT_FOUND' });
        useOnboardingStore.setState({ step: 2, path: 'invitation', invitationSubStep: 'code-entry' });
      });

      it('should clear the invitation error when selectPath is called again', async () => {
        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 1, path: null },
          success: true,
        });

        await act(async () => {
          await result.current.validateInvitationCode('BAD');
        });
        expect(result.current.error).toBe('invitation.codeEntry.errors.INVALID_CODE');

        // Go back to path selection (simulating the page's onBack)
        act(() => {
          result.current.goToStep(1);
        });
        expect(result.current.error).toBeNull();
      });
    });

    describe('D5 — validateInvitationCode error then selectPath clears error', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockRejectedValue({ error: 'INVITATION_EXPIRED' });
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 2, path: 'CREATE' },
          success: true,
        });
        useOnboardingStore.setState({ step: 2, path: 'invitation' });
      });

      it('should clear the expired error when selectPath is called', async () => {
        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        await act(async () => {
          await result.current.validateInvitationCode('OLD');
        });
        expect(result.current.error).toBe('invitation.codeEntry.errors.EXPIRED_CODE');

        act(() => {
          result.current.selectPath('create');
        });
        expect(result.current.error).toBeNull();
      });
    });
  });

  // ===========================================================================
  // E. State consistency / boundary conditions
  // ===========================================================================

  describe('E. State consistency', () => {
    describe('E — goToNextStep at step 4 advances to step 5 (Spaces -> Context)', () => {
      beforeEach(() => {
        useOnboardingStore.setState({ step: 4 });
      });

      it('should advance from step 4 to step 5', async () => {
        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.goToNextStep();
        });
        expect(result.current.currentStep).toBe(5);
      });
    });

    describe('E — goToNextStep clears error at each step boundary', () => {
      it.each([
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
        [6, 7],
      ] as const)('should clear error and advance from step %i to step %i', async (from, to) => {
        useOnboardingStore.setState({ step: from, error: 'some-error' });

        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.goToNextStep();
        });
        expect(result.current.error).toBeNull();
        expect(result.current.currentStep).toBe(to);
      });
    });

    describe('E — goToPreviousStep clears error at each step boundary', () => {
      it.each([
        [7, 6],
        [6, 5],
        [5, 4],
        [4, 3],
        [3, 2],
        [1, 0],
      ] as const)('should clear error and go back from step %i to step %i', async (from, to) => {
        useOnboardingStore.setState({ step: from, error: 'some-error' });

        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.goToPreviousStep();
        });
        expect(result.current.error).toBeNull();
        expect(result.current.currentStep).toBe(to);
      });
    });

    describe('E — goToPreviousStep from step 2 clears path', () => {
      it('should clear path to null when stepping back from step 2 (regardless of which path)', async () => {
        useOnboardingStore.setState({ step: 2, path: 'invitation' });

        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.goToPreviousStep();
        });
        expect(result.current.path).toBeNull();
        expect(result.current.currentStep).toBe(1);
      });
    });

    describe('E — selectPath maps to correct backend path strings', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 1, path: 'CREATE' },
          success: true,
        });
      });

      it('should send CREATE to backend when selecting create', async () => {
        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.selectPath('create');
        });

        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(onboardingService.saveProgress).toHaveBeenCalledWith('path', { path: 'CREATE' }, 1);
      });

      it('should send JOIN to backend when selecting invitation', async () => {
        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        act(() => {
          result.current.selectPath('invitation');
        });

        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, 0));
        });

        expect(onboardingService.saveProgress).toHaveBeenCalledWith('path', { path: 'JOIN' }, 1);
      });
    });
  });

  // ===========================================================================
  // F. Invitation error code mapping (additional error codes)
  // ===========================================================================

  describe('F. Invitation error code mapping', () => {
    describe('INVITATION_EMAIL_MISMATCH maps to INVALID_CODE', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockRejectedValue({ error: 'INVITATION_EMAIL_MISMATCH' });
      });

      it('should show INVALID_CODE error for email mismatch', async () => {
        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        await act(async () => {
          await result.current.validateInvitationCode('MISMATCH1');
        });

        expect(result.current.error).toBe('invitation.codeEntry.errors.INVALID_CODE');
      });
    });

    describe('NETWORK_ERROR maps to networkError', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockRejectedValue({ error: 'NETWORK_ERROR' });
      });

      it('should show network error for NETWORK_ERROR code', async () => {
        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        await act(async () => {
          await result.current.validateInvitationCode('NET1');
        });

        expect(result.current.error).toBe('errors.networkError');
      });
    });

    describe('REQUEST_TIMEOUT maps to networkError', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockRejectedValue({ error: 'REQUEST_TIMEOUT' });
      });

      it('should show network error for REQUEST_TIMEOUT code', async () => {
        const useOnboarding = await getHookFn();
        const { result } = renderHook(() => useOnboarding());

        await act(async () => {
          await result.current.validateInvitationCode('TIMEOUT1');
        });

        expect(result.current.error).toBe('errors.networkError');
      });
    });
  });

  // ===========================================================================
  // G. submitContext resilience — advances even on failure
  // ===========================================================================

  describe('G. submitContext is non-blocking for progression', () => {
    it('should not set an error when saveProgress fails for context', async () => {
      vi.mocked(onboardingService.saveProgress).mockRejectedValue(new Error('fail'));
      useOnboardingStore.setState({ step: 5 });

      const useOnboarding = await getHookFn();
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await result.current.submitContext({ teamSize: '1' });
      });

      expect(result.current.error).toBeNull();
      expect(result.current.context).toEqual({ teamSize: '1' });
      expect(result.current.currentStep).toBe(6);
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ===========================================================================
  // H. Loading state management
  // ===========================================================================

  describe('H. Loading state management', () => {
    it('should set isLoading=false after submitConsents failure', async () => {
      vi.mocked(onboardingService.saveProgress).mockRejectedValue(new Error('fail'));
      useOnboardingStore.setState({ step: 0 });

      const useOnboarding = await getHookFn();
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await result.current.submitConsents({ terms: true, marketing: false, analytics: false });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading=false after submitBusinessProfile failure', async () => {
      vi.mocked(onboardingService.saveProgress).mockRejectedValue(new Error('fail'));
      useOnboardingStore.setState({ step: 3 });

      const useOnboarding = await getHookFn();
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await result.current.submitBusinessProfile({
          businessName: 'X',
          businessType: 'RETAIL',
          country: 'MX',
        });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading=false after validateInvitationCode failure', async () => {
      vi.mocked(onboardingService.validateInvitation).mockRejectedValue({ error: 'INVITATION_NOT_FOUND' });

      const useOnboarding = await getHookFn();
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await result.current.validateInvitationCode('BAD');
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading=false after acceptInvitation failure', async () => {
      vi.mocked(onboardingService.acceptInvitation).mockRejectedValue(new Error('fail'));
      useOnboardingStore.setState({ invitationCode: 'CODE1' });

      const useOnboarding = await getHookFn();
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await result.current.acceptInvitation();
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading=false after completeOnboarding failure', async () => {
      vi.mocked(onboardingService.completeOnboarding).mockRejectedValue(new Error('fail'));

      const useOnboarding = await getHookFn();
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await result.current.completeOnboarding();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  // ===========================================================================
  // I. localStorage cleanup
  // ===========================================================================

  describe('I. localStorage cleanup on initialization', () => {
    beforeEach(() => {
      vi.mocked(onboardingService.startOnboarding).mockResolvedValue({
        data: { status: 'IN_PROGRESS', currentStep: 0, path: null },
        success: true,
      });
      vi.mocked(onboardingService.getOnboardingStatus).mockResolvedValue({
        data: { status: null, currentStep: null, path: null, stepData: null },
        success: true,
      });
    });

    it('should remove legacy onboarding-storage from localStorage', async () => {
      localStorage.setItem('onboarding-storage', JSON.stringify({ step: 3 }));

      const useOnboarding = await getHookFn();
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await result.current.initializeOnboarding();
      });

      expect(localStorage.getItem('onboarding-storage')).toBeNull();
    });
  });

  // ===========================================================================
  // J. Invitation code persisted to backend on validation success
  // ===========================================================================

  describe('J. Invitation code persistence', () => {
    beforeEach(() => {
      vi.mocked(onboardingService.validateInvitation).mockResolvedValue({
        data: {
          id: 'inv-2',
          tenantName: 'Acme',
          email: 'test@acme.com',
          role: 'EMPLOYEE',
          expiresAt: '2026-12-31T00:00:00.000Z',
        },
        success: true,
      });
      vi.mocked(onboardingService.saveProgress).mockResolvedValue({
        data: { status: 'IN_PROGRESS', currentStep: 1, path: 'JOIN' },
        success: true,
      });
    });

    it('should persist invitation code to backend via saveProgress after successful validation', async () => {
      const useOnboarding = await getHookFn();
      const { result } = renderHook(() => useOnboarding());

      await act(async () => {
        await result.current.validateInvitationCode('PERSIST-CODE');
      });

      // Let the fire-and-forget saveProgress settle
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(onboardingService.saveProgress).toHaveBeenCalledWith('path', {
        path: 'JOIN',
        invitationCode: 'PERSIST-CODE',
      }, 1);
    });
  });

  // =========================================================================
  // submitSpaces
  // =========================================================================

  describe('submitSpaces', () => {
    describe('Given the API call succeeds', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockResolvedValue({
          data: { status: 'IN_PROGRESS', currentStep: 4, path: 'CREATE' },
          success: true,
        });
        useOnboardingStore.setState({ step: 4 });
      });

      describe('When the user submits their spaces configuration', () => {
        it('Then saveProgress is called and the step advances to 5', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitSpaces([{ name: 'Almacen 1', type: 'warehouse' }]);
          });

          expect(onboardingService.saveProgress).toHaveBeenCalledWith(
            'spaces',
            { spaces: [{ name: 'Almacen 1', type: 'warehouse' }] },
            4,
          );
          expect(result.current.currentStep).toBe(5);
          expect(result.current.isLoading).toBe(false);
        });
      });
    });

    describe('Given the API call fails when saving spaces', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.saveProgress).mockRejectedValue(new Error('Server error'));
        useOnboardingStore.setState({ step: 4 });
      });

      describe('When saveProgress rejects for the spaces step', () => {
        it('Then a profile update error is set and the step does not advance', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitSpaces([{ name: 'Almacen 1', type: 'warehouse' }]);
          });

          expect(result.current.error).toBe('errors.profileUpdateFailed');
          expect(result.current.currentStep).toBe(4);
          expect(result.current.isLoading).toBe(false);
        });
      });
    });
  });

  // =========================================================================
  // completeOnboarding — auth store update branch
  // =========================================================================

  describe('completeOnboarding — auth store update', () => {
    describe('Given the user is authenticated and completeOnboarding returns a tenantId', () => {
      beforeEach(() => {
        useAuthenticationStore.setState({
          user: {
            id: 'user-1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            tenantId: null,
            role: 'OWNER',
            emailVerified: true,
          },
        });
        vi.mocked(onboardingService.completeOnboarding).mockResolvedValue({
          data: { path: 'CREATE', tenantId: 'tenant-uuid-123', tenantName: 'Mi Tienda', role: 'OWNER' },
          success: true,
        });
      });

      afterEach(() => {
        useAuthenticationStore.setState({ user: null });
      });

      describe('When completeOnboarding succeeds', () => {
        it('Then the auth store user is updated with the new tenantId and role', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.completeOnboarding();
          });

          const updatedUser = useAuthenticationStore.getState().user;
          expect(updatedUser?.tenantId).toBe('tenant-uuid-123');
          expect(updatedUser?.role).toBe('OWNER');
          expect(result.current.completedAt).not.toBeNull();
          expect(result.current.currentStep).toBe(7);
        });
      });
    });

    describe('Given the user is authenticated but response has no tenantId', () => {
      beforeEach(() => {
        useAuthenticationStore.setState({
          user: {
            id: 'user-1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            tenantId: null,
            role: 'OWNER',
            emailVerified: true,
          },
        });
        vi.mocked(onboardingService.completeOnboarding).mockResolvedValue({
          data: { path: 'CREATE', tenantId: null, tenantName: null, role: null },
          success: true,
        });
      });

      afterEach(() => {
        useAuthenticationStore.setState({ user: null });
      });

      describe('When completeOnboarding succeeds with null tenantId', () => {
        it('Then the auth store user is NOT updated but onboarding still completes', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.completeOnboarding();
          });

          const updatedUser = useAuthenticationStore.getState().user;
          expect(updatedUser?.tenantId).toBeNull();
          expect(result.current.completedAt).not.toBeNull();
          expect(result.current.currentStep).toBe(7);
        });
      });
    });

    describe('Given completeOnboarding returns role null and user had a previous role', () => {
      beforeEach(() => {
        useAuthenticationStore.setState({
          user: {
            id: 'user-1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            tenantId: null,
            role: 'EMPLOYEE',
            emailVerified: true,
          },
        });
        vi.mocked(onboardingService.completeOnboarding).mockResolvedValue({
          data: { path: 'CREATE', tenantId: 'tenant-uuid-456', tenantName: 'Biz', role: null },
          success: true,
        });
      });

      afterEach(() => {
        useAuthenticationStore.setState({ user: null });
      });

      describe('When completeOnboarding succeeds with role null', () => {
        it('Then the auth store user keeps the existing role', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.completeOnboarding();
          });

          const updatedUser = useAuthenticationStore.getState().user;
          expect(updatedUser?.tenantId).toBe('tenant-uuid-456');
          expect(updatedUser?.role).toBe('EMPLOYEE');
        });
      });
    });
  });

  // =========================================================================
  // completeOnboarding — token rotation
  // =========================================================================

  describe('completeOnboarding — token rotation', () => {
    describe('Given the user completes onboarding and the server returns a tenantId', () => {
      beforeEach(() => {
        useAuthenticationStore.setState({
          user: {
            id: 'user-1',
            email: 'owner@example.com',
            username: 'owner',
            displayName: null,
            givenName: null,
            familyName: null,
            avatarUrl: null,
            status: 'active',
            createdAt: '2026-01-01T00:00:00.000Z',
            tenantId: null,
            role: null,
          },
        });
        vi.mocked(onboardingService.completeOnboarding).mockResolvedValue({
          data: { path: 'CREATE', tenantId: 'tenant-uuid-rotate', tenantName: 'Mi Tienda', role: 'OWNER' },
          success: true,
        });
      });

      afterEach(() => {
        useAuthenticationStore.setState({ user: null });
      });

      describe('When completeOnboarding succeeds', () => {
        it('Then refreshSession is called to rotate the refresh token cookie', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.completeOnboarding();
          });

          expect(authenticationService.refreshSession).toHaveBeenCalled();
        });

        it('Then the new accessToken from rotation is stored in the auth store', async () => {
          vi.mocked(authenticationService.refreshSession).mockResolvedValueOnce({
            data: { accessToken: 'rotated-access-token' },
            success: true,
          });

          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.completeOnboarding();
          });

          expect(useAuthenticationStore.getState().accessToken).toBe('rotated-access-token');
        });

        it('Then onboarding still completes if token rotation fails', async () => {
          vi.mocked(authenticationService.refreshSession).mockRejectedValueOnce(new Error('Network'));

          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.completeOnboarding();
          });

          expect(result.current.completedAt).not.toBeNull();
          expect(result.current.currentStep).toBe(7);
          expect(result.current.error).toBeNull();
        });
      });
    });
  });

  // =========================================================================
  // completeOnboarding — ONBOARDING_ALREADY_COMPLETED error handling
  // =========================================================================

  describe('completeOnboarding — ONBOARDING_ALREADY_COMPLETED', () => {
    describe('Given the API returns ONBOARDING_ALREADY_COMPLETED error', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.completeOnboarding).mockRejectedValue({
          error: 'ONBOARDING_ALREADY_COMPLETED',
        });
        useOnboardingStore.setState({ step: 6 });
      });

      describe('When completeOnboarding is called and the server says it was already completed', () => {
        it('Then completedAt is set and step advances to 7 (treat as success)', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.completeOnboarding();
          });

          expect(result.current.completedAt).not.toBeNull();
          expect(result.current.currentStep).toBe(7);
          expect(result.current.error).toBeNull();
          expect(result.current.isLoading).toBe(false);
        });
      });
    });
  });
});
