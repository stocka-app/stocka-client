import { renderHook, act } from '@testing-library/react';
import { useOrganizationStore } from '@/features/organization/store/organization.store';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/features/organization/api/organization.service', () => ({
  organizationService: {
    getOrgProfile: vi.fn(),
    updateOrgProfile: vi.fn(),
    uploadLogo: vi.fn(),
    checkNameAvailability: vi.fn(),
    getTierQuotas: vi.fn(),
    getAuditLog: vi.fn(),
    transferOwnership: vi.fn(),
    cancelOrganization: vi.fn(),
  },
}));

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

const mockProfile = {
  id: 'tenant-uuid-001',
  name: 'Ferretería Central',
  slug: 'ferreteria-central',
  businessType: 'RETAIL' as const,
  rfc: 'FCE123456789',
  logoUrl: null,
  status: 'ACTIVE' as const,
  tier: 'STARTER' as const,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockQuotas = {
  warehouses: { used: 1, max: 3 },
  members: { used: 2, max: 5 },
  products: { used: 50, max: 1000 },
};

const mockAuditLog = [
  {
    id: 'audit-001',
    timestamp: '2026-03-01T10:00:00.000Z',
    actorId: 'user-001',
    actorName: 'Roberto Medina',
    action: 'PROFILE_UPDATED',
    details: 'Changed name',
  },
];

// ---------------------------------------------------------------------------
// Import hook after mocks are set up
// ---------------------------------------------------------------------------

async function getHook(): Promise<() => ReturnType<typeof import('@/features/organization/hooks/useOrganization').useOrganization>> {
  const { useOrganization } = await import('@/features/organization/hooks/useOrganization');
  return useOrganization;
}

async function getService(): Promise<typeof import('@/features/organization/api/organization.service').organizationService> {
  const { organizationService } = await import('@/features/organization/api/organization.service');
  return organizationService;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useOrganization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // =========================================================================
  // fetchProfile
  // =========================================================================

  describe('fetchProfile', () => {
    describe('Given the API responds with a valid profile', () => {
      describe('When fetchProfile is called', () => {
        it('Then the profile is stored in the state', async () => {
          const service = await getService();
          vi.mocked(service.getOrgProfile).mockResolvedValueOnce(mockProfile);

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          await act(async () => {
            await result.current.fetchProfile();
          });

          expect(result.current.profile).toEqual(mockProfile);
          expect(result.current.isLoading).toBe(false);
          expect(result.current.error).toBeNull();
        });
      });
    });

    describe('Given the API returns an error', () => {
      describe('When fetchProfile is called', () => {
        it('Then the error key is set in state', async () => {
          const service = await getService();
          vi.mocked(service.getOrgProfile).mockRejectedValueOnce(new Error('Network error'));

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          await act(async () => {
            await result.current.fetchProfile();
          });

          expect(result.current.profile).toBeNull();
          expect(result.current.error).toBe('errors.fetchProfileFailed');
          expect(result.current.isLoading).toBe(false);
        });
      });
    });
  });

  // =========================================================================
  // fetchQuotas
  // =========================================================================

  describe('fetchQuotas', () => {
    describe('Given the API responds with valid quotas', () => {
      describe('When fetchQuotas is called', () => {
        it('Then the quotas are stored in the state', async () => {
          const service = await getService();
          vi.mocked(service.getTierQuotas).mockResolvedValueOnce(mockQuotas);

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          await act(async () => {
            await result.current.fetchQuotas();
          });

          expect(result.current.quotas).toEqual(mockQuotas);
          expect(result.current.isLoading).toBe(false);
        });
      });
    });

    describe('Given the API returns an error', () => {
      describe('When fetchQuotas is called', () => {
        it('Then the fetchQuotasFailed error key is set', async () => {
          const service = await getService();
          vi.mocked(service.getTierQuotas).mockRejectedValueOnce(new Error('Network error'));

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          await act(async () => {
            await result.current.fetchQuotas();
          });

          expect(result.current.error).toBe('errors.fetchQuotasFailed');
        });
      });
    });
  });

  // =========================================================================
  // fetchAuditLog
  // =========================================================================

  describe('fetchAuditLog', () => {
    describe('Given the API responds with audit log entries', () => {
      describe('When fetchAuditLog is called', () => {
        it('Then the audit log is stored in the state', async () => {
          const service = await getService();
          vi.mocked(service.getAuditLog).mockResolvedValueOnce(mockAuditLog);

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          await act(async () => {
            await result.current.fetchAuditLog();
          });

          expect(result.current.auditLog).toEqual(mockAuditLog);
        });
      });
    });

    describe('Given the API returns an error', () => {
      describe('When fetchAuditLog is called', () => {
        it('Then the fetchAuditFailed error key is set', async () => {
          const service = await getService();
          vi.mocked(service.getAuditLog).mockRejectedValueOnce(new Error('Forbidden'));

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          await act(async () => {
            await result.current.fetchAuditLog();
          });

          expect(result.current.error).toBe('errors.fetchAuditFailed');
        });
      });
    });
  });

  // =========================================================================
  // updateProfile
  // =========================================================================

  describe('updateProfile', () => {
    describe('Given the API successfully updates the profile', () => {
      describe('When updateProfile is called with new data', () => {
        it('Then the profile in state is updated with the API response', async () => {
          const service = await getService();
          const updatedProfile = { ...mockProfile, name: 'Ferretería Nueva' };
          vi.mocked(service.updateOrgProfile).mockResolvedValueOnce(updatedProfile);

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          await act(async () => {
            await result.current.updateProfile({ name: 'Ferretería Nueva', businessType: 'RETAIL' });
          });

          expect(result.current.profile?.name).toBe('Ferretería Nueva');
          expect(result.current.isSaving).toBe(false);
          expect(result.current.error).toBeNull();
        });
      });
    });

    describe('Given the API returns an error', () => {
      describe('When updateProfile is called', () => {
        it('Then the updateProfileFailed error key is set', async () => {
          const service = await getService();
          vi.mocked(service.updateOrgProfile).mockRejectedValueOnce(new Error('Conflict'));

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          await act(async () => {
            await result.current.updateProfile({ name: 'Taken Name', businessType: 'RETAIL' });
          });

          expect(result.current.error).toBe('errors.updateProfileFailed');
          expect(result.current.isSaving).toBe(false);
        });
      });
    });
  });

  // =========================================================================
  // uploadLogo
  // =========================================================================

  describe('uploadLogo', () => {
    describe('Given a profile is loaded and the user uploads a logo', () => {
      describe('When uploadLogo succeeds', () => {
        it('Then the profile logoUrl is updated', async () => {
          const service = await getService();
          vi.mocked(service.uploadLogo).mockResolvedValueOnce({
            logoUrl: 'https://cdn.example.com/logo.png',
          });

          useOrganizationStore.setState({ profile: mockProfile });

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          const file = new File([''], 'logo.png', { type: 'image/png' });
          await act(async () => {
            await result.current.uploadLogo(file);
          });

          expect(result.current.profile?.logoUrl).toBe('https://cdn.example.com/logo.png');
          expect(result.current.isSaving).toBe(false);
        });
      });
    });

    describe('Given the upload fails', () => {
      describe('When uploadLogo is called', () => {
        it('Then the uploadLogoFailed error key is set', async () => {
          const service = await getService();
          vi.mocked(service.uploadLogo).mockRejectedValueOnce(new Error('Upload failed'));

          useOrganizationStore.setState({ profile: mockProfile });

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          const file = new File([''], 'logo.png', { type: 'image/png' });
          await act(async () => {
            await result.current.uploadLogo(file);
          });

          expect(result.current.error).toBe('errors.uploadLogoFailed');
        });
      });
    });

    describe('Given no profile is loaded', () => {
      describe('When uploadLogo succeeds', () => {
        it('Then the profile is not updated (no-op)', async () => {
          const service = await getService();
          vi.mocked(service.uploadLogo).mockResolvedValueOnce({
            logoUrl: 'https://cdn.example.com/logo.png',
          });

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          const file = new File([''], 'logo.png', { type: 'image/png' });
          await act(async () => {
            await result.current.uploadLogo(file);
          });

          expect(result.current.profile).toBeNull();
        });
      });
    });
  });

  // =========================================================================
  // checkNameAvailability
  // =========================================================================

  describe('checkNameAvailability', () => {
    describe('Given a profile is loaded with the current business name', () => {
      describe('When the user types the same name as the current name', () => {
        it('Then no availability check is made and nameAvailable is reset to null', async () => {
          const service = await getService();
          useOrganizationStore.setState({ profile: mockProfile });

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          act(() => {
            result.current.checkNameAvailability('Ferretería Central');
          });

          vi.runAllTimers();
          expect(service.checkNameAvailability).not.toHaveBeenCalled();
          expect(result.current.nameAvailable).toBeNull();
          expect(result.current.isCheckingName).toBe(false);
        });
      });
    });

    describe('Given the user types a name shorter than 2 characters', () => {
      describe('When checkNameAvailability is called', () => {
        it('Then no API call is made and checking state is reset', async () => {
          const service = await getService();

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          act(() => {
            result.current.checkNameAvailability('A');
          });

          vi.runAllTimers();
          expect(service.checkNameAvailability).not.toHaveBeenCalled();
          expect(result.current.isCheckingName).toBe(false);
        });
      });
    });

    describe('Given the user types multiple names in rapid succession', () => {
      describe('When checkNameAvailability is called twice before the timer fires', () => {
        it('Then only one API call is made (debounce clears the previous timer)', async () => {
          const service = await getService();
          vi.mocked(service.checkNameAvailability).mockResolvedValue({ available: true });

          useOrganizationStore.setState({ profile: mockProfile });

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          act(() => {
            result.current.checkNameAvailability('Primer Nombre');
          });
          act(() => {
            result.current.checkNameAvailability('Segundo Nombre');
          });

          await act(async () => {
            await vi.runAllTimersAsync();
          });

          // Only the second call's API request goes through
          expect(service.checkNameAvailability).toHaveBeenCalledTimes(1);
          expect(service.checkNameAvailability).toHaveBeenCalledWith('Segundo Nombre');
        });
      });
    });

    describe('Given the user types a valid different name', () => {
      describe('When the debounce completes and the name is available', () => {
        it('Then nameAvailable is set to true', async () => {
          const service = await getService();
          vi.mocked(service.checkNameAvailability).mockResolvedValueOnce({ available: true });

          useOrganizationStore.setState({ profile: mockProfile });

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          act(() => {
            result.current.checkNameAvailability('Tienda Nueva');
          });

          await act(async () => {
            await vi.runAllTimersAsync();
          });

          expect(result.current.nameAvailable).toBe(true);
          expect(result.current.isCheckingName).toBe(false);
        });
      });

      describe('When the debounce completes and the name is not available', () => {
        it('Then nameAvailable is set to false', async () => {
          const service = await getService();
          vi.mocked(service.checkNameAvailability).mockResolvedValueOnce({ available: false });

          useOrganizationStore.setState({ profile: mockProfile });

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          act(() => {
            result.current.checkNameAvailability('Nombre Tomado');
          });

          await act(async () => {
            await vi.runAllTimersAsync();
          });

          expect(result.current.nameAvailable).toBe(false);
        });
      });

      describe('When the availability API call fails', () => {
        it('Then nameAvailable remains null and checking is false', async () => {
          const service = await getService();
          vi.mocked(service.checkNameAvailability).mockRejectedValueOnce(new Error('Network'));

          useOrganizationStore.setState({ profile: mockProfile });

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          act(() => {
            result.current.checkNameAvailability('Nombre Nuevo');
          });

          await act(async () => {
            await vi.runAllTimersAsync();
          });

          expect(result.current.nameAvailable).toBeNull();
          expect(result.current.isCheckingName).toBe(false);
        });
      });
    });
  });

  // =========================================================================
  // transferOwnership
  // =========================================================================

  describe('transferOwnership', () => {
    describe('Given the transfer succeeds', () => {
      describe('When transferOwnership is called with a new owner ID', () => {
        it('Then the operation completes without error', async () => {
          const service = await getService();
          vi.mocked(service.transferOwnership).mockResolvedValueOnce(undefined);

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          await act(async () => {
            await result.current.transferOwnership('new-owner-uuid');
          });

          expect(result.current.isSaving).toBe(false);
          expect(result.current.error).toBeNull();
        });
      });
    });

    describe('Given the transfer fails', () => {
      describe('When transferOwnership is called', () => {
        it('Then the transferOwnershipFailed error key is set', async () => {
          const service = await getService();
          vi.mocked(service.transferOwnership).mockRejectedValueOnce(new Error('Forbidden'));

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          await act(async () => {
            await result.current.transferOwnership('new-owner-uuid');
          });

          expect(result.current.error).toBe('errors.transferOwnershipFailed');
          expect(result.current.isSaving).toBe(false);
        });
      });
    });
  });

  // =========================================================================
  // cancelOrganization
  // =========================================================================

  describe('cancelOrganization', () => {
    describe('Given a profile is loaded and the cancellation succeeds', () => {
      describe('When cancelOrganization is called', () => {
        it('Then the profile status is updated to CANCELLED', async () => {
          const service = await getService();
          vi.mocked(service.cancelOrganization).mockResolvedValueOnce(undefined);

          useOrganizationStore.setState({ profile: mockProfile });

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          await act(async () => {
            await result.current.cancelOrganization();
          });

          expect(result.current.profile?.status).toBe('CANCELLED');
          expect(result.current.isSaving).toBe(false);
          expect(result.current.error).toBeNull();
        });
      });
    });

    describe('Given no profile is loaded and the cancellation succeeds', () => {
      describe('When cancelOrganization is called', () => {
        it('Then profile remains null (no-op on update)', async () => {
          const service = await getService();
          vi.mocked(service.cancelOrganization).mockResolvedValueOnce(undefined);

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          await act(async () => {
            await result.current.cancelOrganization();
          });

          expect(result.current.profile).toBeNull();
        });
      });
    });

    describe('Given the cancellation fails', () => {
      describe('When cancelOrganization is called', () => {
        it('Then the cancelOrgFailed error key is set', async () => {
          const service = await getService();
          vi.mocked(service.cancelOrganization).mockRejectedValueOnce(new Error('Error'));

          useOrganizationStore.setState({ profile: mockProfile });

          const useOrganization = await getHook();
          const { result } = renderHook(() => useOrganization());

          await act(async () => {
            await result.current.cancelOrganization();
          });

          expect(result.current.error).toBe('errors.cancelOrgFailed');
          expect(result.current.isSaving).toBe(false);
        });
      });
    });
  });
});
