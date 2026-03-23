import { useEffect, useRef } from 'react';
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

  // Track whether completedAt was already set when hydration finished.
  // If so, the user completed onboarding in a previous session → redirect.
  // If completedAt became non-null AFTER hydration, the user just completed it now → show Step 7.
  const completedOnLoadRef = useRef<boolean | null>(null);

  useEffect(() => {
    initializeOnboarding();
  }, [initializeOnboarding]);

  // Capture the completedAt state right when hydration finishes (only once)
  if (isHydrated && completedOnLoadRef.current === null) {
    completedOnLoadRef.current = completedAt !== null;
  }

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-page">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  // Only redirect if the onboarding was already completed when the page loaded
  if (completedOnLoadRef.current === true) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
