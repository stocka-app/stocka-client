import { render, screen } from '@testing-library/react';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

const mockReturnObjects = vi.fn().mockReturnValue(true);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.returnObjects) {
        if (mockReturnObjects()) {
          return ['Permission 1', 'Permission 2', 'Permission 3'];
        }
        // Return a non-array value to test the !Array.isArray branch
        return 'roles.permissions.OWNER';
      }
      return key;
    },
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Import component after mocks
// ─────────────────────────────────────────────────────────────────────────────

async function getComponent(): Promise<typeof import('@/features/team/components/RolesReferenceCards').RolesReferenceCards> {
  const { RolesReferenceCards } = await import('@/features/team/components/RolesReferenceCards');
  return RolesReferenceCards;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the RolesReferenceCards displays role information', () => {
  beforeEach(() => {
    mockReturnObjects.mockReturnValue(true);
  });

  describe('When the component is rendered', () => {
    it('Then all 7 roles are represented', async () => {
      const RolesReferenceCards = await getComponent();
      render(<RolesReferenceCards />);
      // Each role appears as a card title (t returns the key)
      expect(screen.getByText('roles.OWNER')).toBeInTheDocument();
      expect(screen.getByText('roles.PARTNER')).toBeInTheDocument();
      expect(screen.getByText('roles.MANAGER')).toBeInTheDocument();
      expect(screen.getByText('roles.BUYER')).toBeInTheDocument();
      expect(screen.getByText('roles.WAREHOUSE_KEEPER')).toBeInTheDocument();
      expect(screen.getByText('roles.SALES_REP')).toBeInTheDocument();
      expect(screen.getByText('roles.VIEWER')).toBeInTheDocument();
    });

    it('Then hierarchy badges are shown', async () => {
      const RolesReferenceCards = await getComponent();
      render(<RolesReferenceCards />);
      expect(screen.getByText('roles.hierarchy.OWNER')).toBeInTheDocument();
      expect(screen.getByText('roles.hierarchy.VIEWER')).toBeInTheDocument();
    });

    it('Then each role shows its description', async () => {
      const RolesReferenceCards = await getComponent();
      render(<RolesReferenceCards />);
      expect(screen.getByText('roles.descriptions.OWNER')).toBeInTheDocument();
      expect(screen.getByText('roles.descriptions.MANAGER')).toBeInTheDocument();
    });

    it('Then permission bullet points are rendered for each role', async () => {
      const RolesReferenceCards = await getComponent();
      render(<RolesReferenceCards />);
      // Each role card renders 3 permissions from the mock
      const permissionItems = screen.getAllByText('Permission 1');
      expect(permissionItems.length).toBe(7); // One set per role
    });
  });

  describe('When the i18n library returns a non-array for permissions', () => {
    beforeEach(() => {
      mockReturnObjects.mockReturnValue(false);
    });

    it('Then no permission bullets are rendered and the component does not crash', async () => {
      const RolesReferenceCards = await getComponent();
      render(<RolesReferenceCards />);
      // Role titles should still be visible
      expect(screen.getByText('roles.OWNER')).toBeInTheDocument();
      // No Permission items rendered
      expect(screen.queryByText('Permission 1')).not.toBeInTheDocument();
    });
  });
});
