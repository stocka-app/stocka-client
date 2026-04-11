import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { useRBACStore } from '@/store/rbac.store';
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

// Section header i18n keys — one per storage type, rendered in the dropdown
// as a sticky `SECTION NAME` label above each group of items.
const SECTION_LABEL_KEY: Record<StorageType, string> = {
  WAREHOUSE: 'switcher.sections.warehouses',
  STORE_ROOM: 'switcher.sections.storeRooms',
  CUSTOM_ROOM: 'switcher.sections.customRooms',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const byName = (a: Storage, b: Storage): number =>
  a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });

const resolveIconName = (storage: Storage): string =>
  storage.type === 'CUSTOM_ROOM' ? storage.icon : TYPE_ICON_NAME[storage.type];

// Each storage type always renders with its own type color — regardless of
// whether the item is the active one in the dropdown. The active-item
// highlight comes exclusively from the row background + font weight.
//
// WARNING: do NOT re-introduce a `text-brand` override for active items.
// In light mode `--color-brand-primary` is `#3b82f6` (blue), which collides
// with the almacen accent and makes an active STORE_ROOM item look like a
// WAREHOUSE. The three type colors are the only allowed icon tints.
const resolveIconClass = (storage: Storage): string => {
  if (storage.type === 'CUSTOM_ROOM') return '';
  return TYPE_ICON_COLOR_CLASS[storage.type];
};

// All storage type icons render with the FILL axis set to 1 so that
// WAREHOUSE (`warehouse`), STORE_ROOM (`inventory_2`) and CUSTOM_ROOM
// (user-chosen) look consistently FILLED instead of a mix of outlined and
// filled. The Material Symbols Outlined font supports the FILL variation
// axis; setting `fontVariationSettings: "'FILL' 1"` swaps each glyph to
// its filled variant without changing the font family.
const ICON_FILL_STYLE: React.CSSProperties = { fontVariationSettings: "'FILL' 1" };

const resolveIconStyle = (storage: Storage): React.CSSProperties => {
  if (storage.type === 'CUSTOM_ROOM') return { ...ICON_FILL_STYLE, color: storage.color };
  return ICON_FILL_STYLE;
};

// ─── Props ───────────────────────────────────────────────────────────────────

interface StorageSwitcherProps {
  className?: string;
  /**
   * Whether the host sidebar is in its lg-collapsed state. When true the
   * trigger renders as a compact 40x40 square (icon + dot only, no name
   * or chevron) so it fits inside the 64px-wide sidebar. The md (tablet)
   * compact state is handled purely via Tailwind `md:` breakpoints and
   * does not depend on this prop.
   */
  isSidebarCollapsed?: boolean;
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
 *   user has `STORAGE_CREATE`. Clicking it navigates to `/storages` with
 *   router state `{ openCreateDrawer: true }` so `StoragesPage` auto-opens
 *   the create drawer on mount, then clears the state from history.
 *
 * Data source: reads directly from the Zustand storages store. The store
 * is populated by `useStorages` in `StoragesPage` or any other consumer.
 * This avoids duplicate fetches on page load.
 */
export function StorageSwitcher({
  className,
  isSidebarCollapsed = false,
}: StorageSwitcherProps): React.ReactElement | null {
  const { t } = useTranslation('storages');
  const navigate = useNavigate();

  // ── Store subscriptions (no independent fetch — uses store data) ─────────
  const switcherStorages = useStoragesStore((state) => state.storages);
  const isLoading = useStoragesStore((state) => state.isLoading);
  const activeStorageId = useStoragesStore((state) => state.activeStorageId);
  const setActiveStorage = useStoragesStore((state) => state.setActiveStorage);
  const [isOpen, setIsOpen] = useState(false);

  // ── RBAC ──────────────────────────────────────────────────────────────────
  const canCreate = useRBACStore((state) => state.canDo('STORAGE_CREATE'));
  const hasReadAccess = useRBACStore((state) => state.canDo('STORAGE_READ'));

  // ── Container ref for click-outside detection ────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);

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

  // ── Derived: storages grouped by type, each group A→Z ────────────────────
  //
  // The dropdown renders one section per storage type in the fixed order
  // WAREHOUSE → STORE_ROOM → CUSTOM_ROOM, matching the Pencil spec `rop68`
  // (Fase 2.3 "Tipos mixtos agrupados"). Section headers ("ALMACENES",
  // "BODEGAS", "ÁREAS PERSONALIZADAS") are rendered only for non-empty
  // groups. Within each group items are sorted A→Z by name; the active
  // item keeps its natural alphabetical position and is highlighted via the
  // row background + font weight (no "active first" reordering).
  const groupedStorages = useMemo<{ type: StorageType; items: Storage[] }[]>(() => {
    const buckets: Record<StorageType, Storage[]> = {
      WAREHOUSE: [],
      STORE_ROOM: [],
      CUSTOM_ROOM: [],
    };
    for (const storage of switcherStorages) buckets[storage.type].push(storage);
    const orderedTypes: StorageType[] = ['WAREHOUSE', 'STORE_ROOM', 'CUSTOM_ROOM'];
    return orderedTypes
      .map((type) => ({ type, items: buckets[type].sort(byName) }))
      .filter((group) => group.items.length > 0);
  }, [switcherStorages]);

  const totalItemsCount = switcherStorages.length;

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
    // Navigate to the storages list and signal the page (via router state)
    // to auto-open the create drawer on mount. StoragesPage reads
    // `location.state.openCreateDrawer`, opens the drawer, and immediately
    // clears the state via `navigate(pathname, { replace: true })` so a
    // reload or back-navigation does not re-trigger the drawer.
    navigate('/storages', { state: { openCreateDrawer: true } });
  };

