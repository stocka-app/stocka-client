import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TenantMember } from '@/features/team/types/team.types';

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

const baseMembers: TenantMember[] = [
  {
    id: 'member-001',
    userId: 'user-001',
    name: 'Roberto Medina',
    email: 'roberto@stocka.mx',
    role: 'OWNER',
    status: 'ACTIVE',
    joinedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'member-002',
    userId: 'user-002',
    name: 'Ana García',
    email: 'ana@stocka.mx',
    role: 'MANAGER',
    status: 'ACTIVE',
    joinedAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'member-003',
    userId: 'user-003',
    name: 'Carlos López',
    email: 'carlos@stocka.mx',
    role: 'VIEWER',
    status: 'SUSPENDED',
    joinedAt: '2026-02-15T00:00:00.000Z',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Import component after mocks
// ─────────────────────────────────────────────────────────────────────────────

async function getComponent(): Promise<typeof import('@/features/team/components/MembersTable').MembersTable> {
  const { MembersTable } = await import('@/features/team/components/MembersTable');
  return MembersTable;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the MembersTable displays team members', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    // Default: OWNER with all permissions
    mockCanDo.mockReturnValue(true);
  });

  describe('When there are no members', () => {
    it('Then the empty state message is shown', async () => {
      const MembersTable = await getComponent();
      render(
        <MembersTable
          members={[]}
          currentUserRole="OWNER"
          onChangeRole={vi.fn()}
          onSuspend={vi.fn()}
          onReactivate={vi.fn()}
          onRemove={vi.fn()}
        />,
      );
      expect(screen.getByText('members.empty')).toBeInTheDocument();
    });
  });

  describe('When members are loaded', () => {
    it('Then each member name is displayed', async () => {
      const MembersTable = await getComponent();
      render(
        <MembersTable
          members={baseMembers}
          currentUserRole="OWNER"
          onChangeRole={vi.fn()}
          onSuspend={vi.fn()}
          onReactivate={vi.fn()}
          onRemove={vi.fn()}
        />,
      );
      expect(screen.getByText('Roberto Medina')).toBeInTheDocument();
      expect(screen.getByText('Ana García')).toBeInTheDocument();
    });

    it('Then member emails are displayed', async () => {
      const MembersTable = await getComponent();
      render(
        <MembersTable
          members={baseMembers}
          currentUserRole="OWNER"
          onChangeRole={vi.fn()}
          onSuspend={vi.fn()}
          onReactivate={vi.fn()}
          onRemove={vi.fn()}
        />,
      );
      expect(screen.getByText('roberto@stocka.mx')).toBeInTheDocument();
      expect(screen.getByText('ana@stocka.mx')).toBeInTheDocument();
    });
  });

  describe('When the current user is an OWNER with role change permission', () => {
    it('Then non-owner members show a role dropdown', async () => {
      const MembersTable = await getComponent();
      render(
        <MembersTable
          members={baseMembers}
          currentUserRole="OWNER"
          onChangeRole={vi.fn()}
          onSuspend={vi.fn()}
          onReactivate={vi.fn()}
          onRemove={vi.fn()}
        />,
      );
      const roleSelects = screen.getAllByRole('combobox');
      expect(roleSelects.length).toBeGreaterThan(0);
    });
  });

  describe('When the user does not have role change permission', () => {
    beforeEach(() => {
      mockCanDo.mockImplementation((action: string) => action !== 'MEMBER_UPDATE_ROLE');
    });

    it('Then role dropdowns are not shown', async () => {
      const MembersTable = await getComponent();
      render(
        <MembersTable
          members={baseMembers}
          currentUserRole="VIEWER"
          onChangeRole={vi.fn()}
          onSuspend={vi.fn()}
          onReactivate={vi.fn()}
          onRemove={vi.fn()}
        />,
      );
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });

  describe('When an OWNER selects a new role for a non-owner member', () => {
    it('Then the onChangeRole callback is called with the correct arguments', async () => {
      const onChangeRole = vi.fn();
      const MembersTable = await getComponent();
      render(
        <MembersTable
          members={baseMembers}
          currentUserRole="OWNER"
          onChangeRole={onChangeRole}
          onSuspend={vi.fn()}
          onReactivate={vi.fn()}
          onRemove={vi.fn()}
        />,
      );
      const selects = screen.getAllByRole('combobox');
      await user.selectOptions(selects[0], 'BUYER');
      expect(onChangeRole).toHaveBeenCalled();
    });
  });

  describe('When a member is suspended', () => {
    it('Then the member status shows as suspended', async () => {
      const MembersTable = await getComponent();
      render(
        <MembersTable
          members={baseMembers}
          currentUserRole="OWNER"
          onChangeRole={vi.fn()}
          onSuspend={vi.fn()}
          onReactivate={vi.fn()}
          onRemove={vi.fn()}
        />,
      );
      expect(screen.getByText('status.SUSPENDED')).toBeInTheDocument();
    });
  });

  describe('When the user does not have remove permission', () => {
    beforeEach(() => {
      mockCanDo.mockReturnValue(false);
    });

    it('Then the actions menu is hidden for non-owner members', async () => {
      const MembersTable = await getComponent();
      render(
        <MembersTable
          members={baseMembers}
          currentUserRole="VIEWER"
          onChangeRole={vi.fn()}
          onSuspend={vi.fn()}
          onReactivate={vi.fn()}
          onRemove={vi.fn()}
        />,
      );
      // No actions menu visible since PermissionGate hides it
      expect(screen.queryByLabelText('members.table.actions')).not.toBeInTheDocument();
    });
  });

  describe('When an OWNER opens the actions menu for an active member', () => {
    it('Then clicking Suspend calls the onSuspend callback', async () => {
      const onSuspend = vi.fn();
      const MembersTable = await getComponent();
      render(
        <MembersTable
          members={baseMembers}
          currentUserRole="OWNER"
          onChangeRole={vi.fn()}
          onSuspend={onSuspend}
          onReactivate={vi.fn()}
          onRemove={vi.fn()}
        />,
      );
      // Open the actions menu for Ana García (active, non-owner)
      const triggers = screen.getAllByLabelText('members.table.actions');
      await user.click(triggers[0]);
      const suspendItem = await screen.findByText('actions.suspend');
      await user.click(suspendItem);
      expect(onSuspend).toHaveBeenCalledWith('member-002');
    });

    it('Then clicking Remove calls the onRemove callback', async () => {
      const onRemove = vi.fn();
      const MembersTable = await getComponent();
      render(
        <MembersTable
          members={baseMembers}
          currentUserRole="OWNER"
          onChangeRole={vi.fn()}
          onSuspend={vi.fn()}
          onReactivate={vi.fn()}
          onRemove={onRemove}
        />,
      );
      const triggers = screen.getAllByLabelText('members.table.actions');
      await user.click(triggers[0]);
      const removeItem = await screen.findByText('actions.remove');
      await user.click(removeItem);
      expect(onRemove).toHaveBeenCalledWith('member-002');
    });
  });

  describe('When an OWNER opens the actions menu for a suspended member', () => {
    it('Then clicking Reactivate calls the onReactivate callback', async () => {
      const onReactivate = vi.fn();
      const MembersTable = await getComponent();
      render(
        <MembersTable
          members={baseMembers}
          currentUserRole="OWNER"
          onChangeRole={vi.fn()}
          onSuspend={vi.fn()}
          onReactivate={onReactivate}
          onRemove={vi.fn()}
        />,
      );
      // Carlos López is suspended — triggers[1] is their actions menu
      const triggers = screen.getAllByLabelText('members.table.actions');
      await user.click(triggers[1]);
      const reactivateItem = await screen.findByText('actions.reactivate');
      await user.click(reactivateItem);
      expect(onReactivate).toHaveBeenCalledWith('member-003');
    });
  });
});
