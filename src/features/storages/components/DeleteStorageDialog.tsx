import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/components/ui/button';
import Dialog from '@/shared/components/Dialog';
import type { Storage } from '../types/storages.types';
import type { PermanentDeleteError } from '../hooks/useStorages';

// ─── Countdown configuration ─────────────────────────────────────────────────

/** Grace window before the actual delete request fires. The user can cancel
 * during this window and no network call is made. Long enough to read
 * "wait, that wasn't what I meant" reflexes; short enough not to feel
 * paternalistic. */
const COUNTDOWN_DURATION_MS = 5000;
/** Tick frequency for the progress ring animation. 50ms ≈ 20 fps — smooth
 * enough for the eye while keeping React updates inexpensive. */
const COUNTDOWN_TICK_MS = 50;
/** SVG ring geometry. Stroke goes around the circle's perimeter; the
 * dashoffset technique drains it from full to empty as time passes. */
const RING_RADIUS = 56;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

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
  /** Remaining grace-window time in ms; null when not in countdown state. */
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // ── Countdown helpers ──────────────────────────────────────────────────────

  const stopCountdown = useCallback((): void => {
    if (countdownIntervalRef.current !== null) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdownRemaining(null);
  }, []);

  const startCountdown = useCallback((): void => {
    const startTime = Date.now();
    setCountdownRemaining(COUNTDOWN_DURATION_MS);

    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, COUNTDOWN_DURATION_MS - elapsed);

      if (remaining <= 0) {
        stopCountdown();
        onConfirm();
        return;
      }
      setCountdownRemaining(remaining);
    }, COUNTDOWN_TICK_MS);
  }, [onConfirm, stopCountdown]);

  // Cleanup interval on unmount + abort countdown if dialog closes mid-window.
  // Also cancel countdown if a server error arrives (e.g. concurrency variant).
  useEffect(() => {
    if (!open || serverError !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: react to external prop transitions (dialog closed by parent or server error returned) by clearing the in-flight timer; setState happens at most once per transition, not on every render.
      stopCountdown();
    }
  }, [open, serverError, stopCountdown]);

  useEffect(() => {
    return () => stopCountdown();
  }, [stopCountdown]);

  // Auto-focus the cancel button when entering countdown — its single primary
  // action and being focusable means ESC + Enter are both intuitive ways out.
  useEffect(() => {
    if (countdownRemaining !== null) {
      cancelButtonRef.current?.focus();
    }
  }, [countdownRemaining]);

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
    // Defer the actual onConfirm() until after the 5s grace window. The
    // network call only fires if the user does NOT cancel during countdown.
    startCountdown();
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
  // VARIANT: Countdown grace window — between confirm-click and request fire
  // ─────────────────────────────────────────────────────────────────────────
  //
  // Rendered while a 5-second cancellation timer is active. The user has
  // already typed the storage name and clicked "Eliminar permanentemente",
  // but the network request hasn't fired yet — they can still abort. Both
  // the explicit Cancel button AND the dialog's native exits (ESC, backdrop)
  // route to `stopCountdown`, so every door out is safe.

  if (countdownRemaining !== null) {
    const secondsRemaining = Math.ceil(countdownRemaining / 1000);
    const progress = countdownRemaining / COUNTDOWN_DURATION_MS;
    const dashOffset = (1 - progress) * RING_CIRCUMFERENCE;

    // Native dialog exits (ESC, backdrop) during countdown route to a unified
    // cancel: stop the timer AND close the dialog entirely. This mirrors what
    // the user expects ("ESC cancels everything") instead of leaving them in
    // a half-state in the form view.
    const cancelCountdownAndClose = (): void => {
      stopCountdown();
      onClose();
    };

    return (
      <Dialog
        open={open}
        onClose={cancelCountdownAndClose}
        closable={true}
        ariaLabelledBy="delete-storage-dialog-title"
      >
        <>
          {/* Progress ring + countdown number */}
          <div className="mb-4 flex justify-center">
            <div className="relative h-32 w-32">
              <svg
                className="h-full w-full -rotate-90"
                viewBox="0 0 128 128"
                aria-hidden="true"
              >
                <circle
                  cx="64"
                  cy="64"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-destructive/15"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="text-destructive"
                  style={{
                    strokeDasharray: RING_CIRCUMFERENCE,
                    strokeDashoffset: dashOffset,
                    transition: `stroke-dashoffset ${COUNTDOWN_TICK_MS}ms linear`,
                  }}
                />
              </svg>
              <div
                className="absolute inset-0 flex items-center justify-center"
                aria-live="polite"
                aria-atomic="true"
                aria-label={t('permanentDelete.countdown.ariaTimeRemaining', {
                  seconds: secondsRemaining,
                })}
              >
                <span className="text-5xl font-bold tabular-nums text-destructive">
                  {secondsRemaining}
                </span>
              </div>
            </div>
          </div>

          {/* Title — name visible so the user confirms what's being deleted */}
          <h2
            id="delete-storage-dialog-title"
            className="mb-2 text-center text-base font-semibold text-neutral-900"
          >
            {t('permanentDelete.countdown.title', { name: storage.name })}
          </h2>

          {/* Reassurance subtitle */}
          <p className="text-center text-sm leading-relaxed text-neutral-600">
            {t('permanentDelete.countdown.subtitle')}
          </p>

          {/* Single prominent cancel — also pre-focused so Enter triggers it */}
          <div className="mt-6 flex justify-center">
            <Button
              ref={cancelButtonRef}
              type="button"
              onClick={stopCountdown}
              className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <span
                className="material-symbols-outlined text-[16px]"
                aria-hidden="true"
              >
                close
              </span>
              {t('permanentDelete.countdown.cancelButton', { seconds: secondsRemaining })}
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
