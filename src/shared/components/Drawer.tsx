import { cn } from '@/shared/lib/utils';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared Drawer shell — slides in from the right on open, slides back out on close.
 *
 * Both enter and exit animations are driven purely by CSS `transition` on the
 * `translate-x-*` class, so no state or effects are needed. The panel stays
 * mounted at all times; `aria-hidden` + `pointer-events-none` make it
 * invisible to assistive technology and pointer input when closed.
 *
 * Usage:
 *   <Drawer open={open} onClose={handleClose} className="max-w-[480px]">
 *     {children}
 *   </Drawer>
 */
export default function Drawer({ open, onClose, children, className }: DrawerProps): React.ReactElement {
  return (
    <>
      {/* Backdrop — fades in on open, fades out on close */}
      <div
        className={cn(
          'fixed inset-0 z-[55] bg-black/40 transition-opacity duration-300',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — slides in from right on open, slides back out on close */}
      <div
        aria-hidden={!open}
        className={cn(
          'fixed right-0 top-0 z-[60] flex h-screen w-full flex-col bg-surface-card shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
          className,
        )}
      >
        {children}
      </div>
    </>
  );
}
