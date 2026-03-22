import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Check, Loader2 } from 'lucide-react';
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
import { FlagMX, FlagUS, FlagEU } from '@/shared/components/flags';
import { useThemeStore } from '@/store/theme.store';
import { preferencesSchema, type PreferencesFormData } from '../../schemas/onboarding.schema';
import type { OnboardingPreferences } from '../../types/onboarding.types';

const CURRENCY_OPTIONS = [
  { code: 'MXN' as const, symbol: '$', nameKey: 'step2.currencyMXNName', Flag: FlagMX },
  { code: 'USD' as const, symbol: '$', nameKey: 'step2.currencyUSDName', Flag: FlagUS },
  { code: 'EUR' as const, symbol: '€', nameKey: 'step2.currencyEURName', Flag: FlagEU },
] as const;

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
  const { t, i18n } = useTranslation('onboarding');
  const { theme } = useThemeStore();

  // Normalize the detected language to a supported value ('en' | 'es').
  // i18next may return a locale with a region suffix (e.g. 'en-US') which
  // does not pass the LanguageSchema enum validation.
  const detectedLang = i18n.language?.startsWith('en') ? 'en' : 'es';

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      language: defaultValues?.language ?? detectedLang,
      currency: defaultValues?.currency ?? 'MXN',
      theme: defaultValues?.theme ?? theme ?? 'light',
    },
  });

  const watchedCurrency = useWatch({ control: form.control, name: 'currency' });

  const handleSubmit = async (data: PreferencesFormData): Promise<void> => {
    // Sync language and theme from the global controls (footer bar)
    const currentLanguage = (i18n.language === 'en' ? 'en' : 'es') as 'es' | 'en';
    await onSubmit({
      ...data,
      language: currentLanguage,
      theme,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* API error */}
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-danger-bg border border-danger/30 p-3 text-sm text-danger"
          >
            {t(error)}
          </div>
        )}

        {/* Currency card selector */}
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-neutral-900">
                {t('step2.currencyLabel')}
              </FormLabel>
              <FormControl>
                <div
                  className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3"
                  role="radiogroup"
                  aria-label={t('step2.currencyLabel')}
                >
                  {CURRENCY_OPTIONS.map(({ code, symbol, nameKey, Flag }) => {
                    const isSelected = watchedCurrency === code;
                    const isFlagSvg = code === 'EUR';

                    return (
                      <button
                        key={code}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={`${code} - ${t(nameKey)}`}
                        tabIndex={isSelected ? 0 : -1}
                        disabled={isLoading}
                        onClick={() => field.onChange(code)}
                        className={cn(
                          'group relative flex flex-col items-center gap-2 p-4 pt-5',
                          'rounded-xl border',
                          'cursor-pointer transition-all duration-200 ease-out',
                          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-page',
                          isSelected
                            ? 'border-brand bg-brand-light shadow-card dark:shadow-glow-brand'
                            : 'border-neutral-200 dark:border-white/[0.08] bg-surface-card hover:border-brand/50 dark:hover:border-brand/30 hover:shadow-md dark:hover:shadow-none dark:hover:bg-white/[0.03]',
                          isLoading && 'opacity-50 cursor-not-allowed pointer-events-none',
                        )}
                      >
                        {/* Check badge */}
                        {isSelected && (
                          <span
                            className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand flex items-center justify-center animate-in zoom-in-0 duration-200"
                            aria-hidden="true"
                          >
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </span>
                        )}

                        {/* Currency symbol circle */}
                        <div
                          className={cn(
                            'w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200',
                            isSelected
                              ? 'bg-brand text-white'
                              : 'bg-neutral-100 text-neutral-900 group-hover:bg-brand-light group-hover:text-brand',
                          )}
                        >
                          <span className="text-2xl font-bold leading-none">{symbol}</span>
                        </div>

                        {/* Flag */}
                        <Flag
                          className={cn(
                            'rounded-[2px]',
                            isFlagSvg ? 'h-4 w-6' : 'h-5 w-auto',
                          )}
                        />

                        {/* Code + Name */}
                        <span className="text-sm font-semibold text-neutral-900">{code}</span>
                        <span className="text-xs text-neutral-500">{t(nameKey)}</span>
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hint */}
        <p className="text-xs text-neutral-400 text-center">
          {t('step2.currencyHint')}
        </p>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            aria-label={t('common.back')}
            className="flex-1 h-12 rounded-xl border-neutral-200 dark:border-white/[0.08] text-neutral-500"
          >
            {t('common.back')}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            aria-label={t('step2.ctaButton')}
            className="flex-1 h-12 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold"
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
