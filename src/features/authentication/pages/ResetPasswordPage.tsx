import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Button } from '@/shared/components/ui/button';
import { PasswordInput } from '../components/PasswordInput';
import { resetPasswordSchema, type ResetPasswordFormData } from '../schemas/authentication.schema';
import { authenticationService } from '../api/authentication.service';
import type { ApiError } from '../types/authentication.types';

type PageView = 'form' | 'success' | 'invalid';
type InvalidReason = 'expired' | 'invalid' | 'missing';

function PasswordHint({ met, label }: { met: boolean; label: string }) {
  return (
    <p className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
      <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
      {label}
    </p>
  );
}

function ResetPasswordPage() {
  const { t } = useTranslation('authentication');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');

  const [view, setView] = useState<PageView>(token ? 'form' : 'invalid');
  const [invalidReason, setInvalidReason] = useState<InvalidReason>(token ? 'invalid' : 'missing');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    try {
      setIsLoading(true);
      await authenticationService.resetPassword(token, data.password);
      setView('success');
    } catch (err: unknown) {
      const errorCode = (err as ApiError).error;
      setInvalidReason(errorCode === 'TOKEN_EXPIRED' ? 'expired' : 'invalid');
      setView('invalid');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Estado de éxito ---
  if (view === 'success') {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('resetPassword.success')}
          </h1>
          <p className="text-gray-600">{t('resetPassword.successDetail')}</p>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={() => navigate('/authentication/sign-in', { replace: true })}
        >
          {t('resetPassword.goToLogin')}
        </Button>
      </div>
    );
  }

  // --- Estado de token inválido/expirado/ausente ---
  if (view === 'invalid') {
    const message =
      invalidReason === 'expired'
        ? t('resetPassword.tokenExpired')
        : t('resetPassword.tokenInvalid');

    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-amber-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {t('resetPassword.title')}
          </h1>
          <p className="text-gray-600">{message}</p>
        </div>

        <Button className="w-full" size="lg" onClick={() => navigate('/authentication/forgot-password')}>
          {t('resetPassword.requestNew')}
        </Button>

        <div>
          <Link
            to="/authentication/sign-in"
            className="text-sm text-gray-600 hover:text-primary hover:underline"
          >
            {t('forgotPasswordPage.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  // --- Estado de formulario ---
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-600">
          {t('welcome')} <span className="font-semibold text-primary">Stocka</span>
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          {t('resetPassword.title')}
        </h1>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('resetPassword.newPassword')}</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="••••••••" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage>
                  {form.formState.errors.password?.message &&
                    t(form.formState.errors.password.message)}
                </FormMessage>
                <div className="mt-2 space-y-1">
                  <PasswordHint
                    met={(field.value ?? '').length >= 8}
                    label={t('resetPassword.hintMinLength')}
                  />
                  <PasswordHint
                    met={/[A-Z]/.test(field.value ?? '')}
                    label={t('resetPassword.hintUppercase')}
                  />
                  <PasswordHint
                    met={/[0-9]/.test(field.value ?? '')}
                    label={t('resetPassword.hintNumber')}
                  />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('resetPassword.confirmPassword')}</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="••••••••" disabled={isLoading} {...field} />
                </FormControl>
                <FormMessage>
                  {form.formState.errors.confirmPassword?.message &&
                    t(form.formState.errors.confirmPassword.message)}
                </FormMessage>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('resetPassword.submitting')}
              </>
            ) : (
              t('resetPassword.submit')
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default ResetPasswordPage;
