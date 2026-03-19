import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { inviteMemberSchema, type InviteMemberFormData } from '../schemas/team.schema';
import type { TenantRole } from '../types/team.types';

const ROLE_HIERARCHY: Record<TenantRole, number> = {
  OWNER: 7,
  PARTNER: 6,
  MANAGER: 5,
  BUYER: 4,
  WAREHOUSE_KEEPER: 4,
  SALES_REP: 4,
  VIEWER: 1,
};

const ALL_ROLES: TenantRole[] = [
  'PARTNER',
  'MANAGER',
  'BUYER',
  'WAREHOUSE_KEEPER',
  'SALES_REP',
  'VIEWER',
];

interface InviteMemberModalProps {
  currentUserRole: TenantRole;
  isLoading: boolean;
  onSubmit: (data: InviteMemberFormData) => Promise<void>;
  onClose: () => void;
}

function getInvitableRoles(currentUserRole: TenantRole): TenantRole[] {
  const currentLevel = ROLE_HIERARCHY[currentUserRole];
  return ALL_ROLES.filter((r) => ROLE_HIERARCHY[r] < currentLevel);
}

/**
 * InviteMemberModal
 *
 * Modal dialog to invite a new member to the tenant.
 * Role dropdown is filtered by the current user's hierarchy level.
 */
export function InviteMemberModal({
  currentUserRole,
  isLoading,
  onSubmit,
  onClose,
}: InviteMemberModalProps): React.ReactElement {
  const { t } = useTranslation('team');
  const invitableRoles = getInvitableRoles(currentUserRole);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <h2 id="invite-modal-title" className="mb-4 text-lg font-semibold">
          {t('invite.title')}
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <Label htmlFor="invite-email">{t('invite.email')}</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder={t('invite.emailPlaceholder')}
                {...register('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'invite-email-error' : undefined}
                className="mt-1"
              />
              {errors.email?.message && (
                <p id="invite-email-error" role="alert" className="mt-1 text-sm text-destructive">
                  {t(errors.email.message)}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="invite-role">{t('invite.role')}</Label>
              <select
                id="invite-role"
                {...register('role')}
                aria-invalid={!!errors.role}
                aria-describedby={errors.role ? 'invite-role-error' : undefined}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t('invite.rolePlaceholder')}</option>
                {invitableRoles.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role}`)}
                  </option>
                ))}
              </select>
              {errors.role?.message && (
                <p id="invite-role-error" role="alert" className="mt-1 text-sm text-destructive">
                  {t(errors.role.message)}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <Label htmlFor="invite-message">{t('invite.message')}</Label>
              <textarea
                id="invite-message"
                {...register('message')}
                placeholder={t('invite.messagePlaceholder')}
                maxLength={200}
                rows={3}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">{t('invite.messageMaxChars')}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              {t('invite.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {t('invite.submit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
