import { toast } from 'sonner';
import i18n from '@/shared/lib/i18n';
import { cn } from '@/shared/lib/utils';
import type { UndoableAction } from './UndoToast';

interface UndoCompletedToastProps {
  storageName: string;
  action: UndoableAction;
}

const TITLE_KEYS: Record<UndoableAction, string> = {
  freeze: 'undoToast.reactivatedTitle',
  archive: 'undoToast.restoredTitle',
};

const TITLE_DEFAULTS: Record<UndoableAction, string> = {
  freeze: '"{{name}}" fue reactivada',
  archive: '"{{name}}" fue restaurada',
};

function UndoCompletedToastContent({ storageName, action }: UndoCompletedToastProps): React.ReactElement {
  const t = i18n.getFixedT(null, 'storages');
  const title = t(TITLE_KEYS[action], { name: storageName, defaultValue: TITLE_DEFAULTS[action] });

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex w-[280px] max-w-full items-center gap-2',
        'rounded-md border border-border bg-surface-card px-4 py-2 shadow-lg',
      )}
    >
      <span className="material-symbols-outlined text-[18px] text-success">check_circle</span>
      <p className="flex-1 text-sm text-neutral-900">{title}</p>
    </div>
  );
}

/**
 * Minimal confirmation toast that appears right after an Undo action
 * succeeds. Auto-dismisses after 2s — the user has already validated the
 * outcome, so the feedback only needs to flash.
 */
export function showUndoCompletedToast(params: UndoCompletedToastProps): void {
  toast.custom(
    () => <UndoCompletedToastContent storageName={params.storageName} action={params.action} />,
    { duration: 2000 },
  );
}
