import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { PageLoader } from '@/app/page-loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isInitializing } = useAuthStore();

  // Esperar a que el silent refresh on mount complete antes de decidir
  if (isInitializing) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
