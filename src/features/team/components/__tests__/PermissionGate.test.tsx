import { render, screen } from '@testing-library/react';

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
// Import component after mocks
// ─────────────────────────────────────────────────────────────────────────────

async function getComponent(): Promise<typeof import('@/features/team/components/PermissionGate').PermissionGate> {
  const { PermissionGate } = await import('@/features/team/components/PermissionGate');
  return PermissionGate;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the PermissionGate controls access to UI elements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('When the user has permission for the action', () => {
    beforeEach(() => {
      mockCanDo.mockReturnValue(true);
    });

    it('Then the children are rendered', async () => {
      const PermissionGate = await getComponent();
      render(
        <PermissionGate action="INVITE_MEMBERS">
          <button type="button">Invite</button>
        </PermissionGate>,
      );
      expect(screen.getByRole('button', { name: 'Invite' })).toBeInTheDocument();
    });
  });

  describe('When the user does not have permission', () => {
    beforeEach(() => {
      mockCanDo.mockReturnValue(false);
    });

    it('Then children are hidden by default (hide mode)', async () => {
      const PermissionGate = await getComponent();
      render(
        <PermissionGate action="INVITE_MEMBERS">
          <button type="button">Invite</button>
        </PermissionGate>,
      );
      expect(screen.queryByRole('button', { name: 'Invite' })).not.toBeInTheDocument();
    });

    it('Then a custom fallback is shown when provided', async () => {
      const PermissionGate = await getComponent();
      render(
        <PermissionGate action="INVITE_MEMBERS" fallback={<span>No access</span>}>
          <button type="button">Invite</button>
        </PermissionGate>,
      );
      expect(screen.getByText('No access')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Invite' })).not.toBeInTheDocument();
    });

    it('Then children are rendered as disabled when mode is disable', async () => {
      const PermissionGate = await getComponent();
      render(
        <PermissionGate action="INVITE_MEMBERS" mode="disable">
          <button type="button">Invite</button>
        </PermissionGate>,
      );
      const wrapper = screen.getByText('Invite').closest('[aria-disabled="true"]');
      expect(wrapper).toBeInTheDocument();
    });

    it('Then the null fallback is rendered when no fallback is provided', async () => {
      const PermissionGate = await getComponent();
      const { container } = render(
        <PermissionGate action="INVITE_MEMBERS">
          <button type="button">Invite</button>
        </PermissionGate>,
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('When children are a complex subtree', () => {
    beforeEach(() => {
      mockCanDo.mockReturnValue(true);
    });

    it('Then all nested children are rendered', async () => {
      const PermissionGate = await getComponent();
      render(
        <PermissionGate action="CREATE_PRODUCT">
          <div>
            <span>Label</span>
            <button type="button">Create</button>
          </div>
        </PermissionGate>,
      );
      expect(screen.getByText('Label')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });
  });
});

