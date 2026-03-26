import { useTranslation } from 'react-i18next';
import { useRBACStore } from '@/store/rbac.store';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import type { Space, SpaceStatus, SpaceType } from '../types/spaces.types';

// ─── Visual mappings ──────────────────────────────────────────────────────────

const TYPE_BADGE_CLASSES: Record<SpaceType, string> = {
  WAREHOUSE: 'bg-blue-100 text-blue-700',
  STORE_ROOM: 'bg-green-100 text-green-700',
  CUSTOM_ROOM: 'bg-purple-100 text-purple-700',
};

const STATUS_DOT_CLASSES: Record<SpaceStatus, string> = {
  ACTIVE: 'bg-green-500',
  FROZEN: 'bg-amber-500',
  ARCHIVED: 'bg-neutral-400',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface SpaceCardProps {
  space: Space;
  onEdit?: (space: Space) => void;
  onArchive?: (space: Space) => void;
  onDelete?: (space: Space) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SpaceCard({
  space,
  onEdit,
  onArchive,
  onDelete,
}: SpaceCardProps): React.ReactElement {
  const { t } = useTranslation('spaces');
  const { canDo } = useRBACStore();

  const canUpdate = canDo('STORAGE_UPDATE');
  const canArchive = canDo('STORAGE_DELETE');
  const canDelete = canDo('STORAGE_DELETE');

  const showEdit = canUpdate;
  const showArchive = canArchive && space.status === 'ACTIVE';
  const showDelete = canDelete && space.status === 'ARCHIVED';

  return (
    <div className="rounded-lg border border-border bg-background p-4 transition-shadow hover:shadow-sm">
      {/* Header: name + type badge */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="truncate font-medium text-neutral-900">{space.name}</h3>
        <span
          className={cn(
            'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
            TYPE_BADGE_CLASSES[space.type],
          )}
        >
          {t(`types.${space.type}`)}
        </span>
      </div>

      {/* Status indicator */}
      <div className="mb-3 flex items-center gap-1.5">
        <span
          className={cn('inline-block h-2 w-2 rounded-full', STATUS_DOT_CLASSES[space.status])}
          aria-hidden="true"
        />
        <span className="text-xs text-neutral-500">{t(`statuses.${space.status}`)}</span>
      </div>

      {/* Address */}
      {space.address !== null && (
        <p className="mb-3 truncate text-sm text-neutral-600">{space.address}</p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 border-t border-border pt-2">
        <Button type="button" variant="ghost" size="sm">
          {t('actions.view')}
        </Button>
        {showEdit && onEdit && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(space)}>
            {t('actions.edit')}
          </Button>
        )}
        {showArchive && onArchive && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onArchive(space)}>
            {t('actions.archive')}
          </Button>
        )}
        {showDelete && onDelete && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onDelete(space)}>
            {t('actions.delete')}
          </Button>
        )}
      </div>
    </div>
  );
}
