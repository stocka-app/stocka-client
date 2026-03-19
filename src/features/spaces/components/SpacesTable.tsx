import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { useRBACStore } from '@/store/rbac.store';
import type { Space } from '../types/spaces.types';

interface SpacesTableProps {
  spaces: Space[];
  onEdit: (space: Space) => void;
  onArchive: (space: Space) => void;
  onRestore?: (space: Space) => void;
  showArchived?: boolean;
}

/**
 * SpacesTable
 *
 * Renders a list of spaces with name, type, address, and action columns.
 * Edit and archive buttons are shown only when the user has CREATE_EDIT_SPACE permission.
 */
export function SpacesTable({
  spaces,
  onEdit,
  onArchive,
  onRestore,
  showArchived = false,
}: SpacesTableProps): React.ReactElement {
  const { t } = useTranslation('spaces');
  const { canDo } = useRBACStore();
  const canEditSpace = canDo('CREATE_EDIT_SPACE');

  const emptyKey = showArchived ? 'table.emptyArchived' : 'table.empty';

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
        <thead className="bg-neutral-50 dark:bg-neutral-900">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
              {t('table.name')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
              {t('table.type')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-400">
              {t('table.address')}
            </th>
            <th className="px-4 py-3 text-right font-medium text-neutral-600 dark:text-neutral-400">
              {t('table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-background">
          {spaces.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400"
              >
                {t(emptyKey)}
              </td>
            </tr>
          ) : (
            spaces.map((space) => (
              <tr
                key={space.id}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">
                  {space.name}
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {t(`types.${space.type}`)}
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                  {space.address ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {canEditSpace && !showArchived && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(space)}
                      >
                        {t('actions.edit')}
                      </Button>
                    )}
                    {canEditSpace && !showArchived && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onArchive(space)}
                      >
                        {t('actions.archive')}
                      </Button>
                    )}
                    {canEditSpace && showArchived && onRestore && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onRestore(space)}
                      >
                        {t('actions.restore')}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
