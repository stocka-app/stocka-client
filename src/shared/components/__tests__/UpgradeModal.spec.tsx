import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useUpgradeModalStore } from '@/store/upgrade-modal.store';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/store/rbac.store', () => ({
  useRBACStore: () => ({ tier: 'FREE' }),
}));

// Import after mocks are set up
import { UpgradeModal } from '@/shared/components/UpgradeModal';

function resetStore(): void {
  useUpgradeModalStore.setState({ isOpen: false, reason: null, feature: null });
}

describe('Given the UpgradeModal component renders based on store state', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    resetStore();
    user = userEvent.setup();
  });

  describe('When the modal is closed', () => {
    it('Then nothing is rendered', () => {
      const { container } = render(<UpgradeModal />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('When the modal is open with TIER_LIMIT_REACHED reason', () => {
    beforeEach(() => {
      useUpgradeModalStore.setState({
        isOpen: true,
        reason: 'TIER_LIMIT_REACHED',
        feature: 'WAREHOUSE',
      });
    });

    it('Then the modal title is rendered', () => {
      render(<UpgradeModal />);
      expect(screen.getByText('upgradeModal.title')).toBeInTheDocument();
    });

    it('Then the TIER_LIMIT_REACHED description is shown', () => {
      render(<UpgradeModal />);
      expect(screen.getByText('upgradeModal.reasonLimitReached')).toBeInTheDocument();
    });

    it('Then the current tier badge is shown', () => {
      render(<UpgradeModal />);
      expect(screen.getByText('FREE')).toBeInTheDocument();
    });

    it('Then the CTA button is visible', () => {
      render(<UpgradeModal />);
      expect(screen.getByText('upgradeModal.cta')).toBeInTheDocument();
    });

    it('Then the close button is visible', () => {
      render(<UpgradeModal />);
      expect(screen.getByText('upgradeModal.close')).toBeInTheDocument();
    });
  });

  describe('When the modal is open with FEATURE_NOT_IN_TIER reason', () => {
    beforeEach(() => {
      useUpgradeModalStore.setState({
        isOpen: true,
        reason: 'FEATURE_NOT_IN_TIER',
        feature: 'INVITE_MEMBERS',
      });
    });

    it('Then the FEATURE_NOT_IN_TIER description is shown', () => {
      render(<UpgradeModal />);
      expect(screen.getByText('upgradeModal.reasonNotInTier')).toBeInTheDocument();
    });
  });

  describe('When the user clicks the close button', () => {
    beforeEach(() => {
      useUpgradeModalStore.setState({
        isOpen: true,
        reason: 'TIER_LIMIT_REACHED',
        feature: 'WAREHOUSE',
      });
    });

    it('Then the modal closes', async () => {
      render(<UpgradeModal />);
      await user.click(screen.getByText('upgradeModal.close'));
      expect(useUpgradeModalStore.getState().isOpen).toBe(false);
    });
  });

  describe('When the user clicks the CTA button', () => {
    beforeEach(() => {
      useUpgradeModalStore.setState({
        isOpen: true,
        reason: 'TIER_LIMIT_REACHED',
        feature: 'WAREHOUSE',
      });
    });

    it('Then the modal closes (Sprint 1 placeholder)', async () => {
      render(<UpgradeModal />);
      await user.click(screen.getByText('upgradeModal.cta'));
      expect(useUpgradeModalStore.getState().isOpen).toBe(false);
    });
  });
});
