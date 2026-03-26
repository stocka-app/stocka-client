import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import type { Storage, StorageStatus, StorageType } from '../types/storages.types';

// ─── Visual mappings ──────────────────────────────────────────────────────────

const TYPE_BADGE_CLASSES: Record<StorageType, string> = {
  WAREHOUSE: 'bg-blue-100 text-blue-700',
  STORE_ROOM: 'bg-green-100 text-green-700',
  CUSTOM_ROOM: 'bg-purple-100 text-purple-700',
};

const STATUS_DOT_CLASSES: Record<StorageStatus, string> = {
  ACTIVE: 'bg-green-500',
  FROZEN: 'bg-amber-500',
  ARCHIVED: 'bg-neutral-400',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface StorageCardProps {
  storage: Storage;
  onEdit?: (storage: Storage) => void;
  onArchive?: (storage: Storage) => void;
  onRestore?: (storage: Storage) => void;
  onDelete?: (storage: Storage) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function StorageCard({
  storage,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: StorageCardProps): React.ReactElement {
  const { t } = useTranslation('installations');

  // Action visibility is fully driven by the handlers passed from the parent.
  // The parent (StoragesPage) decides which handlers to pass based on RBAC + business rules.
  const showEdit = !!onEdit;
  const showArchive = !!onArchive && storage.status === 'ACTIVE';
  const showRestore = !!onRestore && storage.status === 'ARCHIVED';
  const showDelete = !!onDelete && storage.status === 'ARCHIVED';

  return (
    <div className="rounded-lg border border-border bg-background p-4 transition-shadow hover:shadow-sm">
      {/* Header: name + type badge */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="truncate font-medium text-neutral-900">{storage.name}</h3>
        <span
          className={cn(
            'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
            TYPE_BADGE_CLASSES[storage.type],
          )}
        >
          {t(`types.${storage.type}`)}
        </span>
      </div>

      {/* Status indicator */}
      <div className="mb-3 flex items-center gap-1.5">
        <span
          className={cn('inline-block h-2 w-2 rounded-full', STATUS_DOT_CLASSES[storage.status])}
          aria-hidden="true"
        />
        <span className="text-xs text-neutral-500">{t(`statuses.${storage.status}`)}</span>
      </div>

      {/* Address */}
      {storage.address !== null && (
        <p className="mb-3 truncate text-sm text-neutral-600">{storage.address}</p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 border-t border-border pt-2">
        <Button type="button" variant="ghost" size="sm">
          {t('actions.view')}
        </Button>
        {showEdit && onEdit && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(storage)}>
            {t('actions.edit')}
          </Button>
        )}
        {showArchive && onArchive && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onArchive(storage)}>
            {t('actions.archive')}
          </Button>
        )}
        {showRestore && onRestore && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onRestore(storage)}>
            {t('actions.restore')}
          </Button>
        )}
        {showDelete && onDelete && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(storage)}>
            {t('actions.delete')}
          </Button>
        )}
      </div>
    </div>
  );
}
