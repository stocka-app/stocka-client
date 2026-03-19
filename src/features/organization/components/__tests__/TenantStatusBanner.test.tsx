import { render, screen } from '@testing-library/react';
import { TenantStatusBanner } from '@/features/organization/components/TenantStatusBanner';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('TenantStatusBanner', () => {
  // =========================================================================
  // ACTIVE status
  // =========================================================================

  describe('Given the organization is active', () => {
    describe('When the banner renders', () => {
      it('Then nothing is rendered', () => {
        const { container } = render(<TenantStatusBanner status="ACTIVE" />);
        expect(container.firstChild).toBeNull();
      });
    });
  });

  // =========================================================================
  // SUSPENDED status
  // =========================================================================

  describe('Given the organization is suspended', () => {
    describe('When the banner renders', () => {
      it('Then the amber warning banner is visible', () => {
        render(<TenantStatusBanner status="SUSPENDED" />);
        const banner = screen.getByRole('alert');
        expect(banner).toBeInTheDocument();
      });

      it('Then the banner shows the suspended message', () => {
        render(<TenantStatusBanner status="SUSPENDED" />);
        expect(screen.getByText('banners.suspended')).toBeInTheDocument();
      });

      it('Then the banner has amber styling', () => {
        render(<TenantStatusBanner status="SUSPENDED" />);
        const banner = screen.getByRole('alert');
        expect(banner.className).toContain('amber');
      });
    });
  });

  // =========================================================================
  // CANCELLED status
  // =========================================================================

  describe('Given the organization is cancelled', () => {
    describe('When the banner renders', () => {
      it('Then the red danger banner is visible', () => {
        render(<TenantStatusBanner status="CANCELLED" />);
        const banner = screen.getByRole('alert');
        expect(banner).toBeInTheDocument();
      });

      it('Then the banner shows the cancelled message', () => {
        render(<TenantStatusBanner status="CANCELLED" />);
        expect(screen.getByText('banners.cancelled')).toBeInTheDocument();
      });

      it('Then the banner has red styling', () => {
        render(<TenantStatusBanner status="CANCELLED" />);
        const banner = screen.getByRole('alert');
        expect(banner.className).toContain('red');
      });
    });
  });
});
