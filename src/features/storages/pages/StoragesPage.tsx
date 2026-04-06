import { useState, useRef } from 'react';
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
import { useStorages } from '../hooks/useStorages';
import type { Storage, StorageType } from '../types/storages.types';
import { storagesService } from '../api/storages.service';
import { StorageCard } from '../components/StorageCard';
import { CreateStorageDrawer } from '../components/CreateStorageDrawer';
import { CreateEditStorageModal } from '../components/CreateEditStorageModal';
import { ArchiveStorageModal } from '../components/ArchiveStorageModal';
import type { CreateStorageFormData } from '../schemas/storages.schema';

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
    activeStorages,
    frozenStorages,
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
    archiveStorage,
    restoreStorage,
  } = useStorages();

  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  // ── Business rules ──────────────────────────────────────────────────────

  const canArchiveStorage = (storage: Storage): boolean => storage.status === 'ACTIVE';

  const canRestoreStorage = (storage: Storage): boolean => {
    const limit = storageLimits[storage.type];
    if (limit === -1) return true;
    const activeOfType = activeStorages.filter((s) => s.type === storage.type).length;
    return activeOfType < limit;
  };

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleCreateClick = (): void => {
    setIsCreateDrawerOpen(true);
  };

  const handleEditClick = (storage: Storage): void => {
    setSelectedStorage(storage);
    setIsEditOpen(true);
  };

  const handleArchiveClick = (storage: Storage): void => {
    setSelectedStorage(storage);
    setIsArchiveOpen(true);
  };

  const handleRestoreClick = async (storage: Storage): Promise<void> => {
    const ok = await restoreStorage(storage.uuid);
    if (ok) {
      toast.success(t('toast.restored', { name: storage.name }));
    } else {
      toast.error(t('toast.restoreFailed'));
    }
  };

  const handleSave = async (data: CreateStorageFormData): Promise<boolean> => {
    if (selectedStorage) {
      return editStorage(selectedStorage.uuid, data);
    }
    return false;
  };

  const handleArchiveConfirm = async (): Promise<void> => {
    if (selectedStorage) {
      await archiveStorage(selectedStorage.uuid);
    }
  };

  const handleDeleteClick = async (storage: Storage): Promise<void> => {
    try {
      await storagesService.destroy(storage.uuid);
      toast.success(t('toast.deleted', { name: storage.name }));
      fetchStorages();
    } catch {
      toast.error(t('toast.deleteFailed'));
    }
  };

  const handleUpgrade = (): void => {
    /* c8 ignore next */
    openUpgradeModal('FEATURE_NOT_IN_TIER', filterType ?? 'WAREHOUSE');
  };

  const isAtTypeLimit = (type: StorageType): boolean => {
    const limit = storageLimits[type];
    if (limit === -1) return false;
    const activeOfType = activeStorages.filter((s) => s.type === type).length;
    return activeOfType >= limit;
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
  const hasStorages = storages.length > 0;

  // Track whether we ever received data. Once true, stays true for the
  // lifetime of this component so that subsequent loads (filter, search,
  // pagination) always show the spinner overlay instead of the skeleton.
  const everHadDataRef = useRef(false);
  if (!isLoading && (hasStorages || total > 0)) {
    everHadDataRef.current = true;
  }
  const hadData = everHadDataRef.current;

  const countByType = (type: StorageType | null): number => {
    if (type === null) return total;
    return storages.filter((s) => s.type === type).length;
  };

  // ── Modals (always mounted) ───────────────────────────────────────────

  const modals = (
    <>
      {/* Create flow — new drawer */}
      <CreateStorageDrawer
        open={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        storages={storages}
        limits={storageLimits}
        tier={tier ?? 'FREE'}
        onCreateWarehouse={createWarehouse}
        onCreateStoreRoom={createStoreRoom}
        onCreateCustomRoom={createCustomRoom}
      />
      {/* Edit flow — existing modal */}
      <CreateEditStorageModal
        open={isEditOpen}
        storage={selectedStorage}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedStorage(null);
        }}
        onSave={handleSave}
      />
      <ArchiveStorageModal
        open={isArchiveOpen}
        storage={selectedStorage}
        canArchive={selectedStorage !== null ? canArchiveStorage(selectedStorage) : false}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={handleArchiveConfirm}
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
            <div key={i} className="flex overflow-hidden rounded-lg border border-border bg-surface-card shadow-card">
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
          <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 p-8">
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
  // STATE 3.5: TIER GATE — filterType is locked on the current plan
  // ══════════════════════════════════════════════════════════════════════

  if (isGated && filterType !== null) {
    return (
      <div className="mx-auto flex max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-neutral-900">{t('page.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('page.subtitle')}</p>
        </div>
        <div className="mb-4 flex flex-wrap gap-2 overflow-x-auto">
          {TYPE_TABS.map((tab) => {
            const isActive = filterType === tab.key;
            return (
              <button
                key={tab.key ?? 'all'}
                type="button"
                onClick={() => setFilterType(tab.key)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand text-white' : 'text-neutral-500 hover:bg-neutral-100',
                )}
              >
                {t(tab.labelKey)}
              </button>
            );
          })}
        </div>
        <div className="flex flex-1 items-center justify-center">
          <TierUpgradeState
            feature={t(`types.${filterType}`)}
            onUpgrade={() => openUpgradeModal('FEATURE_NOT_IN_TIER', filterType)}
            onBack={() => setFilterType(null)}
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
            return (
              <button
                key={tab.key ?? 'all'}
                type="button"
                onClick={() => setFilterType(tab.key)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand text-white' : 'text-neutral-500 hover:bg-neutral-100',
                )}
              >
                {t(tab.labelKey)} ({countByType(tab.key)})
              </button>
            );
          })}
        </div>
        {/* Stats + search */}
        <StatsBar activeCount={activeStorages.length} frozenCount={frozenStorages.length} />
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} filterStatus={filterStatus} setFilterStatus={setFilterStatus} sortOrder={sortOrder} setSortOrder={setSortOrder} />

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
        {modals}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // STATE 6: SUCCESS + STATE 2: LOADER overlay
  // ══════════════════════════════════════════════════════════════════════

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('page.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t('page.subtitle')}</p>
        </div>
        {canCreate && (
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
          return (
            <button
              key={tab.key ?? 'all'}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilterType(tab.key)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-brand text-white' : 'text-neutral-500 hover:bg-neutral-100',
              )}
            >
              {t(tab.labelKey)} ({countByType(tab.key)})
            </button>
          );
        })}
      </div>

      {/* Stats bar */}
      <StatsBar activeCount={activeStorages.length} frozenCount={frozenStorages.length} />

      {/* Search + status filter + sort */}
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} filterStatus={filterStatus} setFilterStatus={setFilterStatus} sortOrder={sortOrder} setSortOrder={setSortOrder} />

      {/* Active filter chips */}
      {isFiltered && (
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

      {/* Card grid with optional loader overlay */}
      <div className="relative">
        {isLoading && hadData && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <DoubleRingSpinner label={t('loader.loading')} elevated />
          </div>
        )}

        <div className={cn(
          'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
          isLoading && hadData && 'opacity-30',
        )}>
          {storages.map((storage) => (
            <StorageCard
              key={storage.uuid}
              storage={storage}
              onEdit={canDo('STORAGE_UPDATE') ? handleEditClick : undefined}
              onArchive={canDo('STORAGE_ARCHIVE') && canArchiveStorage(storage) ? handleArchiveClick : undefined}
              onRestore={canDo('STORAGE_UPDATE') && canRestoreStorage(storage) ? handleRestoreClick : undefined}
              onDelete={canDo('STORAGE_DELETE') && storage.status === 'ARCHIVED' ? handleDeleteClick : undefined}
            />
          ))}

          {/* Tier limit card inline — shown when the filtered type is at its plan limit,
              OR when on "All" tab and every available type is at its limit */}
          {(filterType !== null ? isAtTypeLimit(filterType) : !canCreateAny) && (
            <button
              type="button"
              onClick={handleUpgrade}
              className="flex min-h-[176px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-neutral-500 transition-colors hover:border-warning hover:bg-warning-bg dark:bg-neutral-100"
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
              className="flex min-h-[176px] flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-neutral-300 bg-transparent text-neutral-500 transition-colors hover:border-brand hover:bg-brand-subtle hover:text-brand"
            >
              <span className="material-symbols-outlined text-[28px]">add</span>
              <span className="text-sm font-medium">{t('actions.createInline')}</span>
            </button>
          )}
        </div>
      </div>

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

function StatsBar({ activeCount, frozenCount }: { activeCount: number; frozenCount: number }): React.ReactElement {
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
        <span className="material-symbols-outlined text-[20px] text-warning">ac_unit</span>
        <span className="text-lg font-bold text-neutral-900">{String(frozenCount).padStart(2, '0')}</span>
        <span className="text-xs text-neutral-500">{t('stats.frozen')}</span>
      </div>
      <div className="hidden sm:block"><div className="h-6 w-px bg-border" /></div>
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-neutral-500">inventory_2</span>
        <span className="text-xs font-medium text-neutral-500">{t('stats.occupancy')}</span>
      </div>

    </div>
  );
}

