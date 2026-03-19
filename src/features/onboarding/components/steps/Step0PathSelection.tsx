import { useTranslation } from 'react-i18next';
import { Building2, Mail } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface Step0PathSelectionProps {
  onSelectPath: (path: 'create' | 'invitation') => void;
}

export function Step0PathSelection({ onSelectPath }: Step0PathSelectionProps): React.ReactElement {
  const { t } = useTranslation('onboarding');

  return (
    <div className="space-y-4">
      {/* Create business card */}
      <button
        type="button"
        onClick={() => onSelectPath('create')}
        aria-label={t('step0.createBusiness')}
        className={cn(
          'w-full text-left p-6 rounded-xl border-2 transition-all duration-200 group',
          'border-[#e5e7eb] hover:border-[#3b82f6] hover:bg-blue-50',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]',
        )}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#3b82f6] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#2563eb] transition-colors">
            <Building2 className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-[#111827] text-base">{t('step0.createBusiness')}</p>
            <p className="text-sm text-[#6b7280] mt-0.5">{t('step0.createBusinessDescription')}</p>
          </div>
        </div>
      </button>

      {/* Invitation code card */}
      <button
        type="button"
        onClick={() => onSelectPath('invitation')}
        aria-label={t('step0.haveInvitationCode')}
        className={cn(
          'w-full text-left p-6 rounded-xl border-2 transition-all duration-200 group',
          'border-[#e5e7eb] hover:border-[#3b82f6] hover:bg-blue-50',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6]',
        )}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#6b7280] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-[#4b5563] transition-colors">
            <Mail className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-[#111827] text-base">{t('step0.haveInvitationCode')}</p>
            <p className="text-sm text-[#6b7280] mt-0.5">{t('step0.haveInvitationCodeDescription')}</p>
          </div>
        </div>
      </button>
    </div>
  );
}
