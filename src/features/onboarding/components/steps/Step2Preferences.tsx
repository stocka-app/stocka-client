import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { preferencesSchema, type PreferencesFormData } from '../../schemas/onboarding.schema';
import type { OnboardingPreferences } from '../../types/onboarding.types';

interface Step2PreferencesProps {
  onSubmit: (preferences: OnboardingPreferences) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
  defaultValues?: OnboardingPreferences;
}

export function Step2Preferences({
  onSubmit,
  onBack,
  isLoading,
  error,
  defaultValues,
}: Step2PreferencesProps): React.ReactElement {
  const { t } = useTranslation('onboarding');

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      language: defaultValues?.language ?? 'es',
      currency: defaultValues?.currency ?? 'MXN',
      theme: defaultValues?.theme ?? 'light',
    },
  });

  const watchedTheme = useWatch({ control: form.control, name: 'theme' });

  const handleSubmit = async (data: PreferencesFormData): Promise<void> => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* API error */}
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-[#fef2f2] border border-[#ef4444]/30 p-3 text-sm text-[#ef4444]"
          >
            {t(error)}
          </div>
        )}

        {/* Language select */}
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-[#111827]">
                {t('step2.languageLabel')}
              </FormLabel>
              <FormControl>
                <select
                  {...field}
                  disabled={isLoading}
                  aria-label={t('step2.languageLabel')}
                  className="w-full h-12 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] disabled:opacity-50"
                >
                  <option value="es">{t('step2.languageEs')}</option>
                  <option value="en">{t('step2.languageEn')}</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Currency select */}
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-[#111827]">
                {t('step2.currencyLabel')}
              </FormLabel>
              <FormControl>
                <select
                  {...field}
                  disabled={isLoading}
                  aria-label={t('step2.currencyLabel')}
                  className="w-full h-12 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] disabled:opacity-50"
                >
                  <option value="MXN">{t('step2.currencyMXN')}</option>
                  <option value="USD">{t('step2.currencyUSD')}</option>
                  <option value="EUR">{t('step2.currencyEUR')}</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Theme toggle */}
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-[#111827]">
                {t('step2.themeLabel')}
              </FormLabel>
              <FormControl>
                <div className="flex gap-3" role="group" aria-label={t('step2.themeLabel')}>
                  <button
                    type="button"
                    onClick={() => field.onChange('light')}
                    disabled={isLoading}
                    aria-pressed={watchedTheme === 'light'}
                    aria-label={t('step2.themeLight')}
                    className={cn(
                      'flex-1 h-12 rounded-xl border-2 font-medium text-sm transition-colors',
                      watchedTheme === 'light'
                        ? 'border-[#3b82f6] bg-blue-50 text-[#3b82f6]'
                        : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#3b82f6]',
                    )}
                  >
                    {t('step2.themeLight')}
                  </button>
                  <button
                    type="button"
                    onClick={() => field.onChange('dark')}
                    disabled={isLoading}
                    aria-pressed={watchedTheme === 'dark'}
                    aria-label={t('step2.themeDark')}
                    className={cn(
                      'flex-1 h-12 rounded-xl border-2 font-medium text-sm transition-colors',
                      watchedTheme === 'dark'
                        ? 'border-[#3b82f6] bg-blue-50 text-[#3b82f6]'
                        : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#3b82f6]',
                    )}
                  >
                    {t('step2.themeDark')}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            aria-label={t('common.back')}
            className="flex-1 h-12 rounded-xl border-[#e5e7eb] text-[#6b7280]"
          >
            {t('common.back')}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            aria-label={t('step2.ctaButton')}
            className="flex-1 h-12 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {t('step2.saving')}
              </>
            ) : (
              t('step2.ctaButton')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
