import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Storage } from '../../types/storages.types';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { name?: string }) =>
      opts?.name ? `${key}:${opts.name}` : key,
  }),
}));

// Import after mocks
import { FreezeConfirmDialog } from '../FreezeConfirmDialog';

// ── Fixtures ───────────────────────────────────────────────────────────────────

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
    isContextActive = false,
    isLastActive = false,
    isLoading = false,
    serverError = null,
    onClose = vi.fn(),
    onConfirm = vi.fn(),
  } = opts;

  render(
    <FreezeConfirmDialog
      open={open}
      storage={storage}
      isContextActive={isContextActive}
      isLastActive={isLastActive}
      isLoading={isLoading}
      serverError={serverError}
      onClose={onClose}
      onConfirm={onConfirm}
    />,
  );
}

// ═════════════════════════════════════════════════════════════════════════════

describe('FreezeConfirmDialog', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  // ── Closed state ────────────────────────────────────────────────────────────

  describe('Given open is false', () => {
    describe('When rendered', () => {
      it('Then returns null (nothing rendered)', () => {
        const { container } = render(
          <FreezeConfirmDialog
            open={false}
            storage={baseStorage}
            isContextActive={false}
            isLastActive={false}
            isLoading={false}
            serverError={null}
            onClose={vi.fn()}
            onConfirm={vi.fn()}
          />,
        );
        expect(container).toBeEmptyDOMElement();
      });
    });
  });

  describe('Given storage is null and open is true', () => {
    describe('When rendered', () => {
      it('Then returns null (nothing rendered)', () => {
        const { container } = render(
          <FreezeConfirmDialog
            open={true}
            storage={null}
            isContextActive={false}
            isLastActive={false}
            isLoading={false}
            serverError={null}
            onClose={vi.fn()}
            onConfirm={vi.fn()}
          />,
        );
        expect(container).toBeEmptyDOMElement();
      });
    });
  });

  // ── Base variant (E2.1) ─────────────────────────────────────────────────────

  describe('Given the dialog is open with a storage (base variant)', () => {
    describe('When rendered', () => {
      beforeEach(() => {
        renderDialog();
      });

      it('Then shows role=dialog with aria-modal', () => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
      });

      it('Then shows title with storage name in quotes', () => {
        expect(
          screen.getByText('modals.freeze.title:Almacén Central'),
        ).toBeInTheDocument();
      });

      it('Then shows body text explaining consequences', () => {
        expect(screen.getByText('modals.freeze.body')).toBeInTheDocument();
      });

      it('Then shows safety line about reactivation', () => {
        expect(screen.getByText('modals.freeze.safetyLine')).toBeInTheDocument();
      });

      it('Then shows Cancelar button', () => {
        expect(
          screen.getByRole('button', { name: 'modals.freeze.cancel' }),
        ).toBeInTheDocument();
      });

      it('Then shows Congelar button', () => {
        expect(
          screen.getByRole('button', { name: 'modals.freeze.confirm' }),
        ).toBeInTheDocument();
      });

      it('Then does NOT show the info block', () => {
        expect(screen.queryByText('modals.freeze.contextBlock')).not.toBeInTheDocument();
      });

      it('Then does NOT show the warning block', () => {
        expect(
          screen.queryByText('modals.freeze.lastActiveBlock'),
        ).not.toBeInTheDocument();
      });
    });

    describe('When user clicks Congelar', () => {
      it('Then onConfirm is called', async () => {
        const onConfirm = vi.fn();
        render(
          <FreezeConfirmDialog
            open={true}
            storage={baseStorage}
            isContextActive={false}
            isLastActive={false}
            isLoading={false}
            serverError={null}
            onClose={vi.fn()}
            onConfirm={onConfirm}
          />,
        );
        await user.click(screen.getByRole('button', { name: 'modals.freeze.confirm' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
      });
    });

    describe('When user clicks Cancelar', () => {
      it('Then onClose is called', async () => {
        const onClose = vi.fn();
        render(
          <FreezeConfirmDialog
            open={true}
            storage={baseStorage}
            isContextActive={false}
            isLastActive={false}
            isLoading={false}
            serverError={null}
            onClose={onClose}
            onConfirm={vi.fn()}
          />,
        );
        await user.click(screen.getByRole('button', { name: 'modals.freeze.cancel' }));
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    describe('When user clicks the backdrop', () => {
      it('Then onClose is called', async () => {
        const onClose = vi.fn();
        render(
          <FreezeConfirmDialog
            open={true}
            storage={baseStorage}
            isContextActive={false}
            isLastActive={false}
            isLoading={false}
            serverError={null}
            onClose={onClose}
            onConfirm={vi.fn()}
          />,
        );
        // The outer div IS the backdrop — clicking it fires handleBackdropClick
        await user.click(screen.getByRole('dialog'));
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    describe('When the inner content div is clicked', () => {
      it('Then onClose is NOT called (stopPropagation)', () => {
        const onClose = vi.fn();
        render(
          <FreezeConfirmDialog
            open={true}
            storage={baseStorage}
            isContextActive={false}
            isLastActive={false}
            isLoading={false}
            serverError={null}
            onClose={onClose}
            onConfirm={vi.fn()}
          />,
        );
        // Click the title (inside the inner content div which stops propagation)
        fireEvent.click(screen.getByText('modals.freeze.title:Almacén Central'));
        expect(onClose).not.toHaveBeenCalled();
      });
    });
  });

  // ── Variant 2.2 — context active ────────────────────────────────────────────

  describe('Given isContextActive is true (variant 2.2)', () => {
    describe('When rendered', () => {
      beforeEach(() => {
        renderDialog({ isContextActive: true });
      });

      it('Then shows the blue info block', () => {
        expect(
          screen.getByText('modals.freeze.contextBlock'),
        ).toBeInTheDocument();
      });

      it('Then does NOT show the warning block', () => {
        expect(
          screen.queryByText('modals.freeze.lastActiveBlock'),
        ).not.toBeInTheDocument();
      });
    });
  });

  // ── Variant 2.3 — last active ────────────────────────────────────────────────

  describe('Given isLastActive is true (variant 2.3)', () => {
    describe('When rendered', () => {
      beforeEach(() => {
        renderDialog({ isLastActive: true });
      });

      it('Then shows the amber warning block', () => {
        expect(
          screen.getByText('modals.freeze.lastActiveBlock'),
        ).toBeInTheDocument();
      });

      it('Then button text is confirmAnyway', () => {
        expect(
          screen.getByRole('button', { name: 'modals.freeze.confirmAnyway' }),
        ).toBeInTheDocument();
      });

      it('Then does NOT show info block', () => {
        expect(
          screen.queryByText('modals.freeze.contextBlock'),
        ).not.toBeInTheDocument();
      });
    });
  });

  // ── Variant 2.4 — both isContextActive and isLastActive ─────────────────────

  describe('Given both isContextActive and isLastActive are true (variant 2.4)', () => {
    describe('When rendered', () => {
      beforeEach(() => {
        renderDialog({ isContextActive: true, isLastActive: true });
      });

      it('Then shows ONLY the warning block (last active subsumes info)', () => {
        expect(
          screen.getByText('modals.freeze.lastActiveBlock'),
        ).toBeInTheDocument();
      });

      it('Then does NOT show the info block', () => {
        expect(
          screen.queryByText('modals.freeze.contextBlock'),
        ).not.toBeInTheDocument();
      });
    });
  });

  // ── Variant 2.5 — loading state ─────────────────────────────────────────────

  describe('Given isLoading is true (variant 2.5)', () => {
    describe('When rendered', () => {
      beforeEach(() => {
        renderDialog({ isLoading: true });
      });

      it('Then shows the loading text on the confirm button', () => {
        expect(screen.getByText('modals.freeze.loading')).toBeInTheDocument();
      });

      it('Then Cancel button is disabled', () => {
        expect(
          screen.getByRole('button', { name: 'modals.freeze.cancel' }),
        ).toBeDisabled();
      });
    });

    describe('When user clicks the backdrop', () => {
      it('Then onClose is NOT called (blocked by isLoading)', async () => {
        const onClose = vi.fn();
        render(
          <FreezeConfirmDialog
            open={true}
            storage={baseStorage}
            isContextActive={false}
            isLastActive={false}
            isLoading={true}
            serverError={null}
            onClose={onClose}
            onConfirm={vi.fn()}
          />,
        );
        await user.click(screen.getByRole('dialog'));
        expect(onClose).not.toHaveBeenCalled();
      });
    });

    describe('When user presses Escape', () => {
      it('Then onClose is NOT called (blocked by isLoading)', async () => {
        const onClose = vi.fn();
        render(
          <FreezeConfirmDialog
            open={true}
            storage={baseStorage}
            isContextActive={false}
            isLastActive={false}
            isLoading={true}
            serverError={null}
            onClose={onClose}
            onConfirm={vi.fn()}
          />,
        );
        await user.keyboard('{Escape}');
        expect(onClose).not.toHaveBeenCalled();
      });
    });
  });

  // ── Escape key when NOT loading ──────────────────────────────────────────────

  describe('Given the dialog is open and not loading', () => {
    describe('When user presses Escape', () => {
      it('Then onClose IS called', async () => {
        const onClose = vi.fn();
        render(
          <FreezeConfirmDialog
            open={true}
            storage={baseStorage}
            isContextActive={false}
            isLastActive={false}
            isLoading={false}
            serverError={null}
            onClose={onClose}
            onConfirm={vi.fn()}
          />,
        );
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    describe('When user presses a key other than Escape', () => {
      it('Then onClose is NOT called', () => {
        const onClose = vi.fn();
        render(
          <FreezeConfirmDialog
            open={true}
            storage={baseStorage}
            isContextActive={false}
            isLastActive={false}
            isLoading={false}
            serverError={null}
            onClose={onClose}
            onConfirm={vi.fn()}
          />,
        );
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter' });
        expect(onClose).not.toHaveBeenCalled();
      });
    });
  });

  // ── Variant 2.6 — server error ───────────────────────────────────────────────

  describe('Given serverError is set (variant 2.6)', () => {
    describe('When rendered', () => {
      beforeEach(() => {
        renderDialog({ serverError: 'modals.freeze.serverError' });
      });

      it('Then shows the red error banner', () => {
        expect(
          screen.getByText('modals.freeze.serverError'),
        ).toBeInTheDocument();
      });

      it('Then Congelar button is still enabled (retry possible)', () => {
        expect(
          screen.getByRole('button', { name: 'modals.freeze.confirm' }),
        ).not.toBeDisabled();
      });
    });
  });
});
