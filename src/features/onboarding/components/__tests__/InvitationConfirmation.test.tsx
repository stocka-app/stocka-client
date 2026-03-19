import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvitationConfirmation } from '@/features/onboarding/components/invitation/InvitationConfirmation';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const validInvitationDetails = {
  code: 'ABC12345',
  businessName: 'Tech Solutions SA',
  inviterName: 'María González',
  role: 'EMPLOYEE',
  expiresAt: '2026-12-31T00:00:00.000Z',
};

describe('InvitationConfirmation', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onAccept = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Given the invitation details have been loaded', () => {
    beforeEach(() => {
      render(
        <InvitationConfirmation
          invitationDetails={validInvitationDetails}
          onAccept={onAccept}
          onCancel={onCancel}
          isLoading={false}
          error={null}
        />,
      );
    });

    it('Then the business name is displayed', () => {
      expect(screen.getByText('Tech Solutions SA')).toBeInTheDocument();
    });

    it('Then the inviter name is displayed', () => {
      expect(screen.getByText('María González')).toBeInTheDocument();
    });

    it('Then the role is displayed', () => {
      expect(screen.getByText('EMPLOYEE')).toBeInTheDocument();
    });

    it('Then the join team button is visible', () => {
      expect(
        screen.getByRole('button', { name: /invitation.confirmation.ctaButton/i }),
      ).toBeInTheDocument();
    });

    it('Then the cancel link is visible', () => {
      expect(
        screen.getByRole('button', { name: /invitation.confirmation.cancelLink/i }),
      ).toBeInTheDocument();
    });

    describe('When the user confirms they want to join the team', () => {
      beforeEach(async () => {
        await user.click(
          screen.getByRole('button', { name: /invitation.confirmation.ctaButton/i }),
        );
      });

      it('Then onAccept is called', () => {
        expect(onAccept).toHaveBeenCalledOnce();
      });
    });

    describe('When the user cancels the invitation', () => {
      beforeEach(async () => {
        await user.click(
          screen.getByRole('button', { name: /invitation.confirmation.cancelLink/i }),
        );
      });

      it('Then onCancel is called', () => {
        expect(onCancel).toHaveBeenCalledOnce();
      });
    });
  });

  describe('Given an error occurred while accepting the invitation', () => {
    beforeEach(() => {
      render(
        <InvitationConfirmation
          invitationDetails={validInvitationDetails}
          onAccept={onAccept}
          onCancel={onCancel}
          isLoading={false}
          error="errors.invitationAcceptFailed"
        />,
      );
    });

    it('Then the error alert is displayed', () => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Given the acceptance is in progress', () => {
    beforeEach(() => {
      render(
        <InvitationConfirmation
          invitationDetails={validInvitationDetails}
          onAccept={onAccept}
          onCancel={onCancel}
          isLoading={true}
          error={null}
        />,
      );
    });

    it('Then the join button is disabled', () => {
      expect(
        screen.getByRole('button', { name: /invitation.confirmation.ctaButton/i }),
      ).toBeDisabled();
    });

    it('Then the cancel button is also disabled', () => {
      expect(
        screen.getByRole('button', { name: /invitation.confirmation.cancelLink/i }),
      ).toBeDisabled();
    });
  });
});
