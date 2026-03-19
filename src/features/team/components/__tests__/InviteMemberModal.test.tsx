import { render, screen, waitFor } from '@testing-library/react';
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

async function getComponent(): Promise<typeof import('@/features/team/components/InviteMemberModal').InviteMemberModal> {
  const { InviteMemberModal } = await import('@/features/team/components/InviteMemberModal');
  return InviteMemberModal;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the InviteMemberModal allows inviting team members', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('When the modal is rendered', () => {
    it('Then the modal dialog is visible', async () => {
      const InviteMemberModal = await getComponent();
      render(
        <InviteMemberModal
          currentUserRole="OWNER"
          isLoading={false}
          onSubmit={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('Then the email input is present', async () => {
      const InviteMemberModal = await getComponent();
      render(
        <InviteMemberModal
          currentUserRole="OWNER"
          isLoading={false}
          onSubmit={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByRole('textbox', { name: 'invite.email' })).toBeInTheDocument();
    });
  });

  describe('When the user clicks the cancel button', () => {
    it('Then the onClose callback is called', async () => {
      const onClose = vi.fn();
      const InviteMemberModal = await getComponent();
      render(
        <InviteMemberModal
          currentUserRole="OWNER"
          isLoading={false}
          onSubmit={vi.fn()}
          onClose={onClose}
        />,
      );
      await user.click(screen.getByText('invite.cancel'));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });

  describe('When the user submits the form without filling required fields', () => {
    it('Then validation errors are shown', async () => {
      const InviteMemberModal = await getComponent();
      render(
        <InviteMemberModal
          currentUserRole="OWNER"
          isLoading={false}
          onSubmit={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      await user.click(screen.getByText('invite.submit'));
      await waitFor(() => {
        expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
      });
    });
  });

  describe('When the user submits the form with valid email and role', () => {
    it('Then the onSubmit callback is called', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const InviteMemberModal = await getComponent();
      render(
        <InviteMemberModal
          currentUserRole="OWNER"
          isLoading={false}
          onSubmit={onSubmit}
          onClose={vi.fn()}
        />,
      );
      await user.type(screen.getByRole('textbox', { name: 'invite.email' }), 'test@company.com');
      const roleSelect = screen.getByRole('combobox', { name: 'invite.role' });
      await user.selectOptions(roleSelect, 'MANAGER');
      await user.click(screen.getByText('invite.submit'));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
        const [firstArg] = onSubmit.mock.calls[0];
        expect(firstArg).toMatchObject({ email: 'test@company.com', role: 'MANAGER' });
      });
    });
  });

  describe('When isLoading is true', () => {
    it('Then the submit and cancel buttons are disabled', async () => {
      const InviteMemberModal = await getComponent();
      render(
        <InviteMemberModal
          currentUserRole="OWNER"
          isLoading={true}
          onSubmit={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      expect(screen.getByText('invite.submit')).toBeDisabled();
      expect(screen.getByText('invite.cancel')).toBeDisabled();
    });
  });

  describe('When the current user is a MANAGER', () => {
    it('Then OWNER role is not available in the dropdown', async () => {
      const InviteMemberModal = await getComponent();
      render(
        <InviteMemberModal
          currentUserRole="MANAGER"
          isLoading={false}
          onSubmit={vi.fn()}
          onClose={vi.fn()}
        />,
      );
      const roleSelect = screen.getByRole('combobox', { name: 'invite.role' });
      const options = Array.from((roleSelect as HTMLSelectElement).options).map((o) => o.value);
      expect(options).not.toContain('OWNER');
      expect(options).not.toContain('PARTNER');
      expect(options).not.toContain('MANAGER');
    });
  });
});
