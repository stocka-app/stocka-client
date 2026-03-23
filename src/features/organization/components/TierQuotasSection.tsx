import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QuotaProgressBar } from './QuotaProgressBar';
import { useOrganization } from '../hooks/useOrganization';

export function TierQuotasSection(): React.ReactNode {
  const { t } = useTranslation('organization');
  const { profile, quotas, isLoading, error, fetchQuotas } = useOrganization();

  useEffect(() => {
    fetchQuotas();
  }, [fetchQuotas]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-neutral-500">{t('audit.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
        {t(error)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t('limits.title')}
        </h2>
        {profile && (
          <span className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
            {t(`profile.tiers.${profile.tier}`)}
          </span>
        )}
      </div>

      {quotas ? (
        <div className="space-y-4">
          <QuotaProgressBar
            label={t('limits.warehouses')}
            used={quotas.warehouses.used}
            max={quotas.warehouses.max}
          />
          <QuotaProgressBar
            label={t('limits.members')}
            used={quotas.members.used}
            max={quotas.members.max}
          />
          <QuotaProgressBar
            label={t('limits.products')}
            used={quotas.products.used}
            max={quotas.products.max}
          />
        </div>
      ) : null}
    </div>
  );
}
