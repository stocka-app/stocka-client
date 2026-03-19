import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { updateOrgSchema, type UpdateOrgFormData } from '../schemas/organization.schema';
import { useOrganization } from '../hooks/useOrganization';
import type { OrgProfile, BusinessType } from '../types/organization.types';

const BUSINESS_TYPES: BusinessType[] = [
  'RETAIL',
  'RESTAURANT',
  'WORKSHOP',
  'SERVICES',
  'HEALTH',
  'EDUCATION',
  'EVENTS',
  'AGRICULTURE',
  'OTHER',
];

interface OrgEditFormProps {
  profile: OrgProfile;
  onCancel: () => void;
  onSaved: () => void;
}

export function OrgEditForm({ profile, onCancel, onSaved }: OrgEditFormProps): React.ReactNode {
  const { t } = useTranslation('organization');
  const { isSaving, isCheckingName, nameAvailable, updateProfile, uploadLogo, checkNameAvailability } =
    useOrganization();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdateOrgFormData>({
    resolver: zodResolver(updateOrgSchema),
    defaultValues: {
      name: profile.name,
      businessType: profile.businessType,
      rfc: profile.rfc ?? '',
    },
  });

  const watchedName = watch('name');

  useEffect(() => {
    checkNameAvailability(watchedName);
  }, [watchedName, checkNameAvailability]);

  const onSubmit = async (data: UpdateOrgFormData): Promise<void> => {
    await updateProfile({
      name: data.name,
      businessType: data.businessType,
      rfc: data.rfc ?? undefined,
    });
    onSaved();
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadLogo(file);
    }
  };

  const showNameStatus = watchedName !== profile.name && watchedName.length >= 2;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Name */}
      <div>
        <label
          htmlFor="org-name"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
        >
          {t('profile.fields.name')}
        </label>
        <div className="relative">
          <input
            id="org-name"
            type="text"
            placeholder={t('profile.fields.namePlaceholder')}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm pr-9',
              'text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900',
              'focus:outline-none focus:ring-2 focus:ring-brand/50',
              errors.name
                ? 'border-red-400 dark:border-red-600'
                : 'border-neutral-300 dark:border-neutral-700',
            )}
            {...register('name')}
            aria-describedby={errors.name ? 'org-name-error' : undefined}
          />
          {showNameStatus && (
            <div className="absolute inset-y-0 right-2 flex items-center">
              {isCheckingName ? (
                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" aria-label={t('nameCheck.checking')} />
              ) : nameAvailable === true ? (
                <CheckCircle className="h-4 w-4 text-emerald-500" aria-label={t('nameCheck.available')} />
              ) : nameAvailable === false ? (
                <XCircle className="h-4 w-4 text-red-500" aria-label={t('nameCheck.unavailable')} />
              ) : null}
            </div>
          )}
        </div>
        {errors.name && (
          <p id="org-name-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.name.message ?? '')}
          </p>
        )}
        {showNameStatus && !isCheckingName && nameAvailable === true && (
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{t('nameCheck.available')}</p>
        )}
        {showNameStatus && !isCheckingName && nameAvailable === false && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">{t('nameCheck.unavailable')}</p>
        )}
      </div>

      {/* Business Type */}
      <div>
        <label
          htmlFor="org-business-type"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
        >
          {t('profile.fields.businessType')}
        </label>
        <select
          id="org-business-type"
          className={cn(
            'w-full rounded-lg border px-3 py-2 text-sm',
            'text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900',
            'focus:outline-none focus:ring-2 focus:ring-brand/50',
            errors.businessType
              ? 'border-red-400 dark:border-red-600'
              : 'border-neutral-300 dark:border-neutral-700',
          )}
          {...register('businessType')}
        >
          <option value="">{t('profile.fields.businessTypePlaceholder')}</option>
          {BUSINESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`profile.businessTypes.${type}`)}
            </option>
          ))}
        </select>
        {errors.businessType && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.businessType.message ?? '')}
          </p>
        )}
      </div>

      {/* RFC */}
      <div>
        <label
          htmlFor="org-rfc"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
        >
          {t('profile.fields.rfc')}
        </label>
        <input
          id="org-rfc"
          type="text"
          placeholder={t('profile.fields.rfcPlaceholder')}
          maxLength={20}
          className={cn(
            'w-full rounded-lg border px-3 py-2 text-sm',
            'text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-900',
            'focus:outline-none focus:ring-2 focus:ring-brand/50',
            'border-neutral-300 dark:border-neutral-700',
          )}
          {...register('rfc')}
        />
        {errors.rfc && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {t(errors.rfc.message ?? '')}
          </p>
        )}
      </div>

      {/* Logo */}
      <div>
        <label
          htmlFor="org-logo"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
        >
          {t('profile.fields.logo')}
        </label>
        {profile.logoUrl && (
          <img
            src={profile.logoUrl}
            alt={t('profile.fields.logoPreviewAlt')}
            className="mb-2 h-12 w-12 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700"
          />
        )}
        <input
          id="org-logo"
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="block w-full text-sm text-neutral-500 dark:text-neutral-400 file:mr-3 file:rounded-lg file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand hover:file:bg-brand/20"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-60 transition-colors"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isSaving ? t('profile.saving') : t('profile.saveButton')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-60 transition-colors"
        >
          {t('profile.cancelButton')}
        </button>
      </div>
    </form>
  );
}
