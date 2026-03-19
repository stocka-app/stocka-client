import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useRBACStore } from '@/store/rbac.store';
import { useTierGate } from '@/shared/hooks/useTierGate';
import { createSpaceSchema, type CreateSpaceFormData } from '../schemas/spaces.schema';
import type { Space, SpaceType } from '../types/spaces.types';

interface CreateEditSpaceModalProps {
  open: boolean;
  space?: Space | null;
  onClose: () => void;
  onSave: (data: CreateSpaceFormData) => Promise<boolean>;
}

const SPACE_TYPES: SpaceType[] = ['CUSTOM_ROOM', 'STORE_ROOM', 'WAREHOUSE'];

/**
 * CreateEditSpaceModal
 *
 * Handles both create and edit flows for a Space. WAREHOUSE type is disabled for
 * FREE tier — clicking it opens the UpgradeModal.
 */
export function CreateEditSpaceModal({
  open,
  space,
  onClose,
  onSave,
}: CreateEditSpaceModalProps): React.ReactElement | null {
  const { t } = useTranslation('spaces');
  const { tier } = useRBACStore();
  const { openUpgradeModal } = useTierGate();
  const isEdit = Boolean(space);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSpaceFormData>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: {
      name: space?.name ?? '',
      type: space?.type ?? 'CUSTOM_ROOM',
      address: space?.address ?? '',
    },
  });

  // Reset form when space changes (switching between create / edit)
  useEffect(() => {
    if (open) {
      reset({
        name: space?.name ?? '',
        type: space?.type ?? 'CUSTOM_ROOM',
        address: space?.address ?? '',
      });
    }
  }, [open, space, reset]);

  const selectedType = watch('type');
  const isWarehouseBlocked = tier === 'FREE';

  const handleFormSubmit = async (data: CreateSpaceFormData): Promise<void> => {
    const success = await onSave(data);
    if (success) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-edit-space-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <h2
          id="create-edit-space-modal-title"
          className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100"
        >
          {isEdit ? t('createModal.titleEdit') : t('createModal.titleCreate')}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="space-name">{t('createModal.name')}</Label>
              <Input
                id="space-name"
                type="text"
                placeholder={t('createModal.namePlaceholder')}
                {...register('name')}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'space-name-error' : undefined}
                className="mt-1"
              />
              {errors.name?.message && (
                <p id="space-name-error" role="alert" className="mt-1 text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="space-type">{t('createModal.type')}</Label>
              <select
                id="space-type"
                {...register('type')}
                aria-invalid={!!errors.type}
                aria-describedby={errors.type ? 'space-type-error' : undefined}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {SPACE_TYPES.map((type) => {
                  const isDisabled = type === 'WAREHOUSE' && isWarehouseBlocked;
                  return (
                    <option
                      key={type}
                      value={type}
                      disabled={isDisabled}
                    >
                      {t(`types.${type}`)}
                      {isDisabled ? ` — ${t('createModal.warehouseDisabled')}` : ''}
                    </option>
                  );
                })}
              </select>
              {errors.type?.message && (
                <p id="space-type-error" role="alert" className="mt-1 text-sm text-destructive">
                  {errors.type.message}
                </p>
              )}
              {isWarehouseBlocked && selectedType !== 'WAREHOUSE' && (
                <button
                  type="button"
                  className="mt-1 text-xs text-brand hover:underline"
                  onClick={() => openUpgradeModal('FEATURE_NOT_IN_TIER', 'WAREHOUSE')}
                >
                  {t('createModal.warehouseDisabled')}
                </button>
              )}
            </div>

            {/* Address — always shown, required only for WAREHOUSE */}
            <div>
              <Label htmlFor="space-address">
                {t('createModal.address')}
                {selectedType === 'WAREHOUSE' && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({t('createModal.addressRequired')})
                  </span>
                )}
              </Label>
              <Input
                id="space-address"
                type="text"
                placeholder={t('createModal.addressPlaceholder')}
                {...register('address')}
                aria-invalid={!!errors.address}
                aria-describedby={errors.address ? 'space-address-error' : undefined}
                className="mt-1"
              />
              {errors.address?.message && (
                <p id="space-address-error" role="alert" className="mt-1 text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              {t('createModal.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {t('createModal.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
