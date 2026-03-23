import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import type { Space } from '../types/spaces.types';

interface RestoreSpaceModalProps {
  open: boolean;
  space: Space | null;
  /** False if restoring would exceed the tier limit for this space type */
  canRestore: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

/**
 * RestoreSpaceModal
 *
 * Confirms restoring an archived space. Shows a blocking warning when restoring
 * would exceed the tenant's tier limit for the given space type.
 */
export function RestoreSpaceModal({
  open,
  space,
  canRestore,
  onClose,
  onConfirm,
}: RestoreSpaceModalProps): React.ReactElement | null {
  const { t } = useTranslation('spaces');

  if (!open || !space) return null;

  const handleConfirm = async (): Promise<void> => {
    await onConfirm();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-space-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <h2
          id="restore-space-modal-title"
          className="mb-3 text-lg font-semibold text-neutral-900"
        >
          {t('restoreModal.title')}
        </h2>

        {canRestore ? (
          <p className="text-sm text-neutral-600">
            {t('restoreModal.description', { name: space.name })}
          </p>
        ) : (
          <p role="alert" className="text-sm text-destructive">
            {t('restoreModal.tierLimitWarning', { type: t(`types.${space.type}`) })}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('restoreModal.cancel')}
          </Button>
          {canRestore && (
            <Button type="button" onClick={handleConfirm}>
              {t('restoreModal.confirm')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
