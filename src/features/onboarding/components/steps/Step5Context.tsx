import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import type { TeamSize, MonthlyRevenue, OnboardingContext } from '../../types/onboarding.types';

interface Step5ContextProps {
  onSubmit: (context: OnboardingContext) => Promise<void>;
  onSkip: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
  defaultValues?: OnboardingContext;
}

const TEAM_SIZE_OPTIONS: { value: TeamSize; labelKey: string }[] = [
  { value: 'solo', labelKey: 'step5.teamSizeSolo' },
  { value: '2-5', labelKey: 'step5.teamSize2to5' },
  { value: '6-20', labelKey: 'step5.teamSize6to20' },
  { value: '21-50', labelKey: 'step5.teamSize21to50' },
  { value: '50+', labelKey: 'step5.teamSize50plus' },
];

const REVENUE_OPTIONS: { value: MonthlyRevenue; labelKey: string }[] = [
  { value: '<50k', labelKey: 'step5.revenueLess50k' },
  { value: '50-200k', labelKey: 'step5.revenue50to200k' },
  { value: '200k-1M', labelKey: 'step5.revenue200kTo1M' },
  { value: '>1M', labelKey: 'step5.revenueMore1M' },
];

export function Step5Context({
  onSubmit,
  onSkip,
  onBack,
  isLoading,
  error,
  defaultValues,
}: Step5ContextProps): React.ReactElement {
  const { t } = useTranslation('onboarding');
  const [selectedTeamSize, setSelectedTeamSize] = useState<TeamSize | undefined>(
    defaultValues?.teamSize as TeamSize | undefined,
  );
  const [selectedRevenue, setSelectedRevenue] = useState<MonthlyRevenue | undefined>(
    defaultValues?.monthlyRevenue as MonthlyRevenue | undefined,
  );

  const handleSubmit = async (): Promise<void> => {
    await onSubmit({
      teamSize: selectedTeamSize,
      monthlyRevenue: selectedRevenue,
    });
  };

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

      {/* Team size chips */}
      <div>
        <p className="text-sm font-medium text-[#111827] mb-3">{t('step5.teamSizeLabel')}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('step5.teamSizeLabel')}>
          {TEAM_SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setSelectedTeamSize(selectedTeamSize === option.value ? undefined : option.value)
              }
              disabled={isLoading}
              aria-pressed={selectedTeamSize === option.value}
              aria-label={t(option.labelKey)}
              className={cn(
                'px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors',
                selectedTeamSize === option.value
                  ? 'border-[#3b82f6] bg-blue-50 text-[#3b82f6]'
                  : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#3b82f6]',
              )}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue chips */}
      <div>
        <p className="text-sm font-medium text-[#111827] mb-3">{t('step5.revenueLabel')}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('step5.revenueLabel')}>
          {REVENUE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setSelectedRevenue(selectedRevenue === option.value ? undefined : option.value)
              }
              disabled={isLoading}
              aria-pressed={selectedRevenue === option.value}
              aria-label={t(option.labelKey)}
              className={cn(
                'px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors',
                selectedRevenue === option.value
                  ? 'border-[#3b82f6] bg-blue-50 text-[#3b82f6]'
                  : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#3b82f6]',
              )}
            >
              {t(option.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          aria-label={t('common.back')}
          className="flex-1 h-12 rounded-xl border-[#e5e7eb] text-[#6b7280]"
        >
          {t('common.back')}
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          aria-label={t('step5.ctaButton')}
          className="flex-1 h-12 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {t('step5.saving')}
            </>
          ) : (
            t('step5.ctaButton')
          )}
        </Button>
      </div>

      {/* Skip link */}
      <div className="text-center">
        <button
          type="button"
          onClick={onSkip}
          disabled={isLoading}
          aria-label={t('step5.skipLink')}
          className="text-sm text-[#6b7280] hover:text-[#3b82f6] hover:underline transition-colors disabled:pointer-events-none"
        >
          {t('step5.skipLink')}
        </button>
      </div>
    </div>
  );
}
