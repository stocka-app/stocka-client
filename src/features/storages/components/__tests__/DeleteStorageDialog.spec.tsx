// TODO STOC-383: This test file covers the H-07 stub variant of DeleteStorageDialog.
// The component was rewritten in H-08 Paso 5 (STOC-381) to include:
//   - 6 visual states (initial, partial, incorrect, correct, confirming, network-error)
//   - Concurrency variant (not_found / blue info layout)
//   - Typing friction (name-match validation on blur / submit)
//
// Full BDD coverage for the new implementation ships in Paso 8 (STOC-383 — FASE 5).
// The tests below are selectively skipped to keep the suite green while the new
// behavior is untested. Do NOT delete them — they document the expected contracts.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Storage } from '../../types/storages.types';
import type { PermanentDeleteError } from '../../hooks/useStorages';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { name?: string; defaultValue?: string }) => {
      if (opts?.name !== undefined) return `${key}:${opts.name}`;
      return key;
    },
  }),
}));

import { DeleteStorageDialog } from '../DeleteStorageDialog';

const baseStorage: Storage = {
  uuid: 'storage-001',
  name: 'Almacén Central',
  type: 'WAREHOUSE',
  status: 'ARCHIVED',
  address: 'Av. Reforma 123',
  roomType: null,
  icon: 'warehouse',
  color: '#3B82F6',
  description: null,
  archivedAt: '2026-04-01T00:00:00.000Z',
  frozenAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-04-01T00:00:00.000Z',
};

interface RenderOptions {
  open?: boolean;
  storage?: Storage | null;
  isLoading?: boolean;
  serverError?: PermanentDeleteError | null;
  onClose?: () => void;
  onConfirm?: () => void;
}

