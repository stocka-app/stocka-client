import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Storage } from '../../types/storages.types';
import type { PermanentDeleteError } from '../../hooks/useStorages';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { name?: string }) =>
      opts?.name !== undefined ? `${key}:${opts.name}` : key,
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

  describe('Given the base variant', () => {
    describe('When the dialog renders', () => {
      it('Then the title, body, mandatory red warning block and red primary "Eliminar" button are shown', () => {
        renderDialog();

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Almacén Central/)).toBeInTheDocument();
        expect(screen.getByText(/modals\.delete\.warningBlock/)).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /modals\.delete\.confirm/ }),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Given isLoading is true', () => {
    describe('When the dialog renders', () => {
      it('Then both buttons are disabled and the primary shows the loading copy', () => {
        renderDialog({ isLoading: true });

        expect(
          screen.getByRole('button', { name: /modals\.delete\.cancel/ }),
        ).toBeDisabled();
        expect(
          screen.getByRole('button', { name: /modals\.delete\.loading/ }),
        ).toBeDisabled();
      });
    });
  });

  // TODO STOC-383: el banner 'not_implemented' fue removido cuando
  // PermanentDeleteError reemplazó la unión del stub en H-08 Paso 4.
  // Tests reales del dialog de eliminación van en el Paso 8 (FASE 5)
  // y cubrirán PermanentDeleteStorageDialog (STOC-381), que reemplaza
  // este componente stub en el Paso 5.
  describe.skip('Given a "not_implemented" server error', () => {
    describe('When the dialog renders', () => {
      it('Then the stub banner is shown and the primary stays enabled for retry', () => {
        // placeholder — ver TODO arriba
      });
    });
  });

  describe('Given a generic "server_error"', () => {
    describe('When the dialog renders', () => {
      it('Then the server error banner is shown', () => {
        renderDialog({ serverError: 'server_error' });

        expect(screen.getByText(/modals\.delete\.serverError/)).toBeInTheDocument();
      });
    });
  });

  describe('Given a user clicks the primary button', () => {
    describe('When the click handler fires', () => {
      it('Then onConfirm is invoked once', async () => {
        const onConfirm = vi.fn();
        renderDialog({ onConfirm });

        await user.click(screen.getByRole('button', { name: /modals\.delete\.confirm/ }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Given a user clicks the cancel button', () => {
    describe('When the click handler fires', () => {
      it('Then onClose is invoked once', async () => {
        const onClose = vi.fn();
        renderDialog({ onClose });

        await user.click(screen.getByRole('button', { name: /modals\.delete\.cancel/ }));

        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

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

  describe('Given the user clicks inside the dialog content (not backdrop)', () => {
    it('Then onClose is NOT invoked (inner container stops the click)', async () => {
      const onClose = vi.fn();
      renderDialog({ onClose });

      await user.click(screen.getByText(/Almacén Central/));

      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
