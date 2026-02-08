import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { VerifyEmailForm } from '../components/VerifyEmailForm'
import { Logo } from '@/shared/components/Logo'

/**
 * Página de verificación de email
 *
 * Muestra:
 * - Título e instrucciones
 * - Email al que se envió el código
 * - Formulario de verificación
 * - Nota sobre spam
 */
export function VerifyEmailPage() {
  const { t } = useTranslation('auth')
  const { emailVerificationRequired, pendingVerificationEmail, isAuthenticated } = useAuthStore()

  // Si ya está autenticado y no requiere verificación, ir a dashboard
  if (isAuthenticated && !emailVerificationRequired) {
    return <Navigate to="/dashboard" replace />
  }

  // Si no hay email pendiente de verificar, ir a login
  if (!pendingVerificationEmail) {
    return <Navigate to="/auth/login" replace />
  }

  return (
    <div className="space-y-6">
      {/* Logo para móvil */}
      <div className="lg:hidden flex justify-center">
        <Logo />
      </div>

      {/* Icono de email */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
      </div>

      {/* Título y subtítulo */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t('verifyEmail.title', 'Verify your email')}
        </h1>
        <p className="text-gray-600">
          {t('verifyEmail.subtitle', 'We sent a 6-digit code to')}
        </p>
        <p className="font-medium text-primary text-lg">{pendingVerificationEmail}</p>
      </div>

      {/* Formulario de verificación */}
      <VerifyEmailForm email={pendingVerificationEmail} />

      {/* Nota sobre spam */}
      <p className="text-center text-sm text-gray-500">
        {t('verifyEmail.checkSpam', "Check your spam folder if you don't see it")}
      </p>
    </div>
  )
}

export default VerifyEmailPage
