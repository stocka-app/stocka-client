import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import type { Storage } from '../types/storages.types';

interface ArchiveStorageModalProps {
  open: boolean;
  storage: Storage | null;
  /** False if this is the last active installation of its type — blocks archiving */
  canArchive: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

/**
 * ArchiveStorageModal
 *
 * Confirms archiving a installation. Shows a blocking warning when the installation is the
 * last active one of its type, preventing accidental data isolation.
 */
export function ArchiveStorageModal({
  open,
  storage,
  canArchive,
  onClose,
  onConfirm,
}: ArchiveStorageModalProps): React.ReactElement | null {
  const { t } = useTranslation('installations');

  if (!open || !storage) return null;

  const handleConfirm = async (): Promise<void> => {
    await onConfirm();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-storage-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <h2
          id="archive-storage-modal-title"
          className="mb-3 text-lg font-semibold text-neutral-900"
        >
          {t('archiveModal.title')}
        </h2>

        {canArchive ? (
          <p className="text-sm text-neutral-600">
            {t('archiveModal.description', { name: storage.name })}
          </p>
        ) : (
          <p role="alert" className="text-sm text-destructive">
            {t('archiveModal.lastActiveWarning', { type: t(`types.${storage.type}`) })}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('archiveModal.cancel')}
          </Button>
          {canArchive && (
            <Button type="button" variant="destructive" onClick={handleConfirm}>
              {t('archiveModal.confirm')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
