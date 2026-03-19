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
          className="rounded-lg bg-[#fef2f2] border border-[#ef4444]/30 p-3 text-sm text-[#ef4444]"
        >
          {t(error)}
        </div>
      )}

      {/* Invitation details card */}
      <div className="rounded-xl border border-[#e5e7eb] bg-[#F9FAFB] p-5 space-y-4">
        {/* Business */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-[#3b82f6]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-[#6b7280] font-medium">
              {t('invitation.confirmation.businessLabel')}
            </p>
            <p className="text-sm font-semibold text-[#111827]">
              {invitationDetails.businessName}
            </p>
          </div>
        </div>

        {/* Inviter */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-[#3b82f6]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-[#6b7280] font-medium">
              {t('invitation.confirmation.invitedByLabel')}
            </p>
            <p className="text-sm font-semibold text-[#111827]">
              {invitationDetails.inviterName}
            </p>
          </div>
        </div>

        {/* Role */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-[#3b82f6]" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-[#6b7280] font-medium">
              {t('invitation.confirmation.roleLabel')}
            </p>
            <p className="text-sm font-semibold text-[#111827]">{invitationDetails.role}</p>
          </div>
        </div>
      </div>

      {/* Accept CTA */}
      <Button
        type="button"
        onClick={onAccept}
        disabled={isLoading}
        aria-label={t('invitation.confirmation.ctaButton')}
        className="w-full h-12 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-base"
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
          className="text-sm text-[#6b7280] hover:text-[#3b82f6] hover:underline transition-colors disabled:pointer-events-none"
        >
          {t('invitation.confirmation.cancelLink')}
        </button>
      </div>
    </div>
  );
}
