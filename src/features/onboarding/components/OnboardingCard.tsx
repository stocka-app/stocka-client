import { useTranslation } from 'react-i18next';
import { ProgressBar } from './ProgressBar';

interface OnboardingCardProps {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * OnboardingCard
 *
 * Centered card layout used for all onboarding steps.
 * Progress bar is visible only for steps 1-7 (not on step 0).
 */
export function OnboardingCard({
  step,
  title,
  subtitle,
  children,
}: OnboardingCardProps): React.ReactElement {
  const { t } = useTranslation('onboarding');
  const showProgressBar = step >= 1 && step <= 7;

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <div className="w-full max-w-[600px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#3b82f6] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm" aria-hidden="true">S</span>
            </div>
            <span className="text-xl font-bold text-[#111827]" aria-label={t('common.stockaLogo')}>
              Stocka
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 shadow-sm">
          {/* Progress bar — steps 1-7 only */}
          {showProgressBar && (
            <div className="mb-6">
              <ProgressBar currentStep={step} />
              <p className="text-xs text-[#6b7280] mt-2 text-center">
                {t('stepOf', { current: step, total: 7 })}
              </p>
            </div>
          )}

          {/* Step header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#111827] leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-[#6b7280] mt-1">{subtitle}</p>
            )}
          </div>

          {/* Step content */}
          {children}
        </div>
      </div>
    </div>
  );
}
