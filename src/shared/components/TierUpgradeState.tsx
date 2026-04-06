import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { StateComposition } from '@/shared/components/StateComposition';

interface TierUpgradeStateProps {
  /** Display name of the locked feature, used in the title — e.g. "Bodegas" */
  feature: string;
  /** Called when the user clicks the upgrade CTA */
  onUpgrade: () => void;
  /** Optional secondary action — renders a "go back" button when provided */
  onBack?: () => void;
}

/**
 * TierUpgradeState
 *
 * Full-container state rendered when an entire feature tab/section is locked
 * on the current tenant tier (limit === 0 / allowed === false).
 *
 * This is distinct from `TierGate` (inline children wrapper) and from the
 * "at limit" inline card in storage grids. Use this component when the whole
 * page content should be replaced with an upgrade prompt.
 *
 * Usage:
 *   <TierUpgradeState
 *     feature={t('types.WAREHOUSE')}
 *     onUpgrade={() => openUpgradeModal('FEATURE_NOT_IN_TIER', 'WAREHOUSE')}
 *     onBack={() => setFilterType(null)}
 *   />
 */
export function TierUpgradeState({
  feature,
  onUpgrade,
  onBack,
}: TierUpgradeStateProps): React.ReactElement {
  const { t } = useTranslation('common');

  return (
    <StateComposition
      icon="lock"
      variant="neutral"
      title={t('tierUpgrade.title', { feature })}
      description={t('tierUpgrade.description')}
      actions={
        <>
          <Button
            type="button"
            onClick={onUpgrade}
            className="gap-2 bg-brand text-white hover:bg-brand-hover"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              rocket_launch
            </span>
            {t('tierUpgrade.cta')}
          </Button>
          {onBack !== undefined && (
            <Button type="button" variant="outline" onClick={onBack} className="gap-2">
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                arrow_back
              </span>
              {t('tierUpgrade.back')}
            </Button>
          )}
        </>
      }
    />
  );
}
