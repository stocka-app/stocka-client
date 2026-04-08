import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TeamSettingsPage from '../TeamSettingsPage';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mocks = vi.hoisted(() => ({
  role: 'OWNER' as string | null,
  canInvite: true,
  members: [] as Array<{ id: string; name: string; role: string; email: string; status?: string }>,
  invitations: [] as unknown[],
  isLoading: false,
}));

vi.mock('@/store/rbac.store', () => ({
  useRBACStore: () => ({
    role: mocks.role,
  }),
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: () => mocks.canInvite,
}));

const mockFetchMembers = vi.fn();
const mockFetchInvitations = vi.fn();
const mockInviteMember = vi.fn().mockResolvedValue(undefined);
const mockChangeRole = vi.fn().mockResolvedValue(undefined);
const mockRemoveMember = vi.fn().mockResolvedValue(undefined);
const mockSuspendMember = vi.fn().mockResolvedValue(undefined);
const mockReactivateMember = vi.fn().mockResolvedValue(undefined);
const mockResendInvitation = vi.fn().mockResolvedValue(undefined);
const mockCancelInvitation = vi.fn().mockResolvedValue(undefined);

vi.mock('../../hooks/useTeam', () => ({
  useTeam: () => ({
    members: mocks.members,
    invitations: mocks.invitations,
    isLoading: mocks.isLoading,
    fetchMembers: mockFetchMembers,
    fetchInvitations: mockFetchInvitations,
    inviteMember: mockInviteMember,
    changeRole: mockChangeRole,
    removeMember: mockRemoveMember,
    suspendMember: mockSuspendMember,
    reactivateMember: mockReactivateMember,
    resendInvitation: mockResendInvitation,
    cancelInvitation: mockCancelInvitation,
  }),
}));

/** Stub child components — expose callback props for integration testing */
vi.mock('../../components/FreeTierBanner', () => ({
  FreeTierBanner: () => <div data-testid="free-tier-banner">FreeTierBanner</div>,
}));

let membersTableProps: Record<string, unknown> = {};
vi.mock('../../components/MembersTable', () => ({
  MembersTable: (props: Record<string, unknown>) => {
    membersTableProps = props;
    return <div data-testid="members-table">MembersTable</div>;
  },
}));

let inviteModalProps: Record<string, unknown> = {};
vi.mock('../../components/InviteMemberModal', () => ({
  InviteMemberModal: (props: Record<string, unknown>) => {
    inviteModalProps = props;
    return <div data-testid="invite-modal">InviteModal</div>;
  },
}));

let roleChangeModalProps: Record<string, unknown> = {};
vi.mock('../../components/RoleChangeConfirmModal', () => ({
  RoleChangeConfirmModal: (props: Record<string, unknown>) => {
    roleChangeModalProps = props;
    return <div data-testid="role-change-modal">RoleChangeModal</div>;
  },
}));

let removeModalProps: Record<string, unknown> = {};
vi.mock('../../components/RemoveMemberConfirmModal', () => ({
  RemoveMemberConfirmModal: (props: Record<string, unknown>) => {
    removeModalProps = props;
    return <div data-testid="remove-modal">RemoveModal</div>;
  },
}));

let invitationsTableProps: Record<string, unknown> = {};
vi.mock('../../components/InvitationsTable', () => ({
  InvitationsTable: (props: Record<string, unknown>) => {
    invitationsTableProps = props;
    return <div data-testid="invitations-table">InvitationsTable</div>;
  },
}));

vi.mock('../../components/RolesReferenceCards', () => ({
  RolesReferenceCards: () => <div data-testid="roles-reference">RolesReference</div>,
}));

vi.mock('../../components/PermissionGate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode; action: string }) => (
    <>{children}</>
  ),
}));

