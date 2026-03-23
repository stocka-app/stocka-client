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
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import {
  businessProfileSchema,
  BusinessTypeSchema,
  type BusinessProfileFormData,
} from '../../schemas/onboarding.schema';
import type { OnboardingBusinessProfile } from '../../types/onboarding.types';

const COUNTRIES = [
  { code: 'MX', nameKey: 'Mexico' },
  { code: 'US', nameKey: 'United States' },
  { code: 'CO', nameKey: 'Colombia' },
  { code: 'AR', nameKey: 'Argentina' },
  { code: 'CL', nameKey: 'Chile' },
  { code: 'PE', nameKey: 'Peru' },
  { code: 'EC', nameKey: 'Ecuador' },
  { code: 'GT', nameKey: 'Guatemala' },
  { code: 'CR', nameKey: 'Costa Rica' },
  { code: 'PA', nameKey: 'Panama' },
  { code: 'ES', nameKey: 'Spain' },
  { code: 'OTHER', nameKey: 'Other' },
];

interface Step3BusinessProfileProps {
  onSubmit: (profile: OnboardingBusinessProfile) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
  defaultValues?: OnboardingBusinessProfile;
}

export function Step3BusinessProfile({
  onSubmit,
  onBack,
  isLoading,
  error,
  defaultValues,
}: Step3BusinessProfileProps): React.ReactElement {
  const { t } = useTranslation('onboarding');

  const form = useForm<BusinessProfileFormData>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      businessName: defaultValues?.businessName ?? '',
      businessType: (defaultValues?.businessType as BusinessProfileFormData['businessType']) ?? undefined,
      otherBusinessType: defaultValues?.otherBusinessType ?? '',
      country: defaultValues?.country ?? 'MX',
      cityRegion: defaultValues?.cityRegion ?? '',
    },
  });

  const selectedType = useWatch({ control: form.control, name: 'businessType' });
  const businessTypes = BusinessTypeSchema.options;

  const handleSubmit = async (data: BusinessProfileFormData): Promise<void> => {
    await onSubmit({
      businessName: data.businessName,
      businessType: data.businessType,
      otherBusinessType: data.businessType === 'OTHER' ? data.otherBusinessType : undefined,
      country: data.country,
      cityRegion: data.cityRegion || undefined,
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

        {/* Business name */}
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-neutral-900">
                {t('step3.businessNameLabel')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('step3.businessNamePlaceholder')}
                  disabled={isLoading}
                  className="h-12 rounded-xl border-neutral-200 dark:border-white/[0.08]"
                  aria-label={t('step3.businessNameLabel')}
                  {...field}
                />
              </FormControl>
              <FormMessage>
                {form.formState.errors.businessName?.message &&
                  t(form.formState.errors.businessName.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        {/* Business type — 3×3 grid */}
        <FormField
          control={form.control}
          name="businessType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-neutral-900">
                {t('step3.businessTypeLabel')}
              </FormLabel>
              <FormControl>
                <div
                  className="grid grid-cols-3 gap-2"
                  role="group"
                  aria-label={t('step3.businessTypeLabel')}
                >
                  {businessTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => field.onChange(type)}
                      disabled={isLoading}
                      aria-pressed={selectedType === type}
                      aria-label={t(`step3.businessTypes.${type}`)}
                      className={cn(
                        'p-3 rounded-xl border text-xs font-medium transition-all text-center cursor-pointer',
                        selectedType === type
                          ? 'border-brand bg-brand-light text-brand'
                          : 'border-neutral-200 dark:border-white/[0.08] text-neutral-500 hover:border-brand/50 dark:hover:border-brand/30 dark:hover:bg-white/[0.03]',
                      )}
                    >
                      {t(`step3.businessTypes.${type}`)}
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage>
                {form.formState.errors.businessType?.message &&
                  t(form.formState.errors.businessType.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        {/* Other business type — text input, visible only when OTHER is selected */}
        {selectedType === 'OTHER' && (
          <FormField
            control={form.control}
            name="otherBusinessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-neutral-900">
                  {t('step3.otherBusinessTypeLabel')}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t('step3.otherBusinessTypePlaceholder')}
                    disabled={isLoading}
                    className="h-12 rounded-xl border-neutral-200 dark:border-white/[0.08]"
                    aria-label={t('step3.otherBusinessTypeLabel')}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        {/* Country */}
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-neutral-900">
                {t('step3.countryLabel')}
              </FormLabel>
              <FormControl>
                <select
                  {...field}
                  disabled={isLoading}
                  aria-label={t('step3.countryLabel')}
                  className="w-full h-12 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-surface-card px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.nameKey}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage>
                {form.formState.errors.country?.message && t(form.formState.errors.country.message)}
              </FormMessage>
            </FormItem>
          )}
        />

        {/* City / Region — optional free text */}
        <FormField
          control={form.control}
          name="cityRegion"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-neutral-900">
                {t('step3.cityRegionLabel')}
                <span className="text-neutral-400 font-normal ml-1">— {t('step3.cityRegionHint')}</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('step3.cityRegionPlaceholder')}
                  disabled={isLoading}
                  className="h-12 rounded-xl border-neutral-200 dark:border-white/[0.08]"
                  aria-label={t('step3.cityRegionLabel')}
                  {...field}
                />
              </FormControl>
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
            className="flex-1 h-12 rounded-xl border-neutral-200 dark:border-white/[0.08] text-neutral-500"
          >
            {t('common.back')}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            aria-label={t('step3.ctaButton')}
            className="flex-1 h-12 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {t('step3.saving')}
              </>
            ) : (
              t('step3.ctaButton')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
