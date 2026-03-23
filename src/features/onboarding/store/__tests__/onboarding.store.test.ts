import { act } from '@testing-library/react';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store';

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
// Tests
// ---------------------------------------------------------------------------

describe('useOnboardingStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  // =========================================================================
  // Initial state
  // =========================================================================

  describe('Given the store is freshly initialized', () => {
    it('Then it starts at step 0 with no path selected', () => {
      const { step, path } = useOnboardingStore.getState();
      expect(step).toBe(0);
      expect(path).toBeNull();
    });

    it('Then all user data fields are null', () => {
      const { consents, preferences, businessProfile, invitationCode, context, completedAt } =
        useOnboardingStore.getState();
      expect(consents).toBeNull();
      expect(preferences).toBeNull();
      expect(businessProfile).toBeNull();
      expect(invitationCode).toBeNull();
      expect(context).toBeNull();
      expect(completedAt).toBeNull();
    });

    it('Then ephemeral state is at default values', () => {
      const { isLoading, error, invitationDetails, invitationSubStep } =
        useOnboardingStore.getState();
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
      expect(invitationDetails).toBeNull();
      expect(invitationSubStep).toBe('code-entry');
    });
  });

  // =========================================================================
  // setStep
  // =========================================================================

  describe('setStep action', () => {
    describe('Given the user is on step 0', () => {
      describe('When setStep is called with step 3', () => {
        beforeEach(() => {
          act(() => {
            useOnboardingStore.getState().setStep(3);
          });
        });

        it('Then the current step updates to 3', () => {
          expect(useOnboardingStore.getState().step).toBe(3);
        });
      });
    });

    describe('When setStep is called with step 7 (the final step)', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setStep(7);
        });
      });

      it('Then the step is set to 7', () => {
        expect(useOnboardingStore.getState().step).toBe(7);
      });
    });
  });

  // =========================================================================
  // setPath
  // =========================================================================

  describe('setPath action', () => {
    describe('When the user selects the create business path', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setPath('create');
        });
      });

      it('Then the path is set to create', () => {
        expect(useOnboardingStore.getState().path).toBe('create');
      });
    });

    describe('When the user selects the invitation path', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setPath('invitation');
        });
      });

      it('Then the path is set to invitation', () => {
        expect(useOnboardingStore.getState().path).toBe('invitation');
      });
    });

    describe('When setPath is called with null (clearing the path)', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setPath('create');
          useOnboardingStore.getState().setPath(null);
        });
      });

      it('Then the path resets to null', () => {
        expect(useOnboardingStore.getState().path).toBeNull();
      });
    });
  });

  // =========================================================================
  // setConsents
  // =========================================================================

  describe('setConsents action', () => {
    describe('When the user accepts terms and opts into marketing', () => {
      const consents = { terms: true as const, marketing: true };

      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setConsents(consents);
        });
      });

      it('Then consents are stored', () => {
        expect(useOnboardingStore.getState().consents).toEqual(consents);
      });
    });

    describe('When the user accepts terms but opts out of marketing', () => {
      const consents = { terms: true as const, marketing: false };

      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setConsents(consents);
        });
      });

      it('Then marketing is stored as false', () => {
        expect(useOnboardingStore.getState().consents?.marketing).toBe(false);
      });
    });
  });

  // =========================================================================
  // setPreferences
  // =========================================================================

  describe('setPreferences action', () => {
    describe('When the user saves their preferences', () => {
      const preferences = { language: 'es' as const, currency: 'MXN' as const, theme: 'light' as const };

      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setPreferences(preferences);
        });
      });

      it('Then preferences are stored', () => {
        expect(useOnboardingStore.getState().preferences).toEqual(preferences);
      });
    });
  });

  // =========================================================================
  // setBusinessProfile
  // =========================================================================

  describe('setBusinessProfile action', () => {
    describe('When the user submits their business profile', () => {
      const profile = { businessName: 'Tienda Central', businessType: 'RETAIL', country: 'MX' };

      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setBusinessProfile(profile);
        });
      });

      it('Then the business profile is stored', () => {
        expect(useOnboardingStore.getState().businessProfile).toEqual(profile);
      });
    });
  });

  // =========================================================================
  // setInvitationCode
  // =========================================================================

  describe('setInvitationCode action', () => {
    describe('When the user enters a valid invitation code', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setInvitationCode('ABC12345');
        });
      });

      it('Then the invitation code is stored', () => {
        expect(useOnboardingStore.getState().invitationCode).toBe('ABC12345');
      });
    });
  });

  // =========================================================================
  // setContext
  // =========================================================================

  describe('setContext action', () => {
    describe('When the user provides team and revenue context', () => {
      const context = { teamSize: '2-5', monthlyRevenue: '50-200k' };

      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setContext(context);
        });
      });

      it('Then the context is stored', () => {
        expect(useOnboardingStore.getState().context).toEqual(context);
      });
    });

    describe('When the user skips context (no selections)', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setContext({});
        });
      });

      it('Then an empty context object is stored', () => {
        expect(useOnboardingStore.getState().context).toEqual({});
      });
    });
  });

  // =========================================================================
  // setCompletedAt
  // =========================================================================

  describe('setCompletedAt action', () => {
    describe('When onboarding is completed', () => {
      const timestamp = '2026-01-15T12:00:00.000Z';

      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setCompletedAt(timestamp);
        });
      });

      it('Then completedAt is stored as a timestamp', () => {
        expect(useOnboardingStore.getState().completedAt).toBe(timestamp);
      });
    });
  });

  // =========================================================================
  // setLoading / setError
  // =========================================================================

  describe('setLoading action', () => {
    describe('When an async operation starts', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setLoading(true);
        });
      });

      it('Then isLoading becomes true', () => {
        expect(useOnboardingStore.getState().isLoading).toBe(true);
      });
    });

    describe('When an async operation finishes', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setLoading(true);
          useOnboardingStore.getState().setLoading(false);
        });
      });

      it('Then isLoading returns to false', () => {
        expect(useOnboardingStore.getState().isLoading).toBe(false);
      });
    });
  });

  describe('setError action', () => {
    describe('When an error occurs', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setError('errors.profileUpdateFailed');
        });
      });

      it('Then the error message is stored', () => {
        expect(useOnboardingStore.getState().error).toBe('errors.profileUpdateFailed');
      });
    });

    describe('When the error is cleared', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setError('errors.profileUpdateFailed');
          useOnboardingStore.getState().setError(null);
        });
      });

      it('Then the error becomes null', () => {
        expect(useOnboardingStore.getState().error).toBeNull();
      });
    });
  });

  // =========================================================================
  // setInvitationDetails / setInvitationSubStep
  // =========================================================================

  describe('setInvitationDetails action', () => {
    describe('When a valid invitation is received from the API', () => {
      const details = {
        id: 'inv-001',
        tenantName: 'Tech Corp',
        email: 'maria@techcorp.com',
        role: 'EMPLOYEE',
        expiresAt: '2026-12-31T00:00:00.000Z',
      };

      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setInvitationDetails(details);
        });
      });

      it('Then invitation details are stored', () => {
        expect(useOnboardingStore.getState().invitationDetails).toEqual(details);
      });
    });

    describe('When invitation details are cleared', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setInvitationDetails(null);
        });
      });

      it('Then invitationDetails is null', () => {
        expect(useOnboardingStore.getState().invitationDetails).toBeNull();
      });
    });
  });

  describe('setInvitationSubStep action', () => {
    describe('When the user moves to the invitation confirmation sub-step', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setInvitationSubStep('confirmation');
        });
      });

      it('Then the sub-step is confirmation', () => {
        expect(useOnboardingStore.getState().invitationSubStep).toBe('confirmation');
      });
    });
  });

  // =========================================================================
  // reset
  // =========================================================================

  describe('reset action', () => {
    describe('When the user has partially completed onboarding and reset is called', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().setStep(3);
          useOnboardingStore.getState().setPath('create');
          useOnboardingStore.getState().setBusinessProfile({
            businessName: 'Test',
            businessType: 'RETAIL',
            country: 'MX',
          });
          useOnboardingStore.getState().reset();
        });
      });

      it('Then the step resets to 0', () => {
        expect(useOnboardingStore.getState().step).toBe(0);
      });

      it('Then the path resets to null', () => {
        expect(useOnboardingStore.getState().path).toBeNull();
      });

      it('Then all persisted data is cleared', () => {
        const { consents, preferences, businessProfile, completedAt } =
          useOnboardingStore.getState();
        expect(consents).toBeNull();
        expect(preferences).toBeNull();
        expect(businessProfile).toBeNull();
        expect(completedAt).toBeNull();
      });

      it('Then ephemeral state is also reset', () => {
        const { isLoading, error, invitationDetails } = useOnboardingStore.getState();
        expect(isLoading).toBe(false);
        expect(error).toBeNull();
        expect(invitationDetails).toBeNull();
      });
    });
  });

  // =========================================================================
  // hydrateFromBackend
  // =========================================================================

  describe('hydrateFromBackend action', () => {
    describe('Given the backend returns a session at step 3 with step data', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().hydrateFromBackend({
            status: 'IN_PROGRESS',
            currentStep: 3,
            path: 'CREATE',
            stepData: {
              'consents': { terms: true, marketing: false, analytics: true },
              'path': { path: 'CREATE' },
              'preferences': { language: 'en', currency: 'USD', theme: 'dark' },
              'businessProfile': { name: 'Mi Tienda', businessType: 'RETAIL', country: 'Jalisco' },
            },
          });
        });
      });

      it('Then step is set to 3', () => {
        expect(useOnboardingStore.getState().step).toBe(3);
      });

      it('Then path is mapped from CREATE to create', () => {
        expect(useOnboardingStore.getState().path).toBe('create');
      });

      it('Then consents are hydrated from consents section data', () => {
        expect(useOnboardingStore.getState().consents).toEqual({
          terms: true,
          marketing: false,
          analytics: true,
        });
      });

      it('Then preferences are hydrated from preferences section data', () => {
        expect(useOnboardingStore.getState().preferences).toEqual({
          language: 'en',
          currency: 'USD',
          theme: 'dark',
        });
      });

      it('Then businessProfile is hydrated with mapped field names', () => {
        expect(useOnboardingStore.getState().businessProfile).toEqual({
          businessName: 'Mi Tienda',
          businessType: 'RETAIL',
          otherBusinessType: undefined,
          country: 'Jalisco',
          cityRegion: undefined,
        });
      });

      it('Then isHydrated is set to true', () => {
        expect(useOnboardingStore.getState().isHydrated).toBe(true);
      });

      it('Then completedAt is null (session is in progress)', () => {
        expect(useOnboardingStore.getState().completedAt).toBeNull();
      });
    });

    describe('Given the backend returns a completed session', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().hydrateFromBackend({
            status: 'COMPLETED',
            currentStep: 7,
            path: 'CREATE',
            stepData: {},
          });
        });
      });

      it('Then completedAt is set to a truthy value', () => {
        expect(useOnboardingStore.getState().completedAt).not.toBeNull();
      });
    });

    describe('Given the backend returns null (no session)', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().hydrateFromBackend({
            status: null,
            currentStep: null,
            path: null,
            stepData: null,
          });
        });
      });

      it('Then step stays at 0', () => {
        expect(useOnboardingStore.getState().step).toBe(0);
      });

      it('Then isHydrated is set to true', () => {
        expect(useOnboardingStore.getState().isHydrated).toBe(true);
      });
    });

    describe('Given the backend returns a completely empty stepData object', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().hydrateFromBackend({
            status: 'IN_PROGRESS',
            currentStep: 1,
            path: 'CREATE',
            stepData: {},
          });
        });
      });

      it('Then all section data remains null', () => {
        const { consents, preferences, businessProfile, context, invitationCode } =
          useOnboardingStore.getState();
        expect(consents).toBeNull();
        expect(preferences).toBeNull();
        expect(businessProfile).toBeNull();
        expect(context).toBeNull();
        expect(invitationCode).toBeNull();
      });

      it('Then isHydrated is true', () => {
        expect(useOnboardingStore.getState().isHydrated).toBe(true);
      });

      it('Then step is set from backend', () => {
        expect(useOnboardingStore.getState().step).toBe(1);
      });
    });

    describe('Given the backend returns partial stepData (only consents present)', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().hydrateFromBackend({
            status: 'IN_PROGRESS',
            currentStep: 2,
            path: 'CREATE',
            stepData: {
              'consents': { terms: true, marketing: true, analytics: false },
            },
          });
        });
      });

      it('Then consents are hydrated', () => {
        expect(useOnboardingStore.getState().consents).toEqual({
          terms: true,
          marketing: true,
          analytics: false,
        });
      });

      it('Then preferences remain null (not in stepData)', () => {
        expect(useOnboardingStore.getState().preferences).toBeNull();
      });

      it('Then businessProfile remains null (not in stepData)', () => {
        expect(useOnboardingStore.getState().businessProfile).toBeNull();
      });

      it('Then context remains null (not in stepData)', () => {
        expect(useOnboardingStore.getState().context).toBeNull();
      });

      it('Then invitationCode remains null (no path section)', () => {
        expect(useOnboardingStore.getState().invitationCode).toBeNull();
      });
    });

    describe('Given the backend returns stepData with context only', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().hydrateFromBackend({
            status: 'IN_PROGRESS',
            currentStep: 5,
            path: 'CREATE',
            stepData: {
              'context': { teamSize: '6-10', monthlyRevenue: '200-500k' },
            },
          });
        });
      });

      it('Then context is hydrated', () => {
        expect(useOnboardingStore.getState().context).toEqual({
          teamSize: '6-10',
          monthlyRevenue: '200-500k',
        });
      });

      it('Then consents remain null', () => {
        expect(useOnboardingStore.getState().consents).toBeNull();
      });
    });

    describe('Given the backend returns null stepData', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().hydrateFromBackend({
            status: 'IN_PROGRESS',
            currentStep: 1,
            path: null,
            stepData: null,
          });
        });
      });

      it('Then all section data remains null', () => {
        const { consents, preferences, businessProfile, context } =
          useOnboardingStore.getState();
        expect(consents).toBeNull();
        expect(preferences).toBeNull();
        expect(businessProfile).toBeNull();
        expect(context).toBeNull();
      });

      it('Then path remains null when backend path is null', () => {
        expect(useOnboardingStore.getState().path).toBeNull();
      });

      it('Then isHydrated is true', () => {
        expect(useOnboardingStore.getState().isHydrated).toBe(true);
      });
    });

    describe('Given the backend returns stepData with empty section objects (missing fields)', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().hydrateFromBackend({
            status: 'IN_PROGRESS',
            currentStep: 4,
            path: 'CREATE',
            stepData: {
              'consents': {},
              'preferences': {},
              'businessProfile': {},
              'context': {},
              'path': {},
            },
          });
        });
      });

      it('Then consents uses fallback defaults for missing fields', () => {
        expect(useOnboardingStore.getState().consents).toEqual({
          terms: false,
          marketing: false,
          analytics: false,
        });
      });

      it('Then preferences uses fallback defaults for missing fields', () => {
        expect(useOnboardingStore.getState().preferences).toEqual({
          language: 'es',
          currency: 'MXN',
          theme: 'light',
        });
      });

      it('Then businessProfile uses empty string fallbacks', () => {
        expect(useOnboardingStore.getState().businessProfile).toEqual({
          businessName: '',
          businessType: '',
          otherBusinessType: undefined,
          country: 'MX',
          cityRegion: undefined,
        });
      });

      it('Then context uses undefined for optional fields', () => {
        const ctx = useOnboardingStore.getState().context;
        expect(ctx).toEqual({
          teamSize: undefined,
          monthlyRevenue: undefined,
        });
      });

      it('Then invitationCode falls back to null', () => {
        expect(useOnboardingStore.getState().invitationCode).toBeNull();
      });
    });

    describe('Given the backend returns a JOIN path', () => {
      beforeEach(() => {
        act(() => {
          useOnboardingStore.getState().hydrateFromBackend({
            status: 'IN_PROGRESS',
            currentStep: 1,
            path: 'JOIN',
            stepData: {
              'path': { path: 'JOIN', invitationCode: 'ABC12345' },
            },
          });
        });
      });

      it('Then path is mapped to invitation', () => {
        expect(useOnboardingStore.getState().path).toBe('invitation');
      });

      it('Then invitationCode is hydrated', () => {
        expect(useOnboardingStore.getState().invitationCode).toBe('ABC12345');
      });
    });
  });
});
