import { create } from 'zustand';
import type {
  OrgStore,
  OrgProfileState,
  OrgProfile,
  TierQuotas,
  AuditLogEntry,
} from '../types/organization.types';

const initialState: OrgProfileState = {
  profile: null,
  quotas: null,
  auditLog: [],
  isLoading: false,
  isSaving: false,
  isCheckingName: false,
  nameAvailable: null,
  error: null,
};

export const useOrganizationStore = create<OrgStore>()((set) => ({
  ...initialState,

  setProfile: (profile: OrgProfile | null): void => {
    set({ profile });
  },

  setQuotas: (quotas: TierQuotas | null): void => {
    set({ quotas });
  },

  setAuditLog: (auditLog: AuditLogEntry[]): void => {
    set({ auditLog });
  },

  setLoading: (isLoading: boolean): void => {
    set({ isLoading });
  },

  setSaving: (isSaving: boolean): void => {
    set({ isSaving });
  },

  setCheckingName: (isCheckingName: boolean): void => {
    set({ isCheckingName });
  },

  setNameAvailable: (nameAvailable: boolean | null): void => {
    set({ nameAvailable });
  },

  setError: (error: string | null): void => {
    set({ error });
  },

  reset: (): void => {
    set(initialState);
  },
}));
