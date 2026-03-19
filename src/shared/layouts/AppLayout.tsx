import { useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Tag,
  Warehouse,
  Package,
  Truck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Building2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { useAuthentication } from '@/features/authentication';

interface NavItem {
  key: string;
  path: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'categories', path: '/categories', icon: Tag },
  { key: 'warehouse', path: '/warehouse', icon: Warehouse },
  { key: 'products', path: '/products', icon: Package },
  { key: 'suppliers', path: '/suppliers', icon: Truck },
  { key: 'settings', path: '/settings/organization', icon: Settings },
];

export function AppLayout() {
  const { t } = useTranslation('layout');
  const navigate = useNavigate();
  const { user, logout } = useAuthentication();

  // Desktop only: user-controlled collapse (tablet is always compact via CSS)
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Mobile: drawer visibility
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/authentication/login');
  }, [logout, navigate]);

  const userInitials = user ? user.username.slice(0, 2).toUpperCase() : '?';

  // Sidebar width:
  //   mobile: w-64 (full-width drawer)
  //   tablet (md): always compact = w-16
  //   desktop (lg): w-64 expanded | w-16 collapsed
  const sidebarWidthClass = cn(
    'w-64',
    'md:w-16',
    isCollapsed ? 'lg:w-16' : 'lg:w-64',
  );

  // Sidebar translation (slide in/out on mobile, always visible on md+):
  const sidebarTranslateClass = cn(
    isMobileOpen ? 'translate-x-0' : '-translate-x-full',
    'md:translate-x-0',
  );

  // Main content left margin to offset the fixed sidebar (mobile: overlay = no margin):
  const mainMarginClass = cn(
    'ml-0',
    'md:ml-16',
    isCollapsed ? 'lg:ml-16' : 'lg:ml-64',
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-page font-app antialiased">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col',
          'bg-surface-sidebar border-r border-neutral-200 dark:border-neutral-800',
          'transition-[width,transform] duration-300 ease-in-out',
          sidebarWidthClass,
          sidebarTranslateClass,
        )}
        aria-label={t('sidebar.ariaLabel')}
      >
        {/* Logo + collapse toggle */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 bg-brand rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white leading-none" style={{ fontSize: 18 }}>
                inventory_2
              </span>
            </div>
            {/* Logo text: mobile drawer + desktop expanded */}
            <span
              className={cn(
                'text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate',
                'md:hidden',
                !isCollapsed && 'lg:inline',
              )}
            >
              Stocka
            </span>
          </div>

          {/* Mobile: close drawer */}
          <button
            className="md:hidden h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            onClick={() => setIsMobileOpen(false)}
            aria-label={t('sidebar.close')}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Desktop: collapse toggle */}
          <button
            className={cn(
              'hidden lg:flex flex-shrink-0 h-7 w-7 items-center justify-center rounded-md',
              'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
            )}
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Space selector placeholder (v1) */}
        <div className="border-b border-neutral-200 dark:border-neutral-800 p-2 flex-shrink-0">
          <button
            className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            aria-label={t('sidebar.myBusiness')}
            type="button"
          >
            <Building2 className="h-4 w-4 text-brand flex-shrink-0" />
            <span
              className={cn(
                'text-neutral-700 dark:text-neutral-300 font-medium truncate',
                'md:hidden',
                !isCollapsed && 'lg:inline',
              )}
            >
              {t('sidebar.myBusiness')}
            </span>
          </button>
        </div>

        {/* Navigation items */}
        <nav
          className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2"
          aria-label={t('sidebar.nav')}
        >
          {NAV_ITEMS.map(({ key, path, icon: Icon }) => (
            <NavLink
              key={key}
              to={path}
              title={isCollapsed ? t(`nav.${key}`) : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand/10 text-brand dark:bg-brand/20'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100',
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span
                className={cn(
                  'truncate',
                  'md:hidden',
                  !isCollapsed && 'lg:inline',
                )}
              >
                {t(`nav.${key}`)}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* ── Compact bottom (tablet + desktop-collapsed): stacked icons ── */}
        {/*   mobile: hidden | tablet: flex-col | desktop-collapsed: flex-col   */}
        <div
          className={cn(
            'hidden border-t border-neutral-200 dark:border-neutral-800 p-2 flex-shrink-0 flex-col items-center gap-1',
            'md:flex lg:hidden',
            isCollapsed && 'lg:flex',
          )}
        >
          <ThemeToggle />
          <LanguageSwitcher />
          <button
            type="button"
            onClick={handleLogout}
            title={t('sidebar.logout')}
            className="h-8 w-8 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs font-semibold hover:ring-2 hover:ring-brand/50 transition-all"
            aria-label={t('sidebar.logout')}
          >
            {userInitials}
          </button>
        </div>

        {/* ── Expanded bottom (mobile drawer + desktop-expanded): full row ── */}
        {/*   mobile: flex | tablet: hidden | desktop-expanded: flex           */}
        <div
          className={cn(
            'flex flex-col gap-1 border-t border-neutral-200 dark:border-neutral-800 p-2 flex-shrink-0',
            'md:hidden',
            !isCollapsed && 'lg:flex',
          )}
        >
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-brand/20 text-brand flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {userInitials}
            </div>
            <span className="flex-1 text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {user?.username ?? '—'}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label={t('sidebar.logout')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile top bar (< 768px) ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 bg-surface-sidebar border-b border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          className="h-8 w-8 flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          onClick={() => setIsMobileOpen(true)}
          aria-label={t('sidebar.open')}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-brand rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white leading-none" style={{ fontSize: 16 }}>
              inventory_2
            </span>
          </div>
          <span className="font-bold text-neutral-900 dark:text-neutral-100">Stocka</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>

      {/* ── Main content area ── */}
      <div
        className={cn(
          'flex flex-1 flex-col min-h-0 min-w-0',
          'transition-[margin-left] duration-300 ease-in-out',
          mainMarginClass,
          'pt-14 md:pt-0',
        )}
      >
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
