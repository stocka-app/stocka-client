import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { useTierCapabilities } from '@/shared/hooks/useTierCapabilities';
import type { Storage, StorageType } from '../types/storages.types';

interface StorageLimitsSectionProps {
  storages: Storage[];
}

const STORAGE_TYPES: StorageType[] = ['CUSTOM_ROOM', 'STORE_ROOM', 'WAREHOUSE'];

function getProgressColor(used: number, max: number): string {
  const pct = used / max;
  if (pct >= 0.8) return 'bg-red-500';
  if (pct >= 0.5) return 'bg-yellow-500';
  return 'bg-brand';
}

function getProgressPercent(used: number, max: number): number {
  if (max <= 0) return 100;
  return Math.min(100, Math.round((used / max) * 100));
}

/**
 * StorageLimitsSection
 *
 * Displays per-type storage usage bars. For WAREHOUSE on FREE tier, clicking the row
 * opens the UpgradeModal instead of showing a progress bar.
 */
export function StorageLimitsSection({ storages }: StorageLimitsSectionProps): React.ReactElement {
  const { t } = useTranslation('storages');
  const { storageLimits, isAllowed, openUpgradeModal } = useTierCapabilities();

  return (
    <div className="rounded-lg border border-border bg-surface-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-neutral-700">
        {t('limits.title')}
      </h3>
      <div className="space-y-3">
        {STORAGE_TYPES.map((type) => {
          const max = storageLimits[type];
          const used = storages.filter((s) => s.type === type && s.status === 'ACTIVE').length;
          const isWarehouseBlocked = type === 'WAREHOUSE' && !isAllowed('warehouses');
          const isUnlimited = max === -1;

          return (
            <div
              key={type}
              className={cn(
                'flex items-center gap-3',
                isWarehouseBlocked && 'cursor-pointer',
              )}
              onClick={
                isWarehouseBlocked
                  ? () => openUpgradeModal('FEATURE_NOT_IN_TIER', 'WAREHOUSE')
                  : undefined
              }
              role={isWarehouseBlocked ? 'button' : undefined}
              tabIndex={isWarehouseBlocked ? 0 : undefined}
              onKeyDown={
                isWarehouseBlocked
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openUpgradeModal('FEATURE_NOT_IN_TIER', 'WAREHOUSE');
                      }
                    }
                  : undefined
              }
            >
              {/* Type label */}
              <span className="w-32 shrink-0 text-sm text-neutral-600">
                {t(`types.${type}`)}
              </span>

              {/* Progress bar */}
              <div className="flex-1">
                {isWarehouseBlocked ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                      {t('limits.warehouseProBadge')}
                    </span>
                  </div>
                ) : (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        isUnlimited ? 'bg-brand/30' : getProgressColor(used, max),
                      )}
                      style={{ width: `${getProgressPercent(used, max)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Usage label */}
              <span className="w-20 shrink-0 text-right text-xs text-neutral-500">
                {isUnlimited
                  ? t('limits.unlimited')
                  : t('limits.used', { used, max })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
