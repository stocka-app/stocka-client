import { useState, useCallback, useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import Drawer from '@/shared/components/Drawer';
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
    iconBg: 'bg-[#DBEAFE] dark:bg-[#1E3A5F]',
    iconColor: 'text-[#3B82F6] dark:text-[#93C5FD]',
    titleKey: 'createDrawer.warehouseLabel',
    descKey: 'createDrawer.warehouseDesc',
    exampleKey: 'createDrawer.warehouseExample',
    bannerBg: 'bg-[#EFF6FF] dark:bg-[#1E3A5F]',
    bannerBorder: 'border-[#BFDBFE] dark:border-[#1D4ED8]',
    bannerIconBg: 'bg-[#DBEAFE] dark:bg-[#1E3A5F]',
    bannerTitleColor: 'text-[#1E40AF] dark:text-[#93C5FD]',
    bannerDescColor: 'text-[#60A5FA] dark:text-[#BFDBFE]',
    bannerLinkColor: 'text-[#3B82F6] dark:text-[#93C5FD]',
    subtitleKey: 'createDrawer.warehouseTypeSubtitle',
    fixedColorSwatch: '#3B82F6',
  },
  {
    type: 'STORE_ROOM',
    icon: 'inventory_2',
    iconBg: 'bg-[#FEF3C7] dark:bg-[#1C1100]',
    iconColor: 'text-[#D97706] dark:text-[#FCD34D]',
    titleKey: 'createDrawer.storeRoomLabel',
    descKey: 'createDrawer.storeRoomDesc',
    exampleKey: 'createDrawer.storeRoomExample',
    bannerBg: 'bg-[#FFFBEB] dark:bg-[#1C1100]',
    bannerBorder: 'border-[#FDE68A] dark:border-[#FBBF24]',
    bannerIconBg: 'bg-[#FEF3C7] dark:bg-[#1C1100]',
    bannerTitleColor: 'text-[#92400E] dark:text-[#FCD34D]',
    bannerDescColor: 'text-[#D97706] dark:text-[#D1D5DB]',
    bannerLinkColor: 'text-[#D97706] dark:text-[#FCD34D]',
    subtitleKey: 'createDrawer.storeRoomTypeSubtitle',
    fixedColorSwatch: '#D97706',
  },
  {
    type: 'CUSTOM_ROOM',
    icon: 'category',
    iconBg: 'bg-[#E5E7EB] dark:bg-[#374151]',
    iconColor: 'text-[#6B7280] dark:text-[#D1D5DB]',
    titleKey: 'createDrawer.customRoomLabel',
    descKey: 'createDrawer.customRoomDesc',
    exampleKey: 'createDrawer.customRoomExample',
    bannerBg: 'bg-[#F9FAFB] dark:bg-[#1F2937]',
    bannerBorder: 'border-[#E5E7EB] dark:border-[#374151]',
    bannerIconBg: 'bg-[#F3F4F6] dark:bg-[#374151]',
    bannerTitleColor: 'text-[#374151] dark:text-[#D1D5DB]',
    bannerDescColor: 'text-[#9CA3AF]',
    bannerLinkColor: 'text-[#6B7280] dark:text-[#9CA3AF]',
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
  onChange: (icon: string, color: string) => void;
  onClose: () => void;
}

