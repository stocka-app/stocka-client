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

const MEXICAN_STATES = [
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'Ciudad de México',
  'Coahuila',
  'Colima',
  'Durango',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'Estado de México',
  'Michoacán',
  'Morelos',
  'Nayarit',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'San Luis Potosí',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatán',
  'Zacatecas',
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
      state: defaultValues?.state ?? '',
    },
  });

  const selectedType = useWatch({ control: form.control, name: 'businessType' });
  const businessTypes = BusinessTypeSchema.options;

  const handleSubmit = async (data: BusinessProfileFormData): Promise<void> => {
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

        {/* Business name */}
        <FormField
          control={form.control}
          name="businessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-[#111827]">
                {t('step3.businessNameLabel')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t('step3.businessNamePlaceholder')}
                  disabled={isLoading}
                  className="h-12 rounded-xl border-[#e5e7eb]"
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
              <FormLabel className="text-sm font-medium text-[#111827]">
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
                        'p-3 rounded-xl border-2 text-xs font-medium transition-colors text-center',
                        selectedType === type
                          ? 'border-[#3b82f6] bg-blue-50 text-[#3b82f6]'
                          : 'border-[#e5e7eb] text-[#6b7280] hover:border-[#3b82f6]',
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

        {/* State dropdown */}
        <FormField
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-[#111827]">
                {t('step3.stateLabel')}
              </FormLabel>
              <FormControl>
                <select
                  {...field}
                  disabled={isLoading}
                  aria-label={t('step3.stateLabel')}
                  className="w-full h-12 rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] disabled:opacity-50"
                >
                  <option value="">{t('step3.statePlaceholder')}</option>
                  {MEXICAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage>
                {form.formState.errors.state?.message && t(form.formState.errors.state.message)}
              </FormMessage>
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
            aria-label={t('step3.ctaButton')}
            className="flex-1 h-12 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold"
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
