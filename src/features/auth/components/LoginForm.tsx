import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { PasswordInput } from './PasswordInput';
import { SocialButton } from './SocialButton';
import { FormDivider } from './FormDivider';
import { loginSchema, type LoginFormData } from '../schemas/auth.schema';
import { useAuthStore } from '../store/auth.store';
import { cn } from '@/shared/lib/utils';

/**
 * Formatea segundos a formato legible (1h 5m, 5m 30s, 30s)
 */
function formatCountdown(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  }
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }
  return `${seconds}s`;
}

export function LoginForm() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { login, isLoading, error, errorCode, clearError, setPendingVerificationEmail, blockInfo } =
    useAuthStore();
  const [countdown, setCountdown] = useState<number>(0);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
    },
  });

  // Countdown para bloqueo temporal
  useEffect(() => {
    if (!blockInfo?.blockedUntil) {
      setCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((blockInfo.blockedUntil!.getTime() - Date.now()) / 1000),
      );
      setCountdown(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [blockInfo?.blockedUntil]);

  // Limpiar blockInfo cuando countdown llega a 0 (solo si había blockedUntil)
  useEffect(() => {
    if (
      countdown === 0 &&
      blockInfo?.isBlocked &&
      blockInfo?.reason === 'account_locked' &&
      blockInfo?.blockedUntil
    ) {
      clearError();
    }
  }, [countdown, blockInfo, clearError]);

  const isFormDisabled = isLoading || blockInfo?.isBlocked;

  // Guardar el email para verificación cuando hay error EMAIL_NOT_VERIFIED
  const handleVerifyEmailClick = () => {
    const emailOrUsername = form.getValues('emailOrUsername');
    if (emailOrUsername.includes('@')) {
      setPendingVerificationEmail(emailOrUsername);
    }
    clearError();
    navigate('/auth/verify-email');
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      const result = await login(data);

      // Solo redirigir a dashboard si login exitoso (usuario verificado)
      if (!result?.requiresVerification) {
        navigate('/dashboard');
      }
      // Si requiresVerification es true, el error se mostrará con el link
    } catch {
      // Los errores se muestran en el formulario con links según el tipo
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Bloqueo temporal por intentos fallidos */}
        {blockInfo?.isBlocked && blockInfo.reason === 'account_locked' && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-medium text-red-800">
                {t('errors.accountTemporarilyLocked')}
              </p>
            </div>
            {countdown > 0 ? (
              <p className="mt-1 text-sm text-red-600">
                {t('errors.tryAgainIn', { time: formatCountdown(countdown) })}
              </p>
            ) : (
              error && <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>
        )}

        {/* Rate limit genérico */}
        {blockInfo?.isBlocked && blockInfo.reason === 'rate_limit' && (
          <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-800">{t('errors.tooManyRequests')}</p>
          </div>
        )}

        {/* Otros errores (credenciales inválidas, etc.) */}
        {error && !blockInfo?.isBlocked && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <span>{t(`errors.${errorCode}`, { defaultValue: error })}</span>
            {errorCode === 'EMAIL_NOT_VERIFIED' && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={handleVerifyEmailClick}
                  className="font-medium underline hover:no-underline"
                >
                  {t('verifyEmail.verifyNow', 'Verify now')}
                </button>
              </>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="emailOrUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('emailOrUsername')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('emailOrUsernamePlaceholder')}
                  disabled={isFormDisabled}
                  {...field}
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors.emailOrUsername?.message &&
                  t(form.formState.errors.emailOrUsername.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>{t('password')}</FormLabel>
                <Link
                  to="/auth/forgot-password"
                  className={cn(
                    'text-sm text-primary hover:underline',
                    isFormDisabled && 'pointer-events-none opacity-50',
                  )}
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <FormControl>
                <PasswordInput
                  placeholder={t('passwordPlaceholder')}
                  disabled={isFormDisabled}
                  {...field}
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors.password?.message &&
                  t(form.formState.errors.password.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" size="lg" disabled={isFormDisabled}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('signingIn')}
            </>
          ) : countdown > 0 ? (
            t('errors.lockedCountdown', { time: formatCountdown(countdown) })
          ) : blockInfo?.isBlocked && blockInfo.reason === 'account_locked' ? (
            t('errors.accountTemporarilyLocked')
          ) : (
            t('signInButton')
          )}
        </Button>

        <FormDivider />

        {/* Social buttons - siempre habilitados durante bloqueo de password */}
        <div className="flex gap-3">
          <SocialButton
            provider="google"
            label={t('signInWithGoogle')}
            variant="full"
            className="flex-1"
          />
          <SocialButton provider="facebook" variant="icon" />
          <SocialButton provider="microsoft" variant="icon" />
        </div>

        {/* Mensaje de alternativa OAuth durante bloqueo */}
        {blockInfo?.isBlocked && blockInfo.reason === 'account_locked' && (
          <p className="text-xs text-muted-foreground text-center">
            {t('errors.useAlternativeLogin')}
          </p>
        )}
      </form>
    </Form>
  );
}
