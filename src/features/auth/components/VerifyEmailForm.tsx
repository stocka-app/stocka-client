import { useState, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useAuthStore } from '../store/auth.store'
import { VerificationCodeInput } from './VerificationCodeInput'
import { ExpirationTimer } from './ExpirationTimer'
import { ResendButton } from './ResendButton'
import { cn } from '@/shared/lib/utils'
import type { ApiError } from '../types/auth.types'

interface VerifyEmailFormProps {
  email: string
}

const CODE_EXPIRATION_SECONDS = 600 // 10 minutos
const RESEND_COOLDOWN_SECONDS = 60 // 60 segundos entre reenvíos

/**
 * Formulario de verificación de email
 *
 * Características:
 * - Input de 6 dígitos alfanuméricos
 * - Timer de expiración (10 minutos) persistente
 * - Botón de reenvío con cooldown
 * - Manejo de errores específicos del backend
 * - Feedback visual de éxito/error
 */
export function VerifyEmailForm({ email: _email }: VerifyEmailFormProps) {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()

  const {
    verifyEmail,
    resendVerificationCode,
    isLoading,
    error,
    errorCode,
    blockInfo,
    clearError,
    verificationCodeSentAt,
  } = useAuthStore()

  // Calcular tiempo inicial restante basado en cuándo se envió el código
  const initialSecondsLeft = useMemo(() => {
    if (!verificationCodeSentAt) return CODE_EXPIRATION_SECONDS

    const sentAt = new Date(verificationCodeSentAt).getTime()
    const now = Date.now()
    const elapsedSeconds = Math.floor((now - sentAt) / 1000)
    const remaining = CODE_EXPIRATION_SECONDS - elapsedSeconds

    return Math.max(0, remaining)
  }, [verificationCodeSentAt])

  // Calcular cooldown inicial para el botón de reenvío
  const initialResendCooldown = useMemo(() => {
    if (!verificationCodeSentAt) return 0

    const sentAt = new Date(verificationCodeSentAt).getTime()
    const now = Date.now()
    const elapsedSeconds = Math.floor((now - sentAt) / 1000)
    const remaining = RESEND_COOLDOWN_SECONDS - elapsedSeconds

    return Math.max(0, remaining)
  }, [verificationCodeSentAt])

  const [code, setCode] = useState('')
  const [isCodeExpired, setIsCodeExpired] = useState(initialSecondsLeft <= 0)
  const [isSuccess, setIsSuccess] = useState(false)
  const [remainingResends, setRemainingResends] = useState<number | undefined>(undefined)

  // Limpiar error cuando cambia el código
  const clearErrorOnChange = useCallback(() => {
    if (error) {
      clearError()
    }
  }, [error, clearError])

  // Manejar submit
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()

      if (code.length !== 6 || isLoading || isCodeExpired) return

      try {
        await verifyEmail(code)
        setIsSuccess(true)

        // Redirigir al dashboard después de un breve momento
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1500)
      } catch {
        // El error se maneja en el store
      }
    },
    [code, isLoading, isCodeExpired, verifyEmail, navigate]
  )

  // Auto-submit cuando el código está completo
  const handleCodeComplete = useCallback(
    (newCode: string) => {
      setCode(newCode)
      clearErrorOnChange()
      if (newCode.length === 6 && !isLoading && !isCodeExpired) {
        // Pequeño delay para mejor UX
        setTimeout(() => {
          verifyEmail(newCode)
            .then(() => {
              setIsSuccess(true)
              setTimeout(() => {
                navigate('/dashboard', { replace: true })
              }, 1500)
            })
            .catch(() => {
              // El error se maneja en el store
            })
        }, 100)
      }
    },
    [isLoading, isCodeExpired, verifyEmail, navigate, clearErrorOnChange]
  )

  // Manejar expiración del código
  const handleExpire = useCallback(() => {
    setIsCodeExpired(true)
    setCode('')
  }, [])

  // Manejar reenvío
  const handleResend = useCallback(async () => {
    try {
      const response = await resendVerificationCode()
      setIsCodeExpired(false)
      setCode('')
      clearError()

      if (response.remainingResends !== undefined) {
        setRemainingResends(response.remainingResends)
      }

      return response
    } catch (err) {
      const apiError = err as ApiError
      // Extraer cooldown del error si existe y devolverlo para que ResendButton lo maneje
      if (apiError.error === 'RESEND_COOLDOWN_ACTIVE') {
        const match = apiError.message?.match(/(\d+)\s*seconds?/i)
        if (match) {
          return { cooldownSeconds: parseInt(match[1]) }
        }
      }
      throw err
    }
  }, [resendVerificationCode, clearError])

  // Obtener mensaje de error traducido
  const getErrorMessage = () => {
    if (!error) return null

    // Si tenemos un código de error, usar la traducción específica
    if (errorCode) {
      // Manejar errores con parámetros
      if (errorCode === 'TOO_MANY_VERIFICATION_ATTEMPTS' && blockInfo?.attemptsRemaining) {
        return t(`errors.TOO_MANY_VERIFICATION_ATTEMPTS`, {
          remaining: blockInfo.attemptsRemaining,
        })
      }
      if (errorCode === 'VERIFICATION_BLOCKED') {
        // Extraer minutos del mensaje original
        const match = error.match(/(\d+)\s*minutes?/i)
        const minutes = match ? match[1] : '15'
        return t(`errors.VERIFICATION_BLOCKED`, { minutes })
      }

      // Intentar obtener traducción del código
      const translatedError = t(`errors.${errorCode}`, { defaultValue: '' })
      if (translatedError) return translatedError
    }

    // Fallback al mensaje original
    return error
  }

  // Estado de éxito
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          {t('verifyEmail.verificationSuccess', 'Email verified successfully!')}
        </h2>
        <p className="text-gray-600">{t('common.redirecting', 'Redirecting...')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Input de código */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700 text-center">
          {t('verifyEmail.enterCode', 'Enter verification code')}
        </label>

        <VerificationCodeInput
          value={code}
          onChange={handleCodeComplete}
          disabled={isLoading || isCodeExpired}
          error={!!error}
          autoFocus
        />

        {/* Mensaje de error */}
        {error && (
          <div
            className={cn(
              'flex items-center justify-center gap-2 text-sm',
              'text-red-600 bg-red-50 rounded-lg p-3'
            )}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{getErrorMessage()}</span>
          </div>
        )}

        {/* Intentos restantes (si hay bloqueo parcial) */}
        {blockInfo?.attemptsRemaining !== undefined && !error && (
          <p className="text-center text-sm text-amber-600">
            {t('verifyEmail.attemptsRemaining', { count: blockInfo.attemptsRemaining })}
          </p>
        )}
      </div>

      {/* Timer de expiración - usa el tiempo calculado desde verificationCodeSentAt */}
      <ExpirationTimer
        totalSeconds={CODE_EXPIRATION_SECONDS}
        initialSeconds={initialSecondsLeft}
        onExpire={handleExpire}
        paused={isSuccess}
      />

      {/* Botón de verificar */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={code.length !== 6 || isLoading || isCodeExpired}
      >
        {isLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t('verifyEmail.verifying', 'Verifying...')}
          </>
        ) : (
          t('verifyEmail.verifyButton', 'Verify Email')
        )}
      </Button>

      {/* Sección de reenvío */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-center text-sm text-gray-600 mb-3">
          {t('verifyEmail.didntReceiveCode', "Didn't receive the code?")}
        </p>

        <ResendButton
          onResend={handleResend}
          initialCooldown={initialResendCooldown}
          initialRemainingResends={remainingResends}
          disabled={isLoading}
        />
      </div>

      {/* Link para cambiar email */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          {t('verifyEmail.wrongEmail', 'Wrong email?')}{' '}
          <button
            type="button"
            onClick={() => navigate('/auth/register')}
            className="text-primary hover:underline font-medium"
          >
            {t('verifyEmail.changeEmail', 'Change email')}
          </button>
        </p>
      </div>
    </form>
  )
}

export default VerifyEmailForm
