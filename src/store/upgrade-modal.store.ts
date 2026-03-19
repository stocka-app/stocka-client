import { create } from 'zustand';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type TierLimitReason = 'TIER_LIMIT_REACHED' | 'FEATURE_NOT_IN_TIER';

interface UpgradeModalState {
  isOpen: boolean;
  reason: TierLimitReason | null;
  feature: string | null;
}

interface UpgradeModalActions {
  open: (reason: TierLimitReason, feature: string) => void;
  close: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store — no persist: ephemeral modal state
// ─────────────────────────────────────────────────────────────────────────────

const initialState: UpgradeModalState = {
  isOpen: false,
  reason: null,
  feature: null,
};

export const useUpgradeModalStore = create<UpgradeModalState & UpgradeModalActions>()((set) => ({
  ...initialState,

  open: (reason: TierLimitReason, feature: string): void => {
    set({ isOpen: true, reason, feature });
  },

  close: (): void => {
    set(initialState);
  },
}));
