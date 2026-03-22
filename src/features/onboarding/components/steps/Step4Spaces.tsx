import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Store, Package, Warehouse, Lock, ChevronDown, ChevronUp, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface SpaceConfig {
  type: 'CUSTOM_ROOM' | 'STORE_ROOM' | 'WAREHOUSE';
  name: string;
  roomType?: string;
  address?: string;
}

interface Step4SpacesProps {
  businessType: string;
  tier: string | null;
  onSubmit: (spaces: SpaceConfig[]) => Promise<void>;
  onSkip: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// STATIC DATA MAPS
// =============================================================================

/**
 * Maps frontend business type enum values to the suggestion key used
 * in the i18n translation files (step4.customRoom.suggestions.<key>).
 */
const BUSINESS_TYPE_TO_SUGGESTION_KEY: Record<string, string> = {
  RETAIL: 'retail',
  RESTAURANT: 'food',
  WORKSHOP: 'manufacturing',
  SERVICES: 'services',
  HEALTH: 'healthcare',
  EDUCATION: 'education',
  EVENTS: 'services',
  AGRICULTURE: 'other',
  OTHER: 'other',
};

// =============================================================================
// INTERNAL STATE TYPES
// =============================================================================

interface CustomRoomState {
  roomType: string;
  customRoomType: string;
  name: string;
  address: string;
}

interface StoreRoomState {
  name: string;
  address: string;
}

interface WarehouseState {
  name: string;
  address: string;
}

interface ValidationErrors {
  [key: string]: string;
}

// =============================================================================
// TIER HELPERS
// =============================================================================

type SpaceType = 'CUSTOM_ROOM' | 'STORE_ROOM' | 'WAREHOUSE';

function getMaxSpaces(spaceType: SpaceType, tier: string | null): number {
  const isFreeTier = !tier || tier === 'FREE';
  if (spaceType === 'WAREHOUSE') return isFreeTier ? 0 : 1;
  return isFreeTier ? 1 : 3;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Step4Spaces({
  businessType,
  tier,
  onSubmit,
  onSkip,
  onBack,
  isLoading,
  error,
}: Step4SpacesProps): React.ReactElement {
  const { t } = useTranslation('onboarding');
  const isFreeTier = !tier || tier === 'FREE';

  // View mode: 'overview' shows summary cards, 'configure' shows editable forms
  const [mode, setMode] = useState<'overview' | 'configure'>('overview');

  // Expanded sections in configure mode
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    storeRoom: true,
    customRoom: false,
    warehouse: false,
  });

  // Space instances
  const [customRooms, setCustomRooms] = useState<CustomRoomState[]>([
    { roomType: '', customRoomType: '', name: '', address: '' },
  ]);
  const [storeRooms, setStoreRooms] = useState<StoreRoomState[]>([
    { name: '', address: '' },
  ]);
  const [warehouses, setWarehouses] = useState<WarehouseState[]>([
    { name: '', address: '' },
  ]);

  // Validation
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Room type suggestions from i18n based on business type
  const suggestionKey = BUSINESS_TYPE_TO_SUGGESTION_KEY[businessType] ?? 'other';
  const suggestions = useMemo(() => {
    const raw = t(`step4.customRoom.suggestions.${suggestionKey}`, { returnObjects: true });
    return Array.isArray(raw) ? (raw as string[]) : [];
  }, [suggestionKey, t]);

  const maxCustomRooms = getMaxSpaces('CUSTOM_ROOM', tier);
  const maxStoreRooms = getMaxSpaces('STORE_ROOM', tier);
  const maxWarehouses = getMaxSpaces('WAREHOUSE', tier);

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Custom room handlers
  const updateCustomRoom = useCallback((index: number, field: keyof CustomRoomState, value: string) => {
    setCustomRooms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    // Clear validation error for this field
    setValidationErrors((prev) => {
      const key = `customRoom.${index}.${field}`;
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev;
    });
  }, []);

  /* v8 ignore start: defensive guard — add button not rendered at max capacity */
  const addCustomRoom = useCallback(() => {
    if (customRooms.length < maxCustomRooms) {
      setCustomRooms((prev) => [...prev, { roomType: '', customRoomType: '', name: '', address: '' }]);
    }
  }, [customRooms.length, maxCustomRooms]);
  /* v8 ignore stop */

