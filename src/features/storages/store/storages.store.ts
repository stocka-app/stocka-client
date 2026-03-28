import { create } from 'zustand';
import type { Storage } from '../types/storages.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface StoragesState {
  storages: Storage[];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

interface StoragesActions {
  setStorages: (storages: Storage[]) => void;
  setPagination: (total: number, page: number, totalPages: number) => void;
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
  total: 0,
  page: 1,
  totalPages: 0,
  isLoading: true,
  error: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Store — no persist: server state, always fresh from API
// ─────────────────────────────────────────────────────────────────────────────

export const useStoragesStore = create<StoragesState & StoragesActions>()((set) => ({
  ...initialState,

  setStorages: (storages: Storage[]): void => set({ storages }),

  setPagination: (total: number, page: number, totalPages: number): void =>
    set({ total, page, totalPages }),

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
