import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface ExpirationTimerProps {
  /** Tiempo total en segundos (default: 600 = 10 minutos) */
  totalSeconds?: number
  /** Tiempo inicial restante en segundos (si se quiere empezar desde un punto específico) */
  initialSeconds?: number
  /** Callback cuando el timer llega a 0 */
  onExpire?: () => void
  /** Mostrar icono de reloj */
  showIcon?: boolean
  /** Clases CSS adicionales */
  className?: string
  /** Si el timer está pausado */
  paused?: boolean
}

/**
 * Timer de expiración con countdown visual
 *
 * Características:
 * - Countdown de tiempo configurable (default 10 minutos)
 * - Formato MM:SS
 * - Callback al expirar
 * - Cambia de color cuando queda poco tiempo
 */
export function ExpirationTimer({
  totalSeconds = 600, // 10 minutos
  initialSeconds,
  onExpire,
  showIcon = true,
  className,
  paused = false,
}: ExpirationTimerProps) {
  const { t } = useTranslation('auth')
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds ?? totalSeconds)
  const [hasExpired, setHasExpired] = useState(false)

  // Formatear tiempo a MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Efecto del countdown
  useEffect(() => {
    if (paused || hasExpired) return

    if (secondsLeft <= 0) {
      setHasExpired(true)
      onExpire?.()
      return
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setHasExpired(true)
          onExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [secondsLeft, paused, hasExpired, onExpire])

  // Reset timer cuando cambia initialSeconds o totalSeconds
  useEffect(() => {
    setSecondsLeft(initialSeconds ?? totalSeconds)
    setHasExpired(false)
  }, [initialSeconds, totalSeconds])

  // Determinar el estado visual basado en tiempo restante
  const isWarning = secondsLeft <= 120 && secondsLeft > 30 // Menos de 2 minutos
  const isCritical = secondsLeft <= 30 && secondsLeft > 0 // Menos de 30 segundos
  const isExpired = secondsLeft <= 0

  if (isExpired) {
    return (
      <div className={cn('flex items-center justify-center gap-2 text-red-600', className)}>
        {showIcon && <Clock className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {t('verifyEmail.codeExpired', 'Code expired. Request a new one.')}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 transition-colors duration-300',
        // Color basado en tiempo restante
        !isWarning && !isCritical && 'text-gray-600',
        isWarning && 'text-amber-600',
        isCritical && 'text-red-600 animate-pulse',
        className
      )}
    >
      {showIcon && <Clock className={cn('h-4 w-4', isCritical && 'animate-bounce')} />}
      <span className="text-sm">
        {t('verifyEmail.codeExpires', 'Code expires in')}{' '}
        <span className="font-mono font-semibold">{formatTime(secondsLeft)}</span>
      </span>
    </div>
  )
}

export default ExpirationTimer
