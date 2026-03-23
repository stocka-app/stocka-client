import { Navigate } from 'react-router-dom';
import { useAuthenticationStore } from '../store/authentication.store';

interface RequiresTenantRouteProps {
  children: React.ReactNode;
}

/**
 * RequiresTenantRoute
 *
 * Redirects authenticated users to /onboarding if they don't have a tenant yet
 * (tenantId is null in their JWT). This guard should wrap routes that require
 * an active tenant context (dashboard, settings, etc.) but NOT the onboarding
 * route itself.
 */
export function RequiresTenantRoute({ children }: RequiresTenantRouteProps) {
  const { user, isAuthenticated } = useAuthenticationStore();

  // Only check tenant if the user is authenticated
  if (isAuthenticated && user?.tenantId === null) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
