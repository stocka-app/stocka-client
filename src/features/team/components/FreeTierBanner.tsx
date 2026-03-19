import { useTranslation } from 'react-i18next';
import { useRBACStore } from '@/store/rbac.store';

/**
 * FreeTierBanner
 *
 * Displayed when the tenant is on the FREE tier and the current user is not OWNER.
 * Informs non-owner members that write actions require an upgraded plan.
 */
export function FreeTierBanner(): React.ReactElement | null {
  const { t } = useTranslation('team');
  const { tier, role } = useRBACStore();

  if (tier !== 'FREE' || role === 'OWNER') {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-4 flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
    >
      <p>{t('freeTierBanner.message')}</p>
      <button
        type="button"
        className="ml-4 shrink-0 rounded-md bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-amber-900 dark:text-amber-100 dark:hover:bg-amber-800"
      >
        {t('freeTierBanner.cta')}
      </button>
    </div>
  );
}
