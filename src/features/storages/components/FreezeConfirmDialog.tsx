import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import Dialog from '@/shared/components/Dialog';
import type { Storage } from '../types/storages.types';

interface FreezeConfirmDialogProps {
  open: boolean;
  storage: Storage | null;
  /** True if this storage is the user's active context (activeStorageId) */
  isContextActive: boolean;
  /** True if this is the only ACTIVE storage in the tenant (client-side detection) */
  isLastActive: boolean;
  /** True while the freeze request is in flight */
  isLoading: boolean;
  /** Non-null when the server returned an error — shows inline error banner */
  serverError: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * FreezeConfirmDialog — H-05 Congelar instalación
 *
 * Confirmation dialog for freezing a storage. 5 variants derived from props:
 *
 * 1. **Base** — standard dialog (no context/lastActive blocks)
 * 2. **Context active** — adds blue info block ("Estás trabajando en esta instalación...")
 * 3. **Last active** — adds amber warning block + button changes to "Congelar de todos modos"
 *    (last active subsumes context active — if both true, only amber block shown)
 * 4. **Loading** — spinner + "Congelando...", Cancel disabled, backdrop/ESC blocked
 * 5. **Server error** — red inline error banner, button re-enabled for retry
 *
 * Design decisions (H-05 UX):
 * - Button color: blue (not red) — freeze is reversible, not destructive
 * - Button alignment: centered (not right-aligned) — at 448px width, centered integrates
 *   better with the dialog body per H-05 UX decision #5
 * - No "last active" server-side validation — the warning is purely informational (ADR D-10)
 */
export function FreezeConfirmDialog({
  open,
  storage,
  isContextActive,
  isLastActive,
  isLoading,
  serverError,
  onClose,
  onConfirm,
}: FreezeConfirmDialogProps): React.ReactElement | null {
  const { t } = useTranslation('storages');

  if (!storage) return null;

  // Last active subsumes context active (H-05 E2.4)
  const showInfoBlock = isContextActive && !isLastActive;
  const showWarningBlock = isLastActive;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      closable={!isLoading}
      ariaLabelledBy="freeze-storage-dialog-title"
    >
      <>
        {/* Icon */}
        <div className="mb-5 flex justify-center">
          <span
            className="material-symbols-outlined text-info"
            style={{ fontSize: '48px' }}
            aria-hidden="true"
          >
            ac_unit
          </span>
        </div>

        {/* Title */}
        <h2
          id="freeze-storage-dialog-title"
          className="mb-3 text-center text-base font-semibold text-neutral-900"
        >
          {t('modals.freeze.title', { name: storage.name })}
        </h2>

        {/* Body */}
        <p className="text-center text-sm leading-relaxed text-neutral-600">
          {t('modals.freeze.body')}
        </p>

        {/* Info block — context active (H-05 E2.2) */}
        {showInfoBlock && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-info bg-info-bg p-3">
            <span
              className="material-symbols-outlined shrink-0 text-[16px] text-info"
              aria-hidden="true"
            >
              info
            </span>
            <p className="text-[13px] leading-snug text-info">
              {t('modals.freeze.contextBlock')}
            </p>
          </div>
        )}

        {/* Warning block — last active (H-05 E2.3) */}
        {showWarningBlock && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-warning bg-warning-bg p-3">
            <span
              className="material-symbols-outlined shrink-0 text-[16px] text-warning"
              aria-hidden="true"
            >
              warning
            </span>
            <p className="text-[13px] leading-snug text-warning">
              {t('modals.freeze.lastActiveBlock')}
            </p>
          </div>
        )}

        {/* Error banner — server error (H-05 E2.6) */}
        {serverError && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-3">
            <span
              className="material-symbols-outlined shrink-0 text-[16px] text-destructive"
              aria-hidden="true"
            >
              cancel
            </span>
            <p className="text-[13px] leading-snug text-destructive">
              {t('modals.freeze.serverError')}
            </p>
          </div>
        )}

        {/* Safety line */}
        <p className="mt-4 text-center text-sm text-neutral-400">
          {t('modals.freeze.safetyLine')}
        </p>

        {/* Footer — buttons centered (H-05 UX decision #5) */}
        <div className="mt-6 flex justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className={cn(isLoading && 'opacity-50')}
          >
            {t('modals.freeze.cancel')}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined animate-spin text-[16px]"
                  aria-hidden="true"
                >
                  progress_activity
                </span>
                {t('modals.freeze.loading')}
              </span>
            ) : showWarningBlock ? (
              t('modals.freeze.confirmAnyway')
            ) : (
              t('modals.freeze.confirm')
            )}
          </Button>
        </div>
      </>
    </Dialog>
  );
}
