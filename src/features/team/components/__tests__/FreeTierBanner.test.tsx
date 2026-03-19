import { render, screen } from '@testing-library/react';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockUseRBACStore = vi.fn();

vi.mock('@/store/rbac.store', () => ({
  useRBACStore: () => mockUseRBACStore(),
}));

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

// ─────────────────────────────────────────────────────────────────────────────
// Import component after mocks
// ─────────────────────────────────────────────────────────────────────────────

async function getComponent(): Promise<typeof import('@/features/team/components/FreeTierBanner').FreeTierBanner> {
  const { FreeTierBanner } = await import('@/features/team/components/FreeTierBanner');
  return FreeTierBanner;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the FreeTierBanner controls plan upgrade messaging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('When the tenant is on FREE tier and the user is not the OWNER', () => {
    beforeEach(() => {
      mockUseRBACStore.mockReturnValue({ tier: 'FREE', role: 'MANAGER' });
    });

    it('Then the banner is shown', async () => {
      const FreeTierBanner = await getComponent();
      render(<FreeTierBanner />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('Then the upgrade CTA button is displayed', async () => {
      const FreeTierBanner = await getComponent();
      render(<FreeTierBanner />);
      expect(screen.getByText('freeTierBanner.cta')).toBeInTheDocument();
    });
  });

  describe('When the tenant is on FREE tier and the user is the OWNER', () => {
    beforeEach(() => {
      mockUseRBACStore.mockReturnValue({ tier: 'FREE', role: 'OWNER' });
    });

    it('Then the banner is not shown', async () => {
      const FreeTierBanner = await getComponent();
      render(<FreeTierBanner />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('When the tenant is on STARTER tier', () => {
    beforeEach(() => {
      mockUseRBACStore.mockReturnValue({ tier: 'STARTER', role: 'MANAGER' });
    });

    it('Then the banner is not shown', async () => {
      const FreeTierBanner = await getComponent();
      render(<FreeTierBanner />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('When the tenant is on GROWTH tier', () => {
    beforeEach(() => {
      mockUseRBACStore.mockReturnValue({ tier: 'GROWTH', role: 'VIEWER' });
    });

    it('Then the banner is not shown', async () => {
      const FreeTierBanner = await getComponent();
      render(<FreeTierBanner />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('When tier is null', () => {
    beforeEach(() => {
      mockUseRBACStore.mockReturnValue({ tier: null, role: 'MANAGER' });
    });

    it('Then the banner is not shown', async () => {
      const FreeTierBanner = await getComponent();
      render(<FreeTierBanner />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
