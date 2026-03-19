import { renderHook, act } from '@testing-library/react';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store';
import { onboardingService } from '@/features/onboarding/api/onboarding.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/features/onboarding/api/onboarding.service', () => ({
  onboardingService: {
    updatePreferences: vi.fn(),
    updateBusinessProfile: vi.fn(),
    completeOnboarding: vi.fn(),
    validateInvitation: vi.fn(),
    acceptInvitation: vi.fn(),
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
  });

  // =========================================================================
  // selectPath
  // =========================================================================

  describe('selectPath', () => {
    describe('Given the user is on the path selection screen', () => {
      describe('When the user selects the create business path', () => {
        it('Then the path is set and the step advances to 1', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.selectPath('create');
          });
          expect(result.current.path).toBe('create');
          expect(result.current.currentStep).toBe(1);
        });
      });

      describe('When the user selects the invitation path', () => {
        it('Then the invitation path is set and the step advances to 1', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());
          act(() => {
            result.current.selectPath('invitation');
          });
          expect(result.current.path).toBe('invitation');
          expect(result.current.currentStep).toBe(1);
        });
      });
    });
  });

  // =========================================================================
  // submitConsents
  // =========================================================================

  describe('submitConsents', () => {
    describe('Given the user has accepted the terms on step 1', () => {
      describe('When submitConsents is called', () => {
        it('Then the consents are saved and the step advances', async () => {
          useOnboardingStore.setState({ step: 1 });
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitConsents({ terms: true, marketing: false });
          });

          expect(result.current.consents).toEqual({ terms: true, marketing: false });
          expect(result.current.currentStep).toBe(2);
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
        useOnboardingStore.setState({ step: 5 });
      });

      describe('When the user submits context data', () => {
        it('Then the context is saved and the step advances to 6', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitContext({ teamSize: '2-5', monthlyRevenue: '<50k' });
          });

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
  });

  // =========================================================================
  // submitPreferences
  // =========================================================================

  describe('submitPreferences', () => {
    describe('Given the API call succeeds', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.updatePreferences).mockResolvedValue({
          data: { language: 'es', currency: 'MXN', theme: 'light' },
          success: true,
        });
        useOnboardingStore.setState({ step: 2 });
      });

      describe('When the user submits valid preferences', () => {
        it('Then preferences are saved and the step advances', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitPreferences({ language: 'es', currency: 'MXN', theme: 'light' });
          });

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
        vi.mocked(onboardingService.updatePreferences).mockRejectedValue(new Error('Network error'));
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
        vi.mocked(onboardingService.updateBusinessProfile).mockResolvedValue({
          data: { businessName: 'Mi Tienda', businessType: 'RETAIL', state: 'Jalisco' },
          success: true,
        });
        useOnboardingStore.setState({ step: 3 });
      });

      describe('When the user submits their business profile', () => {
        it('Then the business profile is saved and the step advances', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.submitBusinessProfile({
              businessName: 'Mi Tienda',
              businessType: 'RETAIL',
              state: 'Jalisco',
            });
          });

          expect(result.current.businessProfile).toEqual({
            businessName: 'Mi Tienda',
            businessType: 'RETAIL',
            state: 'Jalisco',
          });
          expect(result.current.currentStep).toBe(4);
        });
      });
    });

    describe('Given the API call fails', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.updateBusinessProfile).mockRejectedValue(new Error('Server error'));
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
              state: 'Jalisco',
            });
          });

          expect(result.current.error).toBe('errors.profileUpdateFailed');
        });
      });
    });
  });

  // =========================================================================
  // completeOnboarding
  // =========================================================================

  describe('completeOnboarding', () => {
    describe('Given the API call succeeds', () => {
      const completedAt = '2026-03-15T10:00:00.000Z';

      beforeEach(() => {
        vi.mocked(onboardingService.completeOnboarding).mockResolvedValue({
          data: { completedAt },
          success: true,
        });
      });

      describe('When the user finishes the onboarding flow', () => {
        it('Then completedAt is persisted', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.completeOnboarding();
          });

          expect(result.current.completedAt).toBe(completedAt);
        });

        it('Then the user is navigated to the dashboard', async () => {
          const useOnboarding = await getHook();
          const { result } = renderHook(() => useOnboarding());

          await act(async () => {
            await result.current.completeOnboarding();
          });

          expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
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
        code: 'ABC12345',
        businessName: 'Tech Corp',
        inviterName: 'Ana García',
        role: 'EMPLOYEE',
        expiresAt: '2026-12-31T00:00:00.000Z',
      };

      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockResolvedValue({
          data: invitationDetails,
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

    describe('Given the API returns an EXPIRED_CODE error', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockRejectedValue({ error: 'EXPIRED_CODE' });
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

    describe('Given the API returns an ALREADY_USED error', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockRejectedValue({ error: 'ALREADY_USED' });
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

    describe('Given the API returns an INVALID_CODE error', () => {
      beforeEach(() => {
        vi.mocked(onboardingService.validateInvitation).mockRejectedValue({ error: 'INVALID_CODE' });
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
          data: { tenantId: 'tenant-uuid', role: 'EMPLOYEE' },
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
          businessProfile: { businessName: 'Test', businessType: 'RETAIL', state: 'Jalisco' },
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
});
