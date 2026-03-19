import { useRef, useCallback } from 'react';
import { useOrganizationStore } from '../store/organization.store';
import { organizationService } from '../api/organization.service';
import type { OrgProfile, TierQuotas, AuditLogEntry } from '../types/organization.types';
import type { UpdateOrgRequest } from '../schemas/organization.schema';

const NAME_CHECK_DEBOUNCE_MS = 300;

/**
 * useOrganization
 *
 * Central hook for the organization settings feature.
 * Orchestrates the Zustand store and the organization service.
 * Components never call the service directly — they go through this hook.
 */
export function useOrganization(): {
  // State
  profile: OrgProfile | null;
  quotas: TierQuotas | null;
  auditLog: AuditLogEntry[];
  isLoading: boolean;
  isSaving: boolean;
  isCheckingName: boolean;
  nameAvailable: boolean | null;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  fetchQuotas: () => Promise<void>;
  fetchAuditLog: () => Promise<void>;
  updateProfile: (data: UpdateOrgRequest) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  checkNameAvailability: (name: string) => void;
  transferOwnership: (newOwnerId: string) => Promise<void>;
  cancelOrganization: () => Promise<void>;
} {
  const {
    profile,
    quotas,
    auditLog,
    isLoading,
    isSaving,
    isCheckingName,
    nameAvailable,
    error,
    setProfile,
    setQuotas,
    setAuditLog,
    setLoading,
    setSaving,
    setCheckingName,
    setNameAvailable,
    setError,
  } = useOrganizationStore();

  // Debounce timer ref for name availability check
  const nameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProfile = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.getOrgProfile();
      setProfile(data);
    } catch {
      setError('errors.fetchProfileFailed');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setProfile]);

  const fetchQuotas = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.getTierQuotas();
      setQuotas(data);
    } catch {
      setError('errors.fetchQuotasFailed');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setQuotas]);

  const fetchAuditLog = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.getAuditLog();
      setAuditLog(data);
    } catch {
      setError('errors.fetchAuditFailed');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setAuditLog]);

  const updateProfile = useCallback(
    async (data: UpdateOrgRequest): Promise<void> => {
      setSaving(true);
      setError(null);
      try {
        const updated = await organizationService.updateOrgProfile(data);
        setProfile(updated);
      } catch {
        setError('errors.updateProfileFailed');
      } finally {
        setSaving(false);
      }
    },
    [setSaving, setError, setProfile],
  );

  const uploadLogo = useCallback(
    async (file: File): Promise<void> => {
      setSaving(true);
      setError(null);
      try {
        const { logoUrl } = await organizationService.uploadLogo(file);
        if (profile) {
          setProfile({ ...profile, logoUrl });
        }
      } catch {
        setError('errors.uploadLogoFailed');
      } finally {
        setSaving(false);
      }
    },
    [setSaving, setError, profile, setProfile],
  );

  const checkNameAvailability = useCallback(
    (name: string): void => {
      // Skip check if name is the same as the current profile name
      if (profile && name === profile.name) {
        setNameAvailable(null);
        setCheckingName(false);
        return;
      }

      // Clear any pending timer
      if (nameCheckTimer.current !== null) {
        clearTimeout(nameCheckTimer.current);
      }

      if (name.length < 2) {
        setNameAvailable(null);
        setCheckingName(false);
        return;
      }

      setCheckingName(true);
      setNameAvailable(null);

      nameCheckTimer.current = setTimeout(async () => {
        try {
          const { available } = await organizationService.checkNameAvailability(name);
          setNameAvailable(available);
        } catch {
          setNameAvailable(null);
        } finally {
          setCheckingName(false);
        }
      }, NAME_CHECK_DEBOUNCE_MS);
    },
    [profile, setCheckingName, setNameAvailable],
  );

  const transferOwnership = useCallback(
    async (newOwnerId: string): Promise<void> => {
      setSaving(true);
      setError(null);
      try {
        await organizationService.transferOwnership(newOwnerId);
      } catch {
        setError('errors.transferOwnershipFailed');
      } finally {
        setSaving(false);
      }
    },
    [setSaving, setError],
  );

  const cancelOrganization = useCallback(
    async (): Promise<void> => {
      setSaving(true);
      setError(null);
      try {
        await organizationService.cancelOrganization();
        if (profile) {
          setProfile({ ...profile, status: 'CANCELLED' });
        }
      } catch {
        setError('errors.cancelOrgFailed');
      } finally {
        setSaving(false);
      }
    },
    [setSaving, setError, profile, setProfile],
  );

  return {
    profile,
    quotas,
    auditLog,
    isLoading,
    isSaving,
    isCheckingName,
    nameAvailable,
    error,
    fetchProfile,
    fetchQuotas,
    fetchAuditLog,
    updateProfile,
    uploadLogo,
    checkNameAvailability,
    transferOwnership,
    cancelOrganization,
  };
}
