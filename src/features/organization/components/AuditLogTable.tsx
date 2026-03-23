import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AuditLogEntry } from '../types/organization.types';

const PAGE_SIZE = 20;

interface AuditLogTableProps {
  entries: AuditLogEntry[];
  isLoading: boolean;
  error: string | null;
}

export function AuditLogTable({ entries, isLoading, error }: AuditLogTableProps): React.ReactNode {
  const { t } = useTranslation('organization');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleEntries = entries.slice(0, visibleCount);
  const hasMore = entries.length > visibleCount;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-neutral-500">{t('audit.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
        {t(error)}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-neutral-500">{t('audit.empty')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {t('audit.columns.datetime')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {t('audit.columns.actor')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {t('audit.columns.action')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {t('audit.columns.details')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {visibleEntries.map((entry) => (
              <tr
                key={entry.id}
                className="bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                  {new Date(entry.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium text-neutral-900">
                  {entry.actorName}
                </td>
                <td className="px-4 py-3 text-neutral-700 font-mono text-xs">
                  {entry.action}
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {entry.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {t('audit.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
