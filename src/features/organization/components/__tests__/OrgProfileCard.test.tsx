import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrgProfileCard } from '@/features/organization/components/OrgProfileCard';
import type { OrgProfile } from '@/features/organization/types/organization.types';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

vi.mock('@/features/team', () => ({
  usePermission: vi.fn().mockReturnValue(true),
  PermissionGate: ({ children }: { children: React.ReactNode }) => children,
}));

const mockProfile: OrgProfile = {
  id: 'tenant-uuid-001',
  name: 'Ferretería Central',
  slug: 'ferreteria-central',
  businessType: 'RETAIL',
  rfc: 'FCE123456789',
  logoUrl: null,
  status: 'ACTIVE',
  tier: 'STARTER',
  createdAt: '2026-01-01T00:00:00.000Z',
};

async function getUsePermissionMock(): Promise<ReturnType<typeof vi.fn>> {
  const { usePermission } = await import('@/features/team');
  return usePermission as ReturnType<typeof vi.fn>;
}

describe('OrgProfileCard', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  // =========================================================================
  // Profile data display
  // =========================================================================

  describe('Given a loaded organization profile', () => {
    describe('When the card renders', () => {
      it('Then the business name is shown', () => {
        render(<OrgProfileCard profile={mockProfile} onEdit={vi.fn()} />);
        expect(screen.getByText('Ferretería Central')).toBeInTheDocument();
      });

      it('Then the slug is shown', () => {
        render(<OrgProfileCard profile={mockProfile} onEdit={vi.fn()} />);
        expect(screen.getByText('ferreteria-central')).toBeInTheDocument();
      });

      it('Then the RFC is shown', () => {
        render(<OrgProfileCard profile={mockProfile} onEdit={vi.fn()} />);
        expect(screen.getByText('FCE123456789')).toBeInTheDocument();
      });

      it('Then the business type translation key is shown', () => {
        render(<OrgProfileCard profile={mockProfile} onEdit={vi.fn()} />);
        expect(screen.getByText('profile.businessTypes.RETAIL')).toBeInTheDocument();
      });

      it('Then the status badge is shown', () => {
        render(<OrgProfileCard profile={mockProfile} onEdit={vi.fn()} />);
        expect(screen.getByText('profile.status.ACTIVE')).toBeInTheDocument();
      });

      it('Then the tier badge is shown', () => {
        render(<OrgProfileCard profile={mockProfile} onEdit={vi.fn()} />);
        expect(screen.getByText('profile.tiers.STARTER')).toBeInTheDocument();
      });
    });

    describe('When rfc is null', () => {
      it('Then an em dash is shown in place of the RFC', () => {
        render(<OrgProfileCard profile={{ ...mockProfile, rfc: null }} onEdit={vi.fn()} />);
        expect(screen.getByText('—')).toBeInTheDocument();
      });
    });

    describe('When the profile has a logo URL', () => {
      it('Then the logo image is rendered', () => {
        render(
          <OrgProfileCard
            profile={{ ...mockProfile, logoUrl: 'https://cdn.example.com/logo.png' }}
            onEdit={vi.fn()}
          />,
        );
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('src', 'https://cdn.example.com/logo.png');
      });
    });

    describe('When the profile has no logo URL', () => {
      it('Then the placeholder icon is rendered instead of an image', () => {
        render(<OrgProfileCard profile={{ ...mockProfile, logoUrl: null }} onEdit={vi.fn()} />);
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Edit button visibility
  // =========================================================================

  describe('Given the user has TENANT_SETTINGS_UPDATE permission', () => {
    describe('When the card renders', () => {
      it('Then the Edit button is visible', async () => {
        const usePermissionMock = await getUsePermissionMock();
        usePermissionMock.mockReturnValue(true);

        render(<OrgProfileCard profile={mockProfile} onEdit={vi.fn()} />);
        expect(screen.getByText('profile.editButton')).toBeInTheDocument();
      });
    });

    describe('When the user clicks the Edit button', () => {
      it('Then the onEdit callback is called', async () => {
        const usePermissionMock = await getUsePermissionMock();
        usePermissionMock.mockReturnValue(true);

        const onEdit = vi.fn();
        render(<OrgProfileCard profile={mockProfile} onEdit={onEdit} />);

        await user.click(screen.getByText('profile.editButton'));
        expect(onEdit).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Given the user does not have TENANT_SETTINGS_UPDATE permission', () => {
    describe('When the card renders', () => {
      it('Then the Edit button is not shown', async () => {
        const usePermissionMock = await getUsePermissionMock();
        usePermissionMock.mockReturnValue(false);

        render(<OrgProfileCard profile={mockProfile} onEdit={vi.fn()} />);
        expect(screen.queryByText('profile.editButton')).not.toBeInTheDocument();
      });
    });
  });
});
