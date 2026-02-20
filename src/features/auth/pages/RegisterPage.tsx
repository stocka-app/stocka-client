import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RegisterForm } from '../components'
import { cn } from '@/shared/lib/utils'
import { useAuth } from '../hooks/useAuth'

function RegisterPage() {
  const { t } = useTranslation('auth')
  const { isLoading, clearError } = useAuth()

  // Limpiar errores al montar el componente
  useEffect(() => {
    clearError()
  }, [clearError])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">
            {t('welcome')} <span className="font-semibold text-primary">Stocka</span>
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('signUp')}
          </h1>
        </div>
        <div className="text-right text-sm">
          <p className="text-gray-600">{t('haveAccount')}</p>
          <Link
            to="/auth/login"
            className={cn(
              'font-medium text-primary hover:underline',
              isLoading && 'pointer-events-none opacity-50'
            )}
          >
            {t('signIn')}
          </Link>
        </div>
      </div>

      {/* Form */}
      <RegisterForm />
    </div>
  )
}

export default RegisterPage;
