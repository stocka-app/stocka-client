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

  // ── Local data state (independent fetch) ─────────────────────────────────
  const [tenantStorages, setTenantStorages] = useState<Storage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReactivating, setIsReactivating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // ── Active context from store (direct subscription) ──────────────────────
  const activeStorageId = useStoragesStore((state) => state.activeStorageId);
  const updateStorageInStore = useStoragesStore((state) => state.updateStorage);
  const hasReadAccess = useRBACStore((state) => state.canDo('STORAGE_READ'));

  // ── Fetch the tenant storage list once on mount ──────────────────────────
  useEffect(() => {
    if (!hasReadAccess) return;
    let cancelled = false;
    storagesService
      .list({ page: 1, limit: 100, sortOrder: 'ASC' })
      .then((result) => {
        if (cancelled) return;
        setTenantStorages(result.items);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[StorageStatusBanner] failed to fetch storages:', err);
        setIsLoading(false);
      });
    return (): void => {
      cancelled = true;
    };
  }, [hasReadAccess]);

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
        ? tenantStorages.find((s) => s.uuid === activeStorageId) ?? null
        : null,
    [activeStorageId, tenantStorages],
  );

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!hasReadAccess) return null;
  if (isLoading) return null;
  if (dismissed) return null;
  if (!activeStorage) return null;
  if (activeStorage.status === 'ACTIVE') return null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleReactivate = async (): Promise<void> => {
    if (isReactivating) return;
    setIsReactivating(true);
    try {
      const updated = await storagesService.restore(activeStorage.uuid);
      // Update local tenant list so the useMemo re-resolves to the new state
      setTenantStorages((prev) => prev.map((s) => (s.uuid === updated.uuid ? updated : s)));
      // Update the store so any other mounted consumer (StoragesPage grid,
      // StorageSwitcher dropdown) sees the updated state without a refetch
      updateStorageInStore(updated);
      toast.success(t('toast.restored', { name: updated.name }));
    } catch (err) {
      console.error('[StorageStatusBanner] restore failed:', err);
      toast.error(t('toast.restoreFailed'));
    } finally {
      setIsReactivating(false);
    }
  };

  const handleDismiss = (): void => {
    setDismissed(true);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const isFrozen = activeStorage.status === 'FROZEN';
  const bannerKey = isFrozen ? 'banners.frozen' : 'banners.archived';

  return (
    <aside
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 border-b px-4 py-2',
        isFrozen
          ? 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-100'
          : 'border-neutral-300 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
        className,
      )}
    >
      <div className="min-w-0 flex-1 text-sm">
        <Trans
          i18nKey={bannerKey}
          ns="storages"
          values={{ name: activeStorage.name }}
          components={{ strong: <strong className="font-semibold" /> }}
        />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleReactivate}
        disabled={isReactivating}
        className={cn(
          'shrink-0',
          isFrozen
            ? 'border-blue-400 text-blue-700 hover:bg-blue-100 dark:border-blue-500 dark:text-blue-200 dark:hover:bg-blue-900/40'
            : 'border-neutral-400 text-neutral-700 hover:bg-neutral-200 dark:border-neutral-500 dark:text-neutral-200 dark:hover:bg-neutral-700',
        )}
      >
        {t('banners.reactivate')}
      </Button>

      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('banners.close')}
        className={cn(
          'shrink-0 rounded p-1 transition-colors',
          'hover:bg-black/5 dark:hover:bg-white/10',
          'focus:outline-none focus:ring-2 focus:ring-brand',
        )}
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          close
        </span>
      </button>
    </aside>
  );
}
