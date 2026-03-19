import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

// ─────────────────────────────────────────────────────────────────────────────
// Import component after mocks
// ─────────────────────────────────────────────────────────────────────────────

async function getComponent(): Promise<typeof import('@/features/team/components/RoleChangeConfirmModal').RoleChangeConfirmModal> {
  const { RoleChangeConfirmModal } = await import('@/features/team/components/RoleChangeConfirmModal');
  return RoleChangeConfirmModal;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the RoleChangeConfirmModal asks for role change confirmation', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('When the modal is rendered', () => {
    it('Then the dialog is visible', async () => {
      const RoleChangeConfirmModal = await getComponent();
      render(
        <RoleChangeConfirmModal
          memberName="Ana García"
          oldRole="MANAGER"
          newRole="BUYER"
          isLoading={false}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('Then the title is shown', async () => {
      const RoleChangeConfirmModal = await getComponent();
      render(
        <RoleChangeConfirmModal
          memberName="Ana García"
          oldRole="MANAGER"
          newRole="BUYER"
          isLoading={false}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.getByText('changeRole.title')).toBeInTheDocument();
    });
  });

  describe('When the user clicks Confirm', () => {
    it('Then the onConfirm callback is called', async () => {
      const onConfirm = vi.fn();
      const RoleChangeConfirmModal = await getComponent();
      render(
        <RoleChangeConfirmModal
          memberName="Ana García"
          oldRole="MANAGER"
          newRole="BUYER"
          isLoading={false}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />,
      );
      await user.click(screen.getByText('changeRole.confirm'));
      expect(onConfirm).toHaveBeenCalledOnce();
    });
  });

  describe('When the user clicks Cancel', () => {
    it('Then the onCancel callback is called', async () => {
      const onCancel = vi.fn();
      const RoleChangeConfirmModal = await getComponent();
      render(
        <RoleChangeConfirmModal
          memberName="Ana García"
          oldRole="MANAGER"
          newRole="BUYER"
          isLoading={false}
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />,
      );
      await user.click(screen.getByText('changeRole.cancel'));
      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe('When the operation is loading', () => {
    it('Then the confirm and cancel buttons are disabled', async () => {
      const RoleChangeConfirmModal = await getComponent();
      render(
        <RoleChangeConfirmModal
          memberName="Ana García"
          oldRole="MANAGER"
          newRole="BUYER"
          isLoading={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.getByText('changeRole.confirm')).toBeDisabled();
      expect(screen.getByText('changeRole.cancel')).toBeDisabled();
    });
  });
});
