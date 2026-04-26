import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
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
import { registerSchema, type RegisterFormData } from '../schemas/authentication.schema';
import { useAuthentication } from '../hooks/useAuthentication';
import { useOAuthPopup } from '../hooks/useOAuthPopup';
import { cn } from '@/shared/lib/utils';

const inputClassName = 'h-10 sm:h-12 rounded-lg pl-10 bg-authentication-surface dark:bg-authentication-input-bg border-border dark:border-authentication-input-border';

export function RegisterForm() {
  const { t } = useTranslation('authentication');
  const navigate = useNavigate();
  const { register, isLoading, error, errorCode, clearError } = useAuthentication();
  const { initiateOAuthPopup } = useOAuthPopup();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError();
      // Strip fullName and confirmPassword — not in API contract yet
      const { email, username, password } = data;
      const result = await register({ email, username, password });

      if (result?.requiresVerification) {
        navigate('/authentication/verify-email');
      } else {
        navigate('/dashboard');
      }
    } catch {
      // Los errores se muestran en el formulario con links según el tipo
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-5">
        {/* ── Social Buttons ── */}
        <div className="grid grid-cols-2 gap-3">
          <SocialButton provider="google" variant="full" label={t('signUpWithGoogle')} onClick={() => initiateOAuthPopup('google')} />
          <SocialButton provider="microsoft" variant="full" label={t('signUpWithMicrosoft')} onClick={() => initiateOAuthPopup('microsoft')} />
        </div>

        <FormDivider />

        {/* ── Error alert ── */}
        {error && (
          <div className="rounded-lg bg-destructive/10 p-2.5 sm:p-3 text-sm text-destructive">
            <span>{t(`errors.${errorCode}`, { defaultValue: error })}</span>
            {errorCode === 'EMAIL_ALREADY_EXISTS' && (
              <>
                {' '}
                <Link
                  to="/authentication/sign-in"
                  className="font-medium underline hover:no-underline"
                  onClick={clearError}
                >
                  {t('signIn')}
                </Link>
              </>
            )}
          </div>
        )}

        {/* ── Full Name + Username (always 2 col) ── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem className="space-y-1 sm:space-y-2">
                <FormLabel className="text-neutral-700 text-xs sm:text-sm">
                  {t('fullName', 'Full Name')}
                </FormLabel>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-neutral-400 pointer-events-none">
                    person
                  </span>
                  <FormControl>
                    <Input
                      placeholder={t('fullNamePlaceholder', 'John Doe')}
                      disabled={isLoading}
                      className={inputClassName}
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage>
                  {/* istanbul ignore next */ form.formState.errors.fullName?.message &&
                    t(form.formState.errors.fullName.message)}
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="space-y-1 sm:space-y-2">
                <FormLabel className="text-neutral-700 text-xs sm:text-sm">
                  {t('username')}
                </FormLabel>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-neutral-400 pointer-events-none">
                    badge
                  </span>
                  <FormControl>
                    <Input
                      placeholder={t('usernamePlaceholder')}
                      disabled={isLoading}
                      className={inputClassName}
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage>
                  {/* istanbul ignore next */ form.formState.errors.username?.message &&
                    t(form.formState.errors.username.message)}
                </FormMessage>
              </FormItem>
            )}
          />
        </div>

        {/* ── Email ── */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1 sm:space-y-2">
              <FormLabel className="text-neutral-700 text-xs sm:text-sm">
                {t('email')}
              </FormLabel>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-neutral-400 pointer-events-none">
                  mail
                </span>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    disabled={isLoading}
                    className={inputClassName}
                    {...field}
                  />
                </FormControl>
              </div>
              <FormMessage>
                {/* istanbul ignore next */ form.formState.errors.email?.message && t(form.formState.errors.email.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        {/* ── Password + Confirm Password (always 2 col) ── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1 sm:space-y-2">
                <FormLabel className="text-neutral-700 text-xs sm:text-sm">
                  {t('password')}
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder={t('passwordPlaceholder')}
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage>
                  {/* istanbul ignore next */ form.formState.errors.password?.message &&
                    t(form.formState.errors.password.message)}
                </FormMessage>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-1 sm:space-y-2">
                <FormLabel className="text-neutral-700 text-xs sm:text-sm">
                  {t('confirmPassword', 'Confirm Password')}
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder={t('confirmPasswordPlaceholder', 'Confirm your password')}
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage>
                  {/* istanbul ignore next */ form.formState.errors.confirmPassword?.message &&
                    t(form.formState.errors.confirmPassword.message)}
                </FormMessage>
              </FormItem>
            )}
          />
        </div>

        {/* ── Submit button ── */}
        <Button
          type="submit"
          className={cn(
            'w-full h-10 sm:h-12 rounded-lg font-semibold text-sm sm:text-base',
            'bg-authentication-btn hover:bg-authentication-btn-hover text-white',
          )}
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('creatingAccount')}
            </>
          ) : (
            t('signUpButton')
          )}
        </Button>
      </form>
    </Form>
  );
}
