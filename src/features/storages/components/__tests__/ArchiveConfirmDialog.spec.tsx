import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Storage } from '../../types/storages.types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { name?: string }) =>
      opts?.name !== undefined ? `${key}:${opts.name}` : key,
  }),
}));

import { ArchiveConfirmDialog } from '../ArchiveConfirmDialog';

const baseStorage: Storage = {
  uuid: 'storage-001',
  name: 'Almacén Central',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: 'Av. Reforma 123',
  roomType: null,
  icon: 'warehouse',
  color: '#3B82F6',
  description: null,
  archivedAt: null,
  frozenAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

interface RenderOptions {
  open?: boolean;
  storage?: Storage | null;
  sourceStatus?: 'ACTIVE' | 'FROZEN';
  isContextActive?: boolean;
  isLastActive?: boolean;
  isLoading?: boolean;
  serverError?: string | null;
  onClose?: () => void;
  onConfirm?: () => void;
}

function renderDialog(opts: RenderOptions = {}): void {
  const {
    open = true,
    storage = baseStorage,
    sourceStatus = 'ACTIVE',
    isContextActive = false,
    isLastActive = false,
    isLoading = false,
    serverError = null,
    onClose = vi.fn(),
    onConfirm = vi.fn(),
  } = opts;

  render(
    <ArchiveConfirmDialog
      open={open}
      storage={storage}
      sourceStatus={sourceStatus}
      isContextActive={isContextActive}
      isLastActive={isLastActive}
      isLoading={isLoading}
      serverError={serverError}
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
}

describe('ArchiveConfirmDialog', () => {
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
      it('Then nothing is displayed even if open is true', () => {
        renderDialog({ storage: null });

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Given the base variant (active, not context, not last)', () => {
    describe('When the dialog renders', () => {
      it('Then the title, body, and primary "Archivar" button are shown without warning blocks', () => {
        renderDialog();

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Almacén Central/)).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /modals\.archive\.confirm/ }),
        ).toBeInTheDocument();
        expect(screen.queryByText(/lastActiveBlock/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/contextBlock/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/frozenInfoBlock/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Given the storage is the active context', () => {
    describe('When the dialog renders', () => {
      it('Then the amber context block is shown', () => {
        renderDialog({ isContextActive: true });

        expect(screen.getByText(/modals\.archive\.contextBlock/)).toBeInTheDocument();
      });
    });
  });

  describe('Given the storage is the last active', () => {
    describe('When the dialog renders', () => {
      it('Then the amber warning block shows and the primary label switches to "Archivar de todos modos"', () => {
        renderDialog({ isLastActive: true });

        expect(screen.getByText(/modals\.archive\.lastActiveBlock/)).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /modals\.archive\.confirmAnyway/ }),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Given both isContextActive and isLastActive are true', () => {
    describe('When the dialog renders', () => {
      it('Then only the last-active block shows (priority wins over context)', () => {
        renderDialog({ isContextActive: true, isLastActive: true });

        expect(screen.getByText(/modals\.archive\.lastActiveBlock/)).toBeInTheDocument();
        expect(screen.queryByText(/modals\.archive\.contextBlock/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Given the source status is FROZEN without context or last-active flags', () => {
    describe('When the dialog renders', () => {
      it('Then the blue FROZEN info block is shown', () => {
        renderDialog({ sourceStatus: 'FROZEN' });

        expect(screen.getByText(/modals\.archive\.frozenInfoBlock/)).toBeInTheDocument();
      });
    });
  });

  describe('Given the source status is FROZEN and the storage is also context active', () => {
    describe('When the dialog renders', () => {
      it('Then the context block wins over the FROZEN info block (context > frozen), and neither when source is FROZEN (ACTIVE-only context)', () => {
        renderDialog({ sourceStatus: 'FROZEN', isContextActive: true });

        expect(screen.getByText(/modals\.archive\.frozenInfoBlock/)).toBeInTheDocument();
        expect(screen.queryByText(/modals\.archive\.contextBlock/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Given isLoading is true', () => {
    describe('When the dialog renders', () => {
      it('Then both buttons are disabled and the primary shows the loading copy', () => {
        renderDialog({ isLoading: true });

        const cancelBtn = screen.getByRole('button', { name: /modals\.archive\.cancel/ });
        const confirmBtn = screen.getByRole('button', { name: /modals\.archive\.loading/ });
        expect(cancelBtn).toBeDisabled();
        expect(confirmBtn).toBeDisabled();
      });
    });
  });

  describe('Given a server error is present', () => {
    describe('When the dialog renders', () => {
      it('Then the red inline error banner is shown and the primary stays enabled', () => {
        renderDialog({ serverError: 'server_error' });

        expect(screen.getByText(/modals\.archive\.serverError/)).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /modals\.archive\.confirm/ }),
        ).toBeEnabled();
      });
    });
  });

  describe('Given a user clicks the primary button', () => {
    describe('When the click handler fires', () => {
      it('Then onConfirm is invoked once', async () => {
        const onConfirm = vi.fn();
        renderDialog({ onConfirm });

        await user.click(screen.getByRole('button', { name: /modals\.archive\.confirm/ }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Given a user clicks the cancel button', () => {
    describe('When the click handler fires', () => {
      it('Then onClose is invoked once', async () => {
        const onClose = vi.fn();
        renderDialog({ onClose });

        await user.click(screen.getByRole('button', { name: /modals\.archive\.cancel/ }));

        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });
});
