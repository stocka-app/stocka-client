import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import Dialog from '@/shared/components/Dialog';
import type { Storage } from '../types/storages.types';
import type { PermanentDeleteError } from '../hooks/useStorages';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DeleteStorageDialogProps {
  open: boolean;
  storage: Storage | null;
  /** True while the delete request is in flight. */
  isLoading: boolean;
  /**
   * Non-null when the operation returned an error.
   * - `not_found`: concurrency variant — the storage was already deleted by another actor.
   * - `server_error` | `offline`: recoverable network errors — render the inline error banner.
   * - `not_archived` | `forbidden`: defensive fallbacks, should not surface in normal flow.
   */
  serverError: PermanentDeleteError | null;
  onClose: () => void;
  onConfirm: () => void;
}

// ─── Validation helper ────────────────────────────────────────────────────────

/**
 * Returns true when `typed` matches `expected` exactly (case-sensitive).
 * Tolerates leading/trailing whitespace in the typed value.
 */
function isNameMatch(typed: string, expected: string): boolean {
  return typed.trim() === expected;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * DeleteStorageDialog — H-08 Eliminar instalación permanentemente
 *
 * Full implementation with 6 visual states + concurrency variant:
 *
 * 1. **Initial** — input empty, confirm button disabled (opacity 0.5)
 * 2. **Partial** — user typing, border neutral (no inline validation yet)
 * 3. **Incorrect** — blur / Enter with mismatch → red border + inline error message
 * 4. **Correct** — exact match → green border + confirm button enabled
 * 5. **Confirming** — request in flight → input disabled, spinner, ESC/backdrop blocked
 * 6. **Network error** — `server_error` | `offline` → inline red banner, input preserved,
 *    button re-enabled for retry
 *
 * **Concurrency variant** (`serverError === 'not_found'`):
 * The dialog switches to an informational blue layout — icon, title and body change;
 * input, consequences block and cancel button are hidden; a single "Close" button remains.
 */
export function DeleteStorageDialog({
  open,
  storage,
  isLoading,
  serverError,
  onClose,
  onConfirm,
}: DeleteStorageDialogProps): React.ReactElement | null {
  const { t } = useTranslation('storages');

  // ── Internal state ─────────────────────────────────────────────────────────

  const [typed, setTyped] = useState('');
  const [showError, setShowError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset internal state whenever the dialog opens / storage changes.
  // This guarantees that reopening after a cancel or after a success always
  // starts in the initial (empty input, no error) state.
  // Calling setState here is intentional: we are reacting to an external prop
  // transition (`open` flipping to true), which is a valid use of effects as
  // a "synchronize with external system" pattern. There is no risk of an
  // infinite cascade because the deps are stable props, not the derived state.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset form state when dialog re-opens, see comment above.
      setTyped('');
      setShowError(false);
    }
  }, [open, storage?.uuid]);

  // Auto-focus the input when the dialog opens (focus trap is handled by Dialog).
  // We need a small delay because the Dialog animation may not have completed yet.
  useEffect(() => {
    if (open && !isLoading && serverError !== 'not_found') {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open, isLoading, serverError]);

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (!storage) return null;

  // ── Derived flags ──────────────────────────────────────────────────────────

  const isConcurrency = serverError === 'not_found';
  const isNetworkError =
    serverError === 'server_error' ||
    serverError === 'offline' ||
    serverError === 'not_archived' ||
    serverError === 'forbidden';
  const hasMatch = isNameMatch(typed, storage.name);
  const isConfirmEnabled = hasMatch && !isLoading && !isConcurrency;

  // ── Event handlers ─────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setTyped(e.target.value);
    // Clear error as soon as the user starts editing again
    if (showError) setShowError(false);
  };

  const handleBlur = (): void => {
    // Only show error if the user actually typed something and it does not match
    if (typed !== '' && !isNameMatch(typed, storage.name)) {
      setShowError(true);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!isNameMatch(typed, storage.name)) {
      setShowError(true);
      return;
    }
    onConfirm();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // VARIANT: Concurrency (not_found) — storage already deleted by another actor
  // ─────────────────────────────────────────────────────────────────────────

  if (isConcurrency) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        closable={true}
        ariaLabelledBy="delete-storage-dialog-title"
      >
        <>
          {/* Info icon — blue circle */}
          <div className="mb-5 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-info-bg">
              <span
                className="material-symbols-outlined text-info"
                style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                info
              </span>
            </div>
          </div>

          {/* Title */}
          <h2
            id="delete-storage-dialog-title"
            className="mb-3 text-center text-base font-semibold text-neutral-900"
          >
            {t('permanentDelete.error.concurrent.title')}
          </h2>

          {/* Body */}
          <p className="text-center text-sm leading-relaxed text-neutral-600">
            {t('permanentDelete.error.concurrent.body', { name: storage.name })}
          </p>

          {/* Footer — single Close button */}
          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              onClick={onClose}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {t('permanentDelete.buttons.close')}
            </Button>
          </div>
        </>
      </Dialog>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN DIALOG — states 1–6
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={onClose}
      closable={!isLoading}
      ariaLabelledBy="delete-storage-dialog-title"
    >
      <>
        {/* Main icon — red destructive circle 56×56 */}
        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <span
              className="material-symbols-outlined text-destructive"
              style={{ fontSize: '28px', fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              delete_forever
            </span>
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-storage-dialog-title"
          className="mb-3 text-center text-base font-semibold text-neutral-900"
        >
          {t('permanentDelete.title', { name: storage.name })}
        </h2>

        {/* Body */}
        <p className="text-center text-sm leading-relaxed text-neutral-600">
          {t('permanentDelete.body')}
        </p>

        {/* Consequences block */}
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="mb-1.5 text-[13px] font-medium text-destructive">
            {t('permanentDelete.consequences.heading')}
          </p>
          <ul className="space-y-1 text-[13px] leading-snug text-destructive/80">
            <li className="flex items-center gap-2">
              <span
                className="material-symbols-outlined shrink-0 text-[14px] text-destructive/60"
                aria-hidden="true"
              >
                remove
              </span>
              {t('permanentDelete.consequences.history')}
            </li>
            <li className="flex items-center gap-2">
              <span
                className="material-symbols-outlined shrink-0 text-[14px] text-destructive/60"
                aria-hidden="true"
              >
                remove
              </span>
              {t('permanentDelete.consequences.activity')}
            </li>
            <li className="flex items-center gap-2">
              <span
                className="material-symbols-outlined shrink-0 text-[14px] text-destructive/60"
                aria-hidden="true"
              >
                remove
              </span>
              {t('permanentDelete.consequences.config')}
            </li>
          </ul>
        </div>

        {/* Typing confirmation form */}
        <form
          id="delete-storage-form"
          onSubmit={handleSubmit}
          className="mt-4"
          aria-describedby="delete-storage-input-description"
          noValidate
        >
          <label
            htmlFor="delete-storage-input"
            className="mb-1.5 block text-[13px] font-medium text-neutral-700"
          >
            {t('permanentDelete.input.label', { name: storage.name })}
          </label>
          <input
            ref={inputRef}
            id="delete-storage-input"
            type="text"
            value={typed}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={showError ? true : undefined}
            aria-errormessage={showError ? 'delete-storage-input-error' : undefined}
            className={cn(
              'w-full rounded-lg border bg-background px-3 py-2 text-sm text-neutral-900 outline-none transition-colors',
              'focus:ring-2 focus:ring-ring',
              isLoading && 'cursor-not-allowed opacity-60',
              !isLoading && !showError && !hasMatch && 'border-border',
              !isLoading && showError && 'border-destructive',
              !isLoading && !showError && hasMatch && 'border-green-500',
            )}
          />

          {/* Inline error message — state 3 */}
          {showError && (
            <div
              id="delete-storage-input-error"
              role="alert"
              className="mt-1.5 flex items-center gap-1.5 text-[12px] text-destructive"
            >
              <span
                className="material-symbols-outlined shrink-0 text-[14px]"
                aria-hidden="true"
              >
                cancel
              </span>
              {t('permanentDelete.input.error')}
            </div>
          )}
        </form>

        {/* Network error banner — state 6 (between input section and footer) */}
        {isNetworkError && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 p-3"
          >
            <span
              className="material-symbols-outlined shrink-0 text-[16px] text-destructive"
              aria-hidden="true"
            >
              wifi_off
            </span>
            <p className="text-[13px] leading-snug text-destructive">
              {t('permanentDelete.error.network')}
            </p>
          </div>
        )}

        {/* Footer — centered buttons */}
        <div className="mt-6 flex justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className={cn(isLoading && 'opacity-50')}
          >
            {t('permanentDelete.buttons.cancel')}
          </Button>
          <Button
            type="submit"
            form="delete-storage-form"
            disabled={!isConfirmEnabled}
            aria-disabled={!isConfirmEnabled}
            className={cn(
              'bg-destructive text-destructive-foreground hover:bg-destructive/90',
              !isConfirmEnabled && 'opacity-50',
            )}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span
                  className="material-symbols-outlined animate-spin text-[16px]"
                  aria-hidden="true"
                >
                  progress_activity
                </span>
                {t('permanentDelete.buttons.confirming')}
              </span>
            ) : (
              t('permanentDelete.buttons.confirm')
            )}
          </Button>
        </div>
      </>
    </Dialog>
  );
}
