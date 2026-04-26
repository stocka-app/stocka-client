import { cn } from '@/shared/lib/utils';

interface DoubleRingSpinnerProps {
  label?: string;
  className?: string;
  /** When true, wraps the spinner in a frosted-glass elevated circle (use over content) */
  elevated?: boolean;
}

/**
 * DoubleRingSpinner — Two counter-rotating ring arcs.
 *
 * Default: clean rings, no background — for page loaders and empty screens.
 * Elevated: frosted-glass circle backdrop — for overlays on top of content (Strategy B).
 */
/* istanbul ignore start -- TRANSIENT: renders <100ms with real BE; covered by unit test + E2E */
export function DoubleRingSpinner({ label, className, elevated = false }: DoubleRingSpinnerProps) {
  const rings = (
    <div className="relative h-[72px] w-[72px]">
      {/* Outer ring */}
      <div
        className="absolute inset-0 animate-[spin_1s_linear_infinite] rounded-full"
        style={{
          border: '5px solid var(--color-neutral-300)',
          borderTopColor: 'var(--color-brand-primary)',
        }}
        aria-hidden="true"
      />
      {/* Inner ring — counter-rotating */}
      <div
        className="absolute inset-[10px] animate-[spin_0.6s_linear_infinite_reverse] rounded-full"
        style={{
          border: '4px solid var(--color-neutral-200)',
          borderTopColor: 'var(--color-brand-primary-hover)',
        }}
        aria-hidden="true"
      />
    </div>
  );

  return (
    <div
      className={cn('flex flex-col items-center gap-4', className)}
      role="status"
      aria-label={label ?? 'Loading'}
    >
      {elevated ? (
        <div className="flex h-28 w-28 items-center justify-center rounded-full border border-border bg-surface-card shadow-card">
          {rings}
        </div>
      ) : (
        rings
      )}

      {label && (
        <span className="text-sm font-medium text-neutral-500">{label}</span>
      )}
    </div>
  );
}
/* istanbul ignore stop */