function SearchBar({
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  sortOrder,
  setSortOrder,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: import('../types/storages.types').StorageStatus | null;
  setFilterStatus: (s: import('../types/storages.types').StorageStatus | null) => void;
  sortOrder: string;
  setSortOrder: (o: 'ASC' | 'DESC') => void;
}): React.ReactElement {
  const { t } = useTranslation('storages');
  return (
    <div className="mb-5 flex flex-wrap gap-3">
      <div className="relative min-w-0 flex-1">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-neutral-400">search</span>
        <input
          type="search"
          placeholder={t('controls.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-card py-2.5 pl-10 pr-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-ring"
        />
      </div>
      <select
        value={filterStatus ?? ''}
        onChange={(e) => setFilterStatus(e.target.value === '' ? null : e.target.value as import('../types/storages.types').StorageStatus)}
        className="min-h-[44px] rounded-lg border border-border bg-surface-card px-3 py-2.5 text-sm text-neutral-700 outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">{t('controls.allStatuses')}</option>
        <option value="ACTIVE">{t('statuses.ACTIVE')}</option>
        <option value="FROZEN">{t('statuses.FROZEN')}</option>
        <option value="ARCHIVED">{t('statuses.ARCHIVED')}</option>
      </select>
      <button
        type="button"
        onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
        className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-border bg-surface-card px-3 py-2.5 text-xs font-medium text-neutral-500 hover:bg-neutral-100"
      >
        <span className="material-symbols-outlined text-[18px]">sort_by_alpha</span>
        {sortOrder === 'ASC' ? 'A → Z' : 'Z → A'}
      </button>
    </div>
  );
}
