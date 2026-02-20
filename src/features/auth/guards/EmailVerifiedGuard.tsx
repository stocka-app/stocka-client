import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

interface EmailVerifiedGuardProps {
  children: React.ReactNode;
}

/**
 * Guard que protege rutas que requieren email verificado
 *
 * Comportamiento:
 * - Si el usuario no está autenticado → redirige a /auth/login
 * - Si el usuario necesita verificar email → redirige a /auth/verify-email
 * - Si el usuario está completamente autenticado → renderiza children
 */
export function EmailVerifiedGuard({ children }: EmailVerifiedGuardProps) {
  const location = useLocation();
  const { isAuthenticated, emailVerificationRequired, pendingVerificationEmail } = useAuthStore();

  // Si no está autenticado y no tiene verificación pendiente, redirigir a login
  if (!isAuthenticated && !emailVerificationRequired) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Si requiere verificación de email, redirigir a la página de verificación
  if (emailVerificationRequired && pendingVerificationEmail) {
    return <Navigate to="/auth/verify-email" replace />;
  }

  // Usuario completamente autenticado
  return <>{children}</>;
}

export default EmailVerifiedGuard;
