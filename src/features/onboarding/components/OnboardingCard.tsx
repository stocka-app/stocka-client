import { useTranslation } from 'react-i18next';
import { StockaIcon } from '@/shared/components/StockaIcon';
import { ProgressBar } from './ProgressBar';

interface OnboardingCardProps {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerAction?: React.ReactNode;
}

/**
 * OnboardingCard
 *
 * Centered card layout used for all onboarding steps.
 * Progress bar is visible only for steps 1-6 (not on step 0).
 */
export function OnboardingCard({
  step,
  title,
  subtitle,
  children,
  footerAction,
}: OnboardingCardProps): React.ReactElement {
  const { t } = useTranslation('onboarding');
  const showProgressBar = step >= 1 && step <= 6;

  return (
    <div className="min-h-screen bg-neutral-200 dark:bg-surface-page flex items-center justify-center p-4">
      <div className="w-full max-w-[600px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
              <StockaIcon className="h-[18px] w-[18px] text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900" aria-label={t('common.stockaLogo')}>
              Stocka
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface-card rounded-2xl border border-neutral-300 dark:border-white/[0.08] p-8 shadow-lg dark:shadow-none">
          {/* Progress bar — steps 1-6 only */}
          {showProgressBar && (
            <div className="mb-6">
              <ProgressBar currentStep={step} />
              <p className="text-xs text-neutral-500 mt-2 text-center">
                {t('stepOf', { current: step, total: 6 })}
              </p>
            </div>
          )}

          {/* Step header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900 leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
            )}
          </div>

          {/* Step content */}
          {children}
        </div>

        {/* Footer action (e.g. exit onboarding link) */}
        {footerAction && (
          <div className="mt-4 text-center">
            {footerAction}
          </div>
        )}
      </div>
    </div>
  );
}
