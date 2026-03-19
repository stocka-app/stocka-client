import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import type { TenantRole } from '../types/team.types';

interface RoleChangeConfirmModalProps {
  memberName: string;
  oldRole: TenantRole;
  newRole: TenantRole;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * RoleChangeConfirmModal
 *
 * Confirmation dialog before changing a member's role.
 */
export function RoleChangeConfirmModal({
  memberName,
  oldRole,
  newRole,
  isLoading,
  onConfirm,
  onCancel,
}: RoleChangeConfirmModalProps): React.ReactElement {
  const { t } = useTranslation('team');

  const message = t('changeRole.confirmMessage', {
    name: memberName,
    oldRole: t(`roles.${oldRole}`),
    newRole: t(`roles.${newRole}`),
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-role-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-sm rounded-lg bg-background p-6 shadow-xl">
        <h2 id="change-role-modal-title" className="mb-2 text-lg font-semibold">
          {t('changeRole.title')}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">{message}</p>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('changeRole.cancel')}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isLoading}>
            {t('changeRole.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
