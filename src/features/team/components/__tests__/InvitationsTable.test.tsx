import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PendingInvitation } from '@/features/team/types/team.types';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const pendingInvitation: PendingInvitation = {
  id: 'inv-001',
  email: 'invited@empresa.com',
  role: 'BUYER',
  sentAt: '2026-03-16T10:00:00.000Z',
  expiresAt: '2026-03-19T10:00:00.000Z',
  status: 'PENDING',
};

const expiredInvitation: PendingInvitation = {
  id: 'inv-002',
  email: 'expired@empresa.com',
  role: 'SALES_REP',
  sentAt: '2026-03-01T10:00:00.000Z',
  expiresAt: '2026-03-04T10:00:00.000Z',
  status: 'EXPIRED',
};

// ─────────────────────────────────────────────────────────────────────────────
// Import component after mocks
// ─────────────────────────────────────────────────────────────────────────────

async function getComponent(): Promise<typeof import('@/features/team/components/InvitationsTable').InvitationsTable> {
  const { InvitationsTable } = await import('@/features/team/components/InvitationsTable');
  return InvitationsTable;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the InvitationsTable displays pending invitations', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('When there are no invitations', () => {
    it('Then the empty state message is shown', async () => {
      const InvitationsTable = await getComponent();
      render(
        <InvitationsTable
          invitations={[]}
          isLoading={false}
          onResend={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.getByText('invitations.empty')).toBeInTheDocument();
    });
  });

  describe('When there is a pending invitation', () => {
    it('Then the invitation email is shown', async () => {
      const InvitationsTable = await getComponent();
      render(
        <InvitationsTable
          invitations={[pendingInvitation]}
          isLoading={false}
          onResend={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.getByText('invited@empresa.com')).toBeInTheDocument();
    });

    it('Then the resend button is displayed', async () => {
      const InvitationsTable = await getComponent();
      render(
        <InvitationsTable
          invitations={[pendingInvitation]}
          isLoading={false}
          onResend={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.getByText('invitations.resend')).toBeInTheDocument();
    });

    it('Then the cancel button is displayed', async () => {
      const InvitationsTable = await getComponent();
      render(
        <InvitationsTable
          invitations={[pendingInvitation]}
          isLoading={false}
          onResend={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.getByText('invitations.cancel')).toBeInTheDocument();
    });
  });

  describe('When the user clicks resend on a pending invitation', () => {
    it('Then the onResend callback is called with the invitation id', async () => {
      const onResend = vi.fn();
      const InvitationsTable = await getComponent();
      render(
        <InvitationsTable
          invitations={[pendingInvitation]}
          isLoading={false}
          onResend={onResend}
          onCancel={vi.fn()}
        />,
      );
      await user.click(screen.getByText('invitations.resend'));
      expect(onResend).toHaveBeenCalledWith('inv-001');
    });
  });

  describe('When the user clicks cancel on a pending invitation', () => {
    it('Then the onCancel callback is called with the invitation id', async () => {
      const onCancel = vi.fn();
      const InvitationsTable = await getComponent();
      render(
        <InvitationsTable
          invitations={[pendingInvitation]}
          isLoading={false}
          onResend={vi.fn()}
          onCancel={onCancel}
        />,
      );
      await user.click(screen.getByText('invitations.cancel'));
      expect(onCancel).toHaveBeenCalledWith('inv-001');
    });
  });

  describe('When there is an expired invitation', () => {
    it('Then no resend or cancel buttons are shown for the expired invitation', async () => {
      const InvitationsTable = await getComponent();
      render(
        <InvitationsTable
          invitations={[expiredInvitation]}
          isLoading={false}
          onResend={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.queryByText('invitations.resend')).not.toBeInTheDocument();
      expect(screen.queryByText('invitations.cancel')).not.toBeInTheDocument();
    });

    it('Then the expired status badge is shown', async () => {
      const InvitationsTable = await getComponent();
      render(
        <InvitationsTable
          invitations={[expiredInvitation]}
          isLoading={false}
          onResend={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      expect(screen.getByText('status.EXPIRED')).toBeInTheDocument();
    });
  });

  describe('When the table is loading', () => {
    it('Then action buttons are disabled', async () => {
      const InvitationsTable = await getComponent();
      render(
        <InvitationsTable
          invitations={[pendingInvitation]}
          isLoading={true}
          onResend={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });
});
