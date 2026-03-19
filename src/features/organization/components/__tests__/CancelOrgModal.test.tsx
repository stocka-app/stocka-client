import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CancelOrgModal } from '@/features/organization/components/CancelOrgModal';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mocks = vi.hoisted(() => ({
  cancelOrganization: vi.fn().mockResolvedValue(undefined),
  isSaving: false,
}));

vi.mock('@/features/organization/hooks/useOrganization', () => ({
  useOrganization: vi.fn(() => ({
    isSaving: mocks.isSaving,
    cancelOrganization: mocks.cancelOrganization,
  })),
}));

async function getUseOrganizationMock(): Promise<ReturnType<typeof vi.fn>> {
  const { useOrganization } = await import('@/features/organization/hooks/useOrganization');
  return useOrganization as ReturnType<typeof vi.fn>;
}

describe('CancelOrgModal', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mocks.isSaving = false;
    mocks.cancelOrganization = vi.fn().mockResolvedValue(undefined);
  });

  // =========================================================================
  // Initial render
  // =========================================================================

  describe('Given the cancel organization modal opens', () => {
    describe('When the user sees the modal', () => {
      it('Then the modal title is shown', () => {
        render(<CancelOrgModal businessName="Ferretería Central" onClose={vi.fn()} />);
        expect(screen.getByText('dangerZone.cancelOrg.modalTitle')).toBeInTheDocument();
      });

      it('Then the warning message is shown', () => {
        render(<CancelOrgModal businessName="Ferretería Central" onClose={vi.fn()} />);
        expect(screen.getByText('dangerZone.cancelOrg.warning')).toBeInTheDocument();
      });

      it('Then the confirm button is disabled initially', () => {
        render(<CancelOrgModal businessName="Ferretería Central" onClose={vi.fn()} />);
        expect(
          screen.getByRole('button', { name: 'dangerZone.cancelOrg.confirmButton' }),
        ).toBeDisabled();
      });

      it('Then the confirm input is empty', () => {
        render(<CancelOrgModal businessName="Ferretería Central" onClose={vi.fn()} />);
        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('');
      });
    });
  });

  // =========================================================================
  // Confirm input matching
  // =========================================================================

  describe('Given the user types the wrong business name', () => {
    describe('When the user types a partial or incorrect name', () => {
      it('Then the confirm button remains disabled', async () => {
        render(<CancelOrgModal businessName="Ferretería Central" onClose={vi.fn()} />);
        await user.type(screen.getByRole('textbox'), 'Ferreteria Central');

        expect(
          screen.getByRole('button', { name: 'dangerZone.cancelOrg.confirmButton' }),
        ).toBeDisabled();
      });
    });
  });

  describe('Given the user types the exact business name', () => {
    describe('When the input matches the business name (case-sensitive)', () => {
      it('Then the confirm button becomes enabled', async () => {
        render(<CancelOrgModal businessName="Ferretería Central" onClose={vi.fn()} />);
        await user.type(screen.getByRole('textbox'), 'Ferretería Central');

        expect(
          screen.getByRole('button', { name: 'dangerZone.cancelOrg.confirmButton' }),
        ).toBeEnabled();
      });
    });

    describe('When the user clicks Confirm', () => {
      it('Then cancelOrganization is called', async () => {
        render(<CancelOrgModal businessName="Ferretería Central" onClose={vi.fn()} />);
        await user.type(screen.getByRole('textbox'), 'Ferretería Central');
        await user.click(screen.getByRole('button', { name: 'dangerZone.cancelOrg.confirmButton' }));

        await waitFor(() => {
          expect(mocks.cancelOrganization).toHaveBeenCalledTimes(1);
        });
      });

      it('Then onClose is called after successful cancellation', async () => {
        const onClose = vi.fn();
        render(<CancelOrgModal businessName="Ferretería Central" onClose={onClose} />);
        await user.type(screen.getByRole('textbox'), 'Ferretería Central');
        await user.click(screen.getByRole('button', { name: 'dangerZone.cancelOrg.confirmButton' }));

        await waitFor(() => {
          expect(onClose).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  // =========================================================================
  // Close / back actions
  // =========================================================================

  describe('Given the user decides not to cancel', () => {
    describe('When the user clicks the back/cancel button', () => {
      it('Then onClose is called', async () => {
        const onClose = vi.fn();
        render(<CancelOrgModal businessName="Ferretería Central" onClose={onClose} />);
        // Multiple buttons share the cancelButton aria-label — click the first one
        const cancelButtons = screen.getAllByRole('button', { name: 'dangerZone.cancelOrg.cancelButton' });
        await user.click(cancelButtons[0]);
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  // =========================================================================
  // Saving state
  // =========================================================================

  describe('Given the cancellation is in progress', () => {
    describe('When isSaving is true', () => {
      it('Then both buttons are disabled', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          isSaving: true,
          cancelOrganization: mocks.cancelOrganization,
        });

        render(<CancelOrgModal businessName="Ferretería Central" onClose={vi.fn()} />);
        await user.type(screen.getByRole('textbox'), 'Ferretería Central');

        // Confirm action button is disabled
        expect(
          screen.getByRole('button', { name: 'dangerZone.cancelOrg.confirmButton' }),
        ).toBeDisabled();
        // The "Go back" action button in the footer is the last button with the cancel label
        const cancelButtons = screen.getAllByRole('button', { name: 'dangerZone.cancelOrg.cancelButton' });
        const footerCancelButton = cancelButtons[cancelButtons.length - 1];
        expect(footerCancelButton).toBeDisabled();
      });
    });
  });

  // =========================================================================
  // Typing is case-sensitive
  // =========================================================================

  describe('Given the business name has special characters and accents', () => {
    describe('When the user types without the accent', () => {
      it('Then the button remains disabled (case-sensitive match required)', async () => {
        render(<CancelOrgModal businessName="Ferretería Central" onClose={vi.fn()} />);
        await user.type(screen.getByRole('textbox'), 'Ferreteria Central');
        expect(
          screen.getByRole('button', { name: 'dangerZone.cancelOrg.confirmButton' }),
        ).toBeDisabled();
      });
    });
  });
});
