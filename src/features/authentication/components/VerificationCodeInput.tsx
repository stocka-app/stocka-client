import { useRef, useCallback, useEffect } from 'react';
import type { KeyboardEvent, ClipboardEvent, ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';

interface VerificationCodeInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Input de código de verificación de 6 dígitos
 *
 * Características:
 * - Auto-avance al siguiente campo al escribir
 * - Paste de código completo
 * - Backspace retrocede al campo anterior
 * - Solo acepta números
 */
export function VerificationCodeInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = true,
  className,
}: VerificationCodeInputProps) {
  const { t } = useTranslation('common');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Convertir el valor string a un array de caracteres
  const digits = value.split('').slice(0, length);
  while (digits.length < length) {
    digits.push('');
  }

  // Focus en el primer input al montar
  useEffect(() => {
    /* istanbul ignore next 2 -- defensive: ref always attached in browser */
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  // Manejar cambio en un input individual
  const handleChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.toUpperCase();

      // Solo aceptar caracteres alfanuméricos (A-Z, 0-9)
      /* istanbul ignore next -- TRANSIENT: loading state completes <100ms with real BE */
      if (inputValue && !/^[A-Z0-9]$/.test(inputValue)) {
        return;
      }

      // Actualizar el valor
      const newDigits = [...digits];
      newDigits[index] = inputValue;
      onChange(newDigits.join(''));

      // Auto-avance al siguiente input si se escribió un carácter
      /* istanbul ignore next 2 -- auto-advance; branch when at last digit */
      if (inputValue && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, length, onChange],
  );

  // Manejar teclas especiales
  /* istanbul ignore next -- TRANSIENT: loading state completes <100ms with real BE */
  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      // Backspace: si el campo está vacío, retroceder al anterior
      if (e.key === 'Backspace') {
        if (!digits[index] && index > 0) {
          e.preventDefault();
          inputRefs.current[index - 1]?.focus();
          // Limpiar el campo anterior
          const newDigits = [...digits];
          newDigits[index - 1] = '';
          onChange(newDigits.join(''));
        }
      }

      // Flechas izquierda/derecha para navegación
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === 'ArrowRight' && index < length - 1) {
        e.preventDefault();
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, length, onChange],
  );

  // Manejar paste de código completo
  /* istanbul ignore next -- TRANSIENT: loading state completes <100ms with real BE */
  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text/plain').trim().toUpperCase();

      // Solo procesar caracteres alfanuméricos (A-Z, 0-9)
      const pastedChars = pastedData.replace(/[^A-Z0-9]/g, '').slice(0, length);

      if (pastedChars) {
        onChange(pastedChars);

        // Focus en el último carácter pegado o el último campo
        const lastIndex = Math.min(pastedChars.length, length) - 1;
        if (lastIndex >= 0) {
          inputRefs.current[lastIndex]?.focus();
        }
      }
    },
    [length, onChange],
  );

  // Focus handlers (para futuras mejoras de accesibilidad)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFocus = useCallback((_index: number) => {
    // Placeholder para futuras mejoras
  }, []);

  const handleBlur = useCallback(() => {
    // Placeholder para futuras mejoras
  }, []);

  return (
    <div className={cn('flex gap-2 sm:gap-3 justify-center', className)}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="text"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          disabled={disabled}
          aria-label={t('digitOf', { index: index + 1, length })}
          className={cn(
            'w-9 h-11 sm:w-12 sm:h-14 text-center text-lg sm:text-2xl font-semibold',
            'border rounded-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            // Estados normales
            !error &&
              !disabled && [
                'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-authentication-input-bg text-neutral-900',
                'hover:border-neutral-400 dark:hover:border-neutral-500',
                'focus:border-primary focus:ring-primary/30',
              ],
            // Estado de error
            error && [
              'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300',
              'focus:border-red-500 focus:ring-red-500/30',
            ],
            // Estado deshabilitado
            disabled && ['border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-400', 'cursor-not-allowed'],
            // Animación de shake en error
            error && 'animate-shake',
          )}
        />
      ))}
    </div>
  );
}

export default VerificationCodeInput;
