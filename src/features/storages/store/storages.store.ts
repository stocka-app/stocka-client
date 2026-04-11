import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { useAuthenticationStore } from '@/features/authentication';
import type { Storage } from '../types/storages.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface StoragesState {
  storages: Storage[];
  activeStorageId: string | null;
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  /** Monotonic counter incremented on every mutation (add/update/setStorages). Consumers like StorageSwitcher watch this to know when to re-fetch. */
  version: number;
}

interface StoragesActions {
  setStorages: (storages: Storage[]) => void;
  setPagination: (total: number, page: number, totalPages: number) => void;
  addStorage: (storage: Storage) => void;
  updateStorage: (storage: Storage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  // Active context (H-03 — STOC-343)
  setActiveStorage: (id: string | null) => void;
  hydrateActiveStorage: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────────────────

const initialState: StoragesState = {
  storages: [],
  activeStorageId: null,
  total: 0,
  page: 1,
  totalPages: 0,
  isLoading: true,
  error: null,
  version: 0,
};

// ─────────────────────────────────────────────────────────────────────────────
// Sort helper
// ─────────────────────────────────────────────────────────────────────────────

const byName = (a: Storage, b: Storage): number =>
  a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

// ─────────────────────────────────────────────────────────────────────────────
// Selectors — exported for use by the useStorages hook, StorageSwitcher,
// and StoragesPage. Defining them here keeps the ordering rule in one place.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the storages array with the active one in position #0, and the
 * rest sorted alphabetically (A→Z by name). Consumed by StoragesPage (grid)
 * and StorageSwitcher (dropdown) to keep the "contexto actual primero"
 * ordering consistent across the feature.
 *
 * If no `activeStorageId` is set, returns the plain alphabetical order.
 */
export const selectSortedStorages = (state: StoragesState): Storage[] => {
  if (!state.activeStorageId) {
    return [...state.storages].sort(byName);
  }
  const active = state.storages.find((s) => s.uuid === state.activeStorageId);
  const rest = state.storages
    .filter((s) => s.uuid !== state.activeStorageId)
    .sort(byName);
  return active ? [active, ...rest] : rest;
};

/**
 * Resolves the `activeStorageId` against the current storages array. Returns
 * null if the id is unset or points to a storage that no longer exists in
 * the tenant (stale — e.g. deleted by another member).
 */
export const selectActiveStorage = (state: StoragesState): Storage | null => {
  if (!state.activeStorageId) return null;
  return state.storages.find((s) => s.uuid === state.activeStorageId) ?? null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Tenant-scoped localStorage adapter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Custom persist storage that scopes the key by `tenantId` read from the
 * authentication store. This isolates the `activeStorageId` preference per
 * tenant, so switching accounts (logout/re-login) cannot leak the previous
 * tenant's selection into another account.
 *
 * If no user is authenticated (`tenantId` is null), the adapter is a no-op:
 * reads return null and writes are skipped. The store falls back to the
 * in-memory default and is rehydrated via `hydrateActiveStorage` once the
 * user logs in and `fetchStorages` resolves.
 */
const tenantScopedStorage: StateStorage = {
  getItem: (name) => {
    const tenantId = useAuthenticationStore.getState().user?.tenantId;
    if (!tenantId) return null;
    return localStorage.getItem(`${name}:${tenantId}`);
  },
  setItem: (name, value) => {
    const tenantId = useAuthenticationStore.getState().user?.tenantId;
    if (!tenantId) return;
    localStorage.setItem(`${name}:${tenantId}`, value);
  },
  removeItem: (name) => {
    const tenantId = useAuthenticationStore.getState().user?.tenantId;
    if (!tenantId) return;
    localStorage.removeItem(`${name}:${tenantId}`);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Only `activeStorageId` is persisted — the `storages` array is server state
 * and is always rehydrated from the API on mount. The active context is a
 * user preference that must survive reloads within the same tenant.
 */
export const useStoragesStore = create<StoragesState & StoragesActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStorages: (storages: Storage[]): void => {
        set({ storages });
      },

      setPagination: (total: number, page: number, totalPages: number): void => {
        set({ total, page, totalPages });
      },

      addStorage: (storage: Storage): void => {
        set((state) => ({ storages: [...state.storages, storage], version: state.version + 1 }));
      },

      updateStorage: (storage: Storage): void => {
        set((state) => ({
          storages: state.storages.map((s) => (s.uuid === storage.uuid ? storage : s)),
          version: state.version + 1,
        }));
      },

      setLoading: (isLoading: boolean): void => {
        set({ isLoading });
      },

      setError: (error: string | null): void => {
        set({ error });
      },

      reset: (): void => {
        set(initialState);
      },

      setActiveStorage: (id: string | null): void => {
        set({ activeStorageId: id });
      },

      hydrateActiveStorage: (): void => {
        const { activeStorageId, storages } = get();

        // If the persisted id still points to a storage in the current tenant,
        // keep it — the rehydrated value is valid.
        const stillExists =
          activeStorageId !== null && storages.some((s) => s.uuid === activeStorageId);

        if (stillExists) return;

        // Fallback: first ACTIVE storage sorted A→Z. If there are no ACTIVE
        // storages, leave `activeStorageId` as null — the switcher and banner
        // handle the empty case gracefully.
        const firstActive = [...storages]
          .filter((s) => s.status === 'ACTIVE')
          .sort(byName)[0];

        set({ activeStorageId: firstActive?.uuid ?? null });
      },
    }),
    {
      name: 'stocka:active-storage',
      storage: createJSONStorage(() => tenantScopedStorage),
      partialize: (state) => ({ activeStorageId: state.activeStorageId }),
    },
  ),
);
