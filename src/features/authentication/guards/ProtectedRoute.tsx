import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthenticationStore } from '../store/authentication.store';
import { useRBACStore } from '@/store/rbac.store';
import { PageLoader } from '@/app/page-loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isInitializing, user } = useAuthenticationStore();
  const { loaded: rbacLoaded } = useRBACStore();

  // Ensure RBAC permissions are loaded when the user is authenticated and has a tenant.
  // This covers the case where the silent refresh set isAuthenticated but loadPermissions
  // failed or was never called (e.g. stale localStorage). Without this, canDo() returns
  // false for all actions and UI elements gated by RBAC are incorrectly hidden.
  useEffect(() => {
    if (isAuthenticated && user?.tenantId && !rbacLoaded) {
      useRBACStore.getState().loadPermissions().catch(() => {});
    }
  }, [isAuthenticated, user?.tenantId, rbacLoaded]);

  if (isInitializing) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/authentication/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
