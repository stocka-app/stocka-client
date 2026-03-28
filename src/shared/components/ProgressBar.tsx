import { cn } from '@/shared/lib/utils';

interface ProgressBarProps {
  className?: string;
}

/**
 * ProgressBar — Top shimmer bar for skeleton loading states.
 *
 * A full-width gradient bar with a left-to-right shimmer animation.
 * Place at the top of a page or section to indicate loading progress.
 */
export function ProgressBar({ className }: ProgressBarProps) {
  return (
    <div
      className={cn('w-full overflow-hidden', className)}
      role="progressbar"
      aria-label="Loading"
      aria-busy="true"
    >
      <div className="progress-bar-shimmer h-1.5 w-full" />

      <style>{`
        .progress-bar-shimmer {
          background: linear-gradient(
            90deg,
            var(--color-brand-primary) 0%,
            var(--color-brand-primary-light) 50%,
            var(--color-brand-primary) 100%
          );
          background-size: 200% 100%;
          animation: progress-shimmer 1.5s ease-in-out infinite;
        }

        @keyframes progress-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
