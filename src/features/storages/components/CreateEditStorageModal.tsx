import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useRBACStore } from '@/store/rbac.store';
import { useTierGate } from '@/shared/hooks/useTierGate';
import { createStorageSchema, type CreateStorageFormData } from '../schemas/storages.schema';
import type { Storage, StorageType } from '../types/storages.types';

interface CreateEditStorageModalProps {
  open: boolean;
  storage?: Storage | null;
  onClose: () => void;
  onSave: (data: CreateStorageFormData) => Promise<boolean>;
}

const STORAGE_TYPES: StorageType[] = ['CUSTOM_ROOM', 'STORE_ROOM', 'WAREHOUSE'];

/**
 * CreateEditStorageModal
 *
 * Handles both create and edit flows for a Storage. WAREHOUSE type is disabled for
 * FREE tier — clicking it opens the UpgradeModal.
 */
export function CreateEditStorageModal({
  open,
  storage,
  onClose,
  onSave,
}: CreateEditStorageModalProps): React.ReactElement | null {
  const { t } = useTranslation('installations');
  const { tier } = useRBACStore();
  const { openUpgradeModal } = useTierGate();
  const isEdit = Boolean(storage);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateStorageFormData>({
    resolver: zodResolver(createStorageSchema),
    defaultValues: {
      name: storage?.name ?? '',
      type: storage?.type ?? 'CUSTOM_ROOM',
      address: storage?.address ?? '',
    },
  });

  // Reset form when storage changes (switching between create / edit)
  useEffect(() => {
    if (open) {
      reset({
        name: storage?.name ?? '',
        type: storage?.type ?? 'CUSTOM_ROOM',
        address: storage?.address ?? '',
      });
    }
  }, [open, storage, reset]);

  const selectedType = watch('type');
  const isWarehouseBlocked = tier === 'FREE';

  const handleFormSubmit = async (data: CreateStorageFormData): Promise<void> => {
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
      aria-labelledby="create-edit-storage-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <h2
          id="create-edit-storage-modal-title"
          className="mb-4 text-lg font-semibold text-neutral-900"
        >
          {isEdit ? t('createModal.titleEdit') : t('createModal.titleCreate')}
        </h2>

        <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="storage-name">{t('createModal.name')}</Label>
              <Input
                id="storage-name"
                type="text"
                placeholder={t('createModal.namePlaceholder')}
                {...register('name')}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'storage-name-error' : undefined}
                className="mt-1"
              />
              {errors.name?.message && (
                <p id="storage-name-error" role="alert" className="mt-1 text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <Label htmlFor="storage-type">{t('createModal.type')}</Label>
              <select
                id="storage-type"
                {...register('type')}
                aria-invalid={!!errors.type}
                aria-describedby={errors.type ? 'storage-type-error' : undefined}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {STORAGE_TYPES.map((type) => {
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
                <p id="storage-type-error" role="alert" className="mt-1 text-sm text-destructive">
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
              <Label htmlFor="storage-address">
                {t('createModal.address')}
                {selectedType === 'WAREHOUSE' && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({t('createModal.addressRequired')})
                  </span>
                )}
              </Label>
              <Input
                id="storage-address"
                type="text"
                placeholder={t('createModal.addressPlaceholder')}
                {...register('address')}
                aria-invalid={!!errors.address}
                aria-describedby={errors.address ? 'storage-address-error' : undefined}
                className="mt-1"
              />
              {errors.address?.message && (
                <p id="storage-address-error" role="alert" className="mt-1 text-sm text-destructive">
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
