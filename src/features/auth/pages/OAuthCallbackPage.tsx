import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../store/auth.store'
import { authService } from '../api/auth.service'
import { Button } from '@/shared/components/ui/button'
import type { User } from '../types/auth.types'

type CallbackStatus = 'loading' | 'success' | 'error'

/**
 * Página de callback para OAuth
 *
 * Maneja el retorno de los proveedores de OAuth (Google, Facebook, Apple)
 * procesando los tokens recibidos en la URL.
 *
 * URL esperada: /auth/callback?accessToken=xxx&refreshToken=xxx&user=...
 * O en caso de error: /auth/callback?error=xxx&message=xxx
 */
export function OAuthCallbackPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { handleOAuthCallback } = useAuthStore()

  const [status, setStatus] = useState<CallbackStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Verificar si hay error en los parámetros
        const error = searchParams.get('error')
        if (error) {
          const message = searchParams.get('message') || t('errors.UNKNOWN_ERROR', 'An unexpected error occurred')
          setErrorMessage(message)
          setStatus('error')
          return
        }

        // Obtener tokens de la URL
        const accessToken = searchParams.get('accessToken')
        const refreshToken = searchParams.get('refreshToken')
        const userParam = searchParams.get('user')

        // LOGS para depuración
        // eslint-disable-next-line no-console
        console.log('[OAuthCallback] accessToken:', accessToken)
        // eslint-disable-next-line no-console
        console.log('[OAuthCallback] refreshToken:', refreshToken)
        // eslint-disable-next-line no-console
        console.log('[OAuthCallback] userParam:', userParam)

        // Validar que los tokens estén presentes
        if (!accessToken || !refreshToken) {
          setErrorMessage(t('errors.UNKNOWN_ERROR', 'Invalid callback parameters'))
          setStatus('error')
          return
        }

        let user: User | null = null;
        if (userParam) {
          try {
            user = JSON.parse(decodeURIComponent(userParam))
          } catch {
            user = null;
          }
        }

        // Si no viene el usuario, obtenerlo con el accessToken (opcional, no es error si falla)
        if (!user) {
          try {
            const me = await authService.getMe()
            user = me.data.user
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[OAuthCallback] No se pudo obtener el perfil de usuario, pero los tokens existen.', e)
            // No marcamos error, solo continuamos con user = null
          }
        }

        // Procesar el callback en el store
        handleOAuthCallback({
          accessToken,
          refreshToken,
          user,
        })

        setStatus('success')

        // Redirigir al dashboard después de un breve momento
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1500)
      } catch {
        setErrorMessage(t('errors.UNKNOWN_ERROR', 'An unexpected error occurred'))
        setStatus('error')
      }
    }

    processCallback()
  }, [searchParams, handleOAuthCallback, navigate, t])

  // Estado de carga
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-gray-600">
          {t('common.loading', 'Loading...')}
        </p>
      </div>
    )
  }

  // Estado de éxito
  if (status === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">
          {t('verifyEmail.verificationSuccess', 'Successfully authenticated!')}
        </h2>
        <p className="mt-2 text-gray-600">
          {t('common.redirecting', 'Redirecting...')}
        </p>
      </div>
    )
  }

  // Estado de error
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('common.error', 'Authentication failed')}
          </h2>
          <p className="text-gray-600">{errorMessage}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => navigate('/auth/login', { replace: true })}
            className="w-full"
          >
            {t('signIn', 'Back to Login')}
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            {t('common.tryAgain', 'Try again')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default OAuthCallbackPage
