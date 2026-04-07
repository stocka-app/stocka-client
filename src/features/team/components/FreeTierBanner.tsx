import { useTranslation } from 'react-i18next';
import { useRBACStore } from '@/store/rbac.store';
import { TIER_CAPABILITIES } from '@/shared/config/tier-capabilities';
import type { TenantTier } from '@/features/team/types/team.types';

/**
 * FreeTierBanner
 *
 * Displayed when the current tenant plan does not include invitations (i.e. the
 * most restrictive tier) and the user is not the OWNER. Uses the TIER_CAPABILITIES
 * snapshot instead of comparing against a hardcoded tier name string, so the banner
 * automatically adapts if plan limits are reconfigured.
 */
export function FreeTierBanner(): React.ReactElement | null {
  const { t } = useTranslation('team');
  const { tier, role } = useRBACStore();

  const isRestrictedPlan =
    tier !== null && tier in TIER_CAPABILITIES
      ? !TIER_CAPABILITIES[tier as TenantTier].invitations
      : false;

  if (!isRestrictedPlan || role === 'OWNER') {
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
