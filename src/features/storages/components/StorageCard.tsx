import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import type { Storage, StorageStatus, StorageType } from '../types/storages.types';

// ─── Visual mappings ──────────────────────────────────────────────────────────

const TYPE_BRACKET_CLASSES: Record<StorageType, string> = {
  WAREHOUSE: 'bg-inst-almacen-accent',
  STORE_ROOM: 'bg-inst-bodega-accent',
  CUSTOM_ROOM: 'bg-inst-custom-accent',
};

const TYPE_BADGE_CLASSES: Record<StorageType, string> = {
  WAREHOUSE: 'bg-inst-almacen-subtle text-inst-almacen-text',
  STORE_ROOM: 'bg-inst-bodega-subtle text-inst-bodega-text',
  CUSTOM_ROOM: 'bg-inst-custom-subtle text-inst-custom-text',
};

const TYPE_ICON_BG_CLASSES: Record<StorageType, string> = {
  WAREHOUSE: 'bg-inst-almacen-subtle',
  STORE_ROOM: 'bg-inst-bodega-subtle',
  CUSTOM_ROOM: 'bg-inst-custom-subtle',
};

const TYPE_ICON_NAME: Record<StorageType, string> = {
  WAREHOUSE: 'warehouse',
  STORE_ROOM: 'inventory_2',
  CUSTOM_ROOM: 'other_houses',
};

const TYPE_ICON_COLOR_CLASSES: Record<StorageType, string> = {
  WAREHOUSE: 'text-inst-almacen-text',
  STORE_ROOM: 'text-inst-bodega-text',
  CUSTOM_ROOM: 'text-inst-custom-text',
};

const STATUS_DOT_CLASSES: Record<StorageStatus, string> = {
  ACTIVE: 'bg-success',
  FROZEN: 'bg-blue-400',
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
  const { t } = useTranslation('storages');

  // Action visibility is fully driven by the handlers passed from the parent.
  // The parent (StoragesPage) decides which handlers to pass based on RBAC + business rules.
  const showEdit = !!onEdit;
  const showArchive = !!onArchive && storage.status === 'ACTIVE';
  const showRestore = !!onRestore && storage.status === 'ARCHIVED';
  const showDelete = !!onDelete && storage.status === 'ARCHIVED';

  const isFrozen = storage.status === 'FROZEN';
  const isArchived = storage.status === 'ARCHIVED';
  const isCustomRoom = storage.type === 'CUSTOM_ROOM';

  return (
    <div
      className={cn(
        'flex min-h-[220px] overflow-hidden rounded-lg border border-border shadow-card',
        isArchived
          ? 'bg-neutral-50 opacity-50'
          : isFrozen
            ? 'border-blue-400/30 bg-surface-card'
            : 'bg-surface-card',
      )}
    >
      {/* Left color bracket */}
      <div
        className={cn('w-2.5 shrink-0', !isCustomRoom && TYPE_BRACKET_CLASSES[storage.type])}
        style={isCustomRoom ? { backgroundColor: storage.color } : undefined}
        aria-hidden="true"
      />

      {/* Content body */}
      <div className={cn('flex min-w-0 flex-1 flex-col p-4', isFrozen && 'opacity-75')}>
        {/* Header: icon + badge row, then name below */}
        <div className="mb-2 flex items-start justify-between">
          {/* Icon area */}
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
              !isCustomRoom && TYPE_ICON_BG_CLASSES[storage.type],
            )}
            style={isCustomRoom ? { backgroundColor: `${storage.color}33` } : undefined}
            aria-hidden="true"
          >
            <span
              className={cn(
                'material-symbols-outlined text-2xl',
                !isCustomRoom && TYPE_ICON_COLOR_CLASSES[storage.type],
              )}
              style={isCustomRoom ? { color: storage.color } : undefined}
            >
              {isCustomRoom ? storage.icon : TYPE_ICON_NAME[storage.type]}
            </span>
          </div>

          {/* Badge + status dot aligned right */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                !isCustomRoom && TYPE_BADGE_CLASSES[storage.type],
              )}
              style={isCustomRoom ? { backgroundColor: `${storage.color}20`, color: storage.color } : undefined}
            >
              {t(`types.${storage.type}`)}
            </span>
            <span
              className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT_CLASSES[storage.status])}
              role="img"
              aria-label={t(`statuses.${storage.status}`)}
            />
          </div>
        </div>

        {/* Name — always full width, never truncated by badge */}
        <h3 className="mb-1 text-base font-semibold text-neutral-900">{storage.name}</h3>

        {/* Room type (CUSTOM_ROOM only) */}
        {storage.type === 'CUSTOM_ROOM' && storage.roomType && (
          <p className="mb-1 text-xs text-neutral-400">{storage.roomType}</p>
        )}

        {/* Address */}
        {storage.address !== null && (
          <div className="mb-3 flex min-w-0 items-center gap-1">
            <span className="material-symbols-outlined shrink-0 text-[14px] text-neutral-400">location_on</span>
            <p className="truncate text-sm text-neutral-600">{storage.address}</p>
          </div>
        )}

        {/* Context menu — mt-auto pins footer to bottom when grid stretches this card */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-2">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-neutral-400">inventory_2</span>
            <span className="text-xs text-neutral-500">— {t('productCount')}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                aria-label={t('actions.menu')}
              >
                <span className="material-symbols-outlined text-[18px]">more_horiz</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <DropdownMenuItem>{t('actions.view')}</DropdownMenuItem>
              {showEdit && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(storage)}>{t('actions.edit')}</DropdownMenuItem>
              )}
              {showArchive && onArchive && (
                <DropdownMenuItem onClick={() => onArchive(storage)}>{t('actions.archive')}</DropdownMenuItem>
              )}
              {showRestore && onRestore && (
                <DropdownMenuItem onClick={() => onRestore(storage)}>{t('actions.restore')}</DropdownMenuItem>
              )}
              {showDelete && onDelete && (
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(storage)}>
                  {t('actions.delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
