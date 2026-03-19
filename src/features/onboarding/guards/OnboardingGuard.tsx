import { Navigate } from 'react-router-dom';
import { useOnboardingStore } from '../store/onboarding.store';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * OnboardingGuard
 *
 * If the user has already completed onboarding (completedAt is set),
 * redirect them to the dashboard. Otherwise, allow access to onboarding.
 */
export function OnboardingGuard({ children }: OnboardingGuardProps): React.ReactElement {
  const { completedAt } = useOnboardingStore();

  if (completedAt !== null) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
