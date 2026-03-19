import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUpgradeModalStore } from '@/store/upgrade-modal.store';
import { useTierGate } from '@/shared/hooks/useTierGate';

function resetStore(): void {
  useUpgradeModalStore.setState({ isOpen: false, reason: null, feature: null });
}

describe('Given useTierGate provides upgrade modal controls', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('When the hook is called with the modal closed', () => {
    it('Then isOpen is false', () => {
      const { result } = renderHook(() => useTierGate());
      expect(result.current.isOpen).toBe(false);
    });

    it('Then openUpgradeModal is a function', () => {
      const { result } = renderHook(() => useTierGate());
      expect(typeof result.current.openUpgradeModal).toBe('function');
    });

    it('Then closeUpgradeModal is a function', () => {
      const { result } = renderHook(() => useTierGate());
      expect(typeof result.current.closeUpgradeModal).toBe('function');
    });
  });

  describe('When openUpgradeModal is called', () => {
    it('Then isOpen becomes true in the store', () => {
      const { result } = renderHook(() => useTierGate());
      result.current.openUpgradeModal('TIER_LIMIT_REACHED', 'WAREHOUSE');
      expect(useUpgradeModalStore.getState().isOpen).toBe(true);
    });

    it('Then the store reflects the reason', () => {
      const { result } = renderHook(() => useTierGate());
      result.current.openUpgradeModal('FEATURE_NOT_IN_TIER', 'INVITE_MEMBERS');
      expect(useUpgradeModalStore.getState().reason).toBe('FEATURE_NOT_IN_TIER');
    });

    it('Then the store reflects the feature', () => {
      const { result } = renderHook(() => useTierGate());
      result.current.openUpgradeModal('FEATURE_NOT_IN_TIER', 'INVITE_MEMBERS');
      expect(useUpgradeModalStore.getState().feature).toBe('INVITE_MEMBERS');
    });
  });

  describe('When closeUpgradeModal is called after opening', () => {
    it('Then the store isOpen is back to false', () => {
      const { result } = renderHook(() => useTierGate());
      result.current.openUpgradeModal('TIER_LIMIT_REACHED', 'WAREHOUSE');
      result.current.closeUpgradeModal();
      expect(useUpgradeModalStore.getState().isOpen).toBe(false);
    });
  });
});
