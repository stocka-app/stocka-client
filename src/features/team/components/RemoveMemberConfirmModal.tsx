import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';

interface RemoveMemberConfirmModalProps {
  memberName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * RemoveMemberConfirmModal
 *
 * Confirmation dialog before permanently removing a member from the team.
 */
export function RemoveMemberConfirmModal({
  memberName,
  isLoading,
  onConfirm,
  onCancel,
}: RemoveMemberConfirmModalProps): React.ReactElement {
  const { t } = useTranslation('team');

  const message = t('removeMember.confirmMessage', { name: memberName });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-member-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl">
        <h2 id="remove-member-modal-title" className="mb-2 text-lg font-semibold">
          {t('removeMember.title')}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">{message}</p>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('removeMember.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {t('removeMember.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