  const chevronIcon = isOpen ? 'keyboard_arrow_left' : 'keyboard_arrow_right';
  const chevronAriaLabel = isOpen
    ? t('switcher.chevronCloseAriaLabel')
    : t('switcher.chevronOpenAriaLabel');

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* ─── Triggers ─── */}
      {/*
        Two separate buttons with opposite responsive visibility — avoids
        any ambiguity from conditional classes on individual child spans:

          - FULL trigger    [icon · name · dot · chevron]
              visible at: mobile drawer (<md) AND lg-expanded
          - COMPACT trigger [icon only]
              visible at: md (tablet) AND lg-collapsed

        Both share the same `handleToggle` and open the same popover. Only
        one is ever visually present at a given viewport, so no duplicate
        controls are perceived by the user.
      */}

      {/* FULL trigger */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('switcher.triggerAriaLabel')}
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center gap-2 rounded-lg border border-border bg-surface-card px-3 py-2.5 transition-colors',
          'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1',
          'md:hidden',
          isSidebarCollapsed ? 'lg:hidden' : 'lg:flex',
        )}
      >
        {activeStorage ? (
          <>
            <span
              className={cn(
                'material-symbols-outlined shrink-0 text-[20px]',
                resolveIconClass(activeStorage),
              )}
              style={resolveIconStyle(activeStorage)}
              aria-hidden="true"
            >
              {resolveIconName(activeStorage)}
            </span>
            <span className="min-w-0 flex-1 truncate text-left text-sm font-medium text-neutral-900">
              {activeStorage.name}
            </span>
            <span
              className={cn('h-2 w-2 shrink-0 rounded-full', STATUS_DOT_CLASS[activeStorage.status])}
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

      {/* COMPACT trigger — icon only, 40x40 square centered */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={
          activeStorage
            ? `${t('switcher.triggerAriaLabel')}: ${activeStorage.name}`
            : t('switcher.triggerAriaLabel')
        }
        title={activeStorage?.name}
        onClick={handleToggle}
        className={cn(
          'mx-auto hidden h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface-card transition-colors',
          'hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1',
          'md:flex',
          isSidebarCollapsed ? 'lg:flex' : 'lg:hidden',
        )}
      >
        {activeStorage ? (
          <span
            className={cn(
              'material-symbols-outlined shrink-0 text-[20px]',
              resolveIconClass(activeStorage),
            )}
            style={resolveIconStyle(activeStorage)}
            aria-hidden="true"
          >
            {resolveIconName(activeStorage)}
          </span>
        ) : (
          <span
            className="material-symbols-outlined shrink-0 text-[20px] text-neutral-400"
            aria-hidden="true"
          >
            warehouse
          </span>
        )}
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

          {/* Scrollable items area — grouped by type per Pencil spec rop68 */}
          {totalItemsCount === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-neutral-500">
              {t('switcher.noStorages')}
            </div>
          ) : (
            // `relative` wrapper hosts the scroll area plus the gradient fade
            // overlay (Pencil spec 2.4 "Con scroll"). The fade is an absolutely
            // positioned, pointer-events-none div pinned to the bottom of the
            // wrapper — it sits over the last ~56px of visible scroll content
            // so the user perceives there is more to scroll. The gradient ends
            // in `surface-card` which auto-adapts to light/dark via CSS vars.
            <div className="relative">
              <div className="max-h-80 overflow-y-auto">
                {groupedStorages.map((group) => (
                <section key={group.type} aria-label={t(SECTION_LABEL_KEY[group.type])}>
                  <header
                    className={cn(
                      'px-4 pt-3 pb-1',
                      'text-[10px] font-semibold uppercase tracking-wider text-neutral-400',
                    )}
                  >
                    {t(SECTION_LABEL_KEY[group.type])}
                  </header>
                  {group.items.map((storage) => {
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
                          // Active row uses `neutral-200` and hover uses
                          // `neutral-100` so the two states progressively
                          // darken in light mode and progressively brighten
                          // in dark mode (the neutral scale is inverted in
                          // dark). `neutral-100` alone for active was too
                          // close to `surface-card` in dark mode and looked
                          // less prominent than the hover state.
                          isActive
                            ? 'bg-neutral-200 font-semibold text-neutral-900'
                            : 'text-neutral-700 hover:bg-neutral-100',
                        )}
                      >
                        <span
                          className={cn(
                            'material-symbols-outlined shrink-0 text-[20px]',
                            resolveIconClass(storage),
                          )}
                          style={resolveIconStyle(storage)}
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
                </section>
                ))}
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-transparent to-surface-card"
              />
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
