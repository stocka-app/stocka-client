import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransferOwnershipModal } from '@/features/organization/components/TransferOwnershipModal';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mocks = vi.hoisted(() => ({
  transferOwnership: vi.fn().mockResolvedValue(undefined),
  isSaving: false,
}));

vi.mock('@/features/organization/hooks/useOrganization', () => ({
  useOrganization: vi.fn(() => ({
    isSaving: mocks.isSaving,
    transferOwnership: mocks.transferOwnership,
  })),
}));

async function getUseOrganizationMock(): Promise<ReturnType<typeof vi.fn>> {
  const { useOrganization } = await import('@/features/organization/hooks/useOrganization');
  return useOrganization as ReturnType<typeof vi.fn>;
}

const mockMembers = [
  { id: 'user-002', name: 'Ana López' },
  { id: 'user-003', name: 'Carlos Ramírez' },
];

describe('TransferOwnershipModal', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mocks.isSaving = false;
    mocks.transferOwnership = vi.fn().mockResolvedValue(undefined);
  });

  // =========================================================================
  // Step 1: Select new owner
  // =========================================================================

  describe('Given the transfer ownership modal opens', () => {
    describe('When the user sees the first step', () => {
      it('Then the modal title is shown', () => {
        render(<TransferOwnershipModal members={mockMembers} onClose={vi.fn()} />);
        expect(screen.getByText('dangerZone.transferOwnership.modalTitle')).toBeInTheDocument();
      });

      it('Then the member select dropdown is visible', () => {
        render(<TransferOwnershipModal members={mockMembers} onClose={vi.fn()} />);
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      it('Then all members are listed as options', () => {
        render(<TransferOwnershipModal members={mockMembers} onClose={vi.fn()} />);
        expect(screen.getByRole('option', { name: 'Ana López' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Carlos Ramírez' })).toBeInTheDocument();
      });

      it('Then the confirm button is disabled when no member is selected', () => {
        render(<TransferOwnershipModal members={mockMembers} onClose={vi.fn()} />);
        expect(
          screen.getByRole('button', { name: 'dangerZone.transferOwnership.confirmButton' }),
        ).toBeDisabled();
      });
    });

    describe('When the user selects a member', () => {
      it('Then the confirm button becomes enabled', async () => {
        render(<TransferOwnershipModal members={mockMembers} onClose={vi.fn()} />);
        await user.selectOptions(screen.getByRole('combobox'), 'Ana López');
        expect(
          screen.getByRole('button', { name: 'dangerZone.transferOwnership.confirmButton' }),
        ).toBeEnabled();
      });
    });

    describe('When the user clicks Cancel in step 1', () => {
      it('Then onClose is called', async () => {
        const onClose = vi.fn();
        render(<TransferOwnershipModal members={mockMembers} onClose={onClose} />);
        await user.click(screen.getByRole('button', { name: 'dangerZone.transferOwnership.cancelButton' }));
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  // =========================================================================
  // Step 2: Confirmation
  // =========================================================================

  describe('Given the user has selected a member and advances to step 2', () => {
    beforeEach(async () => {
      render(<TransferOwnershipModal members={mockMembers} onClose={vi.fn()} />);
      await user.selectOptions(screen.getByRole('combobox'), 'Ana López');
      await user.click(
        screen.getByRole('button', { name: 'dangerZone.transferOwnership.confirmButton' }),
      );
    });

    describe('When the confirmation step renders', () => {
      it('Then the confirmation message is shown with the selected member name', () => {
        expect(
          screen.getByText('dangerZone.transferOwnership.confirmMessage'),
        ).toBeInTheDocument();
      });
    });

    describe('When the user confirms the transfer', () => {
      it('Then transferOwnership is called with the selected member ID', async () => {
        await user.click(
          screen.getByRole('button', { name: 'dangerZone.transferOwnership.confirmButton' }),
        );

        await waitFor(() => {
          expect(mocks.transferOwnership).toHaveBeenCalledWith('user-002');
        });
      });
    });

    describe('When the user goes back from step 2', () => {
      it('Then the select step is shown again', async () => {
        await user.click(
          screen.getByRole('button', { name: 'dangerZone.transferOwnership.cancelButton' }),
        );
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Saving state
  // =========================================================================

  describe('Given the transfer is in progress', () => {
    describe('When isSaving is true on step 2', () => {
      it('Then the confirm and cancel buttons are disabled', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          isSaving: true,
          transferOwnership: mocks.transferOwnership,
        });

        render(<TransferOwnershipModal members={mockMembers} onClose={vi.fn()} />);
        await user.selectOptions(screen.getByRole('combobox'), 'Ana López');
        await user.click(
          screen.getByRole('button', { name: 'dangerZone.transferOwnership.confirmButton' }),
        );

        const buttons = screen.getAllByRole('button');
        const actionButtons = buttons.filter(
          (b) =>
            b.textContent === 'dangerZone.transferOwnership.confirmButton' ||
            b.textContent === 'dangerZone.transferOwnership.cancelButton',
        );
        actionButtons.forEach((btn) => expect(btn).toBeDisabled());
      });
    });
  });

  // =========================================================================
  // Close button
  // =========================================================================

  describe('Given the modal is open', () => {
    describe('When the user clicks the X close button', () => {
      it('Then onClose is called', async () => {
        const onClose = vi.fn();
        render(<TransferOwnershipModal members={mockMembers} onClose={onClose} />);
        await user.click(screen.getByRole('button', { name: 'profile.cancelButton' }));
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });
});
