import { cn } from '@/shared/lib/utils';

interface ProgressBarProps {
  currentStep: number;
}

const TOTAL_STEPS = 6;

export function ProgressBar({ currentStep }: ProgressBarProps): React.ReactElement {
  return (
    <div className="flex gap-1.5 w-full" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
      {Array.from({ length: TOTAL_STEPS }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= currentStep;

        return (
          <div
            key={stepNumber}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              isActive
                ? 'bg-brand'
                : 'bg-neutral-200 dark:bg-white/[0.08]',
            )}
            aria-label={`Step ${stepNumber}`}
          />
        );
      })}
    </div>
  );
}
