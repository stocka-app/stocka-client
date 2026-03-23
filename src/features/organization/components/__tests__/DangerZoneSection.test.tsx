import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DangerZoneSection } from '@/features/organization/components/DangerZoneSection';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

vi.mock('@/features/team', () => ({
  usePermission: vi.fn().mockReturnValue(true),
  PermissionGate: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/features/organization/components/TransferOwnershipModal', () => ({
  TransferOwnershipModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="transfer-modal">
      <button onClick={onClose}>close-transfer</button>
    </div>
  ),
}));

vi.mock('@/features/organization/components/CancelOrgModal', () => ({
  CancelOrgModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="cancel-modal">
      <button onClick={onClose}>close-cancel</button>
    </div>
  ),
}));

const mockMembers = [{ id: 'user-002', name: 'Ana López' }];

async function getUsePermissionMock(): Promise<ReturnType<typeof vi.fn>> {
  const { usePermission } = await import('@/features/team');
  return usePermission as ReturnType<typeof vi.fn>;
}

describe('DangerZoneSection', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  // =========================================================================
  // Permission gate
  // =========================================================================

  describe('Given the user is an OWNER with TENANT_SETTINGS_UPDATE permission', () => {
    describe('When the danger zone renders', () => {
      it('Then the danger zone section is visible', async () => {
        const usePermissionMock = await getUsePermissionMock();
        usePermissionMock.mockReturnValue(true);

        render(<DangerZoneSection businessName="Ferretería Central" members={mockMembers} />);
        expect(screen.getByText('dangerZone.title')).toBeInTheDocument();
      });

      it('Then the Transfer Ownership button is visible', async () => {
        const usePermissionMock = await getUsePermissionMock();
        usePermissionMock.mockReturnValue(true);

        render(<DangerZoneSection businessName="Ferretería Central" members={mockMembers} />);
        expect(
          screen.getByRole('button', { name: 'dangerZone.transferOwnership.triggerButton' }),
        ).toBeInTheDocument();
      });

      it('Then the Cancel Organization button is visible', async () => {
        const usePermissionMock = await getUsePermissionMock();
        usePermissionMock.mockReturnValue(true);

        render(<DangerZoneSection businessName="Ferretería Central" members={mockMembers} />);
        expect(
          screen.getByRole('button', { name: 'dangerZone.cancelOrg.triggerButton' }),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Given the user does not have TENANT_SETTINGS_UPDATE permission', () => {
    describe('When the danger zone renders', () => {
      it('Then nothing is rendered', async () => {
        const usePermissionMock = await getUsePermissionMock();
        usePermissionMock.mockReturnValue(false);

        const { container } = render(
          <DangerZoneSection businessName="Ferretería Central" members={mockMembers} />,
        );
        expect(container.firstChild).toBeNull();
      });
    });
  });

  // =========================================================================
  // Transfer Ownership modal
  // =========================================================================

  describe('Given the user has OWNER permission', () => {
    beforeEach(async () => {
      const usePermissionMock = await getUsePermissionMock();
      usePermissionMock.mockReturnValue(true);
    });

    describe('When the user clicks Transfer Ownership', () => {
      it('Then the Transfer Ownership modal appears', async () => {
        render(<DangerZoneSection businessName="Ferretería Central" members={mockMembers} />);
        await user.click(
          screen.getByRole('button', { name: 'dangerZone.transferOwnership.triggerButton' }),
        );
        expect(screen.getByTestId('transfer-modal')).toBeInTheDocument();
      });
    });

    describe('When the transfer modal is closed', () => {
      it('Then the modal is removed from the DOM', async () => {
        render(<DangerZoneSection businessName="Ferretería Central" members={mockMembers} />);
        await user.click(
          screen.getByRole('button', { name: 'dangerZone.transferOwnership.triggerButton' }),
        );
        await user.click(screen.getByText('close-transfer'));
        expect(screen.queryByTestId('transfer-modal')).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Cancel Organization modal
  // =========================================================================

  describe('Given the user has OWNER permission', () => {
    beforeEach(async () => {
      const usePermissionMock = await getUsePermissionMock();
      usePermissionMock.mockReturnValue(true);
    });

    describe('When the user clicks Cancel Organization', () => {
      it('Then the Cancel Organization modal appears', async () => {
        render(<DangerZoneSection businessName="Ferretería Central" members={mockMembers} />);
        await user.click(
          screen.getByRole('button', { name: 'dangerZone.cancelOrg.triggerButton' }),
        );
        expect(screen.getByTestId('cancel-modal')).toBeInTheDocument();
      });
    });

    describe('When the cancel modal is closed', () => {
      it('Then the modal is removed from the DOM', async () => {
        render(<DangerZoneSection businessName="Ferretería Central" members={mockMembers} />);
        await user.click(
          screen.getByRole('button', { name: 'dangerZone.cancelOrg.triggerButton' }),
        );
        await user.click(screen.getByText('close-cancel'));
        expect(screen.queryByTestId('cancel-modal')).not.toBeInTheDocument();
      });
    });
  });
});
