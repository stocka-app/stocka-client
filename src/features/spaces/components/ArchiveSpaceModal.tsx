import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import type { Space } from '../types/spaces.types';

interface ArchiveSpaceModalProps {
  open: boolean;
  space: Space | null;
  /** False if this is the last active space of its type — blocks archiving */
  canArchive: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

/**
 * ArchiveSpaceModal
 *
 * Confirms archiving a space. Shows a blocking warning when the space is the
 * last active one of its type, preventing accidental data isolation.
 */
export function ArchiveSpaceModal({
  open,
  space,
  canArchive,
  onClose,
  onConfirm,
}: ArchiveSpaceModalProps): React.ReactElement | null {
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
      aria-labelledby="archive-space-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <h2
          id="archive-space-modal-title"
          className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100"
        >
          {t('archiveModal.title')}
        </h2>

        {canArchive ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t('archiveModal.description', { name: space.name })}
          </p>
        ) : (
          <p role="alert" className="text-sm text-destructive">
            {t('archiveModal.lastActiveWarning', { type: t(`types.${space.type}`) })}
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