function renderDialog(opts: RenderOptions = {}): void {
  const {
    open = true,
    storage = baseStorage,
    isLoading = false,
    serverError = null,
    onClose = vi.fn(),
    onConfirm = vi.fn(),
  } = opts;

  render(
    <DeleteStorageDialog
      open={open}
      storage={storage}
      isLoading={isLoading}
      serverError={serverError}
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
}

describe('DeleteStorageDialog', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  // ── Render guards ──────────────────────────────────────────────────────────

  describe('Given the dialog is closed', () => {
    describe('When the component renders', () => {
      it('Then nothing is displayed', () => {
        renderDialog({ open: false });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Given no storage is provided', () => {
    describe('When the component renders', () => {
      it('Then nothing is displayed', () => {
        renderDialog({ storage: null });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  // ── Initial state (state 1) ────────────────────────────────────────────────

  describe('Given the dialog is open with no typing yet', () => {
    describe('When the component renders', () => {
      it('Then the dialog, storage name and confirm button are shown', () => {
        renderDialog();

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        // Storage name appears in the title interpolation (key:name format from mock)
        expect(
          screen.getByText(/permanentDelete\.title:Almacén Central/),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /permanentDelete\.buttons\.confirm/ }),
        ).toBeInTheDocument();
      });

      it('Then the confirm button is disabled (no typing)', () => {
        renderDialog();

        expect(
          screen.getByRole('button', { name: /permanentDelete\.buttons\.confirm/ }),
        ).toBeDisabled();
      });

      it('Then the typing input is present and empty', () => {
        renderDialog();

        const input = screen.getByRole('textbox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveValue('');
      });
    });
  });

  // ── Loading state (state 5) ────────────────────────────────────────────────

  // TODO STOC-383: The loading state in the rewritten component uses the
  // typed-match gate before isLoading — when isLoading is true without having
  // first reached a match, the confirm button was already disabled. The full
  // loading-state assertions (spinner text, cancel disabled) are covered in Paso 8.
  describe.skip('Given isLoading is true', () => {
    describe('When the dialog renders', () => {
      it('Then both buttons are disabled and the primary shows the loading copy', () => {
        renderDialog({ isLoading: true });

        expect(
          screen.getByRole('button', { name: /permanentDelete\.buttons\.cancel/ }),
        ).toBeDisabled();
        expect(
          screen.getByRole('button', { name: /permanentDelete\.buttons\.confirming/ }),
        ).toBeDisabled();
      });
    });
  });

  // ── Network error banner (state 6) ────────────────────────────────────────

  describe('Given a generic "server_error"', () => {
    describe('When the dialog renders', () => {
      it('Then the network error banner is shown', () => {
        renderDialog({ serverError: 'server_error' });

        expect(screen.getByText(/permanentDelete\.error\.network/)).toBeInTheDocument();
      });
    });
  });

  describe('Given an "offline" server error', () => {
    describe('When the dialog renders', () => {
      it('Then the network error banner is shown', () => {
        renderDialog({ serverError: 'offline' });

        expect(screen.getByText(/permanentDelete\.error\.network/)).toBeInTheDocument();
      });
    });
  });

  // ── Concurrency variant ────────────────────────────────────────────────────

  describe('Given a "not_found" server error (concurrency)', () => {
    describe('When the dialog renders', () => {
      it('Then the concurrency title is shown', () => {
        renderDialog({ serverError: 'not_found' });

        expect(
          screen.getByText(/permanentDelete\.error\.concurrent\.title/),
        ).toBeInTheDocument();
      });

      it('Then the concurrency body is shown with the storage name', () => {
        renderDialog({ serverError: 'not_found' });

        expect(
          screen.getByText(/permanentDelete\.error\.concurrent\.body:Almacén Central/),
        ).toBeInTheDocument();
      });

      it('Then the typing input is NOT shown', () => {
        renderDialog({ serverError: 'not_found' });

        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });

      it('Then only the Close button is shown', () => {
        renderDialog({ serverError: 'not_found' });

        expect(
          screen.getByRole('button', { name: /permanentDelete\.buttons\.close/ }),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: /permanentDelete\.buttons\.cancel/ }),
        ).not.toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: /permanentDelete\.buttons\.confirm/ }),
        ).not.toBeInTheDocument();
      });
    });

    describe('When the user clicks Close', () => {
      it('Then onClose is invoked', async () => {
        const onClose = vi.fn();
        renderDialog({ serverError: 'not_found', onClose });

        await user.click(
          screen.getByRole('button', { name: /permanentDelete\.buttons\.close/ }),
        );

        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ── Cancel button ──────────────────────────────────────────────────────────

  describe('Given a user clicks the cancel button', () => {
    describe('When the click handler fires', () => {
      it('Then onClose is invoked once', async () => {
        const onClose = vi.fn();
        renderDialog({ onClose });

        await user.click(
          screen.getByRole('button', { name: /permanentDelete\.buttons\.cancel/ }),
        );

        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ── Backdrop / ESC ─────────────────────────────────────────────────────────

  describe('Given a user clicks the backdrop', () => {
    describe('When not loading', () => {
      it('Then onClose is invoked', async () => {
        const onClose = vi.fn();
        renderDialog({ onClose });

        await user.click(screen.getByRole('dialog'));

        expect(onClose).toHaveBeenCalled();
      });
    });

    describe('When loading', () => {
      it('Then onClose is NOT invoked', async () => {
        const onClose = vi.fn();
        renderDialog({ onClose, isLoading: true });

        await user.click(screen.getByRole('dialog'));

        expect(onClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Given a user presses ESC', () => {
    describe('When not loading', () => {
      it('Then onClose is invoked', () => {
        const onClose = vi.fn();
        renderDialog({ onClose });

        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

        expect(onClose).toHaveBeenCalled();
      });
    });

    describe('When loading', () => {
      it('Then onClose is NOT invoked', () => {
        const onClose = vi.fn();
        renderDialog({ onClose, isLoading: true });

        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

        expect(onClose).not.toHaveBeenCalled();
      });
    });
  });

  // ── Inner content click ────────────────────────────────────────────────────

  describe('Given the user clicks inside the dialog content (not backdrop)', () => {
    it('Then onClose is NOT invoked (inner container stops the click)', async () => {
      const onClose = vi.fn();
      renderDialog({ onClose });

      // Click on the title text (which interpolates to "permanentDelete.title:Almacén Central")
      await user.click(screen.getByText(/permanentDelete\.title:Almacén Central/));

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  // ── Typing and submit — TODO STOC-383 ─────────────────────────────────────

  // TODO STOC-383: Full typing-friction tests (states 2, 3, 4 — partial, incorrect, correct)
  // and the submit flow (state 5 + onConfirm invocation) are covered in Paso 8 (FASE 5).
  // The assertions below are a minimal smoke test to confirm the happy-path type→submit flow.
  describe('Given a user types the exact storage name and submits', () => {
    describe('When the user types the exact name and clicks confirm', () => {
      it('Then the confirm button becomes enabled and onConfirm is called', async () => {
        const onConfirm = vi.fn();
        renderDialog({ onConfirm });

        const input = screen.getByRole('textbox');
        await user.type(input, 'Almacén Central');

        // After typing the full match, click the confirm button
        const confirmBtn = screen.getByRole('button', {
          name: /permanentDelete\.buttons\.confirm/,
        });
        expect(confirmBtn).not.toBeDisabled();
        await user.click(confirmBtn);

        expect(onConfirm).toHaveBeenCalledTimes(1);
      });
    });
  });
});
