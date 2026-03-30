import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation, Trans } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/shared/components/ui/form';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Button } from '@/shared/components/ui/button';
import { consentSchema, type ConsentFormData } from '../../schemas/onboarding.schema';
import type { OnboardingConsents } from '../../types/onboarding.types';
import type { z } from 'zod';

type ConsentFormInput = z.input<typeof consentSchema>;

interface Step1WelcomeProps {
  onSubmit: (consents: OnboardingConsents) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  defaultValues?: OnboardingConsents;
}

const linkClass = 'text-brand hover:text-brand-hover underline underline-offset-2 font-medium transition-colors';

export function Step1Welcome({
  onSubmit,
  isLoading,
  error,
  defaultValues,
}: Step1WelcomeProps): React.ReactElement {
  const { t } = useTranslation('onboarding');

  const form = useForm<ConsentFormInput, unknown, ConsentFormData>({
    resolver: zodResolver(consentSchema),
    defaultValues: {
      terms: defaultValues?.terms ?? false,
      marketing: defaultValues?.marketing ?? true,
      analytics: defaultValues?.analytics ?? true,
    },
  });

  const handleSubmit = async (data: ConsentFormData): Promise<void> => {
    await onSubmit({ terms: data.terms as true, marketing: data.marketing, analytics: data.analytics });
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

        {/* Terms checkbox */}
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  id="terms"
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-label={t('step1.termsLabel')}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="terms"
                  className="text-sm text-neutral-900 cursor-pointer leading-relaxed"
                >
                  <Trans
                    i18nKey="step1.termsLabel"
                    ns="onboarding"
                    components={{
                      termsLink: (
                        <a
                          href="/legal/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkClass}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ),
                      privacyLink: (
                        <a
                          href="/legal/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={linkClass}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ),
                    }}
                  />
                </label>
                <FormMessage>
                  {form.formState.errors.terms?.message && t(form.formState.errors.terms.message)}
                </FormMessage>
              </div>
            </FormItem>
          )}
        />

        {/* Marketing checkbox */}
        <FormField
          control={form.control}
          name="marketing"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  id="marketing"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-label={t('step1.marketingLabel')}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="marketing"
                  className="text-sm text-neutral-500 cursor-pointer leading-relaxed"
                >
                  {t('step1.marketingLabel')}
                </label>
                <p className="text-xs text-neutral-400">{t('step1.marketingHint')}</p>
              </div>
            </FormItem>
          )}
        />

        {/* Analytics checkbox */}
        <FormField
          control={form.control}
          name="analytics"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  id="analytics"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-label={t('step1.analyticsLabel')}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <label
                  htmlFor="analytics"
                  className="text-sm text-neutral-500 cursor-pointer leading-relaxed"
                >
                  {t('step1.analyticsLabel')}
                </label>
                <p className="text-xs text-neutral-400">{t('step1.analyticsHint')}</p>
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isLoading}
          aria-label={t('step1.ctaButton')}
          className="w-full h-12 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {t('step1.starting')}
            </>
          ) : (
            t('step1.ctaButton')
          )}
        </Button>
      </form>
    </Form>
  );
}
