import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import type { StorageStatus, StorageStatusSummary } from '../types/storages.types';

interface ArchivedStoragesFilterProps {
  /** Currently selected status filter, or `null` for "all". */
  value: StorageStatus | null;
  /** Aggregate counters per status for the active type tab. */
  summary: StorageStatusSummary;
  /** True when the user has STORAGE_RESTORE permission. Drives the
   * informational note rendered below the pills when ARCHIVED is selected. */
  canRestore: boolean;
  onChange: (next: StorageStatus | null) => void;
}

interface PillSpec {
  /** Status filter the pill applies; `null` clears the filter. */
  key: StorageStatus | null;
  /** i18n key under the `storages` namespace. */
  labelKey: string;
  /** Default Spanish label used while the i18n key is being authored. */
  fallback: string;
}

const PILLS: PillSpec[] = [
  { key: null, labelKey: 'statusFilter.all', fallback: 'Todas' },
  { key: 'ACTIVE', labelKey: 'statusFilter.active', fallback: 'Activas' },
  { key: 'FROZEN', labelKey: 'statusFilter.frozen', fallback: 'Congeladas' },
  { key: 'ARCHIVED', labelKey: 'statusFilter.archived', fallback: 'Archivadas' },
];

function countFor(key: StorageStatus | null, summary: StorageStatusSummary): number {
  if (key === null) return summary.active + summary.frozen + summary.archived;
  if (key === 'ACTIVE') return summary.active;
  if (key === 'FROZEN') return summary.frozen;
  return summary.archived;
}

/**
 * Status-filter pill bar for the storages list. Replaces the legacy
 * `<select>` dropdown so users can switch between Todas / Activas /
 * Congeladas / Archivadas in a single click and at-a-glance see counters
 * per state.
 *
 * When ARCHIVED is selected and the user has restore permission, an
 * informational note is shown beneath the pills so the affordance to
 * recover items via the card menu is discoverable.
 */
export function ArchivedStoragesFilter({
  value,
  summary,
  canRestore,
  onChange,
}: ArchivedStoragesFilterProps): React.ReactElement {
  const { t } = useTranslation('storages');

  return (
    <div className="mb-4">
      <div
        role="tablist"
        aria-label={t('statusFilter.ariaLabel', { defaultValue: 'Filtrar por estado' })}
        className="flex flex-wrap gap-2"
      >
        {PILLS.map((pill) => {
          const isActive = value === pill.key;
          const count = countFor(pill.key, summary);
          return (
            <button
              key={pill.key ?? 'all'}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(pill.key)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-4 py-1.5 text-xs font-medium transition-colors',
                isActive
                  ? 'border-brand bg-brand text-white'
                  : 'border-border bg-surface-card text-neutral-600 hover:bg-neutral-100',
              )}
            >
              <span>{t(pill.labelKey, { defaultValue: pill.fallback })}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {value === 'ARCHIVED' && canRestore && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
          <span className="material-symbols-outlined text-[14px] text-neutral-400" aria-hidden="true">
            info
          </span>
          {t('statusFilter.archivedHint', {
            defaultValue:
              'Las instalaciones archivadas se pueden restaurar desde el menú de cada tarjeta.',
          })}
        </p>
      )}
    </div>
  );
}
