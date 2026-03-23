import { beforeEach, describe, expect, it } from 'vitest';
import { useUpgradeModalStore } from '@/store/upgrade-modal.store';

function resetStore(): void {
  useUpgradeModalStore.setState({ isOpen: false, reason: null, feature: null });
}

describe('Given the upgrade-modal store manages ephemeral modal state', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('When the store is in its initial state', () => {
    it('Then the modal is closed', () => {
      const { isOpen } = useUpgradeModalStore.getState();
      expect(isOpen).toBe(false);
    });

    it('Then reason and feature are null', () => {
      const { reason, feature } = useUpgradeModalStore.getState();
      expect(reason).toBeNull();
      expect(feature).toBeNull();
    });
  });

  describe('When open is called with a reason and feature', () => {
    beforeEach(() => {
      useUpgradeModalStore.getState().open('TIER_LIMIT_REACHED', 'WAREHOUSE');
    });

    it('Then the modal is open', () => {
      expect(useUpgradeModalStore.getState().isOpen).toBe(true);
    });

    it('Then reason is set to the provided value', () => {
      expect(useUpgradeModalStore.getState().reason).toBe('TIER_LIMIT_REACHED');
    });

    it('Then feature is set to the provided value', () => {
      expect(useUpgradeModalStore.getState().feature).toBe('WAREHOUSE');
    });
  });

  describe('When open is called with FEATURE_NOT_IN_TIER reason', () => {
    beforeEach(() => {
      useUpgradeModalStore.getState().open('FEATURE_NOT_IN_TIER', 'MEMBER_INVITE');
    });

    it('Then reason is FEATURE_NOT_IN_TIER', () => {
      expect(useUpgradeModalStore.getState().reason).toBe('FEATURE_NOT_IN_TIER');
    });
  });

  describe('When close is called after the modal was opened', () => {
    beforeEach(() => {
      useUpgradeModalStore.getState().open('TIER_LIMIT_REACHED', 'WAREHOUSE');
      useUpgradeModalStore.getState().close();
    });

    it('Then the modal is closed', () => {
      expect(useUpgradeModalStore.getState().isOpen).toBe(false);
    });

    it('Then reason is reset to null', () => {
      expect(useUpgradeModalStore.getState().reason).toBeNull();
    });

    it('Then feature is reset to null', () => {
      expect(useUpgradeModalStore.getState().feature).toBeNull();
    });
  });
});
