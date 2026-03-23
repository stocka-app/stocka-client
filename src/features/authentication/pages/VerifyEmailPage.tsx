import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { Mail, AlertTriangle } from 'lucide-react';
import { useAuthenticationStore } from '../store/authentication.store';
import { VerifyEmailForm } from '../components/VerifyEmailForm';

/**
 * Página de verificación de email
 *
 * Muestra:
 * - Título e instrucciones
 * - Email al que se envió el código
 * - Formulario de verificación
 * - Nota sobre spam
 */
function VerifyEmailPage() {
  const { t } = useTranslation('authentication');
  const {
    emailVerificationRequired,
    pendingVerificationEmail,
    isAuthenticated,
    verificationEmailSent,
    clearError,
  } = useAuthenticationStore();

  // Limpiar errores al montar el componente
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Si ya está autenticado y no requiere verificación, ir a dashboard
  if (isAuthenticated && !emailVerificationRequired) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si no hay email pendiente de verificar, ir a login
  if (!pendingVerificationEmail) {
    return <Navigate to="/authentication/sign-in" replace />;
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Icono de email */}
      <div className="flex justify-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        </div>
      </div>

      {/* Título y subtítulo */}
      <div className="text-center space-y-1 sm:space-y-2">
        <h1 className="text-xl sm:text-3xl font-bold text-neutral-900">
          {t('verifyEmail.title', 'Verify your email')}
        </h1>
        <p className="text-sm sm:text-base text-neutral-600">{t('verifyEmail.subtitle', 'We sent a 6-digit code to')}</p>
        <p className="font-medium text-primary text-base sm:text-lg">{pendingVerificationEmail}</p>
      </div>

      {/* Aviso: email no entregado */}
      {verificationEmailSent === false && (
        <div className="flex items-start gap-2 sm:gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {t(
              'verifyEmail.emailNotDelivered',
              'We could not deliver the verification code. Use the resend button below to try again.',
            )}
          </p>
        </div>
      )}

      {/* Formulario de verificación */}
      <VerifyEmailForm email={pendingVerificationEmail} />

      {/* Nota sobre spam */}
      <p className="text-center text-xs sm:text-sm text-neutral-500">
        {t('verifyEmail.checkSpam', "Check your spam folder if you don't see it")}
      </p>
    </div>
  );
}

export default VerifyEmailPage;
