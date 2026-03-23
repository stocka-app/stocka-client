import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useOrganization } from '../hooks/useOrganization';

interface CancelOrgModalProps {
  businessName: string;
  onClose: () => void;
}

export function CancelOrgModal({ businessName, onClose }: CancelOrgModalProps): React.ReactNode {
  const { t } = useTranslation('organization');
  const { isSaving, cancelOrganization } = useOrganization();

  const [confirmValue, setConfirmValue] = useState('');

  const isMatch = confirmValue === businessName;

  const handleConfirm = async (): Promise<void> => {
    await cancelOrganization();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-neutral-900 shadow-xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            id="cancel-modal-title"
            className="text-lg font-semibold text-red-700 dark:text-red-400"
          >
            {t('dangerZone.cancelOrg.modalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('dangerZone.cancelOrg.cancelButton')}
            className="h-7 w-7 flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-red-700 dark:text-red-300">
            {t('dangerZone.cancelOrg.warning')}
          </p>
        </div>

        {/* Confirm input */}
        <div>
          <label
            htmlFor="cancel-confirm-input"
            className="block text-sm font-medium text-neutral-700 mb-1"
          >
            {t('dangerZone.cancelOrg.confirmLabel')}
          </label>
          <p className="mb-2 text-xs text-neutral-500">
            {t('dangerZone.cancelOrg.confirmNote', { name: businessName })}
          </p>
          <input
            id="cancel-confirm-input"
            type="text"
            value={confirmValue}
            onChange={(e) => setConfirmValue(e.target.value)}
            placeholder={t('dangerZone.cancelOrg.confirmPlaceholder')}
            className={cn(
              'w-full rounded-lg border px-3 py-2 text-sm',
              'text-neutral-900 bg-white dark:bg-neutral-900',
              'focus:outline-none focus:ring-2 focus:ring-red-400/50',
              'border-neutral-300 dark:border-neutral-700',
            )}
            aria-describedby="cancel-match-hint"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isMatch || isSaving}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {t('dangerZone.cancelOrg.confirmButton')}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
          >
            {t('dangerZone.cancelOrg.cancelButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
