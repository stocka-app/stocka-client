import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface ResendButtonProps {
  /** Callback para reenviar el código */
  onResend: () => Promise<{ cooldownSeconds?: number; remainingResends?: number } | void>;
  /** Cooldown inicial en segundos (default: 0) */
  initialCooldown?: number;
  /** Reenvíos restantes iniciales */
  initialRemainingResends?: number;
  /** Si el botón está deshabilitado externamente */
  disabled?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

/**
 * Botón de reenvío de código de verificación
 *
 * Características:
 * - Cooldown visual con countdown
 * - Muestra reenvíos restantes
 * - Se deshabilita cuando alcanza el máximo
 * - Loading state durante el reenvío
 */
export function ResendButton({
  onResend,
  initialCooldown = 0,
  initialRemainingResends,
  disabled = false,
  className,
}: ResendButtonProps) {
  const { t } = useTranslation('authentication');
  const [cooldownSeconds, setCooldownSeconds] = useState(initialCooldown);
  const [remainingResends, setRemainingResends] = useState<number | undefined>(
    initialRemainingResends,
  );
  const [isLoading, setIsLoading] = useState(false);

  // Efecto del cooldown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Actualizar cooldown inicial cuando cambie
  useEffect(() => {
    if (initialCooldown > 0) {
      setCooldownSeconds(initialCooldown);
    }
  }, [initialCooldown]);

  // Manejar click de reenvío
  const handleResend = useCallback(async () => {
    if (cooldownSeconds > 0 || isLoading || disabled) return;

    setIsLoading(true);
    try {
      const result = await onResend();

      if (result) {
        // Actualizar cooldown y reenvíos restantes
        if (result.cooldownSeconds !== undefined) {
          setCooldownSeconds(result.cooldownSeconds);
        }
        if (result.remainingResends !== undefined) {
          setRemainingResends(result.remainingResends);
        }
      }
    } catch {
      // El error se maneja en el componente padre
    } finally {
      setIsLoading(false);
    }
  }, [cooldownSeconds, isLoading, disabled, onResend]);

  // Determinar estado del botón
  const isOnCooldown = cooldownSeconds > 0;
  const noResendsLeft = remainingResends !== undefined && remainingResends <= 0;
  const isDisabled = disabled || isOnCooldown || noResendsLeft || isLoading;

  // Texto del botón
  const getButtonText = () => {
    if (isLoading) {
      return t('verifyEmail.verifying', 'Verifying...');
    }
    if (isOnCooldown) {
      return t('verifyEmail.resendIn', 'Resend in {{seconds}}s', { seconds: cooldownSeconds });
    }
    if (noResendsLeft) {
      return t('verifyEmail.noResends', 'No resends remaining this hour');
    }
    return t('verifyEmail.resendCode', 'Resend code');
  };

  // Texto de reenvíos restantes
  const getResendsText = () => {
    if (remainingResends === undefined || noResendsLeft) return null;

    if (remainingResends === 1) {
      return t('verifyEmail.remainingResends_one', '{{count}} resend remaining', {
        count: remainingResends,
      });
    }
    return t('verifyEmail.remainingResends_other', '{{count}} resends remaining', {
      count: remainingResends,
    });
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleResend}
        disabled={isDisabled}
        className={cn(
          'text-primary hover:text-primary/80 hover:bg-primary/5',
          isOnCooldown && 'text-neutral-400',
          noResendsLeft && 'text-neutral-400 cursor-not-allowed',
        )}
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw
            className={cn(
              'mr-2 h-4 w-4 transition-transform',
              !isDisabled && 'group-hover:rotate-180',
            )}
          />
        )}
        {getButtonText()}
      </Button>

      {/* Mostrar reenvíos restantes */}
      {remainingResends !== undefined && remainingResends > 0 && (
        <span className="text-xs text-neutral-500">{getResendsText()}</span>
      )}
    </div>
  );
}

export default ResendButton;
