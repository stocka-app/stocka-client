import { create } from 'zustand';
import type { Storage } from '../types/storages.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface StoragesState {
  storages: Storage[];
  isLoading: boolean;
  error: string | null;
}

interface StoragesActions {
  setStorages: (storages: Storage[]) => void;
  addStorage: (storage: Storage) => void;
  updateStorage: (storage: Storage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────────────────

const initialState: StoragesState = {
  storages: [],
  isLoading: false,
  error: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Store — no persist: server state, always fresh from API
// ─────────────────────────────────────────────────────────────────────────────

export const useStoragesStore = create<StoragesState & StoragesActions>()((set) => ({
  ...initialState,

  setStorages: (storages: Storage[]): void => set({ storages }),

  addStorage: (storage: Storage): void =>
    set((state) => ({ storages: [...state.storages, storage] })),

  updateStorage: (storage: Storage): void =>
    set((state) => ({
      storages: state.storages.map((s) => (s.uuid === storage.uuid ? storage : s)),
    })),

  setLoading: (isLoading: boolean): void => set({ isLoading }),

  setError: (error: string | null): void => set({ error }),

  reset: (): void => set(initialState),
}));
