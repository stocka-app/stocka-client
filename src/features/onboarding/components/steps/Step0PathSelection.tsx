import { useTranslation } from 'react-i18next';
import { Building2, Mail, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface Step0PathSelectionProps {
  onSelectPath: (path: 'create' | 'invitation') => void;
}

const cardBase = cn(
  'w-full text-left p-5 rounded-xl transition-all duration-200 group cursor-pointer',
  'border border-neutral-200 dark:border-white/[0.08]',
  'bg-surface-card',
  'hover:border-brand/50 dark:hover:border-brand/30',
  'hover:shadow-md dark:hover:shadow-none dark:hover:bg-white/[0.03]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-page',
);

export function Step0PathSelection({ onSelectPath }: Step0PathSelectionProps): React.ReactElement {
  const { t } = useTranslation('onboarding');

  return (
    <div className="space-y-3">
      {/* Create business card */}
      <button
        type="button"
        onClick={() => onSelectPath('create')}
        aria-label={t('step0.createBusiness')}
        className={cardBase}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-brand rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900 text-base">{t('step0.createBusiness')}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{t('step0.createBusinessDescription')}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-brand flex-shrink-0 transition-colors" aria-hidden="true" />
        </div>
      </button>

      {/* Invitation code card */}
      <button
        type="button"
        onClick={() => onSelectPath('invitation')}
        aria-label={t('step0.haveInvitationCode')}
        className={cardBase}
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-neutral-400 dark:bg-neutral-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand group-hover:scale-105 transition-all">
            <Mail className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-neutral-900 text-base">{t('step0.haveInvitationCode')}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{t('step0.haveInvitationCodeDescription')}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-brand flex-shrink-0 transition-colors" aria-hidden="true" />
        </div>
      </button>
    </div>
  );
}
