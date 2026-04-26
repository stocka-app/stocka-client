import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

// ─── Active-context treatment (H-03 / STOC-430) ──────────────────────────────
//
// When `isActiveContext === true` the card receives 3 visual signals that
// override the neutral state: (1) bg pastel del tipo, (2) ring 2px del color
// del tipo, (3) tag "Contexto actual" en la esquina superior derecha. The
// status dot (verde/azul/gris) is preserved unchanged — the type palette
// applies to the frame, not to the semantic state indicator.

const TYPE_BG_SUBTLE_CLASSES: Record<StorageType, string> = {
  WAREHOUSE: 'bg-inst-almacen-subtle',
  STORE_ROOM: 'bg-inst-bodega-subtle',
  CUSTOM_ROOM: 'bg-inst-custom-subtle',
};

const TYPE_RING_CLASSES: Record<StorageType, string> = {
  WAREHOUSE: 'ring-inst-almacen-accent',
  STORE_ROOM: 'ring-inst-bodega-accent',
  CUSTOM_ROOM: 'ring-inst-custom-accent',
};

const TYPE_TAG_BG_CLASSES: Record<StorageType, string> = {
  WAREHOUSE: 'bg-inst-almacen-accent',
  STORE_ROOM: 'bg-inst-bodega-accent',
  CUSTOM_ROOM: 'bg-inst-custom-accent',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface StorageCardProps {
  storage: Storage;
  /**
   * True when this storage is the user's active context (i.e.
   * `storage.uuid === activeStorageId` from the store). Applies the
   * "contexto actual" treatment: bg pastel + ring + tag + forces full
   * opacity even on archived/frozen storages so the active card is
   * always visually dominant in the grid.
   */
  isActiveContext?: boolean;
  /** RBAC: user has STORAGE_UPDATE permission */
  canEdit?: boolean;
  /** RBAC: user has STORAGE_ARCHIVE permission */
  canArchive?: boolean;
  /** RBAC: user has STORAGE_FREEZE permission */
  canFreeze?: boolean;
  /** RBAC: user has STORAGE_UNFREEZE permission */
  canUnfreeze?: boolean;
  /** RBAC: user has STORAGE_RESTORE permission (H-07) */
  canRestore?: boolean;
  /** RBAC: user has STORAGE_DELETE permission */
  canDelete?: boolean;
  /** True when the browser has no network connectivity. Restore is disabled (with a tooltip) while offline because the action requires a server round-trip and would otherwise fail silently from the user's perspective. */
  isOffline?: boolean;
  onView: (storage: Storage) => void;
  onEdit: (storage: Storage) => void;
  onFreeze: (storage: Storage) => void;
  onUnfreeze: (storage: Storage) => void;
  onArchive: (storage: Storage) => void;
  onRestore: (storage: Storage) => void;
  onDelete: (storage: Storage) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function StorageCard({
  storage,
  isActiveContext = false,
  canEdit = false,
  canFreeze = false,
  canUnfreeze = false,
  canArchive = false,
  canRestore = false,
  canDelete = false,
  isOffline = false,
  onView,
  onEdit,
  onFreeze,
  onUnfreeze,
  onArchive,
  onRestore,
  onDelete,
}: StorageCardProps): React.ReactElement {
  const { t } = useTranslation('storages');

  const isFrozen = storage.status === 'FROZEN';
  const isArchived = storage.status === 'ARCHIVED';
  const isCustomRoom = storage.type === 'CUSTOM_ROOM';

  // Menu item enabled state — always visible, conditionally disabled.
  // H-07: edit is allowed in ARCHIVED (E5.2 — metadata editable).
  const editDisabled = !canEdit;
  // H-05: FROZEN → ARCHIVED is allowed directly (no need to unfreeze first)
  const archiveDisabled = !canArchive || isArchived;
  const restoreDisabled = !canRestore || isOffline;
  // H-07: permanent delete is gated purely by RBAC (STORAGE_DELETE is granted
  // only to OWNER/PARTNER). The BE still returns 501 in Sprint 2, which the
  // DeleteStorageDialog surfaces via its 'not_implemented' banner — no extra
  // feature flag needed on top of the permission check.
  const deleteDisabled = !canDelete || !isArchived;

  // H-07: ARCHIVED cards dim content to 60% to signal "stopped" state. The
  // context menu is explicitly kept at 100% so archive actions (Restore,
  // Delete) stay fully interactive. FROZEN cards are NOT attenuated — color
  // differentiation alone carries the semantic (blue border / blue dot).
  const contentFadeClass = isArchived ? 'opacity-60' : '';

  return (
    <div
      className={cn(
        'flex min-h-[220px] overflow-hidden rounded-lg shadow-card transition-all',
        isActiveContext
          ? cn(
              'ring-2',
              !isCustomRoom && TYPE_BG_SUBTLE_CLASSES[storage.type],
              !isCustomRoom && TYPE_RING_CLASSES[storage.type],
            )
          : cn(
              'border border-border',
              isArchived
                ? 'bg-neutral-50'
                : isFrozen
                  ? 'border-blue-400/30 bg-surface-card'
                  : 'bg-surface-card',
            ),
      )}
      style={
        isActiveContext && isCustomRoom
          ? {
              backgroundColor: `${storage.color}20`,
              boxShadow: `0 0 0 2px ${storage.color}`,
            }
          : undefined
      }
    >
      {/* Left color bracket — faded with content on ARCHIVED (visual continuity) */}
      <div
        className={cn(
          'w-2.5 shrink-0',
          !isCustomRoom && TYPE_BRACKET_CLASSES[storage.type],
          contentFadeClass,
        )}
        style={isCustomRoom ? { backgroundColor: storage.color } : undefined}
        aria-hidden="true"
      />

      {/* Content body */}
      <div className="flex min-w-0 flex-1 flex-col p-4">
        {/* Main content — header + name + address — fades to 60% on ARCHIVED */}
        <div className={cn('flex flex-col', contentFadeClass)}>
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
              style={{
                fontVariationSettings: "'FILL' 1",
                ...(isCustomRoom ? { color: storage.color } : {}),
              }}
            >
              {isCustomRoom ? storage.icon : TYPE_ICON_NAME[storage.type]}
            </span>
          </div>

          {/* Right column — context tag (if active) stacked above badge + status dot */}
          <div className="flex flex-col items-end gap-1.5">
            {isActiveContext && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white',
                  !isCustomRoom && TYPE_TAG_BG_CLASSES[storage.type],
                )}
                style={isCustomRoom ? { backgroundColor: storage.color } : undefined}
              >
                {t('contextCurrent')}
              </span>
            )}
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
        </div>

        {/* Context menu — mt-auto pins footer to bottom when grid stretches this card.
            The footer itself is NOT faded on ARCHIVED; only the product-count label
            inherits the fade (wrapped below). The dropdown stays at 100% so
            Restaurar/Eliminar remain fully interactive. */}
        <div className="mt-auto flex items-center justify-between border-t border-border pt-2">
          <div className={cn('flex items-center gap-1.5', contentFadeClass)}>
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
            <DropdownMenuContent align="start" side="right" sideOffset={-24} alignOffset={32} className="min-w-[180px]">
              {/* Group 1 — Navigation / edit */}
              <DropdownMenuItem onClick={() => onView(storage)} className="group">
                <span className="material-symbols-outlined mr-2 text-[16px] transition-colors group-hover:text-info">
                  visibility
                </span>
                {t('actions.view')}
              </DropdownMenuItem>
              {/* H-07: Edit is now allowed in ARCHIVED (metadata editable per E5.2).
                  Type-change stays locked by the drawer's typeLocked gate. */}
              <DropdownMenuItem
                disabled={editDisabled}
                onClick={() => !editDisabled && onEdit(storage)}
                className="group"
              >
                <span className="material-symbols-outlined mr-2 text-[16px] transition-colors group-hover:text-brand">
                  edit
                </span>
                {t('actions.edit')}
              </DropdownMenuItem>

              {/* Divider — separates navigation from state-change actions (H-05 Pencil FASE 1) */}
              <DropdownMenuSeparator />

              {/* Group 2 — State-change actions */}
              {/* H-05: Congelar / Reactivar are mutually exclusive depending on status */}
              {!isFrozen && !isArchived && canFreeze && (
                <DropdownMenuItem
                  onClick={() => onFreeze(storage)}
                  className="group"
                >
                  <span className="material-symbols-outlined mr-2 text-[16px] transition-colors group-hover:text-info">
                    ac_unit
                  </span>
                  {t('actions.freeze', { defaultValue: 'Congelar' })}
                </DropdownMenuItem>
              )}
              {isFrozen && canUnfreeze && (
                <DropdownMenuItem
                  onClick={() => onUnfreeze(storage)}
                  className="group"
                >
                  <span className="material-symbols-outlined mr-2 text-[16px] transition-colors group-hover:text-success">
                    play_circle
                  </span>
                  {t('actions.unfreeze', { defaultValue: 'Reactivar' })}
                </DropdownMenuItem>
              )}
              {isArchived ? (
                <DropdownMenuItem
                  disabled={restoreDisabled}
                  onClick={() => !restoreDisabled && onRestore(storage)}
                  className={cn('group', isOffline && 'cursor-not-allowed opacity-40')}
                  title={
                    isOffline
                      ? t('tooltips.offline', { defaultValue: 'Sin conexión.' })
                      : undefined
                  }
                >
                  <span className="material-symbols-outlined mr-2 text-[16px] transition-colors group-hover:text-success">
                    settings_backup_restore
                  </span>
                  {t('actions.restore')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  disabled={archiveDisabled}
                  onClick={() => !archiveDisabled && onArchive(storage)}
                  className="group"
                >
                  <span className="material-symbols-outlined mr-2 text-[16px] transition-colors group-hover:text-warning">
                    inventory_2
                  </span>
                  {t('actions.archive')}
                </DropdownMenuItem>
              )}
              {isArchived && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={deleteDisabled}
                    onClick={() => !deleteDisabled && onDelete(storage)}
                    aria-label={t('permanentDelete.menuItemAriaLabel', { name: storage.name })}
                    className="group text-destructive focus:bg-destructive/10 focus:text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
                  >
                    <span className="material-symbols-outlined mr-2 text-[16px] text-destructive">
                      delete_forever
                    </span>
                    {t('permanentDelete.menuItem')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
