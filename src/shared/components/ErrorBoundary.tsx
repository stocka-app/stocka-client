import { Component } from 'react';
import type { ReactNode } from 'react';
import i18n from '@/shared/lib/i18n';
import { StockaIcon } from '@/shared/components/StockaIcon';
import { FlagUS, FlagMX } from '@/shared/components/flags';

/**
 * Error context determines the layout of the fallback UI:
 *
 * - `page`   → Standalone full-page error (wraps layouts — no chrome available).
 *               Includes its own branding, language/theme toggles, and nav links.
 * - `inline` → Compact error card (rendered inside a layout that is still visible,
 *               e.g. inside AppLayout sidebar or AuthenticationLayout).
 */
type ErrorContext = 'page' | 'inline';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** @default 'page' */
  context?: ErrorContext;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Reads i18n.t() directly — no React context needed.
 * This makes the boundary resilient even when providers are broken.
 */
function t(key: string): string {
  return i18n.t(`errorBoundary.${key}`, { ns: 'common' }) ?? key;
}

function toggleLanguage() {
  const next = i18n.language === 'es' ? 'en' : 'es';
  i18n.changeLanguage(next);
}

function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.classList.contains('dark');
  if (isDark) {
    root.classList.remove('dark');
    localStorage.setItem('stocka-theme', 'light');
  } else {
    root.classList.add('dark');
    localStorage.setItem('stocka-theme', 'dark');
  }
}

// ── Standalone full-page fallback ──────────────────────────────────

function PageFallback({ onReset }: { onReset: () => void }) {
  const isDark = document.documentElement.classList.contains('dark');
  const isEs = i18n.language === 'es';

  return (
    <div className="min-h-screen bg-surface-page flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="h-8 w-8 bg-brand rounded-lg flex items-center justify-center">
            <StockaIcon className="h-[18px] w-[18px] text-white" />
          </div>
          <span className="text-lg font-bold text-neutral-900">Stocka</span>
        </a>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            {isEs ? (
              <><FlagUS className="h-4 w-auto rounded-[1px]" /> English</>
            ) : (
              <><FlagMX className="h-4 w-auto rounded-[1px]" /> Español</>
            )}
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      {/* Centered error card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-card rounded-2xl border border-neutral-200 p-8 shadow-sm text-center">
          {/* Icon */}
          <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-neutral-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-sm text-neutral-500 mb-6">
            {t('description')}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onReset}
              className="w-full h-11 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              {t('tryAgain')}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => globalThis.location.reload()}
                className="flex-1 h-11 rounded-xl border border-neutral-200 text-neutral-500 text-sm font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                {t('reload')}
              </button>
              <a
                href="/authentication/sign-in"
                className="flex-1 h-11 rounded-xl border border-neutral-200 text-neutral-500 text-sm font-medium hover:bg-neutral-50 transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                {t('goToLogin')}
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Inline fallback (inside an existing layout) ────────────────────

function InlineFallback({ onReset }: { onReset: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center"
    >
      {/* Icon */}
      <div className="mb-4 h-12 w-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>

      <h2 className="text-lg font-bold text-neutral-900 mb-1">
        {t('title')}
      </h2>
      <p className="text-sm text-neutral-500 mb-5 max-w-sm">
        {t('description')}
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onReset}
          className="px-5 h-10 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-sm transition-colors cursor-pointer"
        >
          {t('tryAgain')}
        </button>
        <button
          type="button"
          onClick={() => globalThis.location.reload()}
          className="px-5 h-10 rounded-xl border border-neutral-200 text-neutral-500 text-sm font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          {t('reload')}
        </button>
      </div>
    </div>
  );
}

// ── ErrorBoundary class ────────────────────────────────────────────

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const context = this.props.context ?? 'page';

      if (context === 'inline') {
        return <InlineFallback onReset={this.handleReset} />;
      }

      return <PageFallback onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