function IconColorPicker({
  selectedIcon,
  selectedColor,
  onChange,
  onClose,
}: IconColorPickerProps): React.ReactElement {
  const { t } = useTranslation('storages');
  const titleId = useId();

  const [tempIcon, setTempIcon] = useState(selectedIcon);
  const [tempColor, setTempColor] = useState(selectedColor);
  const [customHex, setCustomHex] = useState(selectedColor);
  const [customHexInvalid, setCustomHexInvalid] = useState(false);
  const [iconsExpanded, setIconsExpanded] = useState(true);
  const [colorsExpanded, setColorsExpanded] = useState(true);
  const [customColorExpanded, setCustomColorExpanded] = useState(true);

  const handleIconSelect = (iconName: string): void => {
    setTempIcon(iconName);
    onChange(iconName, tempColor);
  };

  const handleColorSelect = (color: string): void => {
    setTempColor(color);
    setCustomHex(color);
    setCustomHexInvalid(false);
    onChange(tempIcon, color);
  };

  const handleCustomHexChange = (value: string): void => {
    setCustomHex(value);
    if (HEX_PATTERN.test(value)) {
      setTempColor(value);
      setCustomHexInvalid(false);
      onChange(tempIcon, value);
    } else {
      setCustomHexInvalid(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed bottom-[72px] right-[480px] z-[60] flex w-[280px] flex-col overflow-hidden rounded-xl bg-white shadow-[-8px_0_32px_-4px_rgba(0,0,0,0.32)] dark:bg-[#1a2e45]"
    >
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-black/10 px-4 dark:border-white/[0.08]">
        <h3 id={titleId} className="text-sm font-semibold text-[#111827] dark:text-[#F1F5F9]">
          {t('createDrawer.customizeIconColor')}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('createDrawer.close')}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/5 text-[#374151] hover:bg-black/10 dark:bg-white/[0.08] dark:text-[#94A3B8] dark:hover:bg-white/[0.14]"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="max-h-[420px] overflow-y-auto px-4 py-2">

        {/* Icon section */}
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setIconsExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between py-2"
          >
            <span className="text-[11px] font-medium leading-none text-[#64748b]">
              {t('createDrawer.iconSection')}
            </span>
            <span className="material-symbols-outlined text-[14px] text-[#64748b]">
              {iconsExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </button>
          {iconsExpanded && (
            <div className="grid grid-cols-6 gap-1">
              {PICKER_ICONS.map((iconName) => {
                const isSelected = tempIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => handleIconSelect(iconName)}
                    aria-label={iconName}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-100',
                      isSelected
                        ? 'bg-[#0D9488]/15 ring-2 ring-[#0D9488] ring-offset-1 ring-offset-white dark:ring-offset-[#1a2e45]'
                        : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/[0.06]',
                    )}
                  >
                    <span
                      className={cn(
                        'material-symbols-outlined text-[20px] transition-colors',
                        isSelected ? 'text-[#0D9488] dark:text-[#5EEAD4]' : 'text-[#94a3b8] hover:text-[#475569] dark:text-[#64748b] dark:hover:text-[#e2e8f0]',
                      )}
                    >
                      {iconName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-2 h-px bg-black/[0.06] dark:bg-white/[0.08]" />

        {/* Color section */}
        <div className="mb-2">
          <button
            type="button"
            onClick={() => setColorsExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between py-2"
          >
            <span className="text-[11px] font-medium leading-none text-[#64748b]">
              {t('createDrawer.colorSection')}
            </span>
            <span className="material-symbols-outlined text-[14px] text-[#64748b]">
              {colorsExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </button>
          {colorsExpanded && (
            <div className="grid grid-cols-8 gap-1.5">
              {PICKER_COLORS.map((color) => {
                const isSelected = tempColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    aria-label={color}
                    aria-pressed={isSelected}
                    className="h-[30px] w-[30px] rounded-full transition-all duration-100"
                    style={
                      isSelected
                        ? {
                            backgroundColor: color,
                            outline: '2px solid white',
                            outlineOffset: '2px',
                            transform: 'scale(1.15)',
                          }
                        : { backgroundColor: color }
                    }
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="mb-2 h-px bg-black/[0.06] dark:bg-white/[0.08]" />

        {/* Custom color section */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setCustomColorExpanded((prev) => !prev)}
            className="flex w-full items-center justify-between py-2"
          >
            <span className="text-[11px] font-medium leading-none text-[#64748b]">
              {t('createDrawer.customColorSection')}
            </span>
            <span className="material-symbols-outlined text-[14px] text-[#64748b]">
              {customColorExpanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            </span>
          </button>
          {customColorExpanded && (
            <div className="flex items-center gap-2">
              <div
                className="h-9 w-9 shrink-0 rounded-lg"
                style={{ backgroundColor: HEX_PATTERN.test(customHex) ? customHex : '#E5E7EB' }}
              />
              <input
                type="text"
                value={customHex}
                onChange={(e) => handleCustomHexChange(e.target.value)}
                placeholder="#000000"
                maxLength={7}
                className={cn(
                  'h-9 flex-1 rounded-lg border bg-[#F9FAFB] px-3 font-mono text-xs text-[#374151] outline-none focus:ring-2 focus:ring-brand/30 dark:bg-[#182437] dark:text-[#D1D5DB]',
                  customHexInvalid ? 'border-danger' : 'border-black/10 dark:border-white/[0.1]',
                )}
              />
            </div>
          )}
        </div>
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
      <div className="mx-4 w-full max-w-sm rounded-xl bg-surface-card p-6 shadow-2xl">
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

      <div className="flex flex-col gap-3">
        {TYPE_CONFIGS.map((config) => {
          const isSelected = selectedType === config.type;
          return (
            <button
              key={config.type}
              type="button"
              onClick={() => onSelectType(config.type)}
              className={cn(
                'flex w-full cursor-pointer items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150 active:scale-[0.99]',
                isSelected
                  ? 'border-brand bg-white dark:border-brand dark:bg-[#243447]'
                  : 'border-neutral-100 bg-neutral-50 hover:border-neutral-200 hover:bg-white hover:shadow-sm dark:border-[#2A3F55] dark:bg-[#1e293b] dark:hover:border-[#3A5270] dark:hover:bg-[#243447]',
              )}
            >
              <div
                className={cn(
                  'flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[12px]',
                  config.iconBg,
                )}
              >
                <span className={cn('material-symbols-outlined text-[26px]', config.iconColor)}>
                  {config.icon}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-sm font-semibold text-neutral-900 dark:text-[#E2E8F0]">
                  {t(config.titleKey)}
                </p>
                <p className="mb-1.5 text-xs leading-relaxed text-neutral-500">{t(config.descKey)}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  {t(config.exampleKey)}
                </p>
              </div>

              <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px] text-neutral-300 dark:text-neutral-600">
                chevron_right
              </span>
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
        className={cn('mx-6 mt-5 rounded-xl border p-4', !isCustomRoom && typeConfig.bannerBg, !isCustomRoom && typeConfig.bannerBorder)}
        style={isCustomRoom ? { backgroundColor: `${colorValue}15`, borderColor: `${colorValue}40` } : undefined}
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
              <span className={cn('material-symbols-outlined text-[20px]', typeConfig.iconColor)}>
                {typeConfig.icon}
              </span>
            </div>
          )}
          <div className="min-w-0 flex-1">
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
        <button
          type="button"
          onClick={onChangeType}
          className={cn('mt-2 text-xs font-medium hover:underline', !isCustomRoom && typeConfig.bannerLinkColor)}
          style={isCustomRoom ? { color: colorValue } : undefined}
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
      {(tierLimitReached || serverError === 'tier_limit') && currentTierLimit !== -1 && (
        <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-bg p-3">
          <span className="material-symbols-outlined shrink-0 text-[20px] text-warning">info</span>
          <p className="text-xs text-neutral-700">
            {t('createDrawer.tierLimitWarning', {
              count: currentActiveCount,
              max: currentTierLimit,
              type: typeLabel(),
              tier: capitalizedTier,
            })}{' '}
            <button type="button" className="font-medium text-brand hover:underline">
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
              'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-ring disabled:opacity-50 dark:bg-neutral-100',
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
              'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-ring disabled:opacity-50 dark:bg-neutral-100',
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
              'w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-ring disabled:opacity-50 dark:bg-neutral-100',
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
        <div className="mx-6 mb-2 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-bg p-3">
          <span className="material-symbols-outlined shrink-0 text-[18px] text-danger">error</span>
          <p className="text-xs text-danger">{t('createDrawer.serverError')}</p>
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
}: CreateStorageDrawerProps): React.ReactElement {
  const { t } = useTranslation('storages');
  const formId = useId();
  const drawerId = useId();

  const [step, setStep] = useState<DrawerStep>('type-selection');
  const [selectedType, setSelectedType] = useState<StorageType | null>(null);
  const [serverError, setServerError] = useState<CreateError>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerBackup, setPickerBackup] = useState({ icon: DEFAULT_ICON, color: DEFAULT_COLOR });

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

  // Reset when drawer opens; close picker when drawer closes
  useEffect(() => {
    if (!open) {
      setShowPicker(false);
      return;
    }
    setStep('type-selection');
    setSelectedType(null);
    setServerError(null);
    setShowCancelConfirm(false);
    setShowPicker(false);
    setPickerBackup({ icon: DEFAULT_ICON, color: DEFAULT_COLOR });
    reset({ name: '', address: '', description: '', icon: DEFAULT_ICON, color: DEFAULT_COLOR });
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

  // Auto-advances to step 2 after a 200ms delay so the user sees the card
  // selected visually before the content transitions.
  const handleSelectType = useCallback((type: StorageType): void => {
    setSelectedType(type);
    setTimeout(() => {
      setStep('details');
      setServerError(null);
    }, 200);
  }, []);

  const handleChangeType = (): void => {
    setStep('type-selection');
    setServerError(null);
    reset({ name: '', address: '', description: '', icon: DEFAULT_ICON, color: DEFAULT_COLOR });
  };

  // ── Form submission ───────────────────────────────────────────────────────

  const handleFormSubmit = async (values: DrawerFormValues): Promise<void> => {
    if (!selectedType) return;
    setServerError(null);

    const description = values.description;
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
    tierLimitReached ||
    serverError === 'tier_limit';

  return (
  <>
    <Drawer open={open} onClose={handleAttemptClose} className="max-w-[480px]">
      {/* Inner panel — role="dialog" lives here so aria attributes are on the visible element */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={drawerId}
        className="flex h-full flex-col"
      >
        {/* Header — always visible */}
        <div className="flex shrink-0 items-start justify-between border-b border-neutral-200 px-6 py-5">
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

        {/* aria-live region: announces step changes to screen readers */}
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          {step === 'type-selection' ? t('createDrawer.step1Label') : t('createDrawer.step2Label')}
        </div>

        {/* Body — key forces re-mount on step change, triggering the enter animation */}
        <div key={step} className="flex-1 animate-in fade-in slide-in-from-right-4 duration-200 overflow-y-auto">
          {step === 'type-selection' ? (
            <TypeSelectionBody
              selectedType={selectedType}
              onSelectType={handleSelectType}
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
                onOpenPicker={handleOpenPicker}
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
        <div className="flex shrink-0 items-center gap-3 border-t border-neutral-200 px-6 py-4">
          {step === 'type-selection' ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleAttemptClose}
            >
              {t('createDrawer.pickerCancel')}
            </Button>
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
          selectedIcon={pickerBackup.icon}
          selectedColor={pickerBackup.color}
          onChange={handlePickerChange}
          onClose={() => setShowPicker(false)}
        />
      )}

    </Drawer>

    {/* Cancel confirmation dialog — rendered outside <Drawer> to escape its CSS transform
        stacking context. transform: translateX() makes fixed children position relative to
        the drawer panel instead of the viewport, so this must live at the sibling level. */}
    {showCancelConfirm && (
      <CancelConfirmDialog
        onKeepEditing={handleKeepEditing}
        onAbandon={handleAbandon}
      />
    )}
  </>
  );
}
