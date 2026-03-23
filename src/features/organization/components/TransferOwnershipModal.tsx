import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useOrganization } from '../hooks/useOrganization';

interface TeamMember {
  id: string;
  name: string;
}

interface TransferOwnershipModalProps {
  members: TeamMember[];
  onClose: () => void;
}

type ModalStep = 'select' | 'confirm';

export function TransferOwnershipModal({
  members,
  onClose,
}: TransferOwnershipModalProps): React.ReactNode {
  const { t } = useTranslation('organization');
  const { isSaving, transferOwnership } = useOrganization();

  const [step, setStep] = useState<ModalStep>('select');
  const [selectedId, setSelectedId] = useState<string>('');

  const selectedMember = members.find((m) => m.id === selectedId);

  const handleSelectContinue = (): void => {
    setStep('confirm');
  };

  const handleConfirm = async (): Promise<void> => {
    await transferOwnership(selectedId);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    >
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-neutral-900 shadow-xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            id="transfer-modal-title"
            className="text-lg font-semibold text-neutral-900"
          >
            {t('dangerZone.transferOwnership.modalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('profile.cancelButton')}
            className="h-7 w-7 flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {step === 'select' && (
          <>
            <div>
              <label
                htmlFor="new-owner-select"
                className="block text-sm font-medium text-neutral-700 mb-1"
              >
                {t('dangerZone.transferOwnership.selectLabel')}
              </label>
              <select
                id="new-owner-select"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="">{t('dangerZone.transferOwnership.selectPlaceholder')}</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-neutral-500">
              {t('dangerZone.transferOwnership.note')}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectContinue}
                disabled={!selectedId}
                className="flex-1 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand/90 disabled:opacity-50 transition-colors"
              >
                {t('dangerZone.transferOwnership.confirmButton')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {t('dangerZone.transferOwnership.cancelButton')}
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && selectedMember && (
          <>
            <p className="text-sm text-neutral-700">
              {t('dangerZone.transferOwnership.confirmMessage', { name: selectedMember.name })}
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSaving}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {t('dangerZone.transferOwnership.confirmButton')}
              </button>
              <button
                type="button"
                onClick={() => setStep('select')}
                disabled={isSaving}
                className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {t('dangerZone.transferOwnership.cancelButton')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
