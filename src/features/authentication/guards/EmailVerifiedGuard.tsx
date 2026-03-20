import { Navigate, useLocation } from 'react-router-dom';
import { useAuthenticationStore } from '../store/authentication.store';

interface EmailVerifiedGuardProps {
  children: React.ReactNode;
}

/**
 * Guard que protege rutas que requieren email verificado
 *
 * Comportamiento:
 * - Si el usuario no está autenticado → redirige a /authentication/sign-in
 * - Si el usuario necesita verificar email → redirige a /authentication/verify-email
 * - Si el usuario está completamente autenticado → renderiza children
 */
export function EmailVerifiedGuard({ children }: EmailVerifiedGuardProps) {
  const location = useLocation();
  const { isAuthenticated, emailVerificationRequired, pendingVerificationEmail } = useAuthenticationStore();

  // Si no está autenticado y no tiene verificación pendiente, redirigir a login
  if (!isAuthenticated && !emailVerificationRequired) {
    return <Navigate to="/authentication/sign-in" state={{ from: location }} replace />;
  }

  // Si requiere verificación de email, redirigir a la página de verificación
  if (emailVerificationRequired && pendingVerificationEmail) {
    return <Navigate to="/authentication/verify-email" replace />;
  }

  // Usuario completamente autenticado
  return <>{children}</>;
}

export default EmailVerifiedGuard;