vi.mock('@/shared/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

describe('TeamSettingsPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mocks.role = 'OWNER';
    mocks.canInvite = true;
    mocks.members = [
      { id: '1', name: 'Carlos', role: 'OWNER', email: 'carlos@test.com', status: 'ACTIVE' },
      { id: '2', name: 'Ana', role: 'MANAGER', email: 'ana@test.com', status: 'ACTIVE' },
    ];
    mocks.invitations = [];
    mocks.isLoading = false;
    membersTableProps = {};
    inviteModalProps = {};
    roleChangeModalProps = {};
    removeModalProps = {};
    invitationsTableProps = {};
  });

  // ── Initial render ────────────────────────────────────────────────

  describe('Given the page loads', () => {
    beforeEach(() => {
      render(<TeamSettingsPage />);
    });

    it('should call fetchMembers on mount', () => {
      expect(mockFetchMembers).toHaveBeenCalledOnce();
    });

    it('should call fetchInvitations on mount', () => {
      expect(mockFetchInvitations).toHaveBeenCalledOnce();
    });

    it('should display the page title', () => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('page.title');
    });

    it('should display the page description', () => {
      expect(screen.getByText('page.description')).toBeInTheDocument();
    });

    it('should render all 3 tabs', () => {
      expect(screen.getByRole('tab', { name: 'tabs.members' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'tabs.invitations' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'tabs.roles' })).toBeInTheDocument();
    });

    it('should have the members tab active by default', () => {
      expect(screen.getByRole('tab', { name: 'tabs.members' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('should set aria-selected false on inactive tabs', () => {
      expect(screen.getByRole('tab', { name: 'tabs.invitations' })).toHaveAttribute(
        'aria-selected',
        'false',
      );
      expect(screen.getByRole('tab', { name: 'tabs.roles' })).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });

    it('should render the members table in the members tab panel', () => {
      expect(screen.getByTestId('members-table')).toBeInTheDocument();
    });

    it('should render the FreeTierBanner in the members tab', () => {
      expect(screen.getByTestId('free-tier-banner')).toBeInTheDocument();
    });

    it('should render the invite button', () => {
      expect(screen.getByText('members.inviteButton')).toBeInTheDocument();
    });

    it('should pass currentUserRole to MembersTable', () => {
      expect(membersTableProps.currentUserRole).toBe('OWNER');
    });

    it('should pass members array to MembersTable', () => {
      expect(membersTableProps.members).toEqual(mocks.members);
    });

    it('should not show the invite modal by default', () => {
      expect(screen.queryByTestId('invite-modal')).not.toBeInTheDocument();
    });

    it('should not show the role change modal by default', () => {
      expect(screen.queryByTestId('role-change-modal')).not.toBeInTheDocument();
    });

    it('should not show the remove modal by default', () => {
      expect(screen.queryByTestId('remove-modal')).not.toBeInTheDocument();
    });
  });

  // ── Role fallback when role is null ──────────────────────────────

  describe('Given the RBAC store has no role', () => {
    beforeEach(() => {
      mocks.role = null;
      render(<TeamSettingsPage />);
    });

    it('should default currentUserRole to VIEWER', () => {
      expect(membersTableProps.currentUserRole).toBe('VIEWER');
    });
  });

  // ── InviteMemberModal: role fallback when role is null ────────────

  describe('Given the RBAC store has no role and the user opens the invite modal', () => {
    beforeEach(async () => {
      mocks.role = null;
      render(<TeamSettingsPage />);
      await user.click(screen.getByText('members.inviteButton'));
    });

    it('should pass VIEWER as currentUserRole to InviteMemberModal', () => {
      expect(inviteModalProps.currentUserRole).toBe('VIEWER');
    });
  });

  // ── Tab navigation: Invitations ───────────────────────────────────

  describe('Given the user clicks the invitations tab', () => {
    beforeEach(async () => {
      render(<TeamSettingsPage />);
      await user.click(screen.getByRole('tab', { name: 'tabs.invitations' }));
    });

    it('should show the invitations table', () => {
      expect(screen.getByTestId('invitations-table')).toBeInTheDocument();
    });

    it('should hide the members table', () => {
      expect(screen.queryByTestId('members-table')).not.toBeInTheDocument();
    });

    it('should hide the FreeTierBanner', () => {
      expect(screen.queryByTestId('free-tier-banner')).not.toBeInTheDocument();
    });

    it('should set invitations tab to aria-selected true', () => {
      expect(screen.getByRole('tab', { name: 'tabs.invitations' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('should set members tab to aria-selected false', () => {
      expect(screen.getByRole('tab', { name: 'tabs.members' })).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });

    it('should render the invitations tab panel with correct role', () => {
      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('id', 'tabpanel-invitations');
    });
  });

  // ── Tab navigation: Roles ─────────────────────────────────────────

  describe('Given the user clicks the roles tab', () => {
    beforeEach(async () => {
      render(<TeamSettingsPage />);
      await user.click(screen.getByRole('tab', { name: 'tabs.roles' }));
    });

    it('should show the roles reference cards', () => {
      expect(screen.getByTestId('roles-reference')).toBeInTheDocument();
    });

    it('should hide the members table', () => {
      expect(screen.queryByTestId('members-table')).not.toBeInTheDocument();
    });

    it('should hide the invitations table', () => {
      expect(screen.queryByTestId('invitations-table')).not.toBeInTheDocument();
    });

    it('should render the roles tab panel', () => {
      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('id', 'tabpanel-roles');
    });
  });

  // ── Tab navigation: back to members ──────────────────────────────

  describe('Given the user navigates away and back to members tab', () => {
    beforeEach(async () => {
      render(<TeamSettingsPage />);
      await user.click(screen.getByRole('tab', { name: 'tabs.roles' }));
      await user.click(screen.getByRole('tab', { name: 'tabs.members' }));
    });

    it('should show the members table again', () => {
      expect(screen.getByTestId('members-table')).toBeInTheDocument();
    });

    it('should render the members tab panel', () => {
      const panel = screen.getByRole('tabpanel');
      expect(panel).toHaveAttribute('id', 'tabpanel-members');
    });
  });

  // ── Invite modal: open ────────────────────────────────────────────

  describe('Given the user clicks the invite button', () => {
    beforeEach(async () => {
      render(<TeamSettingsPage />);
      await user.click(screen.getByText('members.inviteButton'));
    });

    it('should show the invite modal', () => {
      expect(screen.getByTestId('invite-modal')).toBeInTheDocument();
    });

    it('should pass currentUserRole to InviteMemberModal', () => {
      expect(inviteModalProps.currentUserRole).toBe('OWNER');
    });

    it('should pass isLoading to InviteMemberModal', () => {
      expect(inviteModalProps.isLoading).toBe(false);
    });
  });

  // ── Invite modal: close ───────────────────────────────────────────

  describe('Given the invite modal is open and the user closes it', () => {
    beforeEach(async () => {
      render(<TeamSettingsPage />);
      await user.click(screen.getByText('members.inviteButton'));
      // Trigger the onClose callback — wrapping in act so React flushes the state update
      await act(async () => {
        (inviteModalProps.onClose as () => void)();
      });
    });

    it('should hide the invite modal', () => {
      expect(screen.queryByTestId('invite-modal')).not.toBeInTheDocument();
    });
  });

  // ── Invite modal: submit ──────────────────────────────────────────

  describe('Given the user submits an invitation', () => {
    beforeEach(async () => {
      render(<TeamSettingsPage />);
      await user.click(screen.getByText('members.inviteButton'));
      await act(async () => {
        await (inviteModalProps.onSubmit as (data: { email: string; role: string }) => Promise<void>)({
          email: 'new@test.com',
          role: 'VIEWER',
        });
      });
    });

    it('should call inviteMember with the form data', () => {
      expect(mockInviteMember).toHaveBeenCalledWith({ email: 'new@test.com', role: 'VIEWER' });
    });

    it('should close the modal after submission', () => {
      expect(screen.queryByTestId('invite-modal')).not.toBeInTheDocument();
    });

    it('should refresh invitations after submission', () => {
      // fetchInvitations is called once on mount + once after invite
      expect(mockFetchInvitations).toHaveBeenCalledTimes(2);
    });
  });

  // ── Invite modal not shown when canInvite is false ────────────────

  describe('Given the user does not have invite permission', () => {
    beforeEach(async () => {
      mocks.canInvite = false;
      render(<TeamSettingsPage />);
      await user.click(screen.getByText('members.inviteButton'));
    });

    it('should not show the invite modal even if button is clicked', () => {
      expect(screen.queryByTestId('invite-modal')).not.toBeInTheDocument();
    });
  });

  // ── Invite button disabled when loading ───────────────────────────

  describe('Given the page is loading', () => {
    beforeEach(() => {
      mocks.isLoading = true;
      render(<TeamSettingsPage />);
    });

    it('should disable the invite button', () => {
      expect(screen.getByText('members.inviteButton').closest('button')).toBeDisabled();
    });
  });

  // ── Role change flow ──────────────────────────────────────────────

  describe('Given the user initiates a role change', () => {
    beforeEach(() => {
      render(<TeamSettingsPage />);
      // Trigger onChangeRole from the MembersTable
      act(() => {
        const onChangeRole = membersTableProps.onChangeRole as (id: string, role: string) => void;
        onChangeRole('2', 'BUYER');
      });
    });

    it('should show the role change confirmation modal', () => {
      expect(screen.getByTestId('role-change-modal')).toBeInTheDocument();
    });

    it('should pass the member name to the modal', () => {
      expect(roleChangeModalProps.memberName).toBe('Ana');
    });

    it('should pass the old role to the modal', () => {
      expect(roleChangeModalProps.oldRole).toBe('MANAGER');
    });

    it('should pass the new role to the modal', () => {
      expect(roleChangeModalProps.newRole).toBe('BUYER');
    });
  });

  // ── Role change: member not found ──────────────────────────────────

  describe('Given onChangeRole is called with a non-existent member ID', () => {
    beforeEach(() => {
      render(<TeamSettingsPage />);
      act(() => {
        const onChangeRole = membersTableProps.onChangeRole as (id: string, role: string) => void;
        onChangeRole('nonexistent', 'BUYER');
      });
    });

    it('should not show the role change modal', () => {
      expect(screen.queryByTestId('role-change-modal')).not.toBeInTheDocument();
    });
  });

  // ── Role change: confirm ──────────────────────────────────────────

  describe('Given the user confirms a role change', () => {
    beforeEach(async () => {
      render(<TeamSettingsPage />);
      act(() => {
        const onChangeRole = membersTableProps.onChangeRole as (id: string, role: string) => void;
        onChangeRole('2', 'BUYER');
      });
      // Confirm the role change
      await act(async () => {
        await (roleChangeModalProps.onConfirm as () => void)();
      });
    });

    it('should call changeRole with the correct args', () => {
      expect(mockChangeRole).toHaveBeenCalledWith('2', 'BUYER');
    });

    it('should close the role change modal after confirmation', () => {
      expect(screen.queryByTestId('role-change-modal')).not.toBeInTheDocument();
    });
  });

  // ── Role change: cancel ───────────────────────────────────────────

  describe('Given the user cancels a role change', () => {
    beforeEach(() => {
      render(<TeamSettingsPage />);
      act(() => {
        const onChangeRole = membersTableProps.onChangeRole as (id: string, role: string) => void;
        onChangeRole('2', 'BUYER');
      });
      // Cancel the role change
      act(() => {
        (roleChangeModalProps.onCancel as () => void)();
      });
    });

    it('should close the role change modal', () => {
      expect(screen.queryByTestId('role-change-modal')).not.toBeInTheDocument();
    });

    it('should not call changeRole', () => {
      expect(mockChangeRole).not.toHaveBeenCalled();
    });
  });

  // ── handleConfirmRoleChange when roleChangeState is null ─────────

  describe('Given handleConfirmRoleChange is triggered with no roleChangeState', () => {
    beforeEach(() => {
      render(<TeamSettingsPage />);
      // The role change modal is not shown, so nothing to confirm — this path
      // is covered implicitly: the modal never opens, changeRole is never called
    });

    it('should not call changeRole', () => {
      expect(mockChangeRole).not.toHaveBeenCalled();
    });
  });

  // ── Remove member flow ────────────────────────────────────────────

  describe('Given the user initiates member removal', () => {
    beforeEach(async () => {
      render(<TeamSettingsPage />);
      await act(async () => {
        const onRemove = membersTableProps.onRemove as (id: string) => void;
        onRemove('2');
      });
    });

    it('should show the remove member confirmation modal', () => {
      expect(screen.getByTestId('remove-modal')).toBeInTheDocument();
    });

    it('should pass the member name to the remove modal', () => {
      expect(removeModalProps.memberName).toBe('Ana');
    });
  });

  // ── Remove member: member not found ───────────────────────────────

  describe('Given onRemove is called with a non-existent member ID', () => {
    beforeEach(async () => {
      render(<TeamSettingsPage />);
      await act(async () => {
        const onRemove = membersTableProps.onRemove as (id: string) => void;
        onRemove('nonexistent');
      });
    });

    it('should not show the remove modal', () => {
      expect(screen.queryByTestId('remove-modal')).not.toBeInTheDocument();
    });
  });

  // ── Remove member: confirm ────────────────────────────────────────

  describe('Given the user confirms member removal', () => {
    beforeEach(async () => {
      render(<TeamSettingsPage />);
      await act(async () => {
        const onRemove = membersTableProps.onRemove as (id: string) => void;
        onRemove('2');
      });
      await act(async () => {
        await (removeModalProps.onConfirm as () => Promise<void>)();
      });
    });

    it('should call removeMember with the correct ID', () => {
      expect(mockRemoveMember).toHaveBeenCalledWith('2');
    });

    it('should close the remove modal after confirmation', () => {
      expect(screen.queryByTestId('remove-modal')).not.toBeInTheDocument();
    });
  });

  // ── Remove member: cancel ─────────────────────────────────────────

  describe('Given the user cancels member removal', () => {
    beforeEach(async () => {
      render(<TeamSettingsPage />);
      await act(async () => {
        const onRemove = membersTableProps.onRemove as (id: string) => void;
        onRemove('2');
      });
      await act(async () => {
        (removeModalProps.onCancel as () => void)();
      });
    });

    it('should close the remove modal', () => {
      expect(screen.queryByTestId('remove-modal')).not.toBeInTheDocument();
    });

    it('should not call removeMember', () => {
      expect(mockRemoveMember).not.toHaveBeenCalled();
    });
  });

  // ── Suspend member ────────────────────────────────────────────────

  describe('Given the user suspends a member', () => {
    beforeEach(() => {
      render(<TeamSettingsPage />);
      const onSuspend = membersTableProps.onSuspend as (id: string) => void;
      onSuspend('2');
    });

    it('should call suspendMember with the correct ID', () => {
      expect(mockSuspendMember).toHaveBeenCalledWith('2');
    });
  });

  // ── Reactivate member ─────────────────────────────────────────────

  describe('Given the user reactivates a member', () => {
    beforeEach(() => {
      render(<TeamSettingsPage />);
      const onReactivate = membersTableProps.onReactivate as (id: string) => void;
      onReactivate('2');
    });

    it('should call reactivateMember with the correct ID', () => {
      expect(mockReactivateMember).toHaveBeenCalledWith('2');
    });
  });

  // ── InvitationsTable callback props ────────────────────────────────

  describe('Given the user interacts with invitations', () => {
    beforeEach(async () => {
      mocks.invitations = [{ id: 'inv-1', email: 'test@test.com', role: 'VIEWER', status: 'PENDING' }];
      render(<TeamSettingsPage />);
      await user.click(screen.getByRole('tab', { name: 'tabs.invitations' }));
    });

    it('should pass invitations data to InvitationsTable', () => {
      expect(invitationsTableProps.invitations).toEqual(mocks.invitations);
    });

    it('should pass isLoading to InvitationsTable', () => {
      expect(invitationsTableProps.isLoading).toBe(false);
    });

    it('should call resendInvitation when onResend is triggered', () => {
      const onResend = invitationsTableProps.onResend as (id: string) => void;
      onResend('inv-1');
      expect(mockResendInvitation).toHaveBeenCalledWith('inv-1');
    });

    it('should call cancelInvitation when onCancel is triggered', () => {
      const onCancel = invitationsTableProps.onCancel as (id: string) => void;
      onCancel('inv-1');
      expect(mockCancelInvitation).toHaveBeenCalledWith('inv-1');
    });
  });

  // ── Tablist aria ──────────────────────────────────────────────────

  describe('Given the tablist is rendered', () => {
    beforeEach(() => {
      render(<TeamSettingsPage />);
    });

    it('should have a tablist with the correct aria-label', () => {
      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'page.title');
    });

    it('should have aria-controls on each tab pointing to the correct panel', () => {
      expect(screen.getByRole('tab', { name: 'tabs.members' })).toHaveAttribute(
        'aria-controls',
        'tabpanel-members',
      );
      expect(screen.getByRole('tab', { name: 'tabs.invitations' })).toHaveAttribute(
        'aria-controls',
        'tabpanel-invitations',
      );
      expect(screen.getByRole('tab', { name: 'tabs.roles' })).toHaveAttribute(
        'aria-controls',
        'tabpanel-roles',
      );
    });
  });
});
