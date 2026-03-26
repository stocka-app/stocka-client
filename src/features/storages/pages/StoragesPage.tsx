import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { useRBACStore } from '@/store/rbac.store';
import { useStorages } from '../hooks/useStorages';
import { STORAGE_TIER_LIMITS } from '../types/storages.types';
import type { Storage, StorageStatus, StorageType } from '../types/storages.types';
import { StorageLimitsSection } from '../components/StorageLimitsSection';
import { StorageCard } from '../components/StorageCard';
import { CreateEditStorageModal } from '../components/CreateEditStorageModal';
import { ArchiveStorageModal } from '../components/ArchiveStorageModal';
import type { CreateStorageFormData } from '../schemas/storages.schema';

/**
 * StoragesPage
 *
 * Main orchestration page for the storages feature. Shows a stats panel, filter/search
 * controls, and a responsive card grid. Delegates all business operations to useStorages.
 *
 * RBAC decisions live here — StorageCard is a pure presentational component
 * that shows actions based solely on the handlers passed to it.
 */
export default function StoragesPage(): React.ReactElement {
  const { t } = useTranslation('storages');
  const { canDo, tier } = useRBACStore();
  const {
    storages,
    activeStorages,
    frozenStorages,
    archivedStorages,
    filteredStorages,
    isLoading,
    error,
    filterStatus,
    filterType,
    searchQuery,
    sortOrder,
    setFilterStatus,
    setFilterType,
    setSearchQuery,
    setSortOrder,
    canCreate,
    fetchStorages,
    createStorage,
    editStorage,
    archiveStorage,
    restoreStorage,
  } = useStorages();

  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const effectiveTier = tier ?? 'FREE';

  // ── Business rules ──────────────────────────────────────────────────────────

  // A storage can only be archived if it is NOT the last active one of its type
  const canArchiveStorage = (storage: Storage): boolean => {
    const activeOfType = activeStorages.filter((s) => s.type === storage.type);
    return activeOfType.length > 1;
  };

  // A storage can be restored only if doing so won't exceed the tier limit for its type
  const canRestoreStorage = (storage: Storage): boolean => {
    const limit = STORAGE_TIER_LIMITS[effectiveTier][storage.type];
    if (limit === -1) return true;
    const activeOfType = activeStorages.filter((s) => s.type === storage.type).length;
    return activeOfType < limit;
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreateClick = (): void => {
    setSelectedStorage(null);
    setIsCreateEditOpen(true);
  };

  const handleEditClick = (storage: Storage): void => {
    setSelectedStorage(storage);
    setIsCreateEditOpen(true);
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
    return createStorage(data);
  };

  const handleArchiveConfirm = async (): Promise<void> => {
    if (selectedStorage) {
      await archiveStorage(selectedStorage.uuid);
    }
  };

  // ── Derived state ───────────────────────────────────────────────────────────

  const isFiltered = filterStatus !== null || filterType !== null || searchQuery !== '';
  const hasStorages = storages.length > 0;
  const hasFilteredResults = filteredStorages.length > 0;

  // ── Loading state ───────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-neutral-200" />
          </div>
          <div className="h-9 w-32 animate-pulse rounded bg-neutral-200" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-lg bg-neutral-200" />
          ))}
        </div>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('page.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('page.subtitle')}</p>
        </div>
        {canCreate && (
          <Button type="button" onClick={handleCreateClick}>
            {t('actions.create')}
          </Button>
        )}
      </div>

      {/* Tier limits */}
      <div className="mb-4">
        <StorageLimitsSection storages={activeStorages} />
      </div>

      {/* Stats panel */}
      {hasStorages && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { label: t('statuses.ACTIVE'), count: activeStorages.length, colorClass: 'text-green-600' },
              { label: t('statuses.FROZEN'), count: frozenStorages.length, colorClass: 'text-amber-600' },
              { label: t('statuses.ARCHIVED'), count: archivedStorages.length, colorClass: 'text-neutral-500' },
              { label: t('stats.total'), count: storages.length, colorClass: 'text-neutral-900' },
            ] as const
          ).map(({ label, count, colorClass }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-background p-3 text-center"
            >
              <p className={cn('text-2xl font-bold', colorClass)}>{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls bar */}
      <div className="mb-4 flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative min-w-48 flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z"
            />
          </svg>
          <input
            type="search"
            placeholder={t('controls.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setFilterStatus(val === '' ? null : (val as StorageStatus));
          }}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t('controls.allStatuses')}</option>
          <option value="ACTIVE">{t('statuses.ACTIVE')}</option>
          <option value="FROZEN">{t('statuses.FROZEN')}</option>
          <option value="ARCHIVED">{t('statuses.ARCHIVED')}</option>
        </select>

        {/* Type filter */}
        <select
          value={filterType ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            setFilterType(val === '' ? null : (val as StorageType));
          }}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t('controls.allTypes')}</option>
          <option value="WAREHOUSE">{t('types.WAREHOUSE')}</option>
          <option value="STORE_ROOM">{t('types.STORE_ROOM')}</option>
          <option value="CUSTOM_ROOM">{t('types.CUSTOM_ROOM')}</option>
        </select>

        {/* Sort toggle */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? t('controls.sortAsc') : t('controls.sortDesc')}
        </Button>
      </div>

      {/* Active filter chips */}
      {isFiltered && (
        <div className="mb-4 flex flex-wrap gap-2">
          {filterStatus !== null && (
            <button
              type="button"
              onClick={() => setFilterStatus(null)}
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
            >
              {t(`statuses.${filterStatus}`)}
              <span aria-hidden="true">×</span>
            </button>
          )}
          {filterType !== null && (
            <button
              type="button"
              onClick={() => setFilterType(null)}
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
            >
              {t(`types.${filterType}`)}
              <span aria-hidden="true">×</span>
            </button>
          )}
          {searchQuery !== '' && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
            >
              &ldquo;{searchQuery}&rdquo;
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
      )}

      {/* Error state */}
      {error !== null && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center"
        >
          <p className="mb-3 text-sm text-destructive">{t(`errors.${error}`)}</p>
          <Button type="button" variant="outline" size="sm" onClick={fetchStorages}>
            {t('error.retry')}
          </Button>
        </div>
      )}

      {/* Empty state — no storages at all */}
      {error === null && !hasStorages && (
        <div className="py-16 text-center">
          <p className="mb-1 text-base font-medium text-neutral-900">{t('empty.noStorages')}</p>
          <p className="mb-4 text-sm text-muted-foreground">{t('empty.noStoragesSubtitle')}</p>
          {canCreate && (
            <Button type="button" onClick={handleCreateClick}>
              {t('empty.createFirst')}
            </Button>
          )}
        </div>
      )}

      {/* Empty state — filters returned no results */}
      {error === null && hasStorages && !hasFilteredResults && (
        <div className="py-16 text-center">
          <p className="mb-1 text-base font-medium text-neutral-900">{t('empty.noResults')}</p>
          <p className="text-sm text-muted-foreground">{t('empty.noResultsSubtitle')}</p>
        </div>
      )}

      {/* Card grid */}
      {error === null && hasFilteredResults && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStorages.map((storage) => (
            <StorageCard
              key={storage.uuid}
              storage={storage}
              onEdit={canDo('STORAGE_UPDATE') ? handleEditClick : undefined}
              onArchive={canDo('STORAGE_ARCHIVE') && canArchiveStorage(storage) ? handleArchiveClick : undefined}
              onRestore={canDo('STORAGE_UPDATE') && canRestoreStorage(storage) ? handleRestoreClick : undefined}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateEditStorageModal
        open={isCreateEditOpen}
        storage={selectedStorage}
        onClose={() => setIsCreateEditOpen(false)}
        onSave={handleSave}
      />
      <ArchiveStorageModal
        open={isArchiveOpen}
        storage={selectedStorage}
        canArchive={selectedStorage !== null ? canArchiveStorage(selectedStorage) : false}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={handleArchiveConfirm}
      />
    </div>
  );
}
