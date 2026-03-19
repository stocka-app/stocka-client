import type { ReactNode } from 'react';
import { useTierGate } from '@/shared/hooks/useTierGate';
import type { TierLimitReason } from '@/store/upgrade-modal.store';

interface TierGateProps {
  children: ReactNode;
  /** If provided, renders as the blocked-state UI. Clicking it opens UpgradeModal. */
  fallback?: ReactNode;
  /** Reason to show in UpgradeModal when access is blocked. */
  reason?: TierLimitReason;
  /** Feature identifier for UpgradeModal messaging. */
  feature?: string;
  /** When true the gate is open and children render normally. */
  allowed: boolean;
}

/**
 * TierGate
 *
 * Conditionally renders children based on the `allowed` prop (computed by the caller
 * from SPACE_TIER_LIMITS or canDo). When blocked:
 * - If `fallback` is provided: renders the fallback wrapped in a clickable div
 *   that opens the UpgradeModal.
 * - If no `fallback`: renders children with disabled/reduced-opacity styling.
 */
export function TierGate({
  children,
  fallback,
  reason = 'FEATURE_NOT_IN_TIER',
  feature = '',
  allowed,
}: TierGateProps): ReactNode {
  const { openUpgradeModal } = useTierGate();

  if (allowed) return children;

  const handleBlockedClick = (): void => {
    if (reason && feature) {
      openUpgradeModal(reason, feature);
    }
  };

  if (fallback) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleBlockedClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBlockedClick();
          }
        }}
        className="cursor-pointer"
      >
        {fallback}
      </div>
    );
  }

  return (
    <span aria-disabled="true" className="pointer-events-none opacity-50">
      {children}
    </span>
  );
}
