import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Logo } from '@/shared/components/Logo';
import { useAuthenticationStore } from '@/features/authentication/store/authentication.store';

vi.mock('@/features/authentication/store/authentication.store');

function renderLogo(props = {}) {
  return render(
    <MemoryRouter>
      <Logo {...props} />
    </MemoryRouter>,
  );
}

describe('Logo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthenticationStore).mockReturnValue({
      isAuthenticated: false,
    } as ReturnType<typeof useAuthenticationStore>);
  });

  describe('Given the user is not authenticated', () => {
    it('Then it renders a link pointing to the login page', () => {
      renderLogo();
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/authentication/sign-in');
    });
  });

  describe('Given the user is authenticated', () => {
    beforeEach(() => {
      vi.mocked(useAuthenticationStore).mockReturnValue({
        isAuthenticated: true,
      } as ReturnType<typeof useAuthenticationStore>);
    });

    it('Then it renders a link pointing to the dashboard', () => {
      renderLogo();
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/dashboard');
    });
  });

  describe('Given disableLink is true', () => {
    it('Then it renders the logo without a clickable link', () => {
      renderLogo({ disableLink: true });
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('Stocka')).toBeInTheDocument();
    });
  });

  describe('Given showIcon is false', () => {
    it('Then it does not render the package icon', () => {
      const { container } = renderLogo({ showIcon: false });
      expect(screen.getByText('Stocka')).toBeInTheDocument();
      // With showIcon=false, no SVG icon should be present alongside the text
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(0);
    });
  });

  describe('Given size="sm" is provided', () => {
    it('Then it renders with text-xl class', () => {
      const { container } = renderLogo({ size: 'sm' });
      const textEl = container.querySelector('.text-xl');
      expect(textEl).toBeTruthy();
    });
  });

  describe('Given size="lg" is provided', () => {
    it('Then it renders with text-3xl class', () => {
      const { container } = renderLogo({ size: 'lg' });
      const textEl = container.querySelector('.text-3xl');
      expect(textEl).toBeTruthy();
    });
  });
});
