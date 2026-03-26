import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { useRBACStore } from '@/store/rbac.store';
import { useSpaces } from '../hooks/useSpaces';
import { SPACE_TIER_LIMITS } from '../types/spaces.types';
import type { Space } from '../types/spaces.types';
import { SpaceLimitsSection } from '../components/SpaceLimitsSection';
import { SpacesTable } from '../components/SpacesTable';
import { CreateEditSpaceModal } from '../components/CreateEditSpaceModal';
import { ArchiveSpaceModal } from '../components/ArchiveSpaceModal';
import { RestoreSpaceModal } from '../components/RestoreSpaceModal';
import type { CreateSpaceFormData } from '../schemas/spaces.schema';

type ActiveTab = 'active' | 'archived';

/**
 * SpacesPage
 *
 * Main orchestration page for the spaces feature. Manages modal visibility,
 * selected space state, and delegates all business operations to useSpaces.
 */
export default function SpacesPage(): React.ReactElement {
  const { t } = useTranslation('spaces');
  const { canDo, tier } = useRBACStore();
  const {
    spaces,
    activeSpaces,
    archivedSpaces,
    isLoading,
    error,
    createSpace,
    editSpace,
    archiveSpace,
    restoreSpace,
  } = useSpaces();

  const [activeTab, setActiveTab] = useState<ActiveTab>('active');
  const [isCreateEditOpen, setIsCreateEditOpen] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

  const canEditSpace = canDo('STORAGE_CREATE');
  const effectiveTier = tier ?? 'FREE';

  // A space can only be archived if it is NOT the last active one of its type
  const canArchive = (space: Space): boolean => {
    const activeOfType = activeSpaces.filter((s) => s.type === space.type);
    return activeOfType.length > 1;
  };

  // A space can be restored if doing so does not exceed the tier limit for its type
  const canRestore = (space: Space): boolean => {
    const limit = SPACE_TIER_LIMITS[effectiveTier][space.type];
    if (limit === -1) return true; // unlimited
    const activeOfType = activeSpaces.filter((s) => s.type === space.type).length;
    return activeOfType < limit;
  };

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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {t('page.title')}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('page.subtitle')}</p>
        </div>
        {canEditSpace && (
          <Button type="button" onClick={handleCreateClick}>
            {t('actions.create')}
          </Button>
        )}
      </div>

      {/* Limits */}
      <div className="mb-6">
        <SpaceLimitsSection spaces={spaces} />
      </div>

      {/* Error state */}
      {error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {t(`errors.${error}`)}
        </p>
      )}

      {/* Tabs */}
      <div className="mb-4 flex gap-1 border-b border-border">
        {(['active', 'archived'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'border-brand text-brand'
                : 'border-transparent text-neutral-500 hover:text-neutral-900',
            )}
          >
            {t(`tabs.${tab}`)}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{t('page.title')}</div>
      ) : (
        <SpacesTable
          spaces={activeTab === 'active' ? activeSpaces : archivedSpaces}
          onEdit={handleEditClick}
          onArchive={handleArchiveClick}
          onRestore={handleRestoreClick}
          showArchived={activeTab === 'archived'}
        />
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
        canArchive={selectedSpace ? canArchive(selectedSpace) : false}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={handleArchiveConfirm}
      />
      <RestoreSpaceModal
        open={isRestoreOpen}
        space={selectedSpace}
        canRestore={selectedSpace ? canRestore(selectedSpace) : false}
        onClose={() => setIsRestoreOpen(false)}
        onConfirm={handleRestoreConfirm}
      />
    </div>
  );
}
