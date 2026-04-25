import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { StateComposition } from '@/shared/components/StateComposition';
import { DoubleRingSpinner } from '@/shared/components/DoubleRingSpinner';
import { ProgressBar } from '@/shared/components/ProgressBar';
import { useRBACStore } from '@/store/rbac.store';
import { useTierCapabilities, STORAGE_TYPE_TO_FEATURE } from '@/shared/hooks/useTierCapabilities';
import { TierUpgradeState } from '@/shared/components/TierUpgradeState';
import { OfflineBanner } from '@/shared/components/OfflineBanner';
import { showUndoToast } from '../components/UndoToast';
import { showUndoCompletedToast } from '../components/UndoCompletedToast';
import { ArchivedStoragesFilter } from '../components/ArchivedStoragesFilter';
import { StorageDetailPanel } from '../components/StorageDetailPanel';
import { useStorages } from '../hooks/useStorages';
import { selectFallbackStorage } from '../utils/select-fallback-storage';
import type { Storage, StorageType } from '../types/storages.types';
import { StorageCard } from '../components/StorageCard';
import { CreateStorageDrawer } from '../components/CreateStorageDrawer';
import { EditStorageDrawer } from '../components/EditStorageDrawer';
import { ArchiveConfirmDialog } from '../components/ArchiveConfirmDialog';
import { DeleteStorageDialog } from '../components/DeleteStorageDialog';
import { FreezeConfirmDialog } from '../components/FreezeConfirmDialog';
import type { EditStoragePayload, PermanentDeleteError } from '../hooks/useStorages';

// ─── Type tab configuration ─────────────────────────────────────────────────

interface TypeTab {
  key: StorageType | null;
  labelKey: string;
}

const TYPE_TABS: TypeTab[] = [
  { key: null, labelKey: 'tabs.all' },
  { key: 'WAREHOUSE', labelKey: 'tabs.warehouses' },
  { key: 'STORE_ROOM', labelKey: 'tabs.storeRooms' },
  { key: 'CUSTOM_ROOM', labelKey: 'tabs.customRooms' },
];

// ─── Skeleton widths for natural variation ──────────────────────────────────

const SKEL_TITLE = ['w-40', 'w-32', 'w-36', 'w-44', 'w-28', 'w-48'];
const SKEL_ADDR = ['w-52', 'w-44', 'w-48', 'w-40', 'w-56', 'w-36'];
const SKEL_BADGE1 = ['w-14', 'w-12', 'w-16', 'w-14', 'w-18', 'w-12'];
const SKEL_BADGE2 = ['w-11', 'w-13', 'w-10', 'w-12', 'w-11', 'w-14'];

// ═════════════════════════════════════════════════════════════════════════════
// StoragesPage
// ═════════════════════════════════════════════════════════════════════════════

