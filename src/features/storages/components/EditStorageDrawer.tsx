import { useState, useCallback, useEffect, useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import Drawer from '@/shared/components/Drawer';
import { IconColorPicker } from '@/shared/components/IconColorPicker';
import type { Storage, StorageType } from '../types/storages.types';
import type { EditStoragePayload } from '../hooks/useStorages';

// ─── Types ────────────────────────────────────────────────────────────────────

type EditError = 'name_taken' | 'archived' | 'address_required' | 'server_error' | null;
type ChangeTypeError = 'archived' | 'frozen' | 'tier_limit' | 'address_required' | 'server_error' | null;

interface EditFormValues {
  name: string;
  address: string;
  description: string;
  icon: string;
  color: string;
}

export interface EditStorageDrawerProps {
  open: boolean;
  storage: Storage | null;
  onClose: () => void;
  onEdit: (id: string, type: StorageType, payload: EditStoragePayload) => Promise<{ error: EditError }>;
  onChangeType: (id: string, targetType: StorageType) => Promise<{ error: ChangeTypeError }>;
  /** Per-type limits from tier. -1 = unlimited */
  limits: Record<StorageType, number>;
  /** Per-type active counts */
  typeCounts: Record<StorageType, number>;
  tier: string;
}

// ─── Type visual config (mirrors CreateStorageDrawer) ─────────────────────────

interface TypeBannerConfig {
  icon: string;
  iconBg: string;
  iconColor: string;
  titleKey: string;
  subtitleKey: string;
  bannerBg: string;
  bannerBorder: string;
  bannerIconBg: string;
  bannerTitleColor: string;
  bannerDescColor: string;
}

const TYPE_BANNER_CONFIGS: Record<StorageType, TypeBannerConfig> = {
  WAREHOUSE: {
    icon: 'warehouse',
    iconBg: 'bg-[#DBEAFE] dark:bg-[#1E3A5F]',
    iconColor: 'text-[#3B82F6] dark:text-[#93C5FD]',
    titleKey: 'createDrawer.warehouseLabel',
    subtitleKey: 'createDrawer.warehouseTypeSubtitle',
    bannerBg: 'bg-[#EFF6FF] dark:bg-[#1E3A5F]',
    bannerBorder: 'border-[#BFDBFE] dark:border-[#1D4ED8]',
    bannerIconBg: 'bg-[#DBEAFE] dark:bg-[#1E3A5F]',
    bannerTitleColor: 'text-[#1E40AF] dark:text-[#93C5FD]',
    bannerDescColor: 'text-[#60A5FA] dark:text-[#BFDBFE]',
  },
  STORE_ROOM: {
    icon: 'inventory_2',
    iconBg: 'bg-[#FEF3C7] dark:bg-[#1C1100]',
    iconColor: 'text-[#D97706] dark:text-[#FCD34D]',
    titleKey: 'createDrawer.storeRoomLabel',
    subtitleKey: 'createDrawer.storeRoomTypeSubtitle',
    bannerBg: 'bg-[#FFFBEB] dark:bg-[#1C1100]',
    bannerBorder: 'border-[#FDE68A] dark:border-[#FBBF24]',
    bannerIconBg: 'bg-[#FEF3C7] dark:bg-[#1C1100]',
    bannerTitleColor: 'text-[#92400E] dark:text-[#FCD34D]',
    bannerDescColor: 'text-[#D97706] dark:text-[#D1D5DB]',
  },
  CUSTOM_ROOM: {
    icon: 'palette',
    iconBg: 'bg-[#FCE7F3] dark:bg-[#831843]',
    iconColor: 'text-[#EC4899] dark:text-[#F9A8D4]',
    titleKey: 'createDrawer.customRoomLabel',
    subtitleKey: 'createDrawer.customRoomTypeSubtitle',
    bannerBg: 'bg-[#F9FAFB] dark:bg-[#1F2937]',
    bannerBorder: 'border-[#E5E7EB] dark:border-[#374151]',
    bannerIconBg: 'bg-[#F3F4F6] dark:bg-[#374151]',
    bannerTitleColor: 'text-[#374151] dark:text-[#D1D5DB]',
    bannerDescColor: 'text-[#9CA3AF]',
  },
};

// ─── Unsaved Changes Dialog ───────────────────────────────────────────────────

function UnsavedChangesDialog({
  onKeepEditing,
  onDiscard,
}: {
  onKeepEditing: () => void;
  onDiscard: () => void;
}): React.ReactElement {
  const { t } = useTranslation('storages');
  const titleId = useId();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
    >
      <div className="mx-4 w-full max-w-sm rounded-xl bg-surface-card p-6 shadow-2xl">
        <h3 id={titleId} className="mb-2 text-base font-semibold text-neutral-900">
          {t('editDrawer.unsaved.title')}
        </h3>
        <p className="mb-5 text-sm text-neutral-500">
          {t('editDrawer.unsaved.description')}
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onKeepEditing}>
            {t('editDrawer.unsaved.keep')}
          </Button>
          <Button
            type="button"
            className="flex-1 bg-danger text-white hover:bg-danger/90"
            onClick={onDiscard}
          >
            {t('editDrawer.unsaved.leave')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EditStorageDrawer
// ═════════════════════════════════════════════════════════════════════════════

export function EditStorageDrawer({
  open,
  storage,
  onClose,
  onEdit,
  onChangeType,
  limits,
  typeCounts,
  tier,
}: EditStorageDrawerProps): React.ReactElement {
  const { t } = useTranslation('storages');
  const formId = useId();
  const drawerId = useId();

  const [serverError, setServerError] = useState<EditError>(null);
  const [changeTypeError, setChangeTypeError] = useState<ChangeTypeError>(null);
  const [isChangingType, setIsChangingType] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerBackup, setPickerBackup] = useState({ icon: '', color: '' });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isSubmitting },
  } = useForm<EditFormValues>({
    defaultValues: {
      name: '',
      address: '',
      description: '',
      icon: '',
      color: '',
    },
  });

  const nameValue = watch('name');
  const addressValue = watch('address');
  const descriptionValue = watch('description');
  const iconValue = watch('icon');
  const colorValue = watch('color');

  // ── Original values for dirty detection ───────────────────────────────────

  const originalValues = useMemo<EditFormValues | null>(() => {
    if (!storage) return null;
    return {
      name: storage.name,
      address: storage.address ?? '',
      description: storage.description ?? '',
      icon: storage.icon,
      color: storage.color,
    };
  }, [storage]);

  const isDirty = useMemo<boolean>(() => {
    if (!originalValues) return false;
    return (
      nameValue !== originalValues.name ||
      addressValue !== originalValues.address ||
      descriptionValue !== originalValues.description ||
      iconValue !== originalValues.icon ||
      colorValue !== originalValues.color
    );
  }, [originalValues, nameValue, addressValue, descriptionValue, iconValue, colorValue]);

  // ── Reset form when drawer opens with a storage ───────────────────────────

  useEffect(() => {
    if (!open) {
      setShowPicker(false);
      return;
    }
    if (!storage) return;
    setServerError(null);
    setChangeTypeError(null);
    setIsChangingType(false);
    setShowUnsavedDialog(false);
    setShowPicker(false);
    reset({
      name: storage.name,
      address: storage.address ?? '',
      description: storage.description ?? '',
      icon: storage.icon,
      color: storage.color,
    });
  }, [open, storage, reset]);

  // ── Close guard ───────────────────────────────────────────────────────────

  const handleAttemptClose = useCallback((): void => {
    if (isDirty) {
      setShowUnsavedDialog(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  const handleDiscard = useCallback((): void => {
    setShowUnsavedDialog(false);
    onClose();
  }, [onClose]);

  const handleKeepEditing = useCallback((): void => {
    setShowUnsavedDialog(false);
  }, []);

  // ── Form submission ───────────────────────────────────────────────────────

  const handleFormSubmit = async (values: EditFormValues): Promise<void> => {
    if (!storage || !originalValues) return;
    setServerError(null);

    const payload: EditStoragePayload = {};

    if (values.name !== originalValues.name) payload.name = values.name;
    if (values.address !== originalValues.address) payload.address = values.address;
    if (values.description !== originalValues.description) {
      payload.description = values.description || null;
    }
    if (storage.type === 'CUSTOM_ROOM') {
      if (values.icon !== originalValues.icon) payload.icon = values.icon;
      if (values.color !== originalValues.color) payload.color = values.color;
    }

    const result = await onEdit(storage.uuid, storage.type, payload);

    if (result.error === null) {
      onClose();
    } else {
      setServerError(result.error);
    }
  };

  // ── Picker handlers ───────────────────────────────────────────────────────

  const handleOpenPicker = (): void => {
    setPickerBackup({ icon: iconValue, color: colorValue });
    setShowPicker(true);
  };

  const handlePickerChange = (icon: string, color: string): void => {
    setValue('icon', icon, { shouldDirty: true });
    setValue('color', color, { shouldDirty: true });
  };

  const handlePickerApply = (): void => {
    setShowPicker(false);
  };

  const handlePickerCancel = (): void => {
    setValue('icon', pickerBackup.icon, { shouldDirty: false });
    setValue('color', pickerBackup.color, { shouldDirty: false });
    setShowPicker(false);
  };

  // ── Type change handler ────────────────────────────────────────────────────

  const handleTypeChange = async (targetType: StorageType): Promise<void> => {
    if (!storage || targetType === storage.type) return;
    setChangeTypeError(null);
    setIsChangingType(true);
    const result = await onChangeType(storage.uuid, targetType);
    setIsChangingType(false);
    if (result.error === null) {
      onClose();
    } else {
      setChangeTypeError(result.error);
    }
  };

  const isTypeAtLimit = (type: StorageType): boolean => {
    if (!storage || type === storage.type) return false;
    const limit = limits[type];
    if (limit === -1) return false;
    return typeCounts[type] >= limit;
  };

  const capitalizedTier = tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();

  // ── Derived state ─────────────────────────────────────────────────────────

  const typeConfig = storage ? TYPE_BANNER_CONFIGS[storage.type] : null;
  const isCustomRoom = storage?.type === 'CUSTOM_ROOM';
  const isWarehouse = storage?.type === 'WAREHOUSE';
  const isFrozen = storage?.status === 'FROZEN';
  const isArchived = storage?.status === 'ARCHIVED';

  const nameCharsLeft = 80 - nameValue.length;
  const addressCharsLeft = 200 - addressValue.length;
  const descriptionCount = descriptionValue.length;

  const hasNameError = nameValue.trim().length > 0 && nameValue.trim().length < 3;
  const hasAddressError = isWarehouse && addressValue.trim().length === 0 && isDirty;

  const isSubmitDisabled =
    isSubmitting ||
    !isDirty ||
    nameValue.trim().length < 3 ||
    (isWarehouse && addressValue.trim().length === 0) ||
    serverError === 'archived';

  const typeLabel = (): string => {
    if (!storage) return '';
    if (storage.type === 'WAREHOUSE') return t('createDrawer.warehouseLabel');
    if (storage.type === 'STORE_ROOM') return t('createDrawer.storeRoomLabel');
    return t('createDrawer.customRoomLabel');
  };

  if (!storage || !typeConfig) {
    return (
      <>
        <Drawer open={open} onClose={onClose} className="max-w-[480px]">
          <div className="flex h-full items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Drawer open={open} onClose={handleAttemptClose} className="max-w-[480px]">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={drawerId}
          className="flex h-full flex-col"
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between border-b border-neutral-200 px-6 py-5">
            <div>
              <h2 id={drawerId} className="text-base font-semibold text-neutral-900">
                {t('editDrawer.title')}
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">{t('editDrawer.subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={handleAttemptClose}
              aria-label={t('editDrawer.cancel')}
              className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <form id={formId} onSubmit={handleSubmit(handleFormSubmit)} noValidate>
              {/* Type banner (read-only) */}
              <div
                className={cn(
                  'mx-6 mt-5 rounded-xl border p-4',
                  !isCustomRoom && typeConfig.bannerBg,
                  !isCustomRoom && typeConfig.bannerBorder,
                )}
                style={
                  isCustomRoom
                    ? { backgroundColor: `${colorValue}15`, borderColor: `${colorValue}40` }
                    : undefined
                }
              >
                <div className="flex items-start gap-3">
                  {isCustomRoom ? (
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${colorValue}33` }}
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ color: colorValue }}
                      >
                        {iconValue}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        typeConfig.bannerIconBg,
                      )}
                    >
                      <span
                        className={cn('material-symbols-outlined text-[20px]', typeConfig.iconColor)}
                      >
                        {typeConfig.icon}
                      </span>
                    </div>
                  )}
                  <div>
                    <p
                      className={cn('text-sm font-semibold', !isCustomRoom && typeConfig.bannerTitleColor)}
                      style={isCustomRoom ? { color: colorValue } : undefined}
                    >
                      {t('createDrawer.typeLabel')} {typeLabel()}
                    </p>
                    <p className={cn('text-xs', typeConfig.bannerDescColor)}>
                      {t(typeConfig.subtitleKey)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Type selector — E5 warnings + E6 tier block */}
              {!isFrozen && !isArchived && (
                <div className="mx-6 mt-4">
                  <p className="mb-2 text-xs font-medium text-neutral-500">
                    {t('createDrawer.step1Title')}
                  </p>
                  <div className="flex gap-2">
                    {(['WAREHOUSE', 'STORE_ROOM', 'CUSTOM_ROOM'] as StorageType[]).map((type) => {
                      const config = TYPE_BANNER_CONFIGS[type];
                      const isCurrent = storage.type === type;
                      const atLimit = isTypeAtLimit(type);
                      const disabled = isChangingType || isSubmitting;

                      return (
                        <button
                          key={type}
                          type="button"
                          disabled={disabled || atLimit}
                          onClick={() => handleTypeChange(type)}
                          className={cn(
                            'flex flex-1 flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all',
                            isCurrent
                              ? 'border-brand bg-brand/5 dark:bg-brand/10'
                              : atLimit
                                ? 'cursor-not-allowed border-neutral-200 opacity-50 dark:border-white/[0.08]'
                                : 'cursor-pointer border-neutral-200 hover:border-brand/40 dark:border-white/[0.08] dark:hover:border-brand/30',
                          )}
                        >
                          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', config.iconBg)}>
                            <span className={cn('material-symbols-outlined text-[20px]', config.iconColor)}>
                              {config.icon}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                            {t(config.titleKey)}
                          </span>
                          {atLimit && (
                            <span className="text-[10px] text-neutral-400">
                              {typeCounts[type]}/{limits[type]}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tier limit warning */}
                  {changeTypeError === 'tier_limit' && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-bg p-2.5">
                      <span className="material-symbols-outlined shrink-0 text-[16px] text-warning">info</span>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300">
                        {t('editDrawer.warnings.tierLimit', { type: typeLabel(), tier: capitalizedTier })}{' '}
                        <button type="button" className="font-medium text-brand hover:underline">
                          {t('editDrawer.warnings.seePlans')}
                        </button>
                      </p>
                    </div>
                  )}

                  {/* Frozen warning */}
                  {changeTypeError === 'frozen' && (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-bg p-2.5">
                      <span className="material-symbols-outlined shrink-0 text-[16px] text-danger">lock</span>
                      <p className="text-xs text-danger">{t('editDrawer.warnings.iconChange')}</p>
                    </div>
                  )}

                  {/* Changing type spinner */}
                  {isChangingType && (
                    <div className="mt-2 flex items-center justify-center gap-2 py-1">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                      <span className="text-xs text-neutral-500">{t('editDrawer.submitting')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Frozen notice — type change blocked */}
              {isFrozen && (
                <div className="mx-6 mt-4 flex items-start gap-2 rounded-lg border border-blue-400/30 bg-blue-50 p-2.5 dark:bg-blue-900/20">
                  <span className="material-symbols-outlined shrink-0 text-[16px] text-blue-500">ac_unit</span>
                  <p className="text-xs text-blue-700 dark:text-blue-300">{t('editDrawer.warnings.iconChange')}</p>
                </div>
              )}

              {/* Fields */}
              <div className="flex flex-col gap-4 px-6 py-5">
                {/* Name */}
                <div>
                  <label
                    htmlFor={`${formId}-name`}
                    className="mb-1.5 flex items-center gap-1 text-sm font-medium text-neutral-700"
                  >
                    {t('createDrawer.nameLabel')}
                    <span className="text-danger" aria-hidden="true">*</span>
                  </label>
                  <input
                    id={`${formId}-name`}
                    type="text"
                    maxLength={80}
                    {...register('name')}
                    aria-invalid={hasNameError || serverError === 'name_taken'}
                    disabled={isSubmitting}
                    className={cn(
                      'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-ring disabled:opacity-50 dark:bg-neutral-100',
                      hasNameError || serverError === 'name_taken'
                        ? 'border-danger focus:ring-danger/30'
                        : 'border-neutral-300',
                    )}
                  />
                  <div className="mt-1 flex items-start justify-between gap-2">
                    <div>
                      {hasNameError && (
                        <p role="alert" className="text-xs text-danger">
                          {t('editDrawer.errors.nameTooShort')}
                        </p>
                      )}
                      {!hasNameError && serverError === 'name_taken' && (
                        <p role="alert" className="text-xs text-danger">
                          {t('editDrawer.errors.nameDuplicate')}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {t('createDrawer.nameCharsLeft', { count: nameCharsLeft })}
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor={`${formId}-address`}
                    className="mb-1.5 flex items-center gap-1 text-sm font-medium text-neutral-700"
                  >
                    {t('createDrawer.addressLabel')}
                    {isWarehouse && <span className="text-danger" aria-hidden="true">*</span>}
                  </label>
                  <input
                    id={`${formId}-address`}
                    type="text"
                    placeholder={t('createDrawer.addressPlaceholder')}
                    maxLength={200}
                    {...register('address')}
                    aria-invalid={hasAddressError || serverError === 'address_required'}
                    disabled={isSubmitting}
                    className={cn(
                      'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-ring disabled:opacity-50 dark:bg-neutral-100',
                      hasAddressError || serverError === 'address_required'
                        ? 'border-danger focus:ring-danger/30'
                        : 'border-neutral-300',
                    )}
                  />
                  <div className="mt-1 flex items-start justify-between gap-2">
                    <div>
                      {(hasAddressError || serverError === 'address_required') && (
                        <p role="alert" className="text-xs text-danger">
                          {t('editDrawer.errors.addressRequired')}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {t('createDrawer.addressCharsLeft', { count: addressCharsLeft })}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor={`${formId}-description`}
                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                  >
                    {t('createDrawer.descriptionLabel')}
                  </label>
                  <textarea
                    id={`${formId}-description`}
                    placeholder={t('createDrawer.descriptionPlaceholder')}
                    maxLength={300}
                    rows={3}
                    {...register('description')}
                    disabled={isSubmitting}
                    className="w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-ring disabled:opacity-50 dark:bg-neutral-100"
                  />
                  <div className="mt-1 flex justify-end">
                    <span className="text-xs text-neutral-400">
                      {t('createDrawer.descriptionCount', { count: descriptionCount })}
                    </span>
                  </div>
                </div>

                {/* Icon & Color */}
                <div>
                  <p className="mb-1.5 text-sm font-medium text-neutral-700">
                    {t('createDrawer.iconColorLabel')}
                  </p>

                  {isCustomRoom ? (
                    <button
                      type="button"
                      onClick={handleOpenPicker}
                      disabled={isSubmitting}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-neutral-300 bg-white p-2.5 transition-colors hover:border-brand disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100"
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${colorValue}33` }}
                      >
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{ color: colorValue }}
                        >
                          {iconValue}
                        </span>
                      </div>
                      <div
                        className="h-9 w-9 shrink-0 rounded-lg border border-neutral-200"
                        style={{ backgroundColor: colorValue }}
                      />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-neutral-700">{iconValue}</p>
                        <p className="text-xs text-neutral-400">{colorValue}</p>
                      </div>
                      <span className="material-symbols-outlined text-[20px] text-neutral-400">
                        chevron_right
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-100 p-2.5">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          typeConfig.iconBg,
                        )}
                      >
                        <span
                          className={cn('material-symbols-outlined text-[20px]', typeConfig.iconColor)}
                        >
                          {typeConfig.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-700">
                          {t('createDrawer.fixedIconLabel')}
                        </p>
                        <p className="text-xs text-neutral-400">
                          {storage.type === 'WAREHOUSE'
                            ? t('createDrawer.fixedIconWarehouse')
                            : t('createDrawer.fixedIconStoreRoom')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Server error banner */}
              {(serverError === 'server_error' || serverError === 'archived') && (
                <div className="mx-6 mb-2 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-bg p-3">
                  <span className="material-symbols-outlined shrink-0 text-[18px] text-danger">
                    error
                  </span>
                  <p className="text-xs text-danger">{t('editDrawer.toast.error')}</p>
                </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center gap-3 border-t border-neutral-200 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleAttemptClose}
              disabled={isSubmitting}
            >
              {t('editDrawer.cancel')}
            </Button>
            <Button
              form={formId}
              type="submit"
              disabled={isSubmitDisabled}
              className={cn(
                'flex-1 gap-2 bg-brand text-white hover:bg-brand-hover',
                isSubmitDisabled && 'cursor-not-allowed opacity-40',
              )}
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('editDrawer.submitting')}
                </>
              ) : (
                t('editDrawer.submit')
              )}
            </Button>
          </div>
        </div>

        {/* Icon/Color picker overlay */}
        {showPicker && (
          <IconColorPicker
            selectedIcon={pickerBackup.icon}
            selectedColor={pickerBackup.color}
            onChange={handlePickerChange}
            onClose={handlePickerCancel}
            onApply={handlePickerApply}
          />
        )}
      </Drawer>

      {showUnsavedDialog && (
        <UnsavedChangesDialog
          onKeepEditing={handleKeepEditing}
          onDiscard={handleDiscard}
        />
      )}
    </>
  );
}
