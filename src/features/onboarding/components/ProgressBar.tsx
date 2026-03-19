import { cn } from '@/shared/lib/utils';

interface ProgressBarProps {
  currentStep: number;
}

const TOTAL_STEPS = 7;

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
              isActive ? 'bg-[#3b82f6]' : 'bg-[#e5e7eb]',
            )}
            aria-label={`Step ${stepNumber}`}
          />
        );
      })}
    </div>
  );
}
