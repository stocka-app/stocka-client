import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUpgradeModalStore } from '@/store/upgrade-modal.store';

const mockOpenUpgradeModal = vi.fn();

vi.mock('@/shared/hooks/useTierGate', () => ({
  useTierGate: () => ({
    openUpgradeModal: mockOpenUpgradeModal,
    closeUpgradeModal: vi.fn(),
    isOpen: false,
  }),
}));

import { TierGate } from '@/shared/components/TierGate';

function resetStore(): void {
  useUpgradeModalStore.setState({ isOpen: false, reason: null, feature: null });
}

describe('Given TierGate controls rendering based on tier access', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    resetStore();
    mockOpenUpgradeModal.mockClear();
    user = userEvent.setup();
  });

  describe('When allowed is true', () => {
    it('Then children are rendered', () => {
      render(
        <TierGate allowed={true}>
          <span>Protected content</span>
        </TierGate>,
      );
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    it('Then no disabled wrapper is applied', () => {
      render(
        <TierGate allowed={true}>
          <span>Protected content</span>
        </TierGate>,
      );
      const content = screen.getByText('Protected content');
      expect(content.parentElement?.getAttribute('aria-disabled')).toBeNull();
    });
  });

  describe('When allowed is false and a fallback is provided', () => {
    it('Then the fallback is rendered instead of children', () => {
      render(
        <TierGate
          allowed={false}
          fallback={<span>Upgrade fallback</span>}
          reason="FEATURE_NOT_IN_TIER"
          feature="WAREHOUSE"
        >
          <span>Protected content</span>
        </TierGate>,
      );
      expect(screen.getByText('Upgrade fallback')).toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    it('Then clicking the fallback calls openUpgradeModal', async () => {
      render(
        <TierGate
          allowed={false}
          fallback={<span>Upgrade fallback</span>}
          reason="FEATURE_NOT_IN_TIER"
          feature="WAREHOUSE"
        >
          <span>Protected content</span>
        </TierGate>,
      );
      await user.click(screen.getByText('Upgrade fallback'));
      expect(mockOpenUpgradeModal).toHaveBeenCalledWith('FEATURE_NOT_IN_TIER', 'WAREHOUSE');
    });

    it('Then pressing Enter on the fallback calls openUpgradeModal', async () => {
      render(
        <TierGate
          allowed={false}
          fallback={<span>Upgrade fallback</span>}
          reason="FEATURE_NOT_IN_TIER"
          feature="WAREHOUSE"
        >
          <span>Protected content</span>
        </TierGate>,
      );
      const fallbackWrapper = screen.getByRole('button');
      fallbackWrapper.focus();
      await user.keyboard('{Enter}');
      expect(mockOpenUpgradeModal).toHaveBeenCalledWith('FEATURE_NOT_IN_TIER', 'WAREHOUSE');
    });

    it('Then pressing Space on the fallback calls openUpgradeModal', async () => {
      render(
        <TierGate
          allowed={false}
          fallback={<span>Upgrade fallback</span>}
          reason="FEATURE_NOT_IN_TIER"
          feature="WAREHOUSE"
        >
          <span>Protected content</span>
        </TierGate>,
      );
      const fallbackWrapper = screen.getByRole('button');
      fallbackWrapper.focus();
      await user.keyboard(' ');
      expect(mockOpenUpgradeModal).toHaveBeenCalledWith('FEATURE_NOT_IN_TIER', 'WAREHOUSE');
    });
  });

  describe('When allowed is false and no fallback is provided', () => {
    it('Then children are rendered with disabled styling', () => {
      render(
        <TierGate allowed={false}>
          <span>Protected content</span>
        </TierGate>,
      );
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    it('Then the wrapper has aria-disabled', () => {
      render(
        <TierGate allowed={false}>
          <span>Protected content</span>
        </TierGate>,
      );
      const content = screen.getByText('Protected content');
      expect(content.parentElement?.getAttribute('aria-disabled')).toBe('true');
    });

    it('Then the wrapper has pointer-events-none styling', () => {
      render(
        <TierGate allowed={false}>
          <span>Protected content</span>
        </TierGate>,
      );
      const content = screen.getByText('Protected content');
      expect(content.parentElement?.className).toContain('pointer-events-none');
    });
  });

  describe('When allowed is false with fallback but no feature provided', () => {
    it('Then clicking the fallback does not call openUpgradeModal', async () => {
      render(
        <TierGate allowed={false} fallback={<span>Upgrade fallback</span>} feature="">
          <span>Protected content</span>
        </TierGate>,
      );
      await user.click(screen.getByText('Upgrade fallback'));
      expect(mockOpenUpgradeModal).not.toHaveBeenCalled();
    });
  });

  describe('When allowed is false with fallback and user presses an unrelated key', () => {
    it('Then openUpgradeModal is not called', async () => {
      render(
        <TierGate
          allowed={false}
          fallback={<span>Upgrade fallback</span>}
          reason="FEATURE_NOT_IN_TIER"
          feature="WAREHOUSE"
        >
          <span>Protected content</span>
        </TierGate>,
      );
      const fallbackWrapper = screen.getByRole('button');
      fallbackWrapper.focus();
      await user.keyboard('{Tab}');
      expect(mockOpenUpgradeModal).not.toHaveBeenCalled();
    });
  });
});
