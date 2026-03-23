import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { usePermission } from '@/features/team';
import { TransferOwnershipModal } from './TransferOwnershipModal';
import { CancelOrgModal } from './CancelOrgModal';

interface TeamMember {
  id: string;
  name: string;
}

interface DangerZoneSectionProps {
  businessName: string;
  members: TeamMember[];
}

export function DangerZoneSection({ businessName, members }: DangerZoneSectionProps): React.ReactNode {
  const { t } = useTranslation('organization');
  const canManageOrg = usePermission('TENANT_SETTINGS_UPDATE');

  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  if (!canManageOrg) {
    return null;
  }

  return (
    <div className="rounded-xl border-2 border-red-200 dark:border-red-800 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
        <h3 className="text-base font-semibold text-red-700 dark:text-red-400">
          {t('dangerZone.title')}
        </h3>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setIsTransferOpen(true)}
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
        >
          {t('dangerZone.transferOwnership.triggerButton')}
        </button>

        <button
          type="button"
          onClick={() => setIsCancelOpen(true)}
          className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
        >
          {t('dangerZone.cancelOrg.triggerButton')}
        </button>
      </div>

      {isTransferOpen && (
        <TransferOwnershipModal
          members={members}
          onClose={() => setIsTransferOpen(false)}
        />
      )}

      {isCancelOpen && (
        <CancelOrgModal
          businessName={businessName}
          onClose={() => setIsCancelOpen(false)}
        />
      )}
    </div>
  );
}
