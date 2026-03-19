import { act } from '@testing-library/react';
import { useOrganizationStore } from '@/features/organization/store/organization.store';
import type { OrgProfile, TierQuotas, AuditLogEntry } from '@/features/organization/types/organization.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore(): void {
  useOrganizationStore.setState({
    profile: null,
    quotas: null,
    auditLog: [],
    isLoading: false,
    isSaving: false,
    isCheckingName: false,
    nameAvailable: null,
    error: null,
  });
}

const mockProfile: OrgProfile = {
  id: 'tenant-uuid-001',
  name: 'Ferretería Central',
  slug: 'ferreteria-central',
  businessType: 'RETAIL',
  rfc: 'FCE123456789',
  logoUrl: null,
  status: 'ACTIVE',
  tier: 'STARTER',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockQuotas: TierQuotas = {
  warehouses: { used: 1, max: 3 },
  members: { used: 2, max: 5 },
  products: { used: 50, max: 1000 },
};

const mockAuditEntry: AuditLogEntry = {
  id: 'audit-001',
  timestamp: '2026-03-01T10:00:00.000Z',
  actorId: 'user-001',
  actorName: 'Roberto Medina',
  action: 'PROFILE_UPDATED',
  details: 'Changed name',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useOrganizationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  // =========================================================================
  // Initial state
  // =========================================================================

  describe('Given the store is freshly initialized', () => {
    it('Then all data fields are at their default values', () => {
      const { profile, quotas, auditLog } = useOrganizationStore.getState();
      expect(profile).toBeNull();
      expect(quotas).toBeNull();
      expect(auditLog).toEqual([]);
    });

    it('Then all loading flags are false', () => {
      const { isLoading, isSaving, isCheckingName } = useOrganizationStore.getState();
      expect(isLoading).toBe(false);
      expect(isSaving).toBe(false);
      expect(isCheckingName).toBe(false);
    });

    it('Then nameAvailable and error are null', () => {
      const { nameAvailable, error } = useOrganizationStore.getState();
      expect(nameAvailable).toBeNull();
      expect(error).toBeNull();
    });
  });

  // =========================================================================
  // setProfile
  // =========================================================================

  describe('setProfile action', () => {
    describe('Given no profile is loaded', () => {
      describe('When setProfile is called with a valid profile', () => {
        beforeEach(() => {
          act(() => {
            useOrganizationStore.getState().setProfile(mockProfile);
          });
        });

        it('Then the profile is stored', () => {
          expect(useOrganizationStore.getState().profile).toEqual(mockProfile);
        });
      });

      describe('When setProfile is called with null', () => {
        beforeEach(() => {
          act(() => {
            useOrganizationStore.getState().setProfile(mockProfile);
            useOrganizationStore.getState().setProfile(null);
          });
        });

        it('Then the profile is cleared', () => {
          expect(useOrganizationStore.getState().profile).toBeNull();
        });
      });
    });
  });

  // =========================================================================
  // setQuotas
  // =========================================================================

  describe('setQuotas action', () => {
    describe('When setQuotas is called with tier quota data', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setQuotas(mockQuotas);
        });
      });

      it('Then the quotas are stored', () => {
        expect(useOrganizationStore.getState().quotas).toEqual(mockQuotas);
      });
    });

    describe('When setQuotas is called with null', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setQuotas(mockQuotas);
          useOrganizationStore.getState().setQuotas(null);
        });
      });

      it('Then quotas are cleared', () => {
        expect(useOrganizationStore.getState().quotas).toBeNull();
      });
    });
  });

  // =========================================================================
  // setAuditLog
  // =========================================================================

  describe('setAuditLog action', () => {
    describe('When setAuditLog is called with entries', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setAuditLog([mockAuditEntry]);
        });
      });

      it('Then the audit log is stored', () => {
        expect(useOrganizationStore.getState().auditLog).toEqual([mockAuditEntry]);
      });
    });

    describe('When setAuditLog is called with an empty array', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setAuditLog([mockAuditEntry]);
          useOrganizationStore.getState().setAuditLog([]);
        });
      });

      it('Then the audit log is cleared', () => {
        expect(useOrganizationStore.getState().auditLog).toEqual([]);
      });
    });
  });

  // =========================================================================
  // setLoading
  // =========================================================================

  describe('setLoading action', () => {
    describe('When a page-level fetch starts', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setLoading(true);
        });
      });

      it('Then isLoading becomes true', () => {
        expect(useOrganizationStore.getState().isLoading).toBe(true);
      });
    });

    describe('When the fetch completes', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setLoading(true);
          useOrganizationStore.getState().setLoading(false);
        });
      });

      it('Then isLoading returns to false', () => {
        expect(useOrganizationStore.getState().isLoading).toBe(false);
      });
    });
  });

  // =========================================================================
  // setSaving
  // =========================================================================

  describe('setSaving action', () => {
    describe('When the user submits the edit form', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setSaving(true);
        });
      });

      it('Then isSaving becomes true', () => {
        expect(useOrganizationStore.getState().isSaving).toBe(true);
      });
    });

    describe('When the save operation completes', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setSaving(true);
          useOrganizationStore.getState().setSaving(false);
        });
      });

      it('Then isSaving returns to false', () => {
        expect(useOrganizationStore.getState().isSaving).toBe(false);
      });
    });
  });

  // =========================================================================
  // setCheckingName / setNameAvailable
  // =========================================================================

  describe('setCheckingName action', () => {
    describe('When the name availability check starts', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setCheckingName(true);
        });
      });

      it('Then isCheckingName becomes true', () => {
        expect(useOrganizationStore.getState().isCheckingName).toBe(true);
      });
    });
  });

  describe('setNameAvailable action', () => {
    describe('When the API confirms the name is available', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setNameAvailable(true);
        });
      });

      it('Then nameAvailable is true', () => {
        expect(useOrganizationStore.getState().nameAvailable).toBe(true);
      });
    });

    describe('When the API confirms the name is not available', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setNameAvailable(false);
        });
      });

      it('Then nameAvailable is false', () => {
        expect(useOrganizationStore.getState().nameAvailable).toBe(false);
      });
    });

    describe('When the name availability check is reset', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setNameAvailable(true);
          useOrganizationStore.getState().setNameAvailable(null);
        });
      });

      it('Then nameAvailable is null', () => {
        expect(useOrganizationStore.getState().nameAvailable).toBeNull();
      });
    });
  });

  // =========================================================================
  // setError
  // =========================================================================

  describe('setError action', () => {
    describe('When an API call fails', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setError('errors.fetchProfileFailed');
        });
      });

      it('Then the error key is stored', () => {
        expect(useOrganizationStore.getState().error).toBe('errors.fetchProfileFailed');
      });
    });

    describe('When the error is dismissed', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setError('errors.fetchProfileFailed');
          useOrganizationStore.getState().setError(null);
        });
      });

      it('Then error becomes null', () => {
        expect(useOrganizationStore.getState().error).toBeNull();
      });
    });
  });

  // =========================================================================
  // reset
  // =========================================================================

  describe('reset action', () => {
    describe('Given the store has loaded data and an error', () => {
      beforeEach(() => {
        act(() => {
          useOrganizationStore.getState().setProfile(mockProfile);
          useOrganizationStore.getState().setQuotas(mockQuotas);
          useOrganizationStore.getState().setAuditLog([mockAuditEntry]);
          useOrganizationStore.getState().setLoading(true);
          useOrganizationStore.getState().setSaving(true);
          useOrganizationStore.getState().setCheckingName(true);
          useOrganizationStore.getState().setNameAvailable(true);
          useOrganizationStore.getState().setError('errors.updateProfileFailed');
          useOrganizationStore.getState().reset();
        });
      });

      it('Then profile is cleared', () => {
        expect(useOrganizationStore.getState().profile).toBeNull();
      });

      it('Then quotas are cleared', () => {
        expect(useOrganizationStore.getState().quotas).toBeNull();
      });

      it('Then audit log is cleared', () => {
        expect(useOrganizationStore.getState().auditLog).toEqual([]);
      });

      it('Then all flags are reset to false', () => {
        const { isLoading, isSaving, isCheckingName } = useOrganizationStore.getState();
        expect(isLoading).toBe(false);
        expect(isSaving).toBe(false);
        expect(isCheckingName).toBe(false);
      });

      it('Then nameAvailable and error are null', () => {
        const { nameAvailable, error } = useOrganizationStore.getState();
        expect(nameAvailable).toBeNull();
        expect(error).toBeNull();
      });
    });
  });
});
