import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { useRBACStore } from '@/store/rbac.store';
import { useSpaces } from '../hooks/useSpaces';
import { SPACE_TIER_LIMITS } from '../types/spaces.types';
import type { Space, SpaceStatus, SpaceType } from '../types/spaces.types';
import { SpaceLimitsSection } from '../components/SpaceLimitsSection';
import { SpaceCard } from '../components/SpaceCard';
import { CreateEditSpaceModal } from '../components/CreateEditSpaceModal';
import { ArchiveSpaceModal } from '../components/ArchiveSpaceModal';
import { RestoreSpaceModal } from '../components/RestoreSpaceModal';
import type { CreateSpaceFormData } from '../schemas/spaces.schema';

/**
 * SpacesPage
 *
 * Main orchestration page for the spaces feature. Shows a stats panel, filter/search
 * controls, and a responsive card grid. Delegates all business operations to useSpaces.
 */
export default function SpacesPage(): React.ReactElement {
  const { t } = useTranslation('spaces');
  const { canDo, tier } = useRBACStore();
  const {
    spaces,
    activeSpaces,
    frozenSpaces,
    archivedSpaces,
    filteredSpaces,
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
    fetchSpaces,
    createSpace,
    editSpace,
    archiveSpace,
    restoreSpace,
  } = useSpaces();

  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

  const effectiveTier = tier ?? 'FREE';

  // ── Business rules ──────────────────────────────────────────────────────────

  // A space can only be archived if it is NOT the last active one of its type
  const canArchiveSpace = (space: Space): boolean => {
    const activeOfType = activeSpaces.filter((s) => s.type === space.type);
    return activeOfType.length > 1;
  };

  // A space can be restored only if doing so won't exceed the tier limit for its type
  const canRestoreSpace = (space: Space): boolean => {
    const limit = SPACE_TIER_LIMITS[effectiveTier][space.type];
    if (limit === -1) return true;
    const activeOfType = activeSpaces.filter((s) => s.type === space.type).length;
    return activeOfType < limit;
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCreateClick = (): void => {
    setSelectedSpace(null);
    setIsCreateEditOpen(true);
  };

  const handleEditClick = (space: Space): void => {
    setSelectedSpace(space);
    setIsCreateEditOpen(true);
  };

  const handleArchiveClick = (space: Space): void => {
    setSelectedSpace(space);
    setIsArchiveOpen(true);
  };

  const handleRestoreClick = (space: Space): void => {
    setSelectedSpace(space);
    setIsRestoreOpen(true);
  };

  const handleSave = async (data: CreateSpaceFormData): Promise<boolean> => {
    if (selectedSpace) {
      return editSpace(selectedSpace.uuid, data);
    }
    return createSpace(data);
  };

  const handleArchiveConfirm = async (): Promise<void> => {
    if (selectedSpace) {
      await archiveSpace(selectedSpace.uuid);
    }
  };

  const handleRestoreConfirm = async (): Promise<void> => {
    if (selectedSpace) {
      await restoreSpace(selectedSpace.uuid);
    }
  };

  // ── Derived state ───────────────────────────────────────────────────────────

  const isFiltered = filterStatus !== null || filterType !== null || searchQuery !== '';
  const hasSpaces = spaces.length > 0;
  const hasFilteredResults = filteredSpaces.length > 0;

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
        <SpaceLimitsSection spaces={spaces} />
      </div>

      {/* Stats panel */}
      {hasSpaces && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { label: t('statuses.ACTIVE'), count: activeSpaces.length, colorClass: 'text-green-600' },
              { label: t('statuses.FROZEN'), count: frozenSpaces.length, colorClass: 'text-amber-600' },
              { label: t('statuses.ARCHIVED'), count: archivedSpaces.length, colorClass: 'text-neutral-500' },
              { label: t('stats.total'), count: spaces.length, colorClass: 'text-neutral-900' },
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
            setFilterStatus(val === '' ? null : (val as SpaceStatus));
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
            setFilterType(val === '' ? null : (val as SpaceType));
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
          <Button type="button" variant="outline" size="sm" onClick={fetchSpaces}>
            {t('error.retry')}
          </Button>
        </div>
      )}

      {/* Empty state — no spaces at all */}
      {error === null && !hasSpaces && (
        <div className="py-16 text-center">
          <p className="mb-1 text-base font-medium text-neutral-900">{t('empty.noSpaces')}</p>
          <p className="mb-4 text-sm text-muted-foreground">{t('empty.noSpacesSubtitle')}</p>
          {canCreate && (
            <Button type="button" onClick={handleCreateClick}>
              {t('empty.createFirst')}
            </Button>
          )}
        </div>
      )}

      {/* Empty state — filters returned no results */}
      {error === null && hasSpaces && !hasFilteredResults && (
        <div className="py-16 text-center">
          <p className="mb-1 text-base font-medium text-neutral-900">{t('empty.noResults')}</p>
          <p className="text-sm text-muted-foreground">{t('empty.noResultsSubtitle')}</p>
        </div>
      )}

      {/* Card grid */}
      {error === null && hasFilteredResults && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSpaces.map((space) => (
            <SpaceCard
              key={space.uuid}
              space={space}
              onEdit={canDo('STORAGE_UPDATE') ? handleEditClick : undefined}
              onArchive={canArchiveSpace(space) ? handleArchiveClick : undefined}
              onRestore={canRestoreSpace(space) ? handleRestoreClick : undefined}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateEditSpaceModal
        open={isCreateEditOpen}
        space={selectedSpace}
        onClose={() => setIsCreateEditOpen(false)}
        onSave={handleSave}
      />
      <ArchiveSpaceModal
        open={isArchiveOpen}
        space={selectedSpace}
        canArchive={selectedSpace !== null ? canArchiveSpace(selectedSpace) : false}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={handleArchiveConfirm}
      />
      <RestoreSpaceModal
        open={isRestoreOpen}
        space={selectedSpace}
        canRestore={selectedSpace !== null ? canRestoreSpace(selectedSpace) : false}
        onClose={() => setIsRestoreOpen(false)}
        onConfirm={handleRestoreConfirm}
      />
    </div>
  );
}
