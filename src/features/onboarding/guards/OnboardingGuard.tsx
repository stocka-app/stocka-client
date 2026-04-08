import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useOnboarding } from '../hooks/useOnboarding';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * OnboardingGuard
 *
 * Initializes onboarding state from the backend and gates access:
 * - While loading: shows a spinner
 * - If completed in a PREVIOUS session (detected during hydration): redirects to dashboard
 * - If completed NOW (during this session): lets Step 7 render before user navigates away
 * - Otherwise: renders children (onboarding flow)
 */
export function OnboardingGuard({ children }: OnboardingGuardProps): React.ReactElement {
  const { completedAt, isHydrated, initializeOnboarding } = useOnboarding();

  // Snapshot — captured once when hydration finishes. If completedAt was
  // already set at that moment, the user completed onboarding in a previous
  // session and must be redirected. If it becomes non-null AFTER hydration,
  // the user just finished Step 7 and should see it before navigating away.
  const [completedOnLoad, setCompletedOnLoad] = useState<boolean | null>(null);

  useEffect(() => {
    initializeOnboarding();
  }, [initializeOnboarding]);

  useEffect(() => {
    if (isHydrated && completedOnLoad === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional snapshot: we capture the completedAt value exactly once when hydration finishes to differentiate between "already completed in a previous session" (redirect) and "just completed now in this session" (show Step 7). No external system to subscribe to.
      setCompletedOnLoad(completedAt !== null);
    }
  }, [isHydrated, completedAt, completedOnLoad]);

  if (!isHydrated || completedOnLoad === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-page">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  // Only redirect if the onboarding was already completed when the page loaded
  if (completedOnLoad) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
