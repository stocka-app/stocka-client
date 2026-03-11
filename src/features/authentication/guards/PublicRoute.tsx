import { Navigate, useLocation } from 'react-router-dom';
import { useAuthenticationStore } from '../store/authentication.store';
import { PageLoader } from '@/app/page-loader';

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isInitializing } = useAuthenticationStore();

  // Esperar a que el silent refresh on mount complete antes de decidir
  if (isInitializing) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
