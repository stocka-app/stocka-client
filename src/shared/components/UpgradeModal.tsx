import { useTranslation } from 'react-i18next';
import { useUpgradeModalStore } from '@/store/upgrade-modal.store';
import { useRBACStore } from '@/store/rbac.store';
import { Button } from '@/shared/components/ui/button';

/**
 * UpgradeModal
 *
 * Global modal that surfaces tier-limit and feature-unavailability messages.
 * Mount once in AppLayout — reads state from upgrade-modal store.
 */
export function UpgradeModal(): React.ReactElement | null {
  const { t } = useTranslation('common');
  const { isOpen, reason, close } = useUpgradeModalStore();
  const { tier } = useRBACStore();

  if (!isOpen) return null;

  const reasonKey =
    reason === 'TIER_LIMIT_REACHED'
      ? 'upgradeModal.reasonLimitReached'
      : 'upgradeModal.reasonNotInTier';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        {/* Header */}
        <h2
          id="upgrade-modal-title"
          className="mb-2 text-lg font-semibold text-neutral-900"
        >
          {t('upgradeModal.title')}
        </h2>

        {/* Reason description */}
        <p className="mb-4 text-sm text-muted-foreground">{t(reasonKey)}</p>

        {/* Current tier badge */}
        {tier && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {t('upgradeModal.currentTier')}:
            </span>
            <span className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
              {tier}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={close}>
            {t('upgradeModal.close')}
          </Button>
          <Button type="button" onClick={close}>
            {t('upgradeModal.cta')}
          </Button>
        </div>
      </div>
    </div>
  );
}
