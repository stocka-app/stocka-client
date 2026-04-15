import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import Dialog from '@/shared/components/Dialog';
import type { Storage } from '../types/storages.types';

interface ArchiveConfirmDialogProps {
  open: boolean;
  storage: Storage | null;
  /** Storage status at the moment the dialog opens (ACTIVE or FROZEN — drives variant 2.4). */
  sourceStatus: 'ACTIVE' | 'FROZEN';
  /** True if this storage is the user's active context (activeStorageId). */
  isContextActive: boolean;
  /** True if this is the only ACTIVE storage in the tenant (client-side detection). */
  isLastActive: boolean;
  /** True while the archive request is in flight. */
  isLoading: boolean;
  /** Non-null when the server returned an error — shows inline error banner and re-enables the primary button for retry. */
  serverError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * ArchiveConfirmDialog — H-07 Archivar instalación
 *
 * Confirmation dialog for archiving a storage. Six variants derived from props:
 *
 * 2.1 **Base** — standard, no extra blocks.
 * 2.2 **Context active** — amber warning ("trabajas en esta instalación"), primary label unchanged.
 * 2.3 **Last active** — amber warning strong + primary label switches to "Archivar de todos modos".
 * 2.4 **From FROZEN** — blue info block with ac_unit icon, primary label unchanged.
 * 2.5 **Loading** — spinner + "Archivando...", cancel disabled, backdrop/ESC blocked.
 * 2.6 **Server error** — red inline banner, primary re-enabled for retry.
 *
 * Block priority (only one block renders):
 *   last active > context active > from FROZEN
 *
 * Design (per UX decision #6):
 * - Primary button is **neutral gray** (`bg-neutral-600`) — archive is reversible, not destructive
 * - Buttons centered — consistent with FreezeConfirmDialog (H-05 decision #5)
 * - Main icon: `inventory_2` inside a 56×56 `bg-neutral-100` circle
 */
export function ArchiveConfirmDialog({
  open,
  storage,
  sourceStatus,
  isContextActive,
  isLastActive,
  isLoading,
  serverError,
  onClose,
  onConfirm,
}: ArchiveConfirmDialogProps): React.ReactElement | null {
  const { t } = useTranslation('storages');

  if (!storage) return null;

  // Block priority (only one renders)
  const showLastActiveBlock = isLastActive;
  const showContextBlock = !showLastActiveBlock && isContextActive && sourceStatus === 'ACTIVE';
  const showFrozenInfoBlock =
    !showLastActiveBlock && !showContextBlock && sourceStatus === 'FROZEN';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      closable={!isLoading}
      ariaLabelledBy="archive-confirm-dialog-title"
    >
      <>
        {/* Main icon — neutral gray circle 56×56 */}
        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
            <span
              className="material-symbols-outlined text-neutral-600"
              style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              inventory_2
            </span>
          </div>
        </div>

        {/* Title */}
        <h2
          id="archive-confirm-dialog-title"
          className="mb-3 text-center text-base font-semibold text-neutral-900"
        >
          {t('modals.archive.title', {
            name: storage.name,
            defaultValue: '¿Archivar "{{name}}"?',
          })}
        </h2>

        {/* Body */}
        <p className="text-center text-sm leading-relaxed text-neutral-600">
          {t('modals.archive.body', {
            defaultValue:
              'Esta instalación dejará de aparecer en las vistas activas. Podrás consultar su historial y restaurarla cuando quieras.',
          })}
        </p>

        {/* 2.3 — Warning block: last active (highest priority) */}
        {showLastActiveBlock && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-warning bg-warning-bg p-3">
            <span
              className="material-symbols-outlined shrink-0 text-[16px] text-warning"
              aria-hidden="true"
            >
              warning
            </span>
            <p className="text-[13px] leading-snug text-warning">
              {t('modals.archive.lastActiveBlock', {
                defaultValue:
                  'Esta es tu última instalación operativa. Si la archivas, no podrás realizar operaciones hasta restaurar o crear otra.',
              })}
            </p>
          </div>
        )}

        {/* 2.2 — Context-active block (amber warning, lighter tone) */}
        {showContextBlock && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-warning bg-warning-bg p-3">
            <span
              className="material-symbols-outlined shrink-0 text-[16px] text-warning"
              aria-hidden="true"
            >
              warning
            </span>
            <p className="text-[13px] leading-snug text-warning">
              {t('modals.archive.contextBlock', {
                defaultValue:
                  'Estás trabajando en esta instalación ahora. Al archivarla, el módulo pasará a otra o quedará sin contexto activo.',
              })}
            </p>
          </div>
        )}

        {/* 2.4 — From FROZEN info block (blue info, ac_unit) */}
        {showFrozenInfoBlock && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-info bg-info-bg p-3">
            <span
              className="material-symbols-outlined shrink-0 text-[16px] text-info"
              aria-hidden="true"
            >
              ac_unit
            </span>
            <p className="text-[13px] leading-snug text-info">
              {t('modals.archive.frozenInfoBlock', {
                defaultValue:
                  'Esta instalación está congelada. Al archivarla pasará directamente a histórico — no es necesario reactivarla primero.',
              })}
            </p>
          </div>
        )}

        {/* 2.6 — Server error banner */}
        {serverError && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-3">
            <span
              className="material-symbols-outlined shrink-0 text-[16px] text-destructive"
              aria-hidden="true"
            >
              cancel
            </span>
            <p className="text-[13px] leading-snug text-destructive">
              {t('modals.archive.serverError', {
                defaultValue:
                  'No pudimos archivar la instalación. Revisa tu conexión e intenta de nuevo.',
              })}
            </p>
          </div>
        )}

        {/* Safety line */}
        <p className="mt-4 text-center text-sm text-neutral-400">
          {t('modals.archive.safetyLine', {
            defaultValue: 'Podrás restaurarla en cualquier momento.',
          })}
        </p>

        {/* Footer — centered buttons */}
        <div className="mt-6 flex justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className={cn(isLoading && 'opacity-50')}
          >
            {t('modals.archive.cancel', { defaultValue: 'Cancelar' })}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-neutral-600 text-white hover:bg-neutral-700"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined animate-spin text-[16px]"
                  aria-hidden="true"
                >
                  progress_activity
                </span>
                {t('modals.archive.loading', { defaultValue: 'Archivando...' })}
              </span>
            ) : showLastActiveBlock ? (
              t('modals.archive.confirmAnyway', { defaultValue: 'Archivar de todos modos' })
            ) : (
              t('modals.archive.confirm', { defaultValue: 'Archivar' })
            )}
          </Button>
        </div>
      </>
    </Dialog>
  );
}
