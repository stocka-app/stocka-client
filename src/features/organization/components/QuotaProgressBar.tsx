import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';

interface QuotaProgressBarProps {
  label: string;
  used: number;
  max: number;
}

function getBarColor(percentage: number): string {
  if (percentage < 50) return 'bg-emerald-500 dark:bg-emerald-400';
  if (percentage <= 75) return 'bg-amber-500 dark:bg-amber-400';
  return 'bg-red-500 dark:bg-red-400';
}

export function QuotaProgressBar({ label, used, max }: QuotaProgressBarProps): React.ReactNode {
  const { t } = useTranslation('organization');

  const isUnlimited = max === -1;
  const percentage = isUnlimited ? 0 : Math.min(Math.round((used / max) * 100), 100);
  const barColor = getBarColor(percentage);
  const limitLabel = isUnlimited ? t('limits.unlimited') : String(max);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
        <span className="text-neutral-500 dark:text-neutral-400">
          {used} / {limitLabel}
        </span>
      </div>

      {!isUnlimited && (
        <div
          className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div
            className={cn('h-full rounded-full transition-all duration-300', barColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