  /* v8 ignore start: defensive guard — remove button not rendered when only 1 room */
  const removeCustomRoom = useCallback((index: number) => {
    if (customRooms.length > 1) {
      setCustomRooms((prev) => prev.filter((_, i) => i !== index));
    }
  }, [customRooms.length]);
  /* v8 ignore stop */

  // Store room handlers
  const updateStoreRoom = useCallback((index: number, field: keyof StoreRoomState, value: string) => {
    setStoreRooms((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setValidationErrors((prev) => {
      const key = `storeRoom.${index}.${field}`;
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev;
    });
  }, []);

  /* v8 ignore start: defensive guard — add button not rendered at max capacity */
  const addStoreRoom = useCallback(() => {
    if (storeRooms.length < maxStoreRooms) {
      setStoreRooms((prev) => [...prev, { name: '', address: '' }]);
    }
  }, [storeRooms.length, maxStoreRooms]);
  /* v8 ignore stop */

  /* v8 ignore start: defensive guard — remove button not rendered when only 1 room */
  const removeStoreRoom = useCallback((index: number) => {
    if (storeRooms.length > 1) {
      setStoreRooms((prev) => prev.filter((_, i) => i !== index));
    }
  }, [storeRooms.length]);
  /* v8 ignore stop */

  // Warehouse handlers
  const updateWarehouse = useCallback((index: number, field: keyof WarehouseState, value: string) => {
    setWarehouses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setValidationErrors((prev) => {
      const key = `warehouse.${index}.${field}`;
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev;
    });
  }, []);

  // Check if any space has data filled in (all-or-nothing validation)
  const hasAnyData = useCallback((): boolean => {
    const hasCustomRoomData = customRooms.some(
      (r) => r.roomType.trim() || r.customRoomType.trim() || r.name.trim() || r.address.trim(),
    );
    const hasStoreRoomData = storeRooms.some(
      (r) => r.name.trim() || r.address.trim(),
    );
    const hasWarehouseData = !isFreeTier && warehouses.some(
      (r) => r.name.trim() || r.address.trim(),
    );
    return hasCustomRoomData || hasStoreRoomData || hasWarehouseData;
  }, [customRooms, storeRooms, warehouses, isFreeTier]);

  // Validate all spaces before submit
  const validate = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    // Only validate spaces that have some data filled in
    customRooms.forEach((room, i) => {
      const hasData = room.roomType.trim() || room.name.trim() || room.address.trim();
      if (hasData) {
        const effectiveRoomType = room.roomType.trim();
        if (!effectiveRoomType) {
          errors[`customRoom.${i}.roomType`] = 'step4.customRoom.roomTypeRequired';
        }
        if (!room.name.trim()) {
          errors[`customRoom.${i}.name`] = 'step4.customRoom.nameRequired';
        }
      }
    });

    storeRooms.forEach((room, i) => {
      const hasData = room.name.trim() || room.address.trim();
      if (hasData) {
        if (!room.name.trim()) {
          errors[`storeRoom.${i}.name`] = 'step4.storeRoom.nameRequired';
        }
      }
    });

    if (!isFreeTier) {
      warehouses.forEach((room, i) => {
        const hasData = room.name.trim() || room.address.trim();
        if (hasData) {
          if (!room.name.trim()) {
            errors[`warehouse.${i}.name`] = 'step4.warehouse.nameRequired';
          }
          if (!room.address.trim()) {
            errors[`warehouse.${i}.address`] = 'step4.warehouse.addressRequired';
          }
        }
      });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [customRooms, storeRooms, warehouses, isFreeTier]);

  // Build SpaceConfig[] from state and submit
  const handleSubmit = useCallback(async () => {
    if (!hasAnyData()) {
      // No data filled in — treat as skip
      onSkip();
      return;
    }

    if (!validate()) return;

    const spaces: SpaceConfig[] = [];

    customRooms.forEach((room) => {
      const effectiveRoomType = room.roomType === '__OTHER__' ? room.customRoomType.trim() : room.roomType.trim();
      if (effectiveRoomType && room.name.trim()) {
        spaces.push({
          type: 'CUSTOM_ROOM',
          name: room.name.trim(),
          roomType: effectiveRoomType,
          address: room.address.trim() || undefined,
        });
      }
    });

    storeRooms.forEach((room) => {
      if (room.name.trim()) {
        spaces.push({
          type: 'STORE_ROOM',
          name: room.name.trim(),
          address: room.address.trim() || undefined,
        });
      }
    });

    if (!isFreeTier) {
      warehouses.forEach((room) => {
        if (room.name.trim() && room.address.trim()) {
          spaces.push({
            type: 'WAREHOUSE',
            name: room.name.trim(),
            address: room.address.trim(),
          });
        }
      });
    }

    if (spaces.length === 0) {
      onSkip();
      return;
    }

    await onSubmit(spaces);
  }, [customRooms, storeRooms, warehouses, isFreeTier, hasAnyData, validate, onSubmit, onSkip]);

  // Get dynamic placeholder for the name field based on selected room type
  const defaultNamePlaceholder = t('step4.customRoom.namePlaceholderDefault');
  const getNamePlaceholder = useCallback((roomType: string): string => {
    if (!roomType) return defaultNamePlaceholder;
    const placeholder = t(`step4.customRoom.namePlaceholders.${roomType}`, { defaultValue: '' });
    return placeholder || defaultNamePlaceholder;
  }, [t, defaultNamePlaceholder]);

  // =========================================================================
  // OVERVIEW MODE
  // =========================================================================

  if (mode === 'overview') {
    return (
      <div className="space-y-6">
        {/* API error */}
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-danger-bg border border-danger/30 p-3 text-sm text-danger"
          >
            {t(error)}
          </div>
        )}

        {/* Overview cards */}
        <div className="space-y-3">
          {/* Store Room card */}
          <div
            className="p-4 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-surface-card"
            aria-label={t('step4.storeRoom.title')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-neutral-900">
                  {t('step4.storeRoom.title')}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t('step4.storeRoom.description')}
                </p>
              </div>
              <span className="text-xs text-neutral-400 flex-shrink-0">
                max {maxStoreRooms}
              </span>
            </div>
          </div>

          {/* Custom Room card */}
          <div
            className="p-4 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-surface-card"
            aria-label={t('step4.customRoom.title')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-brand" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-neutral-900">
                  {t('step4.customRoom.title')}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t('step4.customRoom.description')}
                </p>
              </div>
              <span className="text-xs text-neutral-400 flex-shrink-0">
                max {maxCustomRooms}
              </span>
            </div>
          </div>

          {/* Warehouse card */}
          <div
            className={cn(
              'p-4 rounded-xl border bg-surface-card',
              isFreeTier
                ? 'border-neutral-200 dark:border-white/[0.08] opacity-60'
                : 'border-neutral-200 dark:border-white/[0.08]',
            )}
            aria-label={t('step4.warehouse.title')}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  isFreeTier ? 'bg-neutral-200 dark:bg-white/[0.06]' : 'bg-indigo-500/10',
                )}
              >
                {isFreeTier ? (
                  <Lock className="w-5 h-5 text-neutral-400" aria-hidden="true" />
                ) : (
                  <Warehouse className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      'font-semibold text-sm',
                      isFreeTier ? 'text-neutral-400' : 'text-neutral-900',
                    )}
                  >
                    {t('step4.warehouse.title')}
                  </p>
                  {isFreeTier && (
                    <span className="text-[10px] font-semibold bg-brand text-white px-2 py-0.5 rounded-full">
                      {t('step4.warehouse.lockedBadge')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {isFreeTier ? t('step4.warehouse.lockedMessage') : t('step4.warehouse.description')}
                </p>
              </div>
              {!isFreeTier && (
                <span className="text-xs text-neutral-400 flex-shrink-0">
                  max {maxWarehouses}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Escape hint */}
        <p className="text-xs text-neutral-500 text-center leading-relaxed">
          {t('step4.escapeHint')}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            type="button"
            onClick={() => setMode('configure')}
            disabled={isLoading}
            aria-label={t('step4.configureButton')}
            className="w-full h-12 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold"
          >
            {t('step4.configureButton')}
          </Button>

          <div className="flex gap-3">
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
              type="button"
              variant="outline"
              onClick={onSkip}
              disabled={isLoading}
              aria-label={t('step4.skipButton')}
              className="flex-1 h-12 rounded-xl border-neutral-200 dark:border-white/[0.08] text-neutral-500"
            >
              {t('step4.skipButton')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CONFIGURE MODE
  // =========================================================================

  return (
    <div className="space-y-6">
      {/* API error */}
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-danger-bg border border-danger/30 p-3 text-sm text-danger"
        >
          {t(error)}
        </div>
      )}

      {/* ================================================================= */}
      {/* STORE ROOM SECTION */}
      {/* ================================================================= */}
      <section
        className="rounded-xl border border-neutral-200 dark:border-white/[0.08] overflow-hidden"
        aria-label={t('step4.storeRoom.title')}
      >
        <button
          type="button"
          onClick={() => toggleSection('storeRoom')}
          className="w-full flex items-center gap-3 p-4 bg-surface-card hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors text-left"
          aria-expanded={expandedSections.storeRoom}
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-neutral-900">
              {t('step4.storeRoom.title')}
            </p>
            <p className="text-xs text-neutral-500">
              {t('step4.storeRoom.description')}
            </p>
          </div>
          {expandedSections.storeRoom ? (
            <ChevronUp className="w-4 h-4 text-neutral-400 flex-shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" aria-hidden="true" />
          )}
        </button>

        {expandedSections.storeRoom && (
          <div className="border-t border-neutral-200 dark:border-white/[0.08] p-4 space-y-4">
            {storeRooms.map((room, index) => (
              <div
                key={index}
                className={cn(
                  'space-y-3',
                  index > 0 && 'pt-4 border-t border-neutral-100 dark:border-white/[0.05]',
                )}
              >
                {storeRooms.length > 1 && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeStoreRoom(index)}
                      disabled={isLoading}
                      className="text-xs text-neutral-400 hover:text-danger flex items-center gap-1 transition-colors"
                      aria-label={`Remove store room ${index + 1}`}
                    >
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-neutral-900 block mb-1">
                    {t('step4.storeRoom.nameLabel')}
                  </label>
                  <Input
                    value={room.name}
                    onChange={(e) => updateStoreRoom(index, 'name', e.target.value)}
                    placeholder={t('step4.storeRoom.namePlaceholder')}
                    disabled={isLoading}
                    className="h-10 rounded-xl border-neutral-200 dark:border-white/[0.08]"
                    aria-label={t('step4.storeRoom.nameLabel')}
                  />
                  {validationErrors[`storeRoom.${index}.name`] && (
                    <p className="text-xs text-danger mt-1">
                      {t(validationErrors[`storeRoom.${index}.name`])}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-900 block mb-1">
                    {t('step4.storeRoom.addressLabel')}
                  </label>
                  <Input
                    value={room.address}
                    onChange={(e) => updateStoreRoom(index, 'address', e.target.value)}
                    placeholder={t('step4.storeRoom.addressPlaceholder')}
                    disabled={isLoading}
                    className="h-10 rounded-xl border-neutral-200 dark:border-white/[0.08]"
                    aria-label={t('step4.storeRoom.addressLabel')}
                  />
                </div>
              </div>
            ))}

            {storeRooms.length < maxStoreRooms && (
              <button
                type="button"
                onClick={addStoreRoom}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-hover font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                {t('step4.storeRoom.title')}
              </button>
            )}
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* CUSTOM ROOM SECTION */}
      {/* ================================================================= */}
      <section
        className="rounded-xl border border-neutral-200 dark:border-white/[0.08] overflow-hidden"
        aria-label={t('step4.customRoom.title')}
      >
        <button
          type="button"
          onClick={() => toggleSection('customRoom')}
          className="w-full flex items-center gap-3 p-4 bg-surface-card hover:bg-neutral-50 dark:hover:bg-white/[0.03] transition-colors text-left"
          aria-expanded={expandedSections.customRoom}
        >
          <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-brand" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-neutral-900">
              {t('step4.customRoom.title')}
            </p>
            <p className="text-xs text-neutral-500">
              {t('step4.customRoom.description')}
            </p>
          </div>
          {expandedSections.customRoom ? (
            <ChevronUp className="w-4 h-4 text-neutral-400 flex-shrink-0" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" aria-hidden="true" />
          )}
        </button>

        {expandedSections.customRoom && (
          <div className="border-t border-neutral-200 dark:border-white/[0.08] p-4 space-y-4">
            {customRooms.map((room, index) => (
              <div
                key={index}
                className={cn(
                  'space-y-3',
                  index > 0 && 'pt-4 border-t border-neutral-100 dark:border-white/[0.05]',
                )}
              >
                {customRooms.length > 1 && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeCustomRoom(index)}
                      disabled={isLoading}
                      className="text-xs text-neutral-400 hover:text-danger flex items-center gap-1 transition-colors"
                      aria-label={`Remove custom room ${index + 1}`}
                    >
                      <Trash2 className="w-3 h-3" aria-hidden="true" />
                    </button>
                  </div>
                )}

                {/* Room type — suggestion chips + free text input */}
                <div>
                  <label className="text-sm font-medium text-neutral-900 block mb-2">
                    {t('step4.customRoom.roomTypeLabel')}
                  </label>

                  {/* Suggestion chips */}
                  {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => updateCustomRoom(index, 'roomType', suggestion)}
                          disabled={isLoading}
                          className={cn(
                            'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer',
                            room.roomType === suggestion
                              ? 'border-brand bg-brand-light text-brand dark:bg-brand/20'
                              : 'border-neutral-200 dark:border-white/[0.08] text-neutral-500 hover:border-brand/50 dark:hover:border-brand/30',
                          )}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Free text input — always visible for custom typing */}
                  <Input
                    value={room.roomType}
                    onChange={(e) => updateCustomRoom(index, 'roomType', e.target.value)}
                    placeholder={t('step4.customRoom.roomTypePlaceholder')}
                    disabled={isLoading}
                    className="h-10 rounded-xl border-neutral-200 dark:border-white/[0.08]"
                    aria-label={t('step4.customRoom.roomTypeLabel')}
                  />

                  {validationErrors[`customRoom.${index}.roomType`] && (
                    <p className="text-xs text-danger mt-1">
                      {t(validationErrors[`customRoom.${index}.roomType`])}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-900 block mb-1">
                    {t('step4.customRoom.nameLabel')}
                  </label>
                  <Input
                    value={room.name}
                    onChange={(e) => updateCustomRoom(index, 'name', e.target.value)}
                    placeholder={getNamePlaceholder(room.roomType)}
                    disabled={isLoading}
                    className="h-10 rounded-xl border-neutral-200 dark:border-white/[0.08]"
                    aria-label={t('step4.customRoom.nameLabel')}
                  />
                  {validationErrors[`customRoom.${index}.name`] && (
                    <p className="text-xs text-danger mt-1">
                      {t(validationErrors[`customRoom.${index}.name`])}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-900 block mb-1">
                    {t('step4.customRoom.addressLabel')}
                  </label>
                  <Input
                    value={room.address}
                    onChange={(e) => updateCustomRoom(index, 'address', e.target.value)}
                    placeholder={t('step4.customRoom.addressPlaceholder')}
                    disabled={isLoading}
                    className="h-10 rounded-xl border-neutral-200 dark:border-white/[0.08]"
                    aria-label={t('step4.customRoom.addressLabel')}
                  />
                </div>
              </div>
            ))}

            {customRooms.length < maxCustomRooms && (
              <button
                type="button"
                onClick={addCustomRoom}
                disabled={isLoading}
                className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-hover font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                {t('step4.customRoom.title')}
              </button>
            )}
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* WAREHOUSE SECTION */}
      {/* ================================================================= */}
      <section
        className={cn(
          'rounded-xl border overflow-hidden',
          isFreeTier
            ? 'border-neutral-200 dark:border-white/[0.08] opacity-60'
            : 'border-neutral-200 dark:border-white/[0.08]',
        )}
        aria-label={t('step4.warehouse.title')}
      >
        {/* Section header */}
        <button
          type="button"
          onClick={() => !isFreeTier && toggleSection('warehouse')}
          disabled={isFreeTier}
          className={cn(
            'w-full flex items-center gap-3 p-4 bg-surface-card text-left transition-colors',
            isFreeTier ? 'cursor-not-allowed' : 'hover:bg-neutral-50 dark:hover:bg-white/[0.03]',
          )}
          aria-expanded={!isFreeTier && expandedSections.warehouse}
        >
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
              isFreeTier ? 'bg-neutral-200 dark:bg-white/[0.06]' : 'bg-indigo-500/10',
            )}
          >
            {isFreeTier ? (
              <Lock className="w-4 h-4 text-neutral-400" aria-hidden="true" />
            ) : (
              <Warehouse className="w-4 h-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  'font-semibold text-sm',
                  isFreeTier ? 'text-neutral-400' : 'text-neutral-900',
                )}
              >
                {t('step4.warehouse.title')}
              </p>
              {isFreeTier && (
                <span className="text-[10px] font-semibold bg-brand text-white px-2 py-0.5 rounded-full">
                  {t('step4.warehouse.lockedBadge')}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500">
              {isFreeTier ? t('step4.warehouse.lockedMessage') : t('step4.warehouse.description')}
            </p>
          </div>
          {!isFreeTier && (
            expandedSections.warehouse ? (
              <ChevronUp className="w-4 h-4 text-neutral-400 flex-shrink-0" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" aria-hidden="true" />
            )
          )}
        </button>

        {/* Section body — only for non-free tiers */}
        {!isFreeTier && expandedSections.warehouse && (
          <div className="border-t border-neutral-200 dark:border-white/[0.08] p-4 space-y-4">
            {warehouses.map((room, index) => (
              <div key={index} className="space-y-3">
                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-neutral-900 block mb-1">
                    {t('step4.warehouse.nameLabel')}
                  </label>
                  <Input
                    value={room.name}
                    onChange={(e) => updateWarehouse(index, 'name', e.target.value)}
                    placeholder={t('step4.warehouse.namePlaceholder')}
                    disabled={isLoading}
                    className="h-10 rounded-xl border-neutral-200 dark:border-white/[0.08]"
                    aria-label={t('step4.warehouse.nameLabel')}
                  />
                  {validationErrors[`warehouse.${index}.name`] && (
                    <p className="text-xs text-danger mt-1">
                      {t(validationErrors[`warehouse.${index}.name`])}
                    </p>
                  )}
                </div>

                {/* Address (required for warehouses) */}
                <div>
                  <label className="text-sm font-medium text-neutral-900 block mb-1">
                    {t('step4.warehouse.addressLabel')}
                  </label>
                  <Input
                    value={room.address}
                    onChange={(e) => updateWarehouse(index, 'address', e.target.value)}
                    placeholder={t('step4.warehouse.addressPlaceholder')}
                    disabled={isLoading}
                    className="h-10 rounded-xl border-neutral-200 dark:border-white/[0.08]"
                    aria-label={t('step4.warehouse.addressLabel')}
                  />
                  {validationErrors[`warehouse.${index}.address`] && (
                    <p className="text-xs text-danger mt-1">
                      {t(validationErrors[`warehouse.${index}.address`])}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Escape hint */}
      <p className="text-xs text-neutral-500 text-center leading-relaxed">
        {t('step4.escapeHint')}
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
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          aria-label={t('step4.ctaButton')}
          className="flex-1 h-12 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              {t('step4.saving')}
            </>
          ) : (
            t('step4.ctaButton')
          )}
        </Button>
      </div>

      {/* Skip link */}
      <div className="text-center">
        <button
          type="button"
          onClick={onSkip}
          disabled={isLoading}
          aria-label={t('step4.skipButton')}
          className="text-sm text-neutral-500 hover:text-brand hover:underline transition-colors disabled:pointer-events-none"
        >
          {t('step4.skipButton')}
        </button>
      </div>
    </div>
  );
}
