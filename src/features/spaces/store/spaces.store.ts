import { create } from 'zustand';
import type { Space } from '../types/spaces.types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SpacesState {
  spaces: Space[];
  isLoading: boolean;
  error: string | null;
}

interface SpacesActions {
  setSpaces: (spaces: Space[]) => void;
  addSpace: (space: Space) => void;
  updateSpace: (space: Space) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────────────────

const initialState: SpacesState = {
  spaces: [],
  isLoading: false,
  error: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Store — no persist: server state, always fresh from API
// ─────────────────────────────────────────────────────────────────────────────

export const useSpacesStore = create<SpacesState & SpacesActions>()((set) => ({
  ...initialState,

  setSpaces: (spaces: Space[]): void => set({ spaces }),

  addSpace: (space: Space): void =>
    set((state) => ({ spaces: [...state.spaces, space] })),

  updateSpace: (space: Space): void =>
    set((state) => ({
      spaces: state.spaces.map((s) => (s.id === space.id ? space : s)),
    })),

  setLoading: (isLoading: boolean): void => set({ isLoading }),

  setError: (error: string | null): void => set({ error }),

  reset: (): void => set(initialState),
}));
