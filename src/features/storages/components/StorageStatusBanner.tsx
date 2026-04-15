import { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { useRBACStore } from '@/store/rbac.store';
import { storagesService } from '../api/storages.service';
import { useStoragesStore } from '../store/storages.store';
import type { Storage } from '../types/storages.types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface StorageStatusBannerProps {
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * StorageStatusBanner — global notification banner for the active storage
 * context when it is in a non-operational state.
 *
 * Lives in `AppLayout` between the sidebar and the main content area. It
 * reacts to `activeStorage.status` and renders one of three states:
 *
 * - ACTIVE or null → returns null (no banner)
 * - FROZEN → blue banner ("La instalación está congelada...")
 * - ARCHIVED → gray banner ("La instalación está archivada...")
 *
 * CTA "Reactivar":
 * - Rendered as an outlined `Button` (not a link), per spec
 * - No `→` arrow in the text (the arrow was confusing because it pointed at
 *   the X close button in earlier designs)
 * - Calls `storagesService.restore` directly and updates both the local
 *   tenant list and the store's `storages` array so that any mounted
 *   consumer (e.g. `StoragesPage`) sees the updated state without a refetch
 * - Shows success/error toast via sonner
 *
 * X close button:
 * - `aria-label` from `banners.close` i18n key
 * - Local state `dismissed` — closes the banner for the current session only
 * - **Does NOT persist** — if the user reloads the app, the banner reappears
 *   when `activeStorage` is still FROZEN/ARCHIVED
 * - The `dismissed` state is reset whenever `activeStorageId` changes so
 *   that switching context to another non-operational storage re-shows the
 *   banner immediately
 *
 * Data source:
 * - Own fetch on mount via `storagesService.list({ limit: 100 })`
 * - The `limit: 100` matches the backend hard cap (`ListStoragesInDto`
 *   `@Max(100)`); anything higher is rejected with 400
 * - Same pattern as `StorageSwitcher` (intentionally self-contained so the
 *   banner works on any route of the protected shell, not only on
 *   `/warehouse` where `StoragesPage` is mounted)
 * - The fetch duplication with the switcher AND tenants with >100 storages
 *   are both tracked as technical debt item `[S]` — deferred until we
 *   decide on scroll infinito / prefetch on login / shared fetch
 */
export function StorageStatusBanner({ className }: StorageStatusBannerProps): React.ReactElement | null {
  const { t } = useTranslation('storages');

  // ── State ────────────────────────────────────────────────────────────────
  const [isReactivating, setIsReactivating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // ── Store subscriptions (no independent fetch — uses store data) ────────
  const activeStorageId = useStoragesStore((state) => state.activeStorageId);
  const storages = useStoragesStore((state) => state.storages);
  const isLoading = useStoragesStore((state) => state.isLoading);
  const updateStorageInStore = useStoragesStore((state) => state.updateStorage);
  const hasReadAccess = useRBACStore((state) => state.canDo('STORAGE_READ'));
  const canUnfreeze = useRBACStore((state) => state.canDo('STORAGE_UNFREEZE'));

  // ── Reset dismissed flag when active context changes ─────────────────────
  //
  // If the user dismisses the banner for storage A, then switches context to
  // storage B (which is also FROZEN/ARCHIVED), we want the banner to appear
  // again for the new context. Tying the reset to `activeStorageId` handles
  // this cleanly without persisting dismissals across sessions.
  useEffect(() => {
    setDismissed(false);
  }, [activeStorageId]);

  // ── Derived: resolved active storage ─────────────────────────────────────
  const activeStorage = useMemo<Storage | null>(
    () =>
      activeStorageId !== null
        ? storages.find((s) => s.uuid === activeStorageId) ?? null
        : null,
    [activeStorageId, storages],
  );

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!hasReadAccess) return null;
  if (isLoading) return null;
  if (dismissed) return null;
  if (!activeStorage) return null;
  if (activeStorage.status === 'ACTIVE') return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  // Idempotency is enforced by the `disabled={isReactivating}` attribute on
  // the button itself — a second click cannot reach this handler while a
  // restore is in flight.
  const handleReactivate = async (): Promise<void> => {
    setIsReactivating(true);
    try {
      if (isFrozen) {
        // H-05: FROZEN → ACTIVE uses the per-type /unfreeze endpoint
        await storagesService.unfreeze(activeStorage.uuid, activeStorage.type);
        // Refetch to get the updated storage from the server
        const result = await storagesService.list({ limit: 1, search: activeStorage.name });
        const updated = result.items.find((s) => s.uuid === activeStorage.uuid);
        if (updated) updateStorageInStore(updated);
        toast.success(t('toasts.reactivated', { name: activeStorage.name }));
      } else {
        // ARCHIVED → ACTIVE — H-07 per-type /restore endpoint
        const updated = await storagesService.restore(activeStorage.uuid, activeStorage.type);
        updateStorageInStore(updated);
        toast.success(t('toast.restored', { name: updated.name }));
      }
    } catch (err) {
      console.error('[StorageStatusBanner] reactivate failed:', err);
      toast.error(isFrozen ? t('toasts.errors.unfreezeFailed') : t('toast.restoreFailed'));
    } finally {
      setIsReactivating(false);
    }
  };

  const handleDismiss = (): void => {
    setDismissed(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  //
  // Tokens are sourced from the Stocka design system (`info` and `neutral`
  // semantic tokens), which auto-adapt between light and dark mode via CSS
  // vars in `globals.css`. Do NOT add `dark:` prefixes here — the scales are
  // already inverted in dark mode:
  //   FROZEN  → bg `info-bg`, fg `info`, border `info`
  //             (dark: rgba(96,165,250,0.12) bg + #60a5fa fg)
  //   ARCHIVED→ bg `neutral-100`, fg `neutral-600`, icon `neutral-500`,
  //             border `border` (dark: #1e293b bg + #cbd5e1 text + #94a3b8 icon)
  // Maps 1:1 to the Pencil spec `t7Jfg` (Fase 6 — Banners de contexto).
  const isFrozen = activeStorage.status === 'FROZEN';
  const bannerKey = isFrozen ? 'banners.frozen' : 'banners.archived';
  const bannerIconName = isFrozen ? 'ac_unit' : 'inventory_2';

  return (
    <aside
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 border-b px-6 py-3.5',
        isFrozen
          ? 'border-info bg-info-bg text-info'
          : 'border-border bg-neutral-100 text-neutral-600',
        className,
      )}
    >
      <span
        className={cn(
          'material-symbols-outlined shrink-0 text-[20px]',
          isFrozen ? 'text-info' : 'text-neutral-500',
        )}
        aria-hidden="true"
      >
        {bannerIconName}
      </span>

      <div className="min-w-0 flex-1 text-sm font-medium">
        <Trans
          i18nKey={bannerKey}
          ns="storages"
          values={{ name: activeStorage.name }}
          components={{ strong: <strong className="font-semibold" /> }}
        />
      </div>

      {/* H-05: CTA visible only for roles with the correct permission.
          FROZEN → canUnfreeze (STORAGE_UNFREEZE). ARCHIVED → always shown (existing behavior). */}
      {(isFrozen ? canUnfreeze : true) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReactivate}
          disabled={isReactivating}
          className={cn(
            'shrink-0 bg-transparent',
            isFrozen
              ? 'border-info text-info hover:bg-info/10 hover:text-info'
              : 'border-neutral-500 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-700',
          )}
        >
          {t('banners.reactivate')}
        </Button>
      )}

      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('banners.close')}
        className={cn(
          'shrink-0 rounded p-1 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand',
          isFrozen
            ? 'text-info hover:bg-info/10'
            : 'text-neutral-500 hover:bg-neutral-200',
        )}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          close
        </span>
      </button>
    </aside>
  );
}