export default function StoragesPage(): React.ReactElement {
  const { t } = useTranslation('storages');
  const { canDo, tier } = useRBACStore();
  const { storageLimits, isAllowed, openUpgradeModal } = useTierCapabilities();
  const {
    storages,
    sortedStorages,
    activeStorageId,
    summary,
    typeCounts,
    total,
    page,
    totalPages,
    isLoading,
    error,
    filterStatus,
    filterType,
    searchQuery,
    sortOrder,
    isGated,
    isOffline,
    setFilterStatus,
    setFilterType,
    setSearchQuery,
    setSortOrder,
    setPage,
    canCreate,
    fetchStorages,
    createWarehouse,
    createStoreRoom,
    createCustomRoom,
    editStorage,
    changeStorageType,
    archiveStorage,
    restoreStorage,
    deleteStoragePermanent,
    freezeStorage,
    unfreezeStorage,
    getIsLastActive,
    canFreeze,
    canUnfreeze,
    setActiveStorage,
  } = useStorages();

  const location = useLocation();
  const navigate = useNavigate();
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailStorage, setDetailStorage] = useState<Storage | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  // H-07: freeze the source status the moment the dialog opens so variant 2.4
  // (From FROZEN) stays stable even if the storage mutates mid-dialog.
  const [archiveSourceStatus, setArchiveSourceStatus] = useState<'ACTIVE' | 'FROZEN'>('ACTIVE');
  const [isFreezeOpen, setIsFreezeOpen] = useState(false);
  const [isFreezeLoading, setIsFreezeLoading] = useState(false);
  const [freezeError, setFreezeError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<PermanentDeleteError | null>(null);

  // ── Auto-open create drawer when navigated from the sidebar StorageSwitcher
  //
  // The sidebar StorageSwitcher's "+ Crear nueva instalación" CTA navigates
  // here with router state `{ openCreateDrawer: true }`. We react to that
  // state change and open the drawer, then clear the history state via a
  // replace-navigation so a reload or back-navigation does not re-trigger
  // the drawer. This must be an effect (not a `useState` lazy initializer)
  // because the user may ALREADY be on `/storages` when they click the CTA
  // — in that case the page does not remount and the lazy init never reruns.
  useEffect(() => {
    const state = location.state as { openCreateDrawer?: boolean } | null;
    if (state?.openCreateDrawer && canDo('STORAGE_CREATE')) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: react to external navigation signal, see comment above.
      setIsCreateDrawerOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, canDo, navigate]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCreateClick = (): void => {
    setIsCreateDrawerOpen(true);
  };

  const handleViewClick = (storage: Storage): void => {
    setDetailStorage(storage);
    setIsDetailOpen(true);
  };

  const handleDetailClose = (): void => {
    setIsDetailOpen(false);
  };

  const handleEditClick = (storage: Storage): void => {
    setSelectedStorage(storage);
    setIsEditOpen(true);
  };

  const handleFreezeClick = (storage: Storage): void => {
    setSelectedStorage(storage);
    setFreezeError(null);
    setIsFreezeOpen(true);
  };

  const handleFreezeConfirm = async (): Promise<void> => {
    if (!selectedStorage) return;
    setIsFreezeLoading(true);
    setFreezeError(null);
    const ok = await freezeStorage(selectedStorage.uuid);
    setIsFreezeLoading(false);
    if (ok) {
      const snapshot = selectedStorage;
      setIsFreezeOpen(false);
      showUndoToast({
        storageName: snapshot.name,
        action: 'freeze',
        onUndo: async () => {
          const undone = await unfreezeStorage(snapshot.uuid);
          if (undone) {
            showUndoCompletedToast({ storageName: snapshot.name, action: 'freeze' });
          } else {
            toast.error(t('toasts.errors.unfreezeFailed'));
          }
        },
      });
    } else {
      setFreezeError('server_error');
    }
  };

  const handleFreezeClose = (): void => {
    if (!isFreezeLoading) {
      setIsFreezeOpen(false);
      setFreezeError(null);
    }
  };

  const handleUnfreezeClick = async (storage: Storage): Promise<void> => {
    const ok = await unfreezeStorage(storage.uuid);
    if (ok) {
      toast.success(t('toasts.reactivated', { name: storage.name }));
    } else {
      toast.error(t('toasts.errors.unfreezeFailed'));
    }
  };

  const handleArchiveClick = (storage: Storage): void => {
    setSelectedStorage(storage);
    setArchiveError(null);
    setArchiveSourceStatus(storage.status === 'FROZEN' ? 'FROZEN' : 'ACTIVE');
    setIsArchiveOpen(true);
  };

  const handleRestoreClick = async (storage: Storage): Promise<void> => {
    const result = await restoreStorage(storage.uuid);
    if (result.error === null) {
      toast.success(t('toast.restored', { name: storage.name }));
      return;
    }
    if (result.error === 'tier_limit') {
      toast.error(t('toast.restoreTierLimit', { defaultValue: 'No puedes restaurar: el plan actual no soporta más espacios de este tipo.' }));
      return;
    }
    if (result.error === 'offline') {
      toast.error(t('toast.restoreOffline', { defaultValue: 'Sin conexión. Intenta de nuevo cuando recuperes red.' }));
      return;
    }
    toast.error(t('toast.restoreFailed'));
  };

  const handleEdit = async (
    id: string,
    type: StorageType,
    payload: EditStoragePayload,
    targetType?: StorageType,
  ): Promise<ReturnType<typeof editStorage> extends Promise<infer R> ? R : never> => {
    const result = await editStorage(id, type, payload, targetType);
    if (result.error === null) {
      toast.success(t('editDrawer.toast.success'));
    }
    return result;
  };

  const handleChangeType = async (
    id: string,
    targetType: StorageType,
  ): Promise<{ error: 'archived' | 'frozen' | 'tier_limit' | 'address_required' | 'server_error' | null }> => {
    const result = await changeStorageType(id, targetType);
    if (result.error === null) {
      toast.success(t('editDrawer.toast.success'));
    }
    return result;
  };

  const handleArchiveConfirm = async (): Promise<void> => {
    if (!selectedStorage) return;
    setIsArchiveLoading(true);
    setArchiveError(null);
    const ok = await archiveStorage(selectedStorage.uuid);
    setIsArchiveLoading(false);
    if (ok) {
      const snapshot = selectedStorage;
      setIsArchiveOpen(false);
      showUndoToast({
        storageName: snapshot.name,
        action: 'archive',
        onUndo: async () => {
          const result = await restoreStorage(snapshot.uuid);
          if (result.error === null) {
            showUndoCompletedToast({ storageName: snapshot.name, action: 'archive' });
          } else if (result.error === 'tier_limit') {
            toast.error(
              t('toast.restoreTierLimit', {
                defaultValue:
                  'No puedes restaurar: el plan actual no soporta más espacios de este tipo.',
              }),
            );
          } else if (result.error === 'offline') {
            toast.error(
              t('toast.restoreOffline', {
                defaultValue: 'Sin conexión. Intenta de nuevo cuando recuperes red.',
              }),
            );
          } else {
            toast.error(t('toast.restoreFailed'));
          }
        },
      });
    } else {
      setArchiveError('server_error');
    }
  };

  const handleArchiveClose = (): void => {
    if (!isArchiveLoading) {
      setIsArchiveOpen(false);
      setArchiveError(null);
    }
  };

  const handleDeleteClick = (storage: Storage): void => {
    setSelectedStorage(storage);
    setDeleteError(null);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    if (!selectedStorage) return;
    const deletedSnapshot = selectedStorage;
    const wasContextActive = deletedSnapshot.uuid === activeStorageId;

    setIsDeleteLoading(true);
    setDeleteError(null);
    const { error } = await deleteStoragePermanent(deletedSnapshot.uuid);
    setIsDeleteLoading(false);

    if (error !== null) {
      setDeleteError(error);
      return;
    }

    setIsDeleteOpen(false);
    toast.success(t('permanentDelete.toast.success', { name: deletedSnapshot.name }));

    if (!wasContextActive) return;

    // Active context was deleted — pick a fallback (oldest ACTIVE → FROZEN → ARCHIVED)
    // and notify the user with a secondary info toast 300ms later so the two
    // messages read sequentially instead of stacking.
    const remaining = storages.filter((s) => s.uuid !== deletedSnapshot.uuid);
    const fallback = selectFallbackStorage(remaining, {
      priorityOrder: ['ACTIVE', 'FROZEN', 'ARCHIVED'],
      sortBy: 'createdAt',
      direction: 'asc',
    });

    setActiveStorage(fallback?.uuid ?? null);

    if (fallback !== null) {
      setTimeout(() => {
        toast.info(t('permanentDelete.toast.contextChanged', { name: fallback.name }));
      }, 300);
    }
  };

  const handleDeleteClose = (): void => {
    if (!isDeleteLoading) {
      setIsDeleteOpen(false);
      setDeleteError(null);
    }
  };

  const handleUpgrade = (): void => {
    /* c8 ignore next */
    openUpgradeModal('FEATURE_NOT_IN_TIER', filterType ?? 'WAREHOUSE');
  };

  const isAtTypeLimit = (type: StorageType): boolean => {
    const limit = storageLimits[type];
    if (limit === -1) return false;
    return typeCounts[type] >= limit;
  };

  // True when at least one storage type is allowed by the current tier AND has remaining quota.
  // Used to hide the inline create card in the "All" tab when every type is locked or full.
  const canCreateAny = (['WAREHOUSE', 'STORE_ROOM', 'CUSTOM_ROOM'] as StorageType[]).some(
    (type) => isAllowed(STORAGE_TYPE_TO_FEATURE[type]) && !isAtTypeLimit(type),
  );

  const handleClearFilters = (): void => {
    setFilterStatus(null);
    setFilterType(null);
    setSearchQuery('');
  };

  // ── Derived state ─────────────────────────────────────────────────────

  const isFiltered = filterStatus !== null || filterType !== null || searchQuery !== '';
  // True when the user only clicked a type tab — no status filter or search applied.
  // In this case the empty state should read "No tienes X aún", not "tu filtro no encontró nada".
  const isTypeTabOnly = filterType !== null && filterStatus === null && searchQuery === '';
  const hasStorages = storages.length > 0;

  // Track whether we ever received data. Once true, stays true for the
  // lifetime of this component so that subsequent loads (filter, search,
  // pagination) always show the spinner overlay instead of the skeleton.
  // This is sticky derived state — there is no external system to subscribe
  // to; the flag latches once data arrives and must survive subsequent loads
  // where `storages` may temporarily be empty while fetching.
  const [hadData, setHadData] = useState(false);
  useEffect(() => {
    if (!hadData && !isLoading && (hasStorages || total > 0)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional sticky flag, see comment above.
      setHadData(true);
    }
  }, [hadData, isLoading, hasStorages, total]);

  // ── Modals (always mounted) ───────────────────────────────────────────

  const modals = (
    <>
      {/* Create flow — new drawer */}
      <CreateStorageDrawer
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        typeCounts={typeCounts}
        limits={storageLimits}
        tier={tier ?? 'FREE'}
        onCreateWarehouse={createWarehouse}
        onCreateStoreRoom={createStoreRoom}
        onCreateCustomRoom={createCustomRoom}
      />
      {/* Detail panel — opened from clicking on a card */}
      <StorageDetailPanel
        open={isDetailOpen}
        storage={detailStorage}
        canUpdate={canDo('STORAGE_UPDATE')}
        canUnfreeze={canUnfreeze}
        canRestore={canDo('STORAGE_RESTORE')}
        canDelete={canDo('STORAGE_DELETE')}
        isOffline={isOffline}
        onClose={handleDetailClose}
        onEdit={(s) => {
          handleDetailClose();
          handleEditClick(s);
        }}
        onReactivate={(s) => {
          handleDetailClose();
          void handleUnfreezeClick(s);
        }}
        onRestore={(s) => {
          handleDetailClose();
          void handleRestoreClick(s);
        }}
        onDelete={(s) => {
          handleDetailClose();
          handleDeleteClick(s);
        }}
      />
      {/* Edit flow — drawer */}
      <EditStorageDrawer
        open={isEditOpen}
        storage={selectedStorage}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedStorage(null);
        }}
        onEdit={handleEdit}
        onChangeType={handleChangeType}
        limits={storageLimits}
        typeCounts={typeCounts}
        tier={tier ?? 'FREE'}
      />
      <ArchiveConfirmDialog
        open={isArchiveOpen}
        storage={selectedStorage}
        sourceStatus={archiveSourceStatus}
        isContextActive={selectedStorage?.uuid === activeStorageId}
        isLastActive={selectedStorage ? getIsLastActive(selectedStorage.uuid) : false}
        isLoading={isArchiveLoading}
        serverError={archiveError}
        onClose={handleArchiveClose}
        onConfirm={handleArchiveConfirm}
      />

      <FreezeConfirmDialog
        open={isFreezeOpen}
        storage={selectedStorage}
        isContextActive={selectedStorage?.uuid === activeStorageId}
        isLastActive={selectedStorage ? getIsLastActive(selectedStorage.uuid) : false}
        isLoading={isFreezeLoading}
        serverError={freezeError}
        onClose={handleFreezeClose}
        onConfirm={handleFreezeConfirm}
      />

      <DeleteStorageDialog
        open={isDeleteOpen}
        storage={selectedStorage}
        isLoading={isDeleteLoading}
        serverError={deleteError}
        onClose={handleDeleteClose}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );

  // ══════════════════════════════════════════════════════════════════════
  // STATE 1: SKELETON (first load)
  // ══════════════════════════════════════════════════════════════════════

  if (isLoading && !hadData) {
    return (
      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <ProgressBar className="absolute left-0 right-0 top-0" />

        {/* Header skeleton */}
        <div className="mb-5 flex flex-col gap-4 pt-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="h-7 w-44 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-neutral-200" />
          </div>
          <div className="h-10 w-40 animate-pulse rounded-lg bg-neutral-200" />
        </div>

        {/* Tabs skeleton */}
        <div className="mb-5 flex flex-wrap gap-2 overflow-x-auto">
          <div className="h-9 w-20 animate-pulse rounded-full bg-neutral-200" />
          <div className="h-9 w-28 animate-pulse rounded-full bg-neutral-100" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-neutral-100" />
          <div className="h-9 w-40 animate-pulse rounded-full bg-neutral-100" />
        </div>

        {/* Stats bar skeleton */}
        <div className="mb-5 flex items-center gap-4 overflow-x-auto rounded-lg border border-border bg-surface-card px-4 py-3 sm:gap-6">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-neutral-200" />
            <div className="h-5 w-7 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="hidden sm:block"><div className="h-6 w-px bg-border" /></div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-neutral-200" />
            <div className="h-5 w-7 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="hidden sm:block"><div className="h-6 w-px bg-border" /></div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-40 animate-pulse rounded bg-neutral-100" />
          </div>
        </div>

        {/* Search skeleton */}
        <div className="mb-5 flex gap-3">
          <div className="h-10 flex-1 animate-pulse rounded-lg border border-border bg-surface-card" />
          <div className="h-10 w-20 animate-pulse rounded-lg border border-border bg-surface-card" />
        </div>

        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex min-h-[220px] overflow-hidden rounded-lg border border-border bg-surface-card shadow-card">
              <div className="w-2.5 shrink-0 animate-pulse bg-neutral-200" />
              <div className="flex min-w-0 flex-1 flex-col gap-4 p-5">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 animate-pulse rounded-2xl bg-neutral-100" />
                  <div className="flex flex-col items-end gap-1.5">
                    <div className={cn('h-5 animate-pulse rounded-full bg-neutral-100', SKEL_BADGE1[i])} />
                    <div className={cn('h-5 animate-pulse rounded-full bg-neutral-200', SKEL_BADGE2[i])} />
                  </div>
                </div>
                <div className={cn('h-5 animate-pulse rounded bg-neutral-200', SKEL_TITLE[i])} />
                <div className={cn('h-3 animate-pulse rounded bg-neutral-100', SKEL_ADDR[i])} />
                <div className="border-t border-neutral-100 pt-3">
                  <div className="flex justify-between">
                    <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
                    <div className="h-3 w-14 animate-pulse rounded bg-neutral-100" />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {/* Skeleton create card */}
          <div className="flex min-h-[220px] items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 p-8">
            <div className="flex flex-col items-center gap-2.5">
              <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STATE 3: ERROR
  // ══════════════════════════════════════════════════════════════════════

  if (!isLoading && error !== null) {
    return (
      <div className="mx-auto flex max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-neutral-900">{t('page.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('page.subtitle')}</p>
        </div>
        {/* Tabs */}
        <div className="mb-4 flex flex-wrap gap-2 overflow-x-auto">
          {TYPE_TABS.map((tab) => (
            <span key={tab.key ?? 'all'} className="rounded-full px-4 py-2 text-sm font-medium text-neutral-500">
              {t(tab.labelKey)}
            </span>
          ))}
        </div>
        {/* Error state */}
        <div className="flex flex-1 items-center justify-center">
          <StateComposition
            icon="cloud_off"
            variant="danger"
            title={t('error.title')}
            description={t('error.description')}
            actions={
              <>
                <Button type="button" onClick={fetchStorages} className="gap-2 bg-danger text-white hover:bg-danger/90">
                  <span className="material-symbols-outlined text-[20px]">refresh</span>
                  {t('error.retry')}
                </Button>
                <Button type="button" variant="outline" className="gap-2">
                  <span className="material-symbols-outlined text-[20px]">help</span>
                  {t('error.getHelp')}
                </Button>
              </>
            }
            cards={[
              { icon: 'wifi_off', iconColor: 'text-danger', title: t('error.troubleshooting.connection'), description: t('error.troubleshooting.connectionDesc') },
              { icon: 'update', iconColor: 'text-warning', title: t('error.troubleshooting.refresh'), description: t('error.troubleshooting.refreshDesc') },
              { icon: 'support_agent', iconColor: 'text-brand', title: t('error.troubleshooting.support'), description: t('error.troubleshooting.supportDesc') },
            ]}
          />
        </div>
        {modals}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STATE 4: EMPTY (no storages ever)
  // ══════════════════════════════════════════════════════════════════════

  if (!isLoading && error === null && total === 0 && !isFiltered) {
    return (
      <div className="mx-auto flex max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-neutral-900">{t('page.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('page.subtitle')}</p>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <StateComposition
            icon="warehouse"
            variant="neutral"
            title={t('empty.title')}
            description={t('empty.description')}
            actions={
              <>
                {canCreate && (
                  <Button type="button" onClick={handleCreateClick} className="gap-2 bg-brand text-white hover:bg-brand-hover">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    {t('empty.createFirst')}
                  </Button>
                )}
                <button type="button" className="text-sm font-medium text-brand hover:underline">
                  {t('empty.whatIsStorage')}
                </button>
              </>
            }
            cards={[
              { icon: 'hub', iconColor: 'text-brand', title: t('empty.valueCards.centralization'), description: t('empty.valueCards.centralizationDesc') },
              { icon: 'speed', iconColor: 'text-brand', title: t('empty.valueCards.optimization'), description: t('empty.valueCards.optimizationDesc') },
              { icon: 'shield_person', iconColor: 'text-brand', title: t('empty.valueCards.rolesPermissions'), description: t('empty.valueCards.rolesPermissionsDesc') },
            ]}
          />
        </div>
        {modals}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STATE 5: NO RESULTS (filtered empty)
  // ══════════════════════════════════════════════════════════════════════

  if (!isLoading && error === null && !hasStorages && isFiltered) {
    return (
      <div className="mx-auto flex max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-neutral-900">{t('page.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('page.subtitle')}</p>
        </div>
        {/* Tabs */}
        <div className="mb-4 flex flex-wrap gap-2 overflow-x-auto">
          {TYPE_TABS.map((tab) => {
            const isActive = filterType === tab.key;
            const isLocked = tab.key !== null && !isAllowed(STORAGE_TYPE_TO_FEATURE[tab.key]);
            return (
              <button
                key={tab.key ?? 'all'}
                type="button"
                onClick={() => setFilterType(tab.key)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand text-white' : 'text-neutral-500 hover:bg-neutral-100',
                )}
              >
                {t(tab.labelKey)} ({tab.key === null ? typeCounts.total : typeCounts[tab.key]})
                {isLocked && (
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                    lock
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <StatsBar activeCount={summary.active} frozenCount={summary.frozen} archivedCount={summary.archived} />
        <ArchivedStoragesFilter
          value={filterStatus}
          summary={summary}
          canRestore={canDo('STORAGE_RESTORE')}
          onChange={setFilterStatus}
        />
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          disabled={isGated}
        />

        {isGated && filterType !== null ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <TierUpgradeState
              feature={t(`types.${filterType}`)}
              onUpgrade={() => openUpgradeModal('FEATURE_NOT_IN_TIER', filterType)}
              onBack={() => setFilterType(null)}
            />
          </div>
        ) : /* istanbul ignore next -- TRANSIENT: loading state completes <100ms with real BE */
        filterStatus === 'ARCHIVED' && summary.archived === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <StateComposition
              icon="inventory_2"
              variant="neutral"
              title={t('empty.archived.title', { defaultValue: 'No tienes instalaciones archivadas' })}
              description={t('empty.archived.description', {
                defaultValue:
                  'Cuando archives una instalación aparecerá aquí y podrás restaurarla en cualquier momento.',
              })}
              actions={
                <Button
                  type="button"
                  onClick={() => setFilterStatus('ACTIVE')}
                  className="gap-2 bg-brand text-white hover:bg-brand-hover"
                >
                  <span className="material-symbols-outlined text-[20px]">visibility</span>
                  {t('empty.archived.viewActive', { defaultValue: 'Ver activas' })}
                </Button>
              }
            />
          </div>
        ) : isTypeTabOnly ? (
          <div className="flex flex-1 items-center justify-center">
            <StateComposition
              icon={filterType === 'WAREHOUSE' ? 'warehouse' : filterType === 'STORE_ROOM' ? 'inventory_2' : 'palette'}
              variant="neutral"
              title={t('empty.noTypeResults', { type: t(`tabs.${filterType === 'WAREHOUSE' ? 'warehouses' : filterType === 'STORE_ROOM' ? 'storeRooms' : 'customRooms'}`) })}
              description={t('empty.noTypeResultsSubtitle', { type: t(`tabs.${filterType === 'WAREHOUSE' ? 'warehouses' : filterType === 'STORE_ROOM' ? 'storeRooms' : 'customRooms'}`) })}
              actions={
                canCreate && (
                  <Button type="button" onClick={handleCreateClick} className="gap-2 bg-brand text-white hover:bg-brand-hover">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    {t('actions.create')}
                  </Button>
                )
              }
              cards={[
                { icon: 'hub', iconColor: 'text-brand', title: t('empty.valueCards.centralization'), description: t('empty.valueCards.centralizationDesc') },
                { icon: 'speed', iconColor: 'text-brand', title: t('empty.valueCards.optimization'), description: t('empty.valueCards.optimizationDesc') },
                { icon: 'shield_person', iconColor: 'text-brand', title: t('empty.valueCards.rolesPermissions'), description: t('empty.valueCards.rolesPermissionsDesc') },
              ]}
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <StateComposition
              icon="search_off"
              variant="search"
              title={searchQuery !== '' ? t('empty.noResults') : t('empty.noFilterResults')}
              description={searchQuery !== '' ? t('empty.noResultsSubtitle') : t('empty.noFilterResultsSubtitle')}
              actions={
                <>
                  <Button type="button" onClick={handleClearFilters} className="gap-2 bg-brand text-white hover:bg-brand-hover">
                    <span className="material-symbols-outlined text-[20px]">backspace</span>
                    {t('empty.clearSearch')}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClearFilters} className="gap-2">
                    <span className="material-symbols-outlined text-[20px]">grid_view</span>
                    {t('empty.viewAll')}
                  </Button>
                </>
              }
              cards={[
                { icon: 'spellcheck', iconColor: 'text-brand', title: t('empty.suggestionCards.checkSpelling'), description: t('empty.suggestionCards.checkSpellingDesc') },
                { icon: 'filter_alt', iconColor: 'text-warning', title: t('empty.suggestionCards.adjustFilters'), description: t('empty.suggestionCards.adjustFiltersDesc') },
                { icon: 'add_circle', iconColor: 'text-success', title: t('empty.suggestionCards.createNew'), description: t('empty.suggestionCards.createNewDesc') },
              ]}
            />
          </div>
        )}
        {modals}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STATE 6: SUCCESS + STATE 2: LOADER overlay
  // ══════════════════════════════════════════════════════════════════════

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <OfflineBanner className="mb-4" />

      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('page.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('page.subtitle')}</p>
        </div>
        {canCreate && !isGated && (
          <Button type="button" onClick={handleCreateClick} className="gap-2 bg-brand text-white hover:bg-brand-hover">
            <span className="material-symbols-outlined text-[18px]">add</span>
            {t('actions.create')}
          </Button>
        )}
      </div>

      {/* Pill tabs */}
      <div className="mb-5 flex flex-wrap gap-2 overflow-x-auto">
        {TYPE_TABS.map((tab) => {
          const isActive = filterType === tab.key;
          const isLocked = tab.key !== null && !isAllowed(STORAGE_TYPE_TO_FEATURE[tab.key]);
          return (
            <button
              key={tab.key ?? 'all'}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilterType(tab.key)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-brand text-white' : 'text-neutral-500 hover:bg-neutral-100',
              )}
            >
              {t(tab.labelKey)} ({tab.key === null ? typeCounts.total : typeCounts[tab.key]})
              {isLocked && (
                <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                  lock
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      <StatsBar activeCount={summary.active} frozenCount={summary.frozen} archivedCount={summary.archived} />

      {/* Status filter pills — replaces the legacy <select> in SearchBar */}
      <ArchivedStoragesFilter
        value={filterStatus}
        summary={summary}
        canRestore={canDo('STORAGE_RESTORE')}
        onChange={setFilterStatus}
      />

      {/* Search bar — visible on all tabs, disabled when the tab is tier-gated */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        disabled={isGated}
      />

      {/* Active filter chips — only shown when not gated (gated tabs have no active filters) */}
      {!isGated && isFiltered && (
        <div className="mb-4 flex flex-wrap gap-2">
          {filterStatus !== null && (
            <button
              type="button"
              onClick={() => setFilterStatus(null)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-card px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              {t(`statuses.${filterStatus}`)}
              <span className="material-symbols-outlined text-[14px] text-neutral-400">close</span>
            </button>
          )}
          {searchQuery !== '' && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-card px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              &ldquo;{searchQuery}&rdquo;
              <span className="material-symbols-outlined text-[14px] text-neutral-400">close</span>
            </button>
          )}
        </div>
      )}

      {/* Card grid — replaced by tier gate message when the active tab is blocked */}
      {isGated && filterType !== null ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <TierUpgradeState
            feature={t(`types.${filterType}`)}
            onUpgrade={() => openUpgradeModal('FEATURE_NOT_IN_TIER', filterType)}
            onBack={() => setFilterType(null)}
          />
        </div>
      ) : (
        <div className="relative">
          {/* istanbul ignore next -- TRANSIENT: loading state completes <100ms with real BE */}
          {isLoading && hadData && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <DoubleRingSpinner label={t('loader.loading')} elevated />
            </div>
          )}

          <div className={cn(
            'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
            isLoading && hadData && 'opacity-30',
          )}>
            {sortedStorages.map((storage) => (
              <StorageCard
                key={storage.uuid}
                storage={storage}
                isActiveContext={storage.uuid === activeStorageId}
                canEdit={canDo('STORAGE_UPDATE')}
                canFreeze={canFreeze}
                canUnfreeze={canUnfreeze}
                canArchive={canDo('STORAGE_ARCHIVE')}
                canRestore={canDo('STORAGE_RESTORE')}
                canDelete={canDo('STORAGE_DELETE')}
                isOffline={isOffline}
                onView={handleViewClick}
                onEdit={handleEditClick}
                onFreeze={handleFreezeClick}
                onUnfreeze={handleUnfreezeClick}
                onArchive={handleArchiveClick}
                onRestore={handleRestoreClick}
                onDelete={handleDeleteClick}
              />
            ))}

            {/* Tier limit card inline — shown when the filtered type is at its plan limit,
                OR when on "All" tab and every available type is at its limit */}
            {(filterType !== null ? isAtTypeLimit(filterType) : !canCreateAny) && (
              <button
                type="button"
                onClick={handleUpgrade}
                className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-neutral-500 transition-colors hover:border-warning hover:bg-warning-bg dark:bg-neutral-100"
              >
                <span className="material-symbols-outlined text-[32px] text-neutral-400">lock</span>
                <span className="text-sm font-semibold">{t('upgrade.tierLimit.title')}</span>
                <span className="text-xs text-neutral-400">{t('upgrade.tierLimit.description')}</span>
                <span className="text-xs font-medium text-brand">{t('upgrade.banner.cta')}</span>
              </button>
            )}

            {/* Inline create card — shown when there is remaining quota for the current view:
                specific type tab → that type is not at limit;
                "All" tab → at least one type still has room */}
            {canCreate && (filterType !== null ? !isAtTypeLimit(filterType) : canCreateAny) && (
              <button
                type="button"
                onClick={handleCreateClick}
                className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-neutral-300 bg-transparent text-neutral-500 transition-colors hover:border-brand hover:bg-brand-subtle hover:text-brand"
              >
                <span className="material-symbols-outlined text-[28px]">add</span>
                <span className="text-sm font-medium">{t('actions.createInline')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button type="button" variant="outline" size="sm" className="min-h-[44px] min-w-[44px]" disabled={page === 1} onClick={() => setPage(page - 1)}>
            {t('pagination.prev')}
          </Button>
          <span className="text-sm text-neutral-500">{t('pagination.pageOf', { page, totalPages })}</span>
          <Button type="button" variant="outline" size="sm" className="min-h-[44px] min-w-[44px]" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
            {t('pagination.next')}
          </Button>
        </div>
      )}

      {modals}
    </div>
  );
}

// ─── Extracted sub-components ────────────────────────────────────────────────

function StatsBar({ activeCount, frozenCount, archivedCount }: { activeCount: number; frozenCount: number; archivedCount: number }): React.ReactElement {
  const { t } = useTranslation('storages');
  return (
    <div className="mb-5 flex items-center gap-4 overflow-x-auto rounded-lg border border-border bg-surface-card px-4 py-3 sm:gap-6">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-success">check_circle</span>
        <span className="text-lg font-bold text-neutral-900">{String(activeCount).padStart(2, '0')}</span>
        <span className="text-xs text-neutral-500">{t('stats.active')}</span>
      </div>
      <div className="hidden sm:block"><div className="h-6 w-px bg-border" /></div>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-blue-400">ac_unit</span>
        <span className="text-lg font-bold text-neutral-900">{String(frozenCount).padStart(2, '0')}</span>
        <span className="text-xs text-neutral-500">{t('stats.frozen')}</span>
      </div>
      <div className="hidden sm:block"><div className="h-6 w-px bg-border" /></div>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-neutral-500">inventory_2</span>
        <span className="text-lg font-bold text-neutral-900">{String(archivedCount).padStart(2, '0')}</span>
        <span className="text-xs text-neutral-500">{t('stats.archived')}</span>
      </div>
    </div>
  );
}

function SearchBar({
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
  disabled = false,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortOrder: string;
  setSortOrder: (o: 'ASC' | 'DESC') => void;
  disabled?: boolean;
}): React.ReactElement {
  const { t } = useTranslation('storages');
  return (
    <div className="mb-5 flex flex-wrap gap-3">
      <div className="relative min-w-0 flex-1">
        <span
          className={cn(
            'material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px]',
            disabled ? 'text-neutral-300' : 'text-neutral-400',
          )}
        >
          {disabled ? 'lock' : 'search'}
        </span>
        <input
          type="search"
          placeholder={t('controls.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className={cn(
            'w-full rounded-lg border border-border bg-surface-card py-2.5 pl-10 pr-3 text-sm outline-none',
            disabled
              ? 'cursor-not-allowed text-neutral-300 placeholder:text-neutral-300'
              : 'text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-ring',
          )}
        />
      </div>
      <button
        type="button"
        onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
        disabled={disabled}
        className={cn(
          'flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border bg-surface-card px-3 py-2.5 text-xs font-medium',
          disabled
            ? 'cursor-not-allowed text-neutral-300'
            : 'text-neutral-500 hover:bg-neutral-100',
        )}
      >
        <span className="material-symbols-outlined text-[18px]">sort_by_alpha</span>
        {sortOrder === 'ASC' ? 'A → Z' : 'Z → A'}
      </button>
    </div>
  );
}
