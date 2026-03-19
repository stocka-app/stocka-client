import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvitationCodeEntry } from '@/features/onboarding/components/invitation/InvitationCodeEntry';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('InvitationCodeEntry', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onValidate = vi.fn().mockResolvedValue(undefined);
  const onBack = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Given the user is on the invitation code entry screen', () => {
    beforeEach(() => {
      render(
        <InvitationCodeEntry
          onValidate={onValidate}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
    });

    it('Then the code input is visible', () => {
      expect(
        screen.getByRole('textbox', { name: /invitation.codeEntry.codeLabel/i }),
      ).toBeInTheDocument();
    });

    it('Then the validate button is visible', () => {
      expect(
        screen.getByRole('button', { name: /invitation.codeEntry.ctaButton/i }),
      ).toBeInTheDocument();
    });

    it('Then the back link is visible', () => {
      expect(
        screen.getByRole('button', { name: /invitation.codeEntry.backLink/i }),
      ).toBeInTheDocument();
    });

    describe('When the user types a valid 8-character code', () => {
      beforeEach(async () => {
        await user.type(
          screen.getByRole('textbox', { name: /invitation.codeEntry.codeLabel/i }),
          'ABC12345',
        );
      });

      it('Then the input contains the uppercased code', () => {
        expect(
          screen.getByRole('textbox', { name: /invitation.codeEntry.codeLabel/i }),
        ).toHaveValue('ABC12345');
      });

      describe('When the user submits the code', () => {
        beforeEach(async () => {
          await user.click(
            screen.getByRole('button', { name: /invitation.codeEntry.ctaButton/i }),
          );
        });

        it('Then onValidate is called with the code', () => {
          expect(onValidate).toHaveBeenCalledWith('ABC12345');
        });
      });
    });

    describe('When the user types a lowercase code', () => {
      beforeEach(async () => {
        await user.type(
          screen.getByRole('textbox', { name: /invitation.codeEntry.codeLabel/i }),
          'abc12345',
        );
      });

      it('Then the code is automatically uppercased', () => {
        expect(
          screen.getByRole('textbox', { name: /invitation.codeEntry.codeLabel/i }),
        ).toHaveValue('ABC12345');
      });
    });

    describe('When the user tries to submit an empty code', () => {
      beforeEach(async () => {
        await user.click(
          screen.getByRole('button', { name: /invitation.codeEntry.ctaButton/i }),
        );
      });

      it('Then onValidate is NOT called', () => {
        expect(onValidate).not.toHaveBeenCalled();
      });
    });

    describe('When the user clicks the back link', () => {
      beforeEach(async () => {
        await user.click(
          screen.getByRole('button', { name: /invitation.codeEntry.backLink/i }),
        );
      });

      it('Then onBack is called', () => {
        expect(onBack).toHaveBeenCalledOnce();
      });
    });
  });

  describe('Given an invalid code error is shown', () => {
    beforeEach(() => {
      render(
        <InvitationCodeEntry
          onValidate={onValidate}
          onBack={onBack}
          isLoading={false}
          error="invitation.codeEntry.errors.INVALID_CODE"
        />,
      );
    });

    it('Then the error alert is displayed', () => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Given an expired code error is shown', () => {
    beforeEach(() => {
      render(
        <InvitationCodeEntry
          onValidate={onValidate}
          onBack={onBack}
          isLoading={false}
          error="invitation.codeEntry.errors.EXPIRED_CODE"
        />,
      );
    });

    it('Then the expired error alert is displayed', () => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Given a validation is in progress', () => {
    beforeEach(() => {
      render(
        <InvitationCodeEntry
          onValidate={onValidate}
          onBack={onBack}
          isLoading={true}
          error={null}
        />,
      );
    });

    it('Then the validate button is disabled', () => {
      expect(
        screen.getByRole('button', { name: /invitation.codeEntry.ctaButton/i }),
      ).toBeDisabled();
    });
  });
});
