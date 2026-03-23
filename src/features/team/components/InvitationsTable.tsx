import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import type { PendingInvitation } from '../types/team.types';

interface InvitationsTableProps {
  invitations: PendingInvitation[];
  isLoading: boolean;
  onResend: (invitationId: string) => void;
  onCancel: (invitationId: string) => void;
}

/**
 * InvitationsTable
 *
 * Renders pending (and expired) invitations in a table.
 * Expired invitations are shown greyed out.
 * Provides resend and cancel actions.
 */
export function InvitationsTable({
  invitations,
  isLoading,
  onResend,
  onCancel,
}: InvitationsTableProps): React.ReactElement {
  const { t } = useTranslation('team');

  if (invitations.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('invitations.empty')}
      </p>
    );
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              {t('invitations.table.email')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              {t('invitations.table.role')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              {t('invitations.table.status')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              {t('invitations.table.sent')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              {t('invitations.table.expires')}
            </th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
              {t('invitations.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {invitations.map((invitation) => {
            const isExpired = invitation.status === 'EXPIRED';
            const isPending = invitation.status === 'PENDING';

            return (
              <tr
                key={invitation.id}
                className={`bg-background transition-colors ${isExpired ? 'opacity-50' : 'hover:bg-muted/30'}`}
              >
                <td className="px-4 py-3">{invitation.email}</td>
                <td className="px-4 py-3">{t(`roles.${invitation.role}`)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      isPending
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {t(`status.${invitation.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(invitation.sentAt)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(invitation.expiresAt)}</td>
                <td className="px-4 py-3 text-right">
                  {isPending && (
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => onResend(invitation.id)}
                      >
                        {t('invitations.resend')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => onCancel(invitation.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        {t('invitations.cancel')}
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
