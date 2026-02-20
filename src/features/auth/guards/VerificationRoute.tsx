import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

interface VerificationRouteProps {
  children: React.ReactNode;
}

export function VerificationRoute({ children }: VerificationRouteProps) {
  const { emailVerificationRequired, pendingVerificationEmail } = useAuthStore();
  if (!emailVerificationRequired || !pendingVerificationEmail) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
