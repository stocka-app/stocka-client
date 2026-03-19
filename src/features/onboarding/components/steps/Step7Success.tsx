import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';

interface Step7SuccessProps {
  onGoToDashboard: () => void;
}

function SuccessIllustration(): React.ReactElement {
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="40" cy="40" r="40" fill="#EFF6FF" />
      <circle cx="40" cy="40" r="28" fill="#BFDBFE" />
      <circle cx="40" cy="40" r="18" fill="#3b82f6" />
      <path
        d="M30 40L37 47L50 33"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Step7Success({ onGoToDashboard }: Step7SuccessProps): React.ReactElement {
  const { t } = useTranslation('onboarding');

  return (
    <div className="space-y-6 text-center">
      {/* Illustration */}
      <div className="flex justify-center">
        <SuccessIllustration />
      </div>

      {/* Success message */}
      <p className="text-sm text-[#6b7280]">{t('step7.successMessage')}</p>

      {/* CTA */}
      <Button
        type="button"
        onClick={onGoToDashboard}
        aria-label={t('step7.ctaButton')}
        className="w-full h-12 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-base"
      >
        {t('step7.ctaButton')}
      </Button>
    </div>
  );
}
