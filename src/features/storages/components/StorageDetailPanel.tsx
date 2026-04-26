import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import Drawer from '@/shared/components/Drawer';
import { Button } from '@/shared/components/ui/button';
import type { Storage, StorageStatus } from '../types/storages.types';

interface StorageDetailPanelProps {
  /** Storage being inspected. `null` keeps the drawer empty so it animates out cleanly. */
  storage: Storage | null;
  open: boolean;
  /** Permission flags surfaced from `useStorages`. The panel only renders the
   * primary CTA when the matching action is allowed for the current user. */
  canUpdate: boolean;
  canUnfreeze: boolean;
  canRestore: boolean;
  /** RBAC: user has STORAGE_DELETE permission. The destructive CTA is omitted
   * from the DOM (not rendered disabled) when false so MANAGER/VIEWER never
   * see the entry point. */
  canDelete?: boolean;
  /** True when the browser reports no connectivity. Disables the primary CTA
   * with a tooltip so the user sees why the action cannot fire. */
  isOffline?: boolean;
  onClose: () => void;
  onEdit: (storage: Storage) => void;
  onReactivate: (storage: Storage) => void;
  onRestore: (storage: Storage) => void;
  onDelete?: (storage: Storage) => void;
}

const STATUS_BADGE: Record<StorageStatus, string> = {
  ACTIVE: 'bg-success/15 text-success',
  FROZEN: 'bg-info/15 text-info',
  ARCHIVED: 'bg-neutral-200 text-neutral-700',
};

function formatDate(iso: string | null, locale: string): string {
  if (iso === null) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/**
 * Side panel that surfaces a single storage's full metadata plus the
 * contextual primary CTA for its current state. ARCHIVED bodies fade to
 * 60% to signal "stopped"; the header (where the recovery CTA lives)
 * intentionally stays at 100% opacity so the action is never visually
 * downplayed.
 */
export function StorageDetailPanel({
  storage,
  open,
  canUpdate,
  canUnfreeze,
  canRestore,
  canDelete = false,
  isOffline = false,
  onClose,
  onEdit,
  onReactivate,
  onRestore,
  onDelete,
}: StorageDetailPanelProps): React.ReactElement {
  const { t, i18n } = useTranslation('storages');

  return (
    <Drawer open={open} onClose={onClose} className="max-w-[480px]">
      {storage !== null && (
        <>
          {/* Header — stays at full opacity even on ARCHIVED so the recovery CTA stays prominent */}
          <header className="flex items-start gap-3 border-b border-border px-6 py-4">
            <span
              aria-hidden="true"
              className="mt-1 inline-block h-3 w-3 flex-none rounded-full"
              style={{ backgroundColor: storage.color }}
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold text-neutral-900">
                {storage.name}
              </h2>
              <span
                className={cn(
                  'mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  STATUS_BADGE[storage.status],
                )}
              >
                {t(`statuses.${storage.status}`)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('detail.close', { defaultValue: 'Cerrar' })}
              className="ml-2 rounded p-1 text-neutral-500 hover:bg-neutral-100"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </header>

          {/* Action row — primary CTA contextual to the current status */}
          <div className="flex flex-wrap gap-2 border-b border-border px-6 py-3">
            {storage.status === 'FROZEN' && canUnfreeze && (
              <Button
                type="button"
                onClick={() => !isOffline && onReactivate(storage)}
                disabled={isOffline}
                title={isOffline ? t('tooltips.offline', { defaultValue: 'Sin conexión.' }) : undefined}
                className={cn(
                  'gap-2 bg-brand text-white hover:bg-brand-hover',
                  isOffline && 'cursor-not-allowed opacity-40',
                )}
              >
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                {t('detail.cta.reactivate', { defaultValue: 'Reactivar' })}
              </Button>
            )}
            {storage.status === 'ARCHIVED' && canRestore && (
              <Button
                type="button"
                onClick={() => !isOffline && onRestore(storage)}
                disabled={isOffline}
                title={isOffline ? t('tooltips.offline', { defaultValue: 'Sin conexión.' }) : undefined}
                className={cn(
                  'gap-2 bg-brand text-white hover:bg-brand-hover',
                  isOffline && 'cursor-not-allowed opacity-40',
                )}
              >
                <span className="material-symbols-outlined text-[18px]">settings_backup_restore</span>
                {t('detail.cta.restore', { defaultValue: 'Restaurar' })}
              </Button>
            )}
            {canUpdate && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onEdit(storage)}
                className="gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                {t('detail.cta.edit', { defaultValue: 'Editar' })}
              </Button>
            )}
            {storage.status === 'ARCHIVED' && canDelete && onDelete && (
              <>
                <span
                  aria-hidden="true"
                  className="mx-1 h-6 w-px self-center bg-border"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onDelete(storage)}
                  aria-label={t('permanentDelete.detailCtaAriaLabel', { name: storage.name })}
                  className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  {t('permanentDelete.detailCta')}
                </Button>
              </>
            )}
          </div>

          {/* Body — fades on ARCHIVED to signal the "stopped" state */}
          <div
            className={cn(
              'flex-1 overflow-y-auto px-6 py-4',
              storage.status === 'ARCHIVED' && 'opacity-60',
            )}
          >
            <dl className="space-y-4 text-sm">
              <DetailRow label={t('detail.fields.type', { defaultValue: 'Tipo' })} value={t(`types.${storage.type}`)} />
              {storage.address !== null && storage.address !== '' && (
                <DetailRow label={t('detail.fields.address', { defaultValue: 'Dirección' })} value={storage.address} />
              )}
              {storage.roomType !== null && (
                <DetailRow label={t('detail.fields.roomType', { defaultValue: 'Tipo de cuarto' })} value={storage.roomType} />
              )}
              {storage.description !== null && storage.description !== '' && (
                <DetailRow
                  label={t('detail.fields.description', { defaultValue: 'Descripción' })}
                  value={storage.description}
                />
              )}
              <DetailRow
                label={t('detail.fields.icon', { defaultValue: 'Ícono' })}
                value={
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ color: storage.color }}
                    >
                      {storage.icon}
                    </span>
                    <span className="text-neutral-500">{storage.icon}</span>
                  </span>
                }
              />
              <DetailRow
                label={t('detail.fields.createdAt', { defaultValue: 'Creado' })}
                value={formatDate(storage.createdAt, i18n.language)}
              />
              <DetailRow
                label={t('detail.fields.updatedAt', { defaultValue: 'Actualizado' })}
                value={formatDate(storage.updatedAt, i18n.language)}
              />
              {storage.frozenAt !== null && (
                <DetailRow
                  label={t('detail.fields.frozenAt', { defaultValue: 'Congelado' })}
                  value={formatDate(storage.frozenAt, i18n.language)}
                />
              )}
              {storage.archivedAt !== null && (
                <DetailRow
                  label={t('detail.fields.archivedAt', { defaultValue: 'Archivado' })}
                  value={formatDate(storage.archivedAt, i18n.language)}
                />
              )}
            </dl>
          </div>
        </>
      )}
    </Drawer>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-900">{value}</dd>
    </div>
  );
}
