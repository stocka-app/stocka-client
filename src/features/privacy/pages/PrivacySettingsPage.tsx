import { useTranslation } from 'react-i18next';
import { Mail, BarChart3, FileText, Shield, ExternalLink, RefreshCw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Switch } from '@/shared/components/ui';
import { usePrivacy } from '../hooks/usePrivacy';

// ── Skeleton placeholder shown while loading ─────────────────────────

function ConsentSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-40 mb-1" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-72" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-11 rounded-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Toggle row for marketing / analytics ─────────────────────────────

interface ConsentToggleRowProps {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function ConsentToggleRow({ icon: Icon, label, description, checked, disabled, onToggle }: ConsentToggleRowProps) {
  const id = `consent-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
          <Icon className="h-4 w-4 text-neutral-600" />
        </div>
        <div className="min-w-0">
          <label htmlFor={id} className="text-sm font-medium text-neutral-900 cursor-pointer">
            {label}
          </label>
          <p className="text-xs text-neutral-500 mt-0.5">
            {description}
          </p>
        </div>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}

// ── Legal document row (read-only) ───────────────────────────────────

interface LegalDocRowProps {
  icon: LucideIcon;
  label: string;
  acceptedOn: string | null;
  acceptedOnTemplate: string;
  viewLabel: string;
  href: string;
}

function LegalDocRow({ icon: Icon, label, acceptedOn, acceptedOnTemplate, viewLabel, href }: LegalDocRowProps) {
  const formattedDate = acceptedOn
    ? new Date(acceptedOn).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100">
          <Icon className="h-4 w-4 text-neutral-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900">
            {label}
          </p>
          {formattedDate && (
            <p className="text-xs text-neutral-500 mt-0.5">
              {acceptedOnTemplate.replace('{{date}}', formattedDate)}
            </p>
          )}
        </div>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-brand hover:underline mt-1"
      >
        {viewLabel}
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────

export default function PrivacySettingsPage(): React.ReactNode {
  const { t } = useTranslation('privacy');
  const {
    consents,
    isLoading,
    isSaving,
    error,
    updateError,
    toggleMarketing,
    toggleAnalytics,
    retry,
  } = usePrivacy();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          {t('pageTitle')}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {t('pageDescription')}
        </p>
      </div>

      {/* Fetch error */}
      {error && !isLoading && (
        <div
          role="alert"
          className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
        >
          <span>{t(error)}</span>
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:underline"
          >
            <RefreshCw className="h-3 w-3" />
            {t('errors.fetchFailed') !== t(error) ? t('errors.fetchFailed') : 'Retry'}
          </button>
        </div>
      )}

      {/* Update error toast-like banner */}
      {updateError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
        >
          {t(updateError)}
        </div>
      )}

      {/* Saving indicator */}
      {isSaving && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
          {t('saving')}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && <ConsentSkeleton />}

      {/* Content */}
      {!isLoading && consents && (
        <>
          {/* Preferences section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {t('sections.consents')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ConsentToggleRow
                icon={Mail}
                label={t('marketing.label')}
                description={t('marketing.description')}
                checked={consents.marketing}
                disabled={isSaving}
                onToggle={toggleMarketing}
              />

              <div className="border-t border-border" />

              <ConsentToggleRow
                icon={BarChart3}
                label={t('analytics.label')}
                description={t('analytics.description')}
                checked={consents.analytics}
                disabled={isSaving}
                onToggle={toggleAnalytics}
              />
            </CardContent>
          </Card>

          {/* Legal documents section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {t('sections.legal')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <LegalDocRow
                icon={FileText}
                label={t('terms.label')}
                acceptedOn={consents.termsAcceptedAt}
                acceptedOnTemplate={t('terms.acceptedOn')}
                viewLabel={t('terms.viewDocument')}
                href="/legal/terms"
              />

              <div className="border-t border-border" />

              <LegalDocRow
                icon={Shield}
                label={t('privacy.label')}
                acceptedOn={consents.privacyAcceptedAt}
                acceptedOnTemplate={t('privacy.acceptedOn')}
                viewLabel={t('privacy.viewDocument')}
                href="/legal/privacy"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
