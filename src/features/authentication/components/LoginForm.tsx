import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
import { Checkbox } from '@/shared/components/ui/checkbox';
import { PasswordInput } from './PasswordInput';
import { SocialButton } from './SocialButton';
import { FormDivider } from './FormDivider';
import { loginSchema, type LoginFormData } from '../schemas/authentication.schema';
import { useAuthenticationStore } from '../store/authentication.store';
import { useOAuthPopup } from '../hooks/useOAuthPopup';
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
  const { t } = useTranslation('authentication');
  const navigate = useNavigate();
  const { login, isLoading, error, errorCode, clearError, setPendingVerificationEmail, blockInfo } =
    useAuthenticationStore();
  const { initiateOAuthPopup } = useOAuthPopup();
  const [countdown, setCountdown] = useState<number>(0);
  const [rememberMe, setRememberMe] = useState(false);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Navegar a Forgot Password pasando el email si el usuario ya lo ingresó
  const handleForgotPasswordClick = () => {
    const emailOrUsername = form.getValues('emailOrUsername');
    const isEmail = emailOrUsername.includes('@');
    navigate('/authentication/forgot-password', {
      state: isEmail ? { email: emailOrUsername } : undefined,
    });
  };

  // Guardar el email para verificación cuando hay error EMAIL_NOT_VERIFIED
  const handleVerifyEmailClick = () => {
    const emailOrUsername = form.getValues('emailOrUsername');
    if (emailOrUsername.includes('@')) {
      setPendingVerificationEmail(emailOrUsername);
    }
    clearError();
    navigate('/authentication/verify-email');
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      const result = await login(data);

      if (!result?.requiresVerification) {
        navigate(result?.requiresOnboarding ? '/onboarding' : '/dashboard');
      }
      // Si requiresVerification es true, el error se mostrará con el link
    } catch {
      // Los errores se muestran en el formulario con links según el tipo
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-6">
        {/* ── Social Buttons (always enabled during password block) ── */}
        <div className="grid grid-cols-2 gap-3">
          <SocialButton provider="google" variant="full" label={t('signInWithGoogle')} onClick={() => initiateOAuthPopup('google')} />
          <SocialButton provider="microsoft" variant="full" label={t('signInWithMicrosoft')} onClick={() => initiateOAuthPopup('microsoft')} />
        </div>

        <FormDivider />

        {/* ── Error alerts ── */}
        {/* Bloqueo temporal por intentos fallidos */}
        {blockInfo?.isBlocked && blockInfo.reason === 'account_locked' && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {t('errors.accountTemporarilyLocked')}
              </p>
            </div>
            {countdown > 0 ? (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {t('errors.tryAgainIn', { time: formatCountdown(countdown) })}
              </p>
            ) : (
              error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
        )}

        {/* Rate limit genérico */}
        {blockInfo?.isBlocked && blockInfo.reason === 'rate_limit' && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-300">{t('errors.tooManyRequests')}</p>
          </div>
        )}

        {/* Cuenta vinculada a proveedor social */}
        {error && !blockInfo?.isBlocked && errorCode === 'SOCIAL_ACCOUNT_REQUIRED' && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {t('errors.SOCIAL_ACCOUNT_REQUIRED')}
            </p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">{t('errors.useAlternativeLogin')}</p>
          </div>
        )}

        {/* Otros errores (credenciales inválidas, etc.) */}
        {error && !blockInfo?.isBlocked && errorCode !== 'SOCIAL_ACCOUNT_REQUIRED' && (
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

        {/* ── Form fields ── */}
        <FormField
          control={form.control}
          name="emailOrUsername"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-700">{t('emailOrUsername')}</FormLabel>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-neutral-400 pointer-events-none">
                  mail
                </span>
                <FormControl>
                  <Input
                    placeholder={t('emailOrUsernamePlaceholder')}
                    disabled={isFormDisabled}
                    className="h-10 sm:h-12 rounded-lg pl-10 bg-authentication-surface dark:bg-authentication-input-bg border-border dark:border-authentication-input-border"
                    {...field}
                  />
                </FormControl>
              </div>
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
              <FormLabel className="text-neutral-700">{t('password')}</FormLabel>
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

        {/* Remember me + Forgot password row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
              disabled={isFormDisabled}
            />
            <label
              htmlFor="remember-me"
              className="text-sm text-neutral-600 cursor-pointer select-none"
            >
              {t('rememberMe', 'Remember me')}
            </label>
          </div>
          <button
            type="button"
            onClick={handleForgotPasswordClick}
            disabled={isFormDisabled}
            className="text-sm font-semibold text-authentication-highlight hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            {t('forgotPassword')}
          </button>
        </div>

        {/* ── Submit button ── */}
        <Button
          type="submit"
          className={cn(
            'w-full h-10 sm:h-12 rounded-lg font-semibold text-sm sm:text-base',
            'bg-authentication-btn hover:bg-authentication-btn-hover text-white',
          )}
          size="lg"
          disabled={isFormDisabled}
        >
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
