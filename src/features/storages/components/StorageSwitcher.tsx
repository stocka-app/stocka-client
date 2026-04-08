import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { useRBACStore } from '@/store/rbac.store';
import { storagesService } from '../api/storages.service';
import { useStoragesStore } from '../store/storages.store';
import type { Storage, StorageStatus, StorageType } from '../types/storages.types';

// ─── Visual mappings (shared pattern with StorageCard) ────────────────────────

const TYPE_ICON_NAME: Record<StorageType, string> = {
  WAREHOUSE: 'warehouse',
  STORE_ROOM: 'inventory_2',
  CUSTOM_ROOM: 'other_houses',
};

const TYPE_ICON_COLOR_CLASS: Record<StorageType, string> = {
  WAREHOUSE: 'text-inst-almacen-text',
  STORE_ROOM: 'text-inst-bodega-text',
  CUSTOM_ROOM: 'text-inst-custom-text',
};

const STATUS_DOT_CLASS: Record<StorageStatus, string> = {
  ACTIVE: 'bg-success',
  FROZEN: 'bg-blue-400',
  ARCHIVED: 'bg-neutral-400',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const byName = (a: Storage, b: Storage): number =>
  a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

const resolveIconName = (storage: Storage): string =>
  storage.type === 'CUSTOM_ROOM' ? storage.icon : TYPE_ICON_NAME[storage.type];

const resolveIconClass = (storage: Storage, isActive: boolean): string => {
  if (isActive) return 'text-brand';
  if (storage.type === 'CUSTOM_ROOM') return '';
  return TYPE_ICON_COLOR_CLASS[storage.type];
};

const resolveIconStyle = (
  storage: Storage,
  isActive: boolean,
): React.CSSProperties | undefined => {
  if (isActive) return undefined;
  if (storage.type === 'CUSTOM_ROOM') return { color: storage.color };
  return undefined;
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface StorageSwitcherProps {
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * StorageSwitcher — sidebar component for changing the active storage context.
 *
 * - Trigger: `[type icon · name · status dot · chevron]`
 *   Chevron is dynamic: `keyboard_arrow_right` when closed (pointing to where
 *   the dropdown will open) and `keyboard_arrow_left` when open.
 * - Dropdown: floating popover anchored to the RIGHT side of the trigger
 *   (`left-full top-0 ml-2`). Never opens below; never renders in-place inside
 *   the sidebar/drawer. On mobile the popover floats over the drawer overlay,
 *   anchored to the drawer's right edge.
 * - Lists ALL tenant storages (ACTIVE + FROZEN + ARCHIVED). Items use the
 *   `[icon · name]` ←→ `[dot]` layout with `justify-between`. Dots use the
 *   verde/azul/gris system (not Snowflake / Archive icons).
 * - The active-context item is position #0 and highlighted with
 *   `bg-neutral-100` + `font-semibold` + `text-brand` icon. The status dot is
 *   preserved on the active item — the highlight does not replace it.
 * - Sticky-bottom CTA "+ Crear nueva instalación" — visible only when the
 *   user has `STORAGE_CREATE`. Clicking it navigates to `/warehouse` (where
 *   the create drawer lives); deeper integration (auto-open drawer via query
 *   param) is deferred to AppLayout integration in Paso 8.
 *
 * Data source: the component does its OWN fetch via
 * `storagesService.list({ limit: 1000 })` on mount. This is intentionally
 * independent from the paginated fetch performed by `useStorages` inside
 * `StoragesPage`, because the switcher needs the full tenant list (all
 * pages, all statuses) while the page view is filter/search/paginated.
 */
export function StorageSwitcher({ className }: StorageSwitcherProps): React.ReactElement | null {
  const { t } = useTranslation('storages');
  const navigate = useNavigate();

  // ── Local data state (independent from StoragesPage's paginated hook) ─────
  const [switcherStorages, setSwitcherStorages] = useState<Storage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // ── Active context (direct store subscription — avoids pulling the full
  //    useStorages hook which would trigger a second fetch lifecycle) ───────
  const activeStorageId = useStoragesStore((state) => state.activeStorageId);
  const setActiveStorage = useStoragesStore((state) => state.setActiveStorage);

  // ── RBAC ──────────────────────────────────────────────────────────────────
  const canCreate = useRBACStore((state) => state.canDo('STORAGE_CREATE'));
  const hasReadAccess = useRBACStore((state) => state.canDo('STORAGE_READ'));

  // ── Container ref for click-outside detection ────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Fetch the full tenant storage list once on mount ─────────────────────
  useEffect(() => {
    if (!hasReadAccess) return;
    let cancelled = false;
    storagesService
      .list({ page: 1, limit: 1000, sortOrder: 'ASC' })
      .then((result) => {
        if (cancelled) return;
        setSwitcherStorages(result.items);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[StorageSwitcher] failed to fetch storages:', err);
        setIsLoading(false);
      });
    return (): void => {
      cancelled = true;
    };
  }, [hasReadAccess]);

  // ── Validate & auto-select active context once data arrives ──────────────
  //
  // If the persisted `activeStorageId` no longer matches any storage in the
  // tenant (deleted by another member, tenant switch, etc.), or if no id is
  // set yet, auto-select the first ACTIVE storage sorted A→Z. The `null` case
  // (no ACTIVE storages at all) is handled gracefully by the render below.
  useEffect(() => {
    if (isLoading) return;
    const exists =
      activeStorageId !== null && switcherStorages.some((s) => s.uuid === activeStorageId);
    if (exists) return;
    const firstActive = [...switcherStorages].filter((s) => s.status === 'ACTIVE').sort(byName)[0];
    setActiveStorage(firstActive?.uuid ?? null);
  }, [isLoading, switcherStorages, activeStorageId, setActiveStorage]);

  // ── Click outside → close dropdown ────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return (): void => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ── Escape key → close dropdown ───────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return (): void => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  // ── Derived: resolved active storage ─────────────────────────────────────
  const activeStorage = useMemo<Storage | null>(
    () =>
      activeStorageId !== null
        ? switcherStorages.find((s) => s.uuid === activeStorageId) ?? null
        : null,
    [activeStorageId, switcherStorages],
  );

  // ── Derived: sorted list (active context first, rest A→Z) ───────────────
  const sortedStorages = useMemo<Storage[]>(() => {
    if (activeStorageId === null) return [...switcherStorages].sort(byName);
    const active = switcherStorages.find((s) => s.uuid === activeStorageId);
    if (!active) return [...switcherStorages].sort(byName);
    const rest = switcherStorages.filter((s) => s.uuid !== activeStorageId).sort(byName);
    return [active, ...rest];
  }, [activeStorageId, switcherStorages]);

  // ── RBAC gate: user cannot read storages → do not render anything ────────
  if (!hasReadAccess) return null;

  // ── Skeleton loader ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn('relative', className)}>
        <div
          className="flex items-center gap-2 rounded-lg border border-border bg-surface-card px-3 py-2.5"
          aria-label={t('loader.loading')}
        >
          <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 flex-1 animate-pulse rounded bg-neutral-200" />
        </div>
      </div>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleToggle = (): void => setIsOpen((prev) => !prev);

  const handleSelect = (uuid: string): void => {
    setActiveStorage(uuid);
    setIsOpen(false);
  };

  const handleCreate = (): void => {
    setIsOpen(false);
    navigate('/warehouse');
  };

  const chevronIcon = isOpen ? 'keyboard_arrow_left' : 'keyboard_arrow_right';
  const chevronAriaLabel = isOpen
    ? t('switcher.chevronCloseAriaLabel')
    : t('switcher.chevronOpenAriaLabel');

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* ─── Trigger ─── */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('switcher.triggerAriaLabel')}
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border border-border bg-surface-card px-3 py-2.5',
          'transition-colors hover:bg-neutral-50',
          'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1',
        )}
      >
        {activeStorage ? (
          <>
            <span
              className={cn(
                'material-symbols-outlined shrink-0 text-[20px]',
                resolveIconClass(activeStorage, false),
              )}
              style={resolveIconStyle(activeStorage, false)}
              aria-hidden="true"
            >
              {resolveIconName(activeStorage)}
            </span>
            <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-neutral-900">
              {activeStorage.name}
            </span>
            <span
              className={cn(
                'h-2 w-2 shrink-0 rounded-full',
                STATUS_DOT_CLASS[activeStorage.status],
              )}
              role="img"
              aria-label={t(`statuses.${activeStorage.status}`)}
            />
          </>
        ) : (
          <span className="flex-1 truncate text-left text-sm text-neutral-500">
            {switcherStorages.length === 0
              ? t('switcher.noStorages')
              : t('switcher.triggerAriaLabel')}
          </span>
        )}
        <span
          className="material-symbols-outlined shrink-0 text-[18px] text-neutral-400"
          role="img"
          aria-label={chevronAriaLabel}
        >
          {chevronIcon}
        </span>
      </button>

      {/* ─── Dropdown popover — floats to the right of the trigger ─── */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={t('switcher.header')}
          className={cn(
            'absolute left-full top-0 z-50 ml-2 w-72',
            'flex flex-col overflow-hidden rounded-lg border border-border bg-surface-card shadow-lg',
          )}
        >
          {/* Sticky header */}
          <header
            className={cn(
              'sticky top-0 border-b border-border bg-surface-card px-4 py-3',
              'text-[11px] font-semibold uppercase tracking-wider text-neutral-500',
            )}
          >
            {t('switcher.header')}
          </header>

          {/* Scrollable items area */}
          {sortedStorages.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-neutral-500">
              {t('switcher.noStorages')}
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {sortedStorages.map((storage) => {
                const isActive = storage.uuid === activeStorageId;
                return (
                  <button
                    key={storage.uuid}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(storage.uuid)}
                    className={cn(
                      'flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors',
                      isActive
                        ? 'bg-neutral-100 font-semibold text-neutral-900'
                        : 'text-neutral-700 hover:bg-neutral-50',
                    )}
                  >
                    <span
                      className={cn(
                        'material-symbols-outlined shrink-0 text-[20px]',
                        resolveIconClass(storage, isActive),
                      )}
                      style={resolveIconStyle(storage, isActive)}
                      aria-hidden="true"
                    >
                      {resolveIconName(storage)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{storage.name}</span>
                    <span
                      className={cn(
                        'h-2 w-2 shrink-0 rounded-full',
                        STATUS_DOT_CLASS[storage.status],
                      )}
                      role="img"
                      aria-label={t(`statuses.${storage.status}`)}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Sticky-bottom CTA — RBAC gated */}
          {canCreate && (
            <button
              type="button"
              onClick={handleCreate}
              className={cn(
                'sticky bottom-0 flex items-center justify-center gap-1 border-t border-border bg-surface-card',
                'px-4 py-3 text-sm font-medium text-brand transition-colors hover:bg-neutral-50',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand',
              )}
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                add
              </span>
              {t('switcher.createNew')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
