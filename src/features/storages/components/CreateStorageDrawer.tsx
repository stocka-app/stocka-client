import { useState, useCallback, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { createCustomRoomFormSchema } from '../schemas/storages.schema';
import type {
  CreateWarehouseFormData,
  CreateStoreRoomFormData,
  CreateCustomRoomFormData,
} from '../schemas/storages.schema';
import type { Storage, StorageType } from '../types/storages.types';

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawerStep = 'type-selection' | 'details';
type CreateError = 'name_taken' | 'tier_limit' | 'server_error' | null;

export interface CreateStorageDrawerProps {
  open: boolean;
  onClose: () => void;
  storages: Storage[];
  limits: Record<StorageType, number>;
  tier: string;
  onCreateWarehouse: (payload: CreateWarehouseFormData) => Promise<{ error: CreateError }>;
  onCreateStoreRoom: (payload: CreateStoreRoomFormData) => Promise<{ error: CreateError }>;
  onCreateCustomRoom: (payload: CreateCustomRoomFormData) => Promise<{ error: CreateError }>;
}

// ─── Unified form shape ───────────────────────────────────────────────────────

interface DrawerFormValues {
  name: string;
  address: string;
  description: string;
  icon: string;
  color: string;
}

// ─── Icon/Color picker constants ──────────────────────────────────────────────

const PICKER_ICONS: string[] = [
  'restaurant',
  'hotel',
  'corporate_fare',
  'school',
  'local_cafe',
  'local_hospital',
  'fitness_center',
  'factory',
  'local_pharmacy',
  'spa',
  'storefront',
  'apartment',
  'stadium',
  'museum',
  'local_gas_station',
  'church',
  'local_bar',
  'park',
];

const PICKER_COLORS: string[] = [
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#0D9488',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#DC2626',
  '#EA580C',
  '#CA8A04',
  '#16A34A',
  '#0F766E',
  '#2563EB',
  '#7C3AED',
  '#DB2777',
];

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const DEFAULT_ICON = 'restaurant';
const DEFAULT_COLOR = '#0D9488';

// ─── Type card config ─────────────────────────────────────────────────────────

interface TypeCardConfig {
  type: StorageType;
  icon: string;
  iconBg: string;
  iconColor: string;
  titleKey: string;
  descKey: string;
  exampleKey: string;
  bannerBg: string;
  bannerBorder: string;
  bannerIconBg: string;
  bannerTitleColor: string;
  bannerDescColor: string;
  bannerLinkColor: string;
  subtitleKey: string;
  fixedColorSwatch: string;
}

const TYPE_CONFIGS: TypeCardConfig[] = [
  {
    type: 'WAREHOUSE',
    icon: 'warehouse',
    iconBg: 'bg-[#DBEAFE]',
    iconColor: 'text-[#3B82F6]',
    titleKey: 'createDrawer.warehouseLabel',
    descKey: 'createDrawer.warehouseDesc',
    exampleKey: 'createDrawer.warehouseExample',
    bannerBg: 'bg-[#EFF6FF]',
    bannerBorder: 'border-[#BFDBFE]',
    bannerIconBg: 'bg-[#DBEAFE]',
    bannerTitleColor: 'text-[#1E40AF]',
    bannerDescColor: 'text-[#60A5FA]',
    bannerLinkColor: 'text-[#3B82F6]',
    subtitleKey: 'createDrawer.warehouseTypeSubtitle',
    fixedColorSwatch: '#3B82F6',
  },
  {
    type: 'STORE_ROOM',
    icon: 'inventory_2',
    iconBg: 'bg-[#FEF3C7]',
    iconColor: 'text-[#D97706]',
    titleKey: 'createDrawer.storeRoomLabel',
    descKey: 'createDrawer.storeRoomDesc',
    exampleKey: 'createDrawer.storeRoomExample',
    bannerBg: 'bg-[#FFFBEB]',
    bannerBorder: 'border-[#FDE68A]',
    bannerIconBg: 'bg-[#FEF3C7]',
    bannerTitleColor: 'text-[#92400E]',
    bannerDescColor: 'text-[#D97706]',
    bannerLinkColor: 'text-[#D97706]',
    subtitleKey: 'createDrawer.storeRoomTypeSubtitle',
    fixedColorSwatch: '#D97706',
  },
  {
    type: 'CUSTOM_ROOM',
    icon: 'category',
    iconBg: 'bg-[#E5E7EB]',
    iconColor: 'text-[#6B7280]',
    titleKey: 'createDrawer.customRoomLabel',
    descKey: 'createDrawer.customRoomDesc',
    exampleKey: 'createDrawer.customRoomExample',
    bannerBg: 'bg-[#F0FDFA]',
    bannerBorder: 'border-[#99F6E4]',
    bannerIconBg: 'bg-[#CCFBF1]',
    bannerTitleColor: 'text-[#134E4A]',
    bannerDescColor: 'text-[#2DD4BF]',
    bannerLinkColor: 'text-[#0D9488]',
    subtitleKey: 'createDrawer.customRoomTypeSubtitle',
    fixedColorSwatch: '#0D9488',
  },
];

// ═════════════════════════════════════════════════════════════════════════════
// Icon/Color Picker
// ═════════════════════════════════════════════════════════════════════════════

interface IconColorPickerProps {
  selectedIcon: string;
  selectedColor: string;
  onApply: (icon: string, color: string) => void;
  onCancel: () => void;
}

function IconColorPicker({
  selectedIcon,
  selectedColor,
  onApply,
  onCancel,
}: IconColorPickerProps): React.ReactElement {
  const { t } = useTranslation('storages');
  const titleId = useId();

  const [tempIcon, setTempIcon] = useState(selectedIcon);
  const [tempColor, setTempColor] = useState(selectedColor);
  const [customHex, setCustomHex] = useState(selectedColor);
  const [customHexInvalid, setCustomHexInvalid] = useState(false);
  const [iconsExpanded, setIconsExpanded] = useState(true);
  const [colorsExpanded, setColorsExpanded] = useState(true);
  const [customColorExpanded, setCustomColorExpanded] = useState(false);

  const handleColorSelect = (color: string): void => {
    setTempColor(color);
    setCustomHex(color);
    setCustomHexInvalid(false);
  };

  const handleCustomHexChange = (value: string): void => {
    setCustomHex(value);
    if (HEX_PATTERN.test(value)) {
      setTempColor(value);
      setCustomHexInvalid(false);
    } else {
      setCustomHexInvalid(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed right-[480px] top-0 z-[60] flex h-screen w-[280px] flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-4">
        <h3 id={titleId} className="text-sm font-semibold text-neutral-900">
          {t('createDrawer.customizeIconColor')}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label={t('createDrawer.close')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Icon section */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setIconsExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between py-2"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700">
              {t('createDrawer.iconSection')}
            </span>
            <span className="material-symbols-outlined text-[18px] text-neutral-400">
              {iconsExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {iconsExpanded && (
            <div className="mt-2 grid grid-cols-6 gap-1.5">
              {PICKER_ICONS.map((iconName) => {
                const isSelected = tempIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setTempIcon(iconName)}
                    aria-label={iconName}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border transition-colors',
                      isSelected
                        ? 'border-2 border-teal-600 bg-[#CCFBF1]'
                        : 'border border-neutral-200 bg-[#F9FAFB] hover:bg-neutral-100',
                    )}
                  >
                    <span className="material-symbols-outlined text-[20px] text-neutral-700">
                      {iconName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Color section */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setColorsExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between py-2"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700">
              {t('createDrawer.colorSection')}
            </span>
            <span className="material-symbols-outlined text-[18px] text-neutral-400">
              {colorsExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {colorsExpanded && (
            <div className="mt-2 grid grid-cols-8 gap-1.5">
              {PICKER_COLORS.map((color) => {
                const isSelected = tempColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    aria-label={color}
                    aria-pressed={isSelected}
                    className="h-[34px] w-[34px] rounded-full transition-all"
                    style={
                      isSelected
                        ? { backgroundColor: color, outline: `3px solid ${color}`, outlineOffset: '2px' }
                        : { backgroundColor: color }
                    }
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Custom color section */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setCustomColorExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between py-2"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700">
              {t('createDrawer.customColorSection')}
            </span>
            <span className="material-symbols-outlined text-[18px] text-neutral-400">
              {customColorExpanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {customColorExpanded && (
            <div className="mt-2 flex items-center gap-2">
              <div
                className="h-9 w-9 shrink-0 rounded-lg border border-neutral-200"
                style={{ backgroundColor: HEX_PATTERN.test(customHex) ? customHex : '#E5E7EB' }}
              />
              <input
                type="text"
                value={customHex}
                onChange={(e) => handleCustomHexChange(e.target.value)}
                placeholder="#000000"
                maxLength={7}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-brand',
                  customHexInvalid ? 'border-danger text-danger' : 'border-neutral-200',
                )}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center gap-2 border-t border-neutral-100 px-4 py-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          {t('createDrawer.pickerCancel')}
        </Button>
        <Button
          type="button"
          className="flex-1 bg-brand text-white hover:bg-brand-hover"
          onClick={() => onApply(tempIcon, tempColor)}
        >
          {t('createDrawer.pickerApply')}
        </Button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Cancel Confirmation Dialog
// ═════════════════════════════════════════════════════════════════════════════

interface CancelConfirmDialogProps {
  onKeepEditing: () => void;
  onAbandon: () => void;
}

function CancelConfirmDialog({
  onKeepEditing,
  onAbandon,
}: CancelConfirmDialogProps): React.ReactElement {
  const { t } = useTranslation('storages');
  const titleId = useId();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50"
    >
      <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <h3 id={titleId} className="mb-2 text-base font-semibold text-neutral-900">
          {t('createDrawer.cancelConfirmTitle')}
        </h3>
        <p className="mb-5 text-sm text-neutral-500">
          {t('createDrawer.cancelConfirmBody')}
        </p>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onKeepEditing}>
            {t('createDrawer.keepEditing')}
          </Button>
          <Button
            type="button"
            className="flex-1 bg-danger text-white hover:bg-danger/90"
            onClick={onAbandon}
          >
            {t('createDrawer.abandon')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Step 1 — Type Selection body
// ═════════════════════════════════════════════════════════════════════════════

function TypeSelectionBody({
  selectedType,
  onSelectType,
}: {
  selectedType: StorageType | null;
  onSelectType: (type: StorageType) => void;
}): React.ReactElement {
  const { t } = useTranslation('storages');

  return (
    <div className="px-6 py-5">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        {t('createDrawer.step1Label')}
      </p>
      <h3 className="mb-0.5 text-sm font-semibold text-neutral-900">
        {t('createDrawer.step1Title')}
      </h3>
      <p className="mb-5 text-xs text-neutral-500">{t('createDrawer.step1Subtitle')}</p>

      <div className="flex flex-col gap-3" role="radiogroup" aria-label={t('createDrawer.step1Title')}>
        {TYPE_CONFIGS.map((config) => {
          const isSelected = selectedType === config.type;
          return (
            <button
              key={config.type}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelectType(config.type)}
              className={cn(
                'flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors',
                isSelected
                  ? 'border-2 border-brand bg-white'
                  : 'border border-neutral-200 bg-neutral-100 hover:border-neutral-300',
              )}
            >
              <div
                className={cn(
                  'flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px]',
                  config.iconBg,
                )}
              >
                <span className={cn('material-symbols-outlined text-[22px]', config.iconColor)}>
                  {config.icon}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-sm font-semibold text-neutral-900">{t(config.titleKey)}</p>
                <p className="mb-1.5 text-xs leading-relaxed text-neutral-500">{t(config.descKey)}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  {t(config.exampleKey)}
                </p>
              </div>

              <div
                className={cn(
                  'mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2',
                  isSelected ? 'border-brand' : 'border-neutral-300',
                )}
              >
                {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-brand" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Step 2 — Details form body (no footer — rendered separately)
// ═════════════════════════════════════════════════════════════════════════════

interface DetailsBodyProps {
  formId: string;
  selectedType: StorageType;
  typeConfig: TypeCardConfig;
  onChangeType: () => void;
  tierLimitReached: boolean;
  currentActiveCount: number;
  currentTierLimit: number;
  capitalizedTier: string;
  namePlaceholder: string;
  nameCharsLeft: number;
  addressCharsLeft: number;
  descriptionCount: number;
  iconValue: string;
  colorValue: string;
  onOpenPicker: () => void;
  serverError: CreateError;
  isSubmitting: boolean;
  register: ReturnType<typeof useForm<DrawerFormValues>>['register'];
  errors: ReturnType<typeof useForm<DrawerFormValues>>['formState']['errors'];
  handleSubmit: ReturnType<typeof useForm<DrawerFormValues>>['handleSubmit'];
  onFormSubmit: (values: DrawerFormValues) => Promise<void>;
}

function DetailsBody({
  formId,
  selectedType,
  typeConfig,
  onChangeType,
  tierLimitReached,
  currentActiveCount,
  currentTierLimit,
  capitalizedTier,
  namePlaceholder,
  nameCharsLeft,
  addressCharsLeft,
  descriptionCount,
  iconValue,
  colorValue,
  onOpenPicker,
  serverError,
  isSubmitting,
  register,
  errors,
  handleSubmit,
  onFormSubmit,
}: DetailsBodyProps): React.ReactElement {
  const { t } = useTranslation('storages');
  const isCustomRoom = selectedType === 'CUSTOM_ROOM';

  const typeLabel = (): string => {
    if (selectedType === 'WAREHOUSE') return t('createDrawer.warehouseLabel');
    if (selectedType === 'STORE_ROOM') return t('createDrawer.storeRoomLabel');
    return t('createDrawer.customRoomLabel');
  };

  const fixedIconLabel = (): string => {
    if (selectedType === 'WAREHOUSE') return t('createDrawer.fixedIconWarehouse');
    return t('createDrawer.fixedIconStoreRoom');
  };

  return (
    <form id={formId} onSubmit={handleSubmit(onFormSubmit)} noValidate>
      {/* Type banner */}
      <div
        className={cn(
          'mx-6 mt-5 rounded-xl border p-4',
          typeConfig.bannerBg,
          typeConfig.bannerBorder,
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
              typeConfig.bannerIconBg,
            )}
          >
            <span className={cn('material-symbols-outlined text-[20px]', typeConfig.iconColor)}>
              {typeConfig.icon}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm font-semibold', typeConfig.bannerTitleColor)}>
              {t('createDrawer.typeLabel')} {typeLabel()}
            </p>
            <p className={cn('text-xs', typeConfig.bannerDescColor)}>
              {t(typeConfig.subtitleKey)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onChangeType}
          className={cn('mt-2 text-xs font-medium hover:underline', typeConfig.bannerLinkColor)}
        >
          {t('createDrawer.changeType')}
        </button>
      </div>

      {/* Section header */}
      <div className="px-6 pb-1 pt-5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
          {t('createDrawer.step2Label')}
        </p>
        <h3 className="mb-0.5 text-sm font-semibold text-neutral-900">
          {t('createDrawer.step2Title')}
        </h3>
        <p className="text-xs text-neutral-500">{t('createDrawer.step2Subtitle')}</p>
      </div>

      {/* Tier limit banner */}
      {tierLimitReached && currentTierLimit !== -1 && (
        <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <span className="material-symbols-outlined shrink-0 text-[20px] text-warning">info</span>
          <p className="text-xs text-amber-800">
            {t('createDrawer.tierLimitWarning', {
              count: currentActiveCount,
              max: currentTierLimit,
              type: typeLabel(),
              tier: capitalizedTier,
            })}{' '}
            <button type="button" className="font-medium text-[#3B82F6] hover:underline">
              {t('createDrawer.tierLimitCta')}
            </button>
          </p>
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
            placeholder={namePlaceholder}
            maxLength={80}
            {...register('name')}
            aria-invalid={!!errors.name || serverError === 'name_taken'}
            aria-describedby={
              errors.name
                ? `${formId}-name-error`
                : serverError === 'name_taken'
                  ? `${formId}-name-taken`
                  : undefined
            }
            disabled={isSubmitting}
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-ring disabled:opacity-50',
              errors.name || serverError === 'name_taken'
                ? 'border-danger focus:ring-danger/30'
                : 'border-neutral-300',
            )}
          />
          <div className="mt-1 flex items-start justify-between gap-2">
            <div>
              {errors.name?.message && (
                <p id={`${formId}-name-error`} role="alert" className="text-xs text-danger">
                  {errors.name.message}
                </p>
              )}
              {!errors.name && serverError === 'name_taken' && (
                <p id={`${formId}-name-taken`} role="alert" className="text-xs text-danger">
                  {t('createDrawer.nameTakenError')}
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
            <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input
            id={`${formId}-address`}
            type="text"
            placeholder={t('createDrawer.addressPlaceholder')}
            maxLength={200}
            {...register('address')}
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? `${formId}-address-error` : undefined}
            disabled={isSubmitting}
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-ring disabled:opacity-50',
              errors.address ? 'border-danger focus:ring-danger/30' : 'border-neutral-300',
            )}
          />
          <div className="mt-1 flex items-start justify-between gap-2">
            <div>
              {errors.address?.message && (
                <p id={`${formId}-address-error`} role="alert" className="text-xs text-danger">
                  {errors.address.message}
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
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? `${formId}-description-error` : undefined}
            className={cn(
              'w-full resize-none rounded-lg border px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-ring disabled:opacity-50',
              errors.description ? 'border-danger focus:ring-danger/30' : 'border-neutral-300',
            )}
          />
          <div className="mt-1 flex items-start justify-between gap-2">
            <div>
              {errors.description?.message && (
                <p
                  id={`${formId}-description-error`}
                  role="alert"
                  className="text-xs text-danger"
                >
                  {errors.description.message}
                </p>
              )}
            </div>
            <span className="shrink-0 text-xs text-neutral-400">
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
              onClick={onOpenPicker}
              disabled={isSubmitting}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-neutral-300 bg-white p-2.5 transition-colors hover:border-brand disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  typeConfig.iconBg,
                )}
              >
                <span className={cn('material-symbols-outlined text-[20px]', typeConfig.iconColor)}>
                  {typeConfig.icon}
                </span>
              </div>
              <div
                className="h-9 w-9 shrink-0 rounded-lg border border-neutral-200"
                style={{ backgroundColor: typeConfig.fixedColorSwatch }}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-700">
                  {t('createDrawer.fixedIconLabel')}
                </p>
                <p className="text-xs text-neutral-400">{fixedIconLabel()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Server error banner */}
      {serverError === 'server_error' && (
        <div className="mx-6 mb-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <span className="material-symbols-outlined shrink-0 text-[18px] text-danger">error</span>
          <p className="text-xs text-red-700">{t('createDrawer.serverError')}</p>
        </div>
      )}
    </form>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CreateStorageDrawer
// ═════════════════════════════════════════════════════════════════════════════

export function CreateStorageDrawer({
  open,
  onClose,
  storages,
  limits,
  tier,
  onCreateWarehouse,
  onCreateStoreRoom,
  onCreateCustomRoom,
}: CreateStorageDrawerProps): React.ReactElement | null {
  const { t } = useTranslation('storages');
  const formId = useId();
  const drawerId = useId();

  const [step, setStep] = useState<DrawerStep>('type-selection');
  const [selectedType, setSelectedType] = useState<StorageType | null>(null);
  const [serverError, setServerError] = useState<CreateError>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DrawerFormValues>({
    resolver: zodResolver(
      createCustomRoomFormSchema.pick({
        name: true,
        address: true,
        description: true,
        icon: true,
        color: true,
      }),
    ),
    defaultValues: {
      name: '',
      address: '',
      description: '',
      icon: DEFAULT_ICON,
      color: DEFAULT_COLOR,
    },
  });

  const nameValue = watch('name');
  const addressValue = watch('address');
  const descriptionValue = watch('description');
  const iconValue = watch('icon');
  const colorValue = watch('color');

  // Reset when drawer opens
  useEffect(() => {
    if (open) {
      setStep('type-selection');
      setSelectedType(null);
      setServerError(null);
      setShowCancelConfirm(false);
      setShowPicker(false);
      reset({ name: '', address: '', description: '', icon: DEFAULT_ICON, color: DEFAULT_COLOR });
    }
  }, [open, reset]);

  // ── Tier limit helpers ────────────────────────────────────────────────────

  const activeCountForType = (type: StorageType): number =>
    storages.filter((s) => s.type === type && s.status === 'ACTIVE').length;

  const isAtTierLimit = (type: StorageType): boolean => {
    const limit = limits[type];
    if (limit === -1) return false;
    return activeCountForType(type) >= limit;
  };

  // ── Close / cancel guard ──────────────────────────────────────────────────

  const hasFormData = nameValue.trim().length > 0 || addressValue.trim().length > 0;

  const handleAttemptClose = useCallback((): void => {
    if (step === 'details' && hasFormData) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  }, [step, hasFormData, onClose]);

  const handleAttemptBack = useCallback((): void => {
    if (hasFormData) {
      setShowCancelConfirm(true);
    } else {
      setStep('type-selection');
      setServerError(null);
    }
  }, [hasFormData]);

  const handleAbandon = useCallback((): void => {
    setShowCancelConfirm(false);
    onClose();
  }, [onClose]);

  const handleKeepEditing = useCallback((): void => {
    setShowCancelConfirm(false);
  }, []);

  // ── Step navigation ───────────────────────────────────────────────────────

  const handleContinue = (): void => {
    if (!selectedType) return;
    setStep('details');
    setServerError(null);
  };

  const handleChangeType = (): void => {
    setStep('type-selection');
    setServerError(null);
    reset({ name: '', address: '', description: '', icon: DEFAULT_ICON, color: DEFAULT_COLOR });
  };

  // ── Form submission ───────────────────────────────────────────────────────

  const handleFormSubmit = async (values: DrawerFormValues): Promise<void> => {
    if (!selectedType) return;
    setServerError(null);

    const description = values.description.trim() === '' ? undefined : values.description.trim();
    let result: { error: CreateError };

    if (selectedType === 'WAREHOUSE') {
      result = await onCreateWarehouse({
        name: values.name,
        address: values.address,
        description,
      });
    } else if (selectedType === 'STORE_ROOM') {
      result = await onCreateStoreRoom({
        name: values.name,
        address: values.address,
        description,
      });
    } else {
      result = await onCreateCustomRoom({
        name: values.name,
        address: values.address,
        description,
        icon: values.icon,
        color: values.color,
      });
    }

    if (result.error === null) {
      onClose();
    } else {
      setServerError(result.error);
    }
  };

  // ── Picker handlers ───────────────────────────────────────────────────────

  const handlePickerApply = (icon: string, color: string): void => {
    setValue('icon', icon, { shouldDirty: true });
    setValue('color', color, { shouldDirty: true });
    setShowPicker(false);
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const typeConfig = selectedType
    ? (TYPE_CONFIGS.find((c) => c.type === selectedType) ?? null)
    : null;

  const tierLimitReached = selectedType !== null && isAtTierLimit(selectedType);
  const currentTierLimit = selectedType ? limits[selectedType] : -1;
  const currentActiveCount = selectedType ? activeCountForType(selectedType) : 0;

  const capitalizedTier =
    tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();

  const namePlaceholder = (): string => {
    if (selectedType === 'WAREHOUSE') return t('createDrawer.namePlaceholderWarehouse');
    if (selectedType === 'STORE_ROOM') return t('createDrawer.namePlaceholderStoreRoom');
    return t('createDrawer.namePlaceholderCustomRoom');
  };

  const nameCharsLeft = 80 - nameValue.length;
  const addressCharsLeft = 200 - addressValue.length;
  const descriptionCount = descriptionValue.length;

  const isSubmitDisabled =
    isSubmitting ||
    nameValue.trim().length < 3 ||
    addressValue.trim().length === 0 ||
    tierLimitReached;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={handleAttemptClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={drawerId}
        className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[480px] flex-col bg-white shadow-2xl"
      >
        {/* Header — always visible */}
        <div className="flex shrink-0 items-start justify-between border-b border-neutral-100 px-6 py-5">
          <div>
            <h2 id={drawerId} className="text-base font-semibold text-neutral-900">
              {t('createDrawer.title')}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">{t('createDrawer.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={handleAttemptClose}
            aria-label={t('createDrawer.close')}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {step === 'type-selection' ? (
            <TypeSelectionBody
              selectedType={selectedType}
              onSelectType={setSelectedType}
            />
          ) : (
            selectedType !== null && typeConfig !== null && (
              <DetailsBody
                formId={formId}
                selectedType={selectedType}
                typeConfig={typeConfig}
                onChangeType={handleChangeType}
                tierLimitReached={tierLimitReached}
                currentActiveCount={currentActiveCount}
                currentTierLimit={currentTierLimit}
                capitalizedTier={capitalizedTier}
                namePlaceholder={namePlaceholder()}
                nameCharsLeft={nameCharsLeft}
                addressCharsLeft={addressCharsLeft}
                descriptionCount={descriptionCount}
                iconValue={iconValue}
                colorValue={colorValue}
                onOpenPicker={() => setShowPicker(true)}
                serverError={serverError}
                isSubmitting={isSubmitting}
                register={register}
                errors={errors}
                handleSubmit={handleSubmit}
                onFormSubmit={handleFormSubmit}
              />
            )
          )}
        </div>

        {/* Footer — always visible, step-specific */}
        <div className="flex shrink-0 items-center gap-3 border-t border-neutral-100 px-6 py-4">
          {step === 'type-selection' ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleAttemptClose}
              >
                {t('createDrawer.pickerCancel')}
              </Button>
              <Button
                type="button"
                className={cn(
                  'flex-1 bg-brand text-white hover:bg-brand-hover',
                  !selectedType && 'cursor-not-allowed opacity-40',
                )}
                disabled={!selectedType}
                onClick={handleContinue}
              >
                {t('createDrawer.continue')}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleAttemptBack}
                disabled={isSubmitting}
              >
                {t('createDrawer.back')}
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
                    {t('createDrawer.creating')}
                  </>
                ) : (
                  t('createDrawer.create')
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Icon/Color picker overlay */}
      {showPicker && (
        <IconColorPicker
          selectedIcon={iconValue}
          selectedColor={colorValue}
          onApply={handlePickerApply}
          onCancel={() => setShowPicker(false)}
        />
      )}

      {/* Cancel confirmation dialog */}
      {showCancelConfirm && (
        <CancelConfirmDialog
          onKeepEditing={handleKeepEditing}
          onAbandon={handleAbandon}
        />
      )}
    </>
  );
}
