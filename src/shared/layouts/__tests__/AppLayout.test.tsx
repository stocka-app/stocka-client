import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppLayout } from '../AppLayout';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Main Content</div>,
  NavLink: ({
    children,
    to,
    title,
    className,
  }: {
    children: React.ReactNode | ((props: { isActive: boolean }) => React.ReactNode);
    to: string;
    title?: string;
    className?: ((props: { isActive: boolean }) => string) | string;
  }) => {
    const isActive = to === '/dashboard';
    const resolvedClass = typeof className === 'function' ? className({ isActive }) : className;
    return (
      <a href={to} data-testid={`nav-${to}`} title={title ?? undefined} className={resolvedClass}>
        {typeof children === 'function' ? children({ isActive }) : children}
      </a>
    );
  },
  useNavigate: () => mockNavigate,
}));

const mockLogout = vi.fn().mockResolvedValue(undefined);

const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: {
    user: {
      username: 'carlos' as string | null,
      email: 'carlos@stocka.mx',
      givenName: 'Carlos' as string | null,
      familyName: 'Garcia' as string | null,
      displayName: 'Carlos Garcia' as string | null,
      avatarUrl: null as string | null,
      role: 'OWNER' as string | null,
    } as Record<string, unknown> | null,
  },
}));

vi.mock('@/features/authentication', () => ({
  useAuthentication: () => ({
    user: mockAuthState.user,
    logout: mockLogout,
  }),
}));

vi.mock('@/shared/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme</div>,
}));

vi.mock('@/shared/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Lang</div>,
}));

vi.mock('@/shared/components/StockaIcon', () => ({
  StockaIcon: () => <div data-testid="stocka-icon">Icon</div>,
}));

vi.mock('@/shared/components/UpgradeModal', () => ({
  UpgradeModal: () => <div data-testid="upgrade-modal" />,
}));

vi.mock('@/shared/components/AvatarWithFallback', () => ({
  AvatarWithFallback: ({ initials }: { initials: string; avatarUrl?: string | null; className?: string }) => (
    <div data-testid="avatar">{initials}</div>
  ),
  getInitials: (givenName?: string | null, familyName?: string | null, displayName?: string | null, username?: string | null) => {
    if (givenName && familyName) return `${givenName[0]}${familyName[0]}`;
    if (displayName) return displayName[0];
    if (username) return username[0];
    return '?';
  },
}));

vi.mock('@/features/storages', () => ({
  StorageSwitcher: () => <div data-testid="storage-switcher" />,
  StorageStatusBanner: () => <div data-testid="storage-status-banner" />,
}));

