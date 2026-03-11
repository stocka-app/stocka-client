import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { IsometricCubesIllustration } from '@/shared/components/illustrations';
import { useTheme } from '@/shared/hooks/useTheme';

export function AuthLayout() {
  const { t } = useTranslation('auth');
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen w-full bg-auth-body font-auth text-neutral-800 dark:text-neutral-800 antialiased flex items-center justify-center p-2 lg:p-[1.5vw]">
      <div className="bg-auth-surface dark:bg-auth-right-panel rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden w-full max-w-[96vw] min-h-[500px] lg:h-[85vh] flex flex-col lg:flex-row relative ring-1 ring-black/5 dark:ring-white/10">
        {/* ── Left Panel (hidden on mobile) ── */}
        <div className="hidden lg:flex lg:w-5/12 relative bg-auth-left-panel items-center justify-center overflow-hidden">
          {/* Isometric illustration background */}
          <div className="absolute inset-0 z-0 flex items-center justify-center">
            <IsometricCubesIllustration variant={isDark ? 'dark' : 'light'} />
            <div className="absolute inset-0 bg-gradient-to-t from-teal-900/30 via-transparent to-transparent dark:from-auth-left-panel/90" />
          </div>

          {/* Content overlay */}
          <div className="relative z-10 p-12 flex flex-col h-full justify-between text-white w-full">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 dark:bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 dark:border-white/10 dark:shadow-lg dark:shadow-teal-500/10">
                <span className="material-symbols-outlined text-white dark:text-teal-400 text-2xl">
                  inventory_2
                </span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
                Stocka
              </span>
            </div>

            {/* Bottom branding text */}
            <div className="mt-auto mb-8">
              <h2 className="text-4xl font-bold mb-4 leading-tight drop-shadow-md text-white">
                {t('layout.heroTitle', 'Welcome to Stocka')}
              </h2>
              <p className="text-lg text-white/95 dark:text-slate-300 font-medium max-w-sm leading-relaxed drop-shadow-md">
                {t(
                  'layout.heroSubtitle',
                  'Streamline your inventory, optimize your logistics, and scale your business with intelligent insights.',
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ── Right Panel (form) ── */}
        <div className="w-full lg:w-7/12 flex flex-col bg-auth-surface dark:bg-auth-right-panel overflow-y-auto h-full">
          {/* Mobile header */}
          <div className="lg:hidden p-6 flex justify-between items-center bg-neutral-50 dark:bg-auth-right-panel border-b border-neutral-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-auth-btn dark:bg-auth-btn/20 dark:border dark:border-auth-btn/30 rounded-lg flex items-center justify-center text-white dark:text-auth-btn">
                <span className="material-symbols-outlined text-lg">inventory_2</span>
              </div>
              <span className="text-xl font-bold text-neutral-900 dark:text-white">Stocka</span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>

          {/* Desktop toolbar — top right corner */}
          <div className="hidden lg:flex items-center gap-1 absolute top-4 right-4 z-20">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>

          {/* Form content area */}
          <div className="flex-1 flex flex-col justify-center px-6 sm:px-16 py-10 w-full max-w-2xl mx-auto">
            <Outlet />
          </div>

          {/* Footer */}
          <div className="p-4 text-center text-xs text-neutral-400 dark:text-neutral-600">
            <span>{t('layout.termsPrefix', 'By clicking continue, you agree to our ')} </span>
            <a className="hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors underline" href="#">
              {t('layout.termsOfService', 'Terms of Service')}
            </a>
            <span> {t('layout.and', 'and')} </span>
            <a className="hover:text-neutral-600 dark:hover:text-neutral-400 transition-colors underline" href="#">
              {t('layout.privacyPolicy', 'Privacy Policy')}
            </a>
            .
          </div>
        </div>
      </div>
    </div>
  );
}
