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

async function getComponent(): Promise<typeof import('@/features/team/components/RemoveMemberConfirmModal').RemoveMemberConfirmModal> {
  const { RemoveMemberConfirmModal } = await import('@/features/team/components/RemoveMemberConfirmModal');
  return RemoveMemberConfirmModal;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the RemoveMemberConfirmModal asks for member removal confirmation', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('When the modal is rendered', () => {
    it('Then the dialog is visible', async () => {
      const RemoveMemberConfirmModal = await getComponent();
      render(
        <RemoveMemberConfirmModal
          memberName="Carlos López"
          isLoading={false}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('Then the title is shown', async () => {
      const RemoveMemberConfirmModal = await getComponent();
      render(
        <RemoveMemberConfirmModal
          memberName="Carlos López"
          isLoading={false}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.getByText('removeMember.title')).toBeInTheDocument();
    });
  });

  describe('When the user confirms removal', () => {
    it('Then the onConfirm callback is called', async () => {
      const onConfirm = vi.fn();
      const RemoveMemberConfirmModal = await getComponent();
      render(
        <RemoveMemberConfirmModal
          memberName="Carlos López"
          isLoading={false}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
        />,
      );
      await user.click(screen.getByText('removeMember.confirm'));
      expect(onConfirm).toHaveBeenCalledOnce();
    });
  });

  describe('When the user cancels', () => {
    it('Then the onCancel callback is called', async () => {
      const onCancel = vi.fn();
      const RemoveMemberConfirmModal = await getComponent();
      render(
        <RemoveMemberConfirmModal
          memberName="Carlos López"
          isLoading={false}
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />,
      );
      await user.click(screen.getByText('removeMember.cancel'));
      expect(onCancel).toHaveBeenCalledOnce();
    });
  });

  describe('When the operation is loading', () => {
    it('Then both buttons are disabled', async () => {
      const RemoveMemberConfirmModal = await getComponent();
      render(
        <RemoveMemberConfirmModal
          memberName="Carlos López"
          isLoading={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.getByText('removeMember.confirm')).toBeDisabled();
      expect(screen.getByText('removeMember.cancel')).toBeDisabled();
    });
  });
});
