import { Navigate, useLocation } from 'react-router-dom';
import { useAuthenticationStore } from '../store/authentication.store';
import { PageLoader } from '@/app/page-loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isInitializing } = useAuthenticationStore();

  if (isInitializing) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/authentication/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
