import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import type { Storage } from '../types/storages.types';

interface DeleteStorageDialogProps {
  open: boolean;
  storage: Storage | null;
  /** True while the delete request is in flight. */
  isLoading: boolean;
  /** Non-null when the server returned an error — renders a red inline banner. In Sprint 2 the BE stub returns 501 and the error is 'not_implemented'. */
  serverError: 'not_implemented' | 'server_error' | null;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * DeleteStorageDialog — H-07 Eliminar permanentemente (entry point).
 *
 * This is the **only dialog in the Storage BC with a red destructive button**.
 * Visual shell is production-quality; the real flow (typed confirmation of the
 * name, preview of data to lose, audit hook) ships in a later story. In
 * Sprint 2 the BE returns 501 and `onConfirm` surfaces a
 * "Funcionalidad en desarrollo" toast.
 *
 * Feature flag (`VITE_STORAGE_DELETE_ENABLED`):
 * - **false (prod default):** the menu item is disabled upstream in StorageCard
 *   with a tooltip; the dialog never renders.
 * - **true (dev/staging):** dialog renders, confirm exercises the stub.
 */
export function DeleteStorageDialog({
  open,
  storage,
  isLoading,
  serverError,
  onClose,
  onConfirm,
}: DeleteStorageDialogProps): React.ReactElement | null {
  const { t } = useTranslation('storages');

  if (!open || !storage) return null;

  const handleBackdropClick = (): void => {
    if (!isLoading) onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Escape' && !isLoading) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-storage-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main icon — red destructive circle 56×56 */}
        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <span
              className="material-symbols-outlined text-destructive"
              style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              delete_forever
            </span>
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-storage-dialog-title"
          className="mb-3 text-center text-base font-semibold text-neutral-900"
        >
          {t('modals.delete.title', {
            name: storage.name,
            defaultValue: '¿Eliminar "{{name}}" permanentemente?',
          })}
        </h2>

        {/* Body */}
        <p className="text-center text-sm leading-relaxed text-neutral-600">
          {t('modals.delete.body', {
            defaultValue:
              'Esta acción no se puede deshacer. Se perderá el historial completo de la instalación, incluyendo movimientos, registros y configuración.',
          })}
        </p>

        {/* Mandatory red warning block */}
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-3">
          <span
            className="material-symbols-outlined shrink-0 text-[16px] text-destructive"
            aria-hidden="true"
          >
            warning
          </span>
          <p className="text-[13px] leading-snug text-destructive">
            {t('modals.delete.warningBlock', {
              defaultValue: 'No podrás recuperar esta información después.',
            })}
          </p>
        </div>

        {/* Server error banner — 501 stub surfaces as 'not_implemented' */}
        {serverError && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-3">
            <span
              className="material-symbols-outlined shrink-0 text-[16px] text-destructive"
              aria-hidden="true"
            >
              cancel
            </span>
            <p className="text-[13px] leading-snug text-destructive">
              {serverError === 'not_implemented'
                ? t('modals.delete.notImplemented', {
                    defaultValue: 'Funcionalidad en desarrollo. Estará disponible próximamente.',
                  })
                : t('modals.delete.serverError', {
                    defaultValue:
                      'No pudimos eliminar la instalación. Revisa tu conexión e intenta de nuevo.',
                  })}
            </p>
          </div>
        )}

        {/* Footer — centered buttons */}
        <div className="mt-6 flex justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className={cn(isLoading && 'opacity-50')}
          >
            {t('modals.delete.cancel', { defaultValue: 'Cancelar' })}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined animate-spin text-[16px]"
                  aria-hidden="true"
                >
                  progress_activity
                </span>
                {t('modals.delete.loading', { defaultValue: 'Eliminando...' })}
              </span>
            ) : (
              t('modals.delete.confirm', { defaultValue: 'Eliminar' })
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
