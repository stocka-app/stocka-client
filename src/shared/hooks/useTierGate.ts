import { useUpgradeModalStore, type TierLimitReason } from '@/store/upgrade-modal.store';

export interface UseTierGateReturn {
  openUpgradeModal: (reason: TierLimitReason, feature: string) => void;
  closeUpgradeModal: () => void;
  isOpen: boolean;
}

/**
 * useTierGate
 *
 * Convenience hook that exposes upgrade modal controls from the global store.
 * Use this to programmatically open the UpgradeModal from anywhere in the app.
 */
export function useTierGate(): UseTierGateReturn {
  const { open, close, isOpen } = useUpgradeModalStore();

  return {
    openUpgradeModal: open,
    closeUpgradeModal: close,
    isOpen,
  };
}
