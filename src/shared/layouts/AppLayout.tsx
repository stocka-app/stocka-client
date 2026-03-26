import { useState, useCallback, useRef, useEffect } from 'react';
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
  ChevronDown,
  Menu,
  X,
  LogOut,
  Bell,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { StockaIcon } from '@/shared/components/StockaIcon';
import { UpgradeModal } from '@/shared/components/UpgradeModal';
import { useAuthentication } from '@/features/authentication';
import { AvatarWithFallback, getInitials } from '@/shared/components/AvatarWithFallback';

interface NavItem {
  key: string;
  path: string;
  icon: LucideIcon;
  hasSubNav?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard },
  { key: 'categories', path: '/categories', icon: Tag, hasSubNav: true },
  { key: 'warehouse', path: '/warehouse', icon: Warehouse, hasSubNav: true },
  { key: 'products', path: '/products', icon: Package, hasSubNav: true },
  { key: 'suppliers', path: '/suppliers', icon: Truck },
  { key: 'settings', path: '/settings/organization', icon: Settings },
];


export function AppLayout() {
  const { t } = useTranslation('layout');
  const navigate = useNavigate();
  const { user, logout } = useAuthentication();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setIsSelectorOpen(false);
      }
    };
    if (isSelectorOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSelectorOpen]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/authentication/sign-in');
  }, [logout, navigate]);

  const userInitials = user ? getInitials(user.givenName, user.familyName, user.displayName, user.username) : '?';

  // Sidebar width: mobile=w-64, tablet=w-16, desktop=w-64|w-16
  const sidebarWidthClass = cn('w-64', 'md:w-16', isCollapsed ? 'lg:w-16' : 'lg:w-64');
  const sidebarTranslateClass = cn(
    isMobileOpen ? 'translate-x-0' : '-translate-x-full',
    'md:translate-x-0',
  );
  const mainMarginClass = cn('ml-0', 'md:ml-16', isCollapsed ? 'lg:ml-16' : 'lg:ml-64');

  // Classes for elements that should only show when sidebar has label space
  const labelVisible = cn('block md:hidden', !isCollapsed && 'lg:block');

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
          'bg-surface-sidebar border-r border-border',
          'transition-[width,transform] duration-300 ease-in-out',
          sidebarWidthClass,
          sidebarTranslateClass,
        )}
        aria-label={t('sidebar.ariaLabel')}
      >
        {/* Logo + collapse toggle */}
        <div className="flex items-center justify-between px-4 pt-6 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 bg-brand rounded-xl flex items-center justify-center flex-shrink-0 dark:shadow-glow-brand">
              <StockaIcon className="h-[22px] w-[22px] text-white" />
            </div>
            <span
              className={cn(
                'text-xl font-bold tracking-tight text-neutral-900 dark:text-white truncate',
                'md:hidden',
                !isCollapsed && 'lg:inline',
              )}
            >
              Stocka
            </span>
          </div>

          {/* Mobile: close drawer */}
          <button
            className="md:hidden h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
            onClick={() => setIsMobileOpen(false)}
            aria-label={t('sidebar.close')}
          >
            <X className="h-4 w-4" />
          </button>

        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto pt-14 pb-3 space-y-1 px-3" aria-label={t('sidebar.nav')}>
          {/* Business selector with floating popover */}
          <div ref={selectorRef} className={cn('relative mb-4', 'md:hidden', !isCollapsed && 'lg:block')}>
            <button
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-base hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
              aria-label={t('sidebar.myBusiness')}
              type="button"
              onClick={() => setIsSelectorOpen((prev) => !prev)}
            >
              <Warehouse className="h-5 w-5 text-brand flex-shrink-0" />
              <span className="text-neutral-700 dark:text-neutral-200 font-medium truncate flex-1 text-left">
                {t('sidebar.myBusiness')}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-neutral-400 flex-shrink-0 transition-transform duration-200',
                  isSelectorOpen && 'rotate-180',
                )}
              />
            </button>

            {isSelectorOpen && (
              <div className="absolute left-full top-0 ml-2 z-50 w-52 rounded-xl border border-border bg-surface-card shadow-dropdown overflow-hidden">
                <p className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  {t('sidebar.selectBusiness')}
                </p>
                <div className="p-1.5 space-y-0.5">
                  {[
                    { label: 'Mi Negocio', active: true },
                    { label: 'Tienda Norte', active: false },
                    { label: 'Sucursal Centro', active: false },
                  ].map(({ label, active }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setIsSelectorOpen(false)}
                      className={cn(
                        'w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors flex items-center gap-2',
                        active
                          ? 'bg-neutral-100 dark:bg-white/[0.09] text-neutral-900 dark:text-white font-semibold'
                          : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white',
                      )}
                    >
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-brand flex-shrink-0" />}
                      {!active && <span className="h-1.5 w-1.5 flex-shrink-0" />}
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {NAV_ITEMS.map(({ key, path, icon: Icon, hasSubNav }) => (
            <NavLink
              key={key}
              to={path}
              title={isCollapsed ? t(`nav.${key}`) : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-4 rounded-xl px-4 py-3 text-base transition-colors',
                  'md:justify-center md:gap-0 md:px-0',
                  !isCollapsed ? 'lg:justify-start lg:gap-4 lg:px-4' : 'lg:justify-center lg:gap-0 lg:px-0',
                  isActive
                    ? 'bg-neutral-100 dark:bg-white/[0.09] text-neutral-900 dark:text-white font-semibold'
                    : 'font-normal text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.05] hover:text-neutral-900 dark:hover:text-white',
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className={cn('flex-1 truncate', 'md:hidden', !isCollapsed && 'lg:inline')}>
                {t(`nav.${key}`)}
              </span>
              {hasSubNav && (
                <ChevronRight
                  className={cn(
                    'h-4 w-4 flex-shrink-0 text-neutral-400',
                    'md:hidden',
                    !isCollapsed && 'lg:block',
                  )}
                />
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Compact bottom (tablet + desktop-collapsed) ── */}
        <div
          className={cn(
            'hidden py-3 flex-shrink-0 flex-col items-center gap-2',
            'md:flex lg:hidden',
            isCollapsed && 'lg:flex',
          )}
        >
          <button
            type="button"
            aria-label={t('sidebar.notifications')}
            title={t('sidebar.notifications')}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 transition-colors"
          >
            <Bell className="h-4 w-4" />
          </button>
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            type="button"
            onClick={handleLogout}
            title={t('sidebar.logout')}
            className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-brand flex items-center justify-center text-xs font-bold hover:ring-2 hover:ring-brand/50 transition-all overflow-hidden"
            aria-label={t('sidebar.logout')}
          >
            <AvatarWithFallback avatarUrl={user?.avatarUrl} initials={userInitials} className="h-9 w-9" />
          </button>
        </div>

        {/* ── Expanded bottom (mobile drawer + desktop-expanded) ── */}
        <div
          className={cn(
            'flex flex-col flex-shrink-0',
            'md:hidden',
            !isCollapsed && 'lg:flex',
          )}
        >
          {/* Icon row: notifications, language, theme */}
          <div className="flex items-center justify-around py-3">
            <button
              type="button"
              aria-label={t('sidebar.notifications')}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
            >
              <Bell className="h-5 w-5" />
            </button>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {/* User row */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-brand flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
              <AvatarWithFallback avatarUrl={user?.avatarUrl} initials={userInitials} className="h-9 w-9" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate leading-tight">
                {user?.username ?? '—'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate leading-tight">
                {user?.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()
                  : 'Member'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-shrink-0 h-7 w-7 flex items-center justify-center rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
              aria-label={t('sidebar.logout')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* ── Desktop: collapse toggle — floating on sidebar right edge ── */}
        <button
          className={cn(
            'absolute top-[96px] right-[-12px] hidden lg:flex',
            'h-6 w-6 items-center justify-center rounded-full',
            'bg-white dark:bg-[#0d1526] border border-border dark:border-white/[0.12] shadow-sm',
            'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors',
          )}
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>

      {/* ── Mobile top bar (< 768px) ── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 bg-surface-sidebar border-b border-border">
        <button
          type="button"
          className="h-8 w-8 flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
          onClick={() => setIsMobileOpen(true)}
          aria-label={t('sidebar.open')}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 bg-brand rounded-lg flex items-center justify-center dark:shadow-glow-brand">
            <StockaIcon className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-neutral-900">Stocka</span>
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

      {/* Global upgrade modal */}
      <UpgradeModal />
    </div>
  );
}
