import { useEffect } from 'react';
import { cn } from '@/shared/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** When false, backdrop click and ESC are blocked (e.g. during an in-flight request). */
  closable?: boolean;
  /** Id of the element that labels the dialog for screen readers (use on your heading). */
  ariaLabelledBy?: string;
  children: React.ReactNode;
  /** Overrides for the inner panel — defaults to `w-full max-w-md rounded-2xl p-6`. */
  className?: string;
}

export default function Dialog({
  open,
  onClose,
  closable = true,
  ariaLabelledBy,
  children,
  className,
}: DialogProps): React.ReactElement | null {
  useEffect(() => {
    if (!open || !closable) return;

    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handler);

    return () => window.removeEventListener('keydown', handler);
  }, [open, closable, onClose]);

  if (!open) return null;

  const handleBackdropClick = (): void => {
    if (closable) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6 sm:px-0 md:py-12 lg:py-16 2xl:py-20 overflow-auto scrollbar-hide outline-none focus:outline-none"
      onClick={handleBackdropClick}
    >
      <div
        className={cn('w-full max-w-md rounded-2xl bg-background p-6 shadow-xl', className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