describe('AppLayout', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockAuthState.user = {
      username: 'carlos',
      email: 'carlos@stocka.mx',
      givenName: 'Carlos',
      familyName: 'Garcia',
      displayName: 'Carlos Garcia',
      avatarUrl: null,
      role: 'OWNER',
    };
  });

  // ══════════════════════════════════════════════════════════════════
  // Initial render
  // ══════════════════════════════════════════════════════════════════

  describe('Given the layout renders', () => {
    beforeEach(() => {
      render(<AppLayout />);
    });

    it('should render the main content area with Outlet', () => {
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('should render the sidebar with correct aria-label', () => {
      expect(screen.getByLabelText('sidebar.ariaLabel')).toBeInTheDocument();
    });

    it('should display the Stocka brand name', () => {
      expect(screen.getAllByText('Stocka').length).toBeGreaterThan(0);
    });

    it('should render the Stocka icon', () => {
      expect(screen.getAllByTestId('stocka-icon').length).toBeGreaterThan(0);
    });

    it('should render all navigation links', () => {
      expect(screen.getByTestId('nav-/dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('nav-/categories')).toBeInTheDocument();
      expect(screen.getByTestId('nav-/storages')).toBeInTheDocument();
      expect(screen.getByTestId('nav-/products')).toBeInTheDocument();
      expect(screen.getByTestId('nav-/suppliers')).toBeInTheDocument();
      expect(screen.getByTestId('nav-/settings/organization')).toBeInTheDocument();
    });

    it('should display navigation text for each item', () => {
      expect(screen.getAllByText('nav.dashboard').length).toBeGreaterThan(0);
      expect(screen.getAllByText('nav.categories').length).toBeGreaterThan(0);
      expect(screen.getAllByText('nav.storages').length).toBeGreaterThan(0);
      expect(screen.getAllByText('nav.products').length).toBeGreaterThan(0);
      expect(screen.getAllByText('nav.suppliers').length).toBeGreaterThan(0);
      expect(screen.getAllByText('nav.settings').length).toBeGreaterThan(0);
    });

    it('should render the user avatar', () => {
      expect(screen.getAllByTestId('avatar').length).toBeGreaterThan(0);
    });

    it('should show user initials CG', () => {
      const avatars = screen.getAllByTestId('avatar');
      const hasInitials = avatars.some(a => a.textContent === 'CG');
      expect(hasInitials).toBe(true);
    });

    it('should display the username', () => {
      expect(screen.getByText('carlos')).toBeInTheDocument();
    });

    it('should display the user role (capitalized)', () => {
      expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    it('should mount the upgrade modal', () => {
      expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
    });

    it('should render theme toggle', () => {
      expect(screen.getAllByTestId('theme-toggle').length).toBeGreaterThan(0);
    });

    it('should render language switcher', () => {
      expect(screen.getAllByTestId('language-switcher').length).toBeGreaterThan(0);
    });

    it('should render notification buttons', () => {
      const notifButtons = screen.getAllByLabelText('sidebar.notifications');
      expect(notifButtons.length).toBeGreaterThan(0);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Mobile menu
  // ══════════════════════════════════════════════════════════════════

  describe('Given the mobile menu toggle', () => {
    beforeEach(() => {
      render(<AppLayout />);
    });

    it('should render the mobile hamburger button', () => {
      expect(screen.getByLabelText('sidebar.open')).toBeInTheDocument();
    });

    describe('When the user opens the mobile menu', () => {
      beforeEach(async () => {
        await user.click(screen.getByLabelText('sidebar.open'));
      });

      it('should show the close button', () => {
        expect(screen.getByLabelText('sidebar.close')).toBeInTheDocument();
      });

      it('should show the mobile overlay', () => {
        const overlay = document.querySelector('[aria-hidden="true"]');
        expect(overlay).toBeInTheDocument();
      });

      describe('When the user clicks the close button', () => {
        beforeEach(async () => {
          await user.click(screen.getByLabelText('sidebar.close'));
        });

        it('should hide the overlay', () => {
          const overlay = document.querySelector('.bg-black\\/50');
          expect(overlay).not.toBeInTheDocument();
        });
      });

      describe('When the user clicks the overlay', () => {
        beforeEach(async () => {
          const overlay = document.querySelector('[aria-hidden="true"]');
          if (overlay) await user.click(overlay as HTMLElement);
        });

        it('should close the mobile menu', () => {
          const overlay = document.querySelector('.bg-black\\/50');
          expect(overlay).not.toBeInTheDocument();
        });
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Desktop collapse toggle
  // ══════════════════════════════════════════════════════════════════

  describe('Given the desktop collapse toggle', () => {
    beforeEach(() => {
      render(<AppLayout />);
    });

    it('should show the collapse button initially', () => {
      expect(screen.getByLabelText('sidebar.collapse')).toBeInTheDocument();
    });

    it('should show the collapse text', () => {
      expect(screen.getByText('sidebar.collapse')).toBeInTheDocument();
    });

    describe('When the user clicks collapse', () => {
      beforeEach(async () => {
        await user.click(screen.getByLabelText('sidebar.collapse'));
      });

      it('should show the expand button', () => {
        expect(screen.getByLabelText('sidebar.expand')).toBeInTheDocument();
      });

      it('should hide the collapse text', () => {
        expect(screen.queryByText('sidebar.collapse')).not.toBeInTheDocument();
      });

      describe('When the user clicks expand', () => {
        beforeEach(async () => {
          await user.click(screen.getByLabelText('sidebar.expand'));
        });

        it('should show the collapse button again', () => {
          expect(screen.getByLabelText('sidebar.collapse')).toBeInTheDocument();
        });
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Logout
  // ══════════════════════════════════════════════════════════════════

  describe('Given the user clicks logout', () => {
    beforeEach(async () => {
      render(<AppLayout />);
      // Find the expanded logout button (the one with aria-label in expanded section)
      const logoutButtons = screen.getAllByLabelText('sidebar.logout');
      // Click the first logout button available
      await user.click(logoutButtons[0]);
    });

    it('should call the logout function', () => {
      expect(mockLogout).toHaveBeenCalled();
    });

    it('should navigate to sign-in page', async () => {
      // handleLogout is async: await logout() then navigate
      await vi.waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/authentication/sign-in');
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Storage context switcher (H-03 / STOC-346)
  // ══════════════════════════════════════════════════════════════════

  describe('Given the storage context switcher is integrated in the sidebar', () => {
    beforeEach(() => {
      render(<AppLayout />);
    });

    it('Then the StorageSwitcher is mounted in the sidebar', () => {
      expect(screen.getByTestId('storage-switcher')).toBeInTheDocument();
    });

    it('Then the global StorageStatusBanner is mounted above the main content', () => {
      expect(screen.getByTestId('storage-status-banner')).toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Mobile top bar
  // ══════════════════════════════════════════════════════════════════

  describe('Given the mobile top bar', () => {
    beforeEach(() => {
      render(<AppLayout />);
    });

    it('should show the Stocka brand in the mobile top bar', () => {
      // Mobile top bar has its own Stocka text
      const stockaTexts = screen.getAllByText('Stocka');
      expect(stockaTexts.length).toBeGreaterThanOrEqual(2); // sidebar + mobile bar
    });

    it('should show the hamburger menu button', () => {
      expect(screen.getByLabelText('sidebar.open')).toBeInTheDocument();
    });

    it('should show the theme toggle in the mobile top bar', () => {
      // Multiple theme toggles: sidebar (compact), sidebar (expanded), mobile bar
      expect(screen.getAllByTestId('theme-toggle').length).toBeGreaterThanOrEqual(2);
    });

    it('should show the language switcher in the mobile top bar', () => {
      expect(screen.getAllByTestId('language-switcher').length).toBeGreaterThanOrEqual(2);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // User with no role
  // ══════════════════════════════════════════════════════════════════

  describe('Given a user with no role', () => {
    beforeEach(() => {
      mockAuthState.user = {
        username: 'guest',
        email: 'guest@stocka.mx',
        givenName: null,
        familyName: null,
        displayName: null,
        avatarUrl: null,
        role: null,
      };
      render(<AppLayout />);
    });

    it('should display the role fallback as Member', () => {
      expect(screen.getByText('Member')).toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Null user (unauthenticated render)
  // ══════════════════════════════════════════════════════════════════

  describe('Given the user is null', () => {
    beforeEach(() => {
      mockAuthState.user = null;
      render(<AppLayout />);
    });

    it('should render the layout without crashing', () => {
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('should show dash as username fallback', () => {
      expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    });
  });
});
