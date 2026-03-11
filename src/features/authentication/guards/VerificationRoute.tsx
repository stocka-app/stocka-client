import { Navigate } from 'react-router-dom';
import { useAuthenticationStore } from '../store/authentication.store';

interface VerificationRouteProps {
  children: React.ReactNode;
}

export function VerificationRoute({ children }: VerificationRouteProps) {
  const { emailVerificationRequired, pendingVerificationEmail } = useAuthenticationStore();
  if (!emailVerificationRequired || !pendingVerificationEmail) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
