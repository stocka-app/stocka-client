import { useTranslation } from 'react-i18next';
import { Loader2, Building2, User, Shield } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { InvitationDetails } from '../../schemas/onboarding.schema';

interface InvitationConfirmationProps {
  invitationDetails: InvitationDetails;
  onAccept: () => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string | null;
}

export function InvitationConfirmation({
  invitationDetails,
  onAccept,
  onCancel,
  isLoading,
  error,
}: InvitationConfirmationProps): React.ReactElement {
  const { t } = useTranslation('onboarding');

  return (
    <div className="space-y-6">
      {/* API error */}
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-danger-bg border border-danger/30 p-3 text-sm text-danger"
        >
          {t(error)}
        </div>
      )}

      {/* Invitation details card */}
      <div className="rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-neutral-50 dark:bg-white/[0.03] p-5 space-y-4">
        {/* Business */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-brand" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">
              {t('invitation.confirmation.businessLabel')}
            </p>
            <p className="text-sm font-semibold text-neutral-900">
              {invitationDetails.tenantName}
            </p>
          </div>
        </div>

        {/* Inviter */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-brand" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">
              {t('invitation.confirmation.invitedByLabel')}
            </p>
            <p className="text-sm font-semibold text-neutral-900">
              {invitationDetails.email}
            </p>
          </div>
        </div>

        {/* Role */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-light rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-brand" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 font-medium">
              {t('invitation.confirmation.roleLabel')}
            </p>
            <p className="text-sm font-semibold text-neutral-900">{invitationDetails.role}</p>
          </div>
        </div>
      </div>

      {/* Accept CTA */}
      <Button
        type="button"
        onClick={onAccept}
        disabled={isLoading}
        aria-label={t('invitation.confirmation.ctaButton')}
        className="w-full h-12 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-base"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            {t('invitation.confirmation.joining')}
          </>
        ) : (
          t('invitation.confirmation.ctaButton')
        )}
      </Button>

      {/* Cancel link */}
      <div className="text-center">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          aria-label={t('invitation.confirmation.cancelLink')}
          className="text-sm text-neutral-500 hover:text-brand hover:underline transition-colors disabled:pointer-events-none"
        >
          {t('invitation.confirmation.cancelLink')}
        </button>
      </div>
    </div>
  );
}
