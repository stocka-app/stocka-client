import { cn } from '@/shared/lib/utils';

interface StateCompositionCard {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
}

interface StateCompositionProps {
  icon: string;
  variant: 'neutral' | 'danger' | 'search';
  title: string;
  description: string;
  actions?: React.ReactNode;
  cards?: StateCompositionCard[];
  className?: string;
}

const variantStyles = {
  neutral: {
    outerGlow: 'bg-[radial-gradient(circle,var(--color-neutral-200)_0%,transparent_70%)]',
    middleRing: 'border-neutral-200 border-solid',
    iconColor: 'text-neutral-300',
  },
  danger: {
    outerGlow: 'bg-[radial-gradient(circle,rgba(239,68,68,0.08)_0%,transparent_70%)]',
    middleRing: 'border-danger/20 border-solid',
    iconColor: 'text-danger',
  },
  search: {
    outerGlow: 'bg-[radial-gradient(circle,var(--color-neutral-200)_0%,transparent_70%)]',
    middleRing: 'border-neutral-300 border-dashed',
    iconColor: 'text-neutral-400',
  },
} as const;

/**
 * StateComposition — Reusable full-container centered state screen.
 *
 * Matches the Pencil design system "State Compositions" pattern:
 * Icon with concentric rings + title/description + action buttons + info cards.
 */
export function StateComposition({
  icon,
  variant,
  title,
  description,
  actions,
  cards,
  className,
}: StateCompositionProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-6 px-4 py-6 sm:py-12',
        className,
      )}
      role="status"
    >
      {/* Icon composition — concentric rings */}
      <div className="relative flex h-[100px] w-[100px] sm:h-[140px] sm:w-[140px] items-center justify-center">
        {/* Outer glow */}
        <div
          className={cn('absolute inset-0 rounded-full', styles.outerGlow)}
          aria-hidden="true"
        />

        {/* Middle ring */}
        <div
          className={cn('absolute inset-3 rounded-full border-2', styles.middleRing)}
          aria-hidden="true"
        />

        {/* Decorative dots */}
        <div className="absolute right-5 top-1 h-2 w-2 rounded-full bg-neutral-300" aria-hidden="true" />
        <div className="absolute bottom-3 right-2 h-1.5 w-1.5 rounded-full bg-neutral-200" aria-hidden="true" />
        <div className="absolute bottom-5 left-3 h-[7px] w-[7px] rounded-full bg-neutral-300" aria-hidden="true" />

        {/* Inner circle with icon */}
        <div className="relative flex h-[50px] w-[50px] sm:h-[70px] sm:w-[70px] items-center justify-center rounded-full border border-border bg-neutral-50">
          <span
            className={cn('material-symbols-outlined select-none text-[24px] sm:text-[32px]', styles.iconColor)}
            aria-hidden="true"
          >
            {icon}
          </span>
        </div>
      </div>

      {/* Text area */}
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-xl font-bold text-neutral-900">{title}</h2>
        <p className="max-w-[440px] text-center text-sm text-neutral-500">
          {description}
        </p>
      </div>

      {/* Actions row */}
      {actions && (
        <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div>
      )}

      {/* Info cards row */}
      {cards && cards.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 pt-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="flex w-full sm:w-[200px] flex-col gap-2.5 rounded-xl border border-border bg-surface-card p-4"
            >
              <span
                className={cn('material-symbols-outlined select-none', card.iconColor)}
                style={{ fontSize: 24 }}
                aria-hidden="true"
              >
                {card.icon}
              </span>
              <span className="text-[13px] font-semibold text-neutral-900">
                {card.title}
              </span>
              <span className="text-xs text-neutral-500">
                {card.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
