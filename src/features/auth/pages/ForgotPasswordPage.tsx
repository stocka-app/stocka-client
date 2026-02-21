import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
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
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../schemas/auth.schema';
import { authService } from '../api/auth.service';
import type { ApiError } from '../types/auth.types';

type PageView = 'form' | 'success';

function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const location = useLocation();
  const prefillEmail = (location.state as { email?: string } | null)?.email ?? '';

  const [view, setView] = useState<PageView>('form');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => setCooldownSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: prefillEmail },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setApiError('');
      await authService.forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setView('success');
      setCooldownSeconds(60);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.statusCode === 429) {
        setApiError(t('errors.RATE_LIMIT_EXCEEDED'));
      } else {
        setApiError(t('errors.UNKNOWN_ERROR'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsLoading(true);
      await authService.forgotPassword(submittedEmail);
      setCooldownSeconds(60);
    } catch {
      // El backend siempre retorna 200, cualquier error es de red
    } finally {
      setIsLoading(false);
    }
  };

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
            {t('forgotPasswordPage.success')}
          </h1>
          <p className="text-gray-600">
            {t('forgotPasswordPage.successDetail', { email: submittedEmail })}
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={handleResend}
          disabled={isLoading || cooldownSeconds > 0}
          className="text-sm text-primary hover:underline"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('forgotPasswordPage.sending')}
            </>
          ) : cooldownSeconds > 0 ? (
            t('forgotPasswordPage.resendIn', { seconds: cooldownSeconds })
          ) : (
            t('forgotPasswordPage.resend')
          )}
        </Button>

        <div>
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('forgotPasswordPage.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-600">
          {t('welcome')} <span className="font-semibold text-primary">Stocka</span>
        </p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
          {t('forgotPasswordPage.title')}
        </h1>
        <p className="mt-2 text-sm text-gray-600">{t('forgotPasswordPage.subtitle')}</p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {apiError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {apiError}
            </div>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('forgotPasswordPage.emailLabel')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage>
                  {form.formState.errors.email?.message && t(form.formState.errors.email.message)}
                </FormMessage>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('forgotPasswordPage.sending')}
              </>
            ) : (
              t('forgotPasswordPage.submit')
            )}
          </Button>
        </form>
      </Form>

      {/* Back to login */}
      <div className="text-center">
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('forgotPasswordPage.backToLogin')}
        </Link>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
