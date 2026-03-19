import { render, screen } from '@testing-library/react';
import { TierQuotasSection } from '@/features/organization/components/TierQuotasSection';
import type { TierQuotas, OrgProfile } from '@/features/organization/types/organization.types';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mockFetchQuotas = vi.fn().mockResolvedValue(undefined);

const mockQuotas: TierQuotas = {
  warehouses: { used: 1, max: 3 },
  members: { used: 2, max: 5 },
  products: { used: 50, max: 1000 },
};

const mockProfile: OrgProfile = {
  id: 'tenant-uuid-001',
  name: 'Ferretería Central',
  slug: 'ferreteria-central',
  businessType: 'RETAIL',
  rfc: null,
  logoUrl: null,
  status: 'ACTIVE',
  tier: 'STARTER',
  createdAt: '2026-01-01T00:00:00.000Z',
};

vi.mock('@/features/organization/hooks/useOrganization', () => ({
  useOrganization: vi.fn(),
}));

async function getUseOrganizationMock(): Promise<ReturnType<typeof vi.fn>> {
  const { useOrganization } = await import('@/features/organization/hooks/useOrganization');
  return useOrganization as ReturnType<typeof vi.fn>;
}

describe('TierQuotasSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Loading state
  // =========================================================================

  describe('Given the quotas are being loaded', () => {
    describe('When the component renders', () => {
      it('Then a loading indicator is shown', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          profile: null,
          quotas: null,
          isLoading: true,
          error: null,
          fetchQuotas: mockFetchQuotas,
        });

        render(<TierQuotasSection />);
        expect(screen.getByText('audit.loading')).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Error state
  // =========================================================================

  describe('Given the quotas fetch failed', () => {
    describe('When the component renders', () => {
      it('Then an error message is shown', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          profile: null,
          quotas: null,
          isLoading: false,
          error: 'errors.fetchQuotasFailed',
          fetchQuotas: mockFetchQuotas,
        });

        render(<TierQuotasSection />);
        expect(screen.getByText('errors.fetchQuotasFailed')).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Successful load
  // =========================================================================

  describe('Given the quotas are successfully loaded', () => {
    describe('When the component renders', () => {
      it('Then three progress bars are displayed', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          profile: mockProfile,
          quotas: mockQuotas,
          isLoading: false,
          error: null,
          fetchQuotas: mockFetchQuotas,
        });

        render(<TierQuotasSection />);
        expect(screen.getAllByRole('progressbar')).toHaveLength(3);
      });

      it('Then the section title is shown', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          profile: mockProfile,
          quotas: mockQuotas,
          isLoading: false,
          error: null,
          fetchQuotas: mockFetchQuotas,
        });

        render(<TierQuotasSection />);
        expect(screen.getByText('limits.title')).toBeInTheDocument();
      });

      it('Then the current tier badge is shown', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          profile: mockProfile,
          quotas: mockQuotas,
          isLoading: false,
          error: null,
          fetchQuotas: mockFetchQuotas,
        });

        render(<TierQuotasSection />);
        expect(screen.getByText('profile.tiers.STARTER')).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Unlimited quotas (ENTERPRISE)
  // =========================================================================

  describe('Given the organization is on an Enterprise plan with unlimited quotas', () => {
    describe('When the component renders', () => {
      it('Then no progress bar tracks are rendered (unlimited = no bar)', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        const unlimitedQuotas: TierQuotas = {
          warehouses: { used: 5, max: -1 },
          members: { used: 20, max: -1 },
          products: { used: 1000, max: -1 },
        };
        useOrganizationMock.mockReturnValue({
          profile: { ...mockProfile, tier: 'ENTERPRISE' },
          quotas: unlimitedQuotas,
          isLoading: false,
          error: null,
          fetchQuotas: mockFetchQuotas,
        });

        render(<TierQuotasSection />);
        expect(screen.queryAllByRole('progressbar')).toHaveLength(0);
      });
    });
  });

  // =========================================================================
  // No profile (tier badge hidden)
  // =========================================================================

  describe('Given quotas are loaded but no profile is available', () => {
    describe('When the component renders', () => {
      it('Then the tier badge is not shown', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          profile: null,
          quotas: mockQuotas,
          isLoading: false,
          error: null,
          fetchQuotas: mockFetchQuotas,
        });

        render(<TierQuotasSection />);
        // tier badge should not appear when no profile
        expect(screen.queryByText('profile.tiers.STARTER')).not.toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Quotas null but not loading (e.g. fetch hasn't returned yet but isLoading false)
  // =========================================================================

  describe('Given the section renders with no quotas and no loading or error state', () => {
    describe('When quotas have not been fetched yet', () => {
      it('Then only the title is shown with no progress bars', async () => {
        const useOrganizationMock = await getUseOrganizationMock();
        useOrganizationMock.mockReturnValue({
          profile: null,
          quotas: null,
          isLoading: false,
          error: null,
          fetchQuotas: mockFetchQuotas,
        });

        render(<TierQuotasSection />);
        expect(screen.getByText('limits.title')).toBeInTheDocument();
        expect(screen.queryAllByRole('progressbar')).toHaveLength(0);
      });
    });
  });
});
