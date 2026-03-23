import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IndividualGrant } from '@/features/team/types/team.types';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockCanDo = vi.fn();

vi.mock('@/store/rbac.store', () => ({
  useRBACStore: () => ({ canDo: mockCanDo }),
}));

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const existingGrant: IndividualGrant = {
  memberId: 'member-003',
  action: 'MEMBER_INVITE',
  grantedAt: '2026-03-10T00:00:00.000Z',
  grantedBy: 'member-001',
};

// ─────────────────────────────────────────────────────────────────────────────
// Import component after mocks
// ─────────────────────────────────────────────────────────────────────────────

async function getComponent(): Promise<typeof import('@/features/team/components/MemberGrantsSection').MemberGrantsSection> {
  const { MemberGrantsSection } = await import('@/features/team/components/MemberGrantsSection');
  return MemberGrantsSection;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the MemberGrantsSection manages individual permissions', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('When the current user has no grantable actions', () => {
    beforeEach(() => {
      mockCanDo.mockReturnValue(false);
    });

    it('Then the empty state is shown', async () => {
      const MemberGrantsSection = await getComponent();
      render(
        <MemberGrantsSection
          memberId="member-003"
          grants={[]}
          isLoading={false}
          onAddGrant={vi.fn()}
          onRemoveGrant={vi.fn()}
        />,
      );
      expect(screen.getByText('grants.empty')).toBeInTheDocument();
    });
  });

  describe('When the current user can grant some actions', () => {
    beforeEach(() => {
      // Only allow MEMBER_INVITE and MEMBER_READ
      mockCanDo.mockImplementation((action: string) =>
        action === 'MEMBER_INVITE' || action === 'MEMBER_READ',
      );
    });

    it('Then only grantable actions are shown', async () => {
      const MemberGrantsSection = await getComponent();
      render(
        <MemberGrantsSection
          memberId="member-003"
          grants={[]}
          isLoading={false}
          onAddGrant={vi.fn()}
          onRemoveGrant={vi.fn()}
        />,
      );
      expect(screen.getByText('MEMBER_INVITE')).toBeInTheDocument();
      expect(screen.getByText('MEMBER_READ')).toBeInTheDocument();
      expect(screen.queryByText('TENANT_SETTINGS_UPDATE')).not.toBeInTheDocument();
    });

    it('Then actions without grants show an Add button', async () => {
      const MemberGrantsSection = await getComponent();
      render(
        <MemberGrantsSection
          memberId="member-003"
          grants={[]}
          isLoading={false}
          onAddGrant={vi.fn()}
          onRemoveGrant={vi.fn()}
        />,
      );
      const addButtons = screen.getAllByText('grants.add');
      expect(addButtons.length).toBeGreaterThan(0);
    });
  });

  describe('When a member already has a grant', () => {
    beforeEach(() => {
      mockCanDo.mockImplementation((action: string) =>
        action === 'MEMBER_INVITE' || action === 'MEMBER_READ',
      );
    });

    it('Then the granted action shows a Remove button instead of Add', async () => {
      const MemberGrantsSection = await getComponent();
      render(
        <MemberGrantsSection
          memberId="member-003"
          grants={[existingGrant]}
          isLoading={false}
          onAddGrant={vi.fn()}
          onRemoveGrant={vi.fn()}
        />,
      );
      // MEMBER_INVITE already granted → should show Remove
      expect(screen.getByText('grants.remove')).toBeInTheDocument();
    });
  });

  describe('When the user clicks the Add button for an action', () => {
    beforeEach(() => {
      mockCanDo.mockImplementation((action: string) => action === 'MEMBER_READ');
    });

    it('Then the onAddGrant callback is called with the correct arguments', async () => {
      const onAddGrant = vi.fn().mockResolvedValue(undefined);
      const MemberGrantsSection = await getComponent();
      render(
        <MemberGrantsSection
          memberId="member-003"
          grants={[]}
          isLoading={false}
          onAddGrant={onAddGrant}
          onRemoveGrant={vi.fn()}
        />,
      );
      await user.click(screen.getByText('grants.add'));
      expect(onAddGrant).toHaveBeenCalledWith('member-003', 'MEMBER_READ');
    });
  });

  describe('When the user clicks the Remove button for a granted action', () => {
    beforeEach(() => {
      mockCanDo.mockImplementation((action: string) => action === 'MEMBER_INVITE');
    });

    it('Then the onRemoveGrant callback is called with the correct arguments', async () => {
      const onRemoveGrant = vi.fn().mockResolvedValue(undefined);
      const MemberGrantsSection = await getComponent();
      render(
        <MemberGrantsSection
          memberId="member-003"
          grants={[existingGrant]}
          isLoading={false}
          onAddGrant={vi.fn()}
          onRemoveGrant={onRemoveGrant}
        />,
      );
      await user.click(screen.getByText('grants.remove'));
      expect(onRemoveGrant).toHaveBeenCalledWith('member-003', 'MEMBER_INVITE');
    });
  });

  describe('When the section is in loading state', () => {
    beforeEach(() => {
      mockCanDo.mockImplementation((action: string) => action === 'MEMBER_INVITE');
    });

    it('Then action buttons are disabled', async () => {
      const MemberGrantsSection = await getComponent();
      render(
        <MemberGrantsSection
          memberId="member-003"
          grants={[]}
          isLoading={true}
          onAddGrant={vi.fn()}
          onRemoveGrant={vi.fn()}
        />,
      );
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });
});
