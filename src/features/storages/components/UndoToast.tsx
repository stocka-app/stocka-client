import { toast } from 'sonner';
import i18n from '@/shared/lib/i18n';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

export type UndoableAction = 'freeze' | 'archive';

interface UndoToastProps {
  id: string | number;
  storageName: string;
  action: UndoableAction;
  onUndo: () => void;
}

const TITLE_KEYS: Record<UndoableAction, string> = {
  freeze: 'undoToast.frozenTitle',
  archive: 'undoToast.archivedTitle',
};

const TITLE_DEFAULTS: Record<UndoableAction, string> = {
  freeze: '"{{name}}" fue congelada',
  archive: '"{{name}}" fue archivada',
};

function UndoToastContent({ id, storageName, action, onUndo }: UndoToastProps): React.ReactElement {
  const t = i18n.getFixedT(null, 'storages');
  const title = t(TITLE_KEYS[action], { name: storageName, defaultValue: TITLE_DEFAULTS[action] });

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex w-[360px] max-w-full items-center justify-between gap-4',
        'rounded-md border border-border bg-surface-card px-4 py-3 shadow-lg',
      )}
    >
      <p className="flex-1 text-sm text-neutral-900">{title}</p>
      <Button
        type="button"
        size="sm"
        onClick={() => {
          onUndo();
          toast.dismiss(id);
        }}
        className="bg-brand text-white hover:bg-brand-hover"
      >
        {t('undoToast.undo', { defaultValue: 'Deshacer' })}
      </Button>
    </div>
  );
}

/**
 * Shows a toast with an "Deshacer" action for reversible freeze/archive
 * operations. Auto-dismisses after 6s (matches the H-06 UX spec). The Undo
 * button uses the primary brand color, intentionally NOT success green, so
 * the action reads as "revert my last step" rather than "confirm something
 * good happened".
 */
export function showUndoToast(params: Omit<UndoToastProps, 'id'>): void {
  toast.custom(
    (id) => (
      <UndoToastContent
        id={id}
        storageName={params.storageName}
        action={params.action}
        onUndo={params.onUndo}
      />
    ),
    { duration: 6000 },
  );
}
