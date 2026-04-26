import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StorageDetailPanel } from '@/features/storages/components/StorageDetailPanel';
import type { Storage, StorageStatus } from '@/features/storages/types/storages.types';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

function makeStorage(overrides: Partial<Storage> = {}): Storage {
  return {
    uuid: 'storage-001',
    name: 'WH Norte',
    type: 'WAREHOUSE',
    status: 'ACTIVE',
    address: 'Av. Industrial 1000',
    roomType: null,
    icon: 'warehouse',
    color: '#0066FF',
    description: 'Almacén principal',
    archivedAt: null,
    frozenAt: null,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-02-01T12:00:00.000Z',
    ...overrides,
  };
}

interface RenderArgs {
  storage?: Storage | null;
  open?: boolean;
  status?: StorageStatus;
  isOffline?: boolean;
  canUpdate?: boolean;
  canUnfreeze?: boolean;
  canRestore?: boolean;
  canDelete?: boolean;
  withOnDelete?: boolean;
}

function renderPanel(args: RenderArgs = {}): {
  onClose: ReturnType<typeof vi.fn>;
  onEdit: ReturnType<typeof vi.fn>;
  onReactivate: ReturnType<typeof vi.fn>;
  onRestore: ReturnType<typeof vi.fn>;
  onDelete: ReturnType<typeof vi.fn>;
  storage: Storage | null;
} {
  const {
    open = true,
    status,
    isOffline = false,
    canUpdate = true,
    canUnfreeze = true,
    canRestore = true,
    canDelete = false,
    withOnDelete = true,
  } = args;
  const finalStorage =
    'storage' in args
      ? args.storage ?? null
      : makeStorage(status !== undefined ? { status } : {});
  const onClose = vi.fn();
  const onEdit = vi.fn();
  const onReactivate = vi.fn();
  const onRestore = vi.fn();
  const onDelete = vi.fn();
  render(
    <StorageDetailPanel
      storage={finalStorage}
      open={open}
      canUpdate={canUpdate}
      canUnfreeze={canUnfreeze}
      canRestore={canRestore}
      canDelete={canDelete}
      isOffline={isOffline}
      onClose={onClose}
      onEdit={onEdit}
      onReactivate={onReactivate}
      onRestore={onRestore}
      onDelete={withOnDelete ? onDelete : undefined}
    />,
  );
  return { onClose, onEdit, onReactivate, onRestore, onDelete, storage: finalStorage };
}

describe('StorageDetailPanel', () => {
  describe('Given an ACTIVE storage', () => {
    describe('When the panel renders', () => {
      it('Then no Reactivar nor Restaurar CTA is visible — only Editar', () => {
        renderPanel({ status: 'ACTIVE' });
        expect(screen.queryByRole('button', { name: /Reactivar/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Restaurar/ })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Editar/ })).toBeInTheDocument();
      });
    });
  });

  describe('Given a FROZEN storage and the user can unfreeze', () => {
    describe('When the panel renders', () => {
      it('Then the Reactivar CTA is shown', () => {
        renderPanel({ status: 'FROZEN' });
        expect(screen.getByRole('button', { name: /Reactivar/ })).toBeInTheDocument();
      });
    });

    describe('When the user clicks Reactivar', () => {
      it('Then onReactivate is called with the storage', async () => {
        const user = userEvent.setup();
        const { onReactivate, storage } = renderPanel({ status: 'FROZEN' });
        await user.click(screen.getByRole('button', { name: /Reactivar/ }));
        expect(onReactivate).toHaveBeenCalledWith(storage);
      });
    });
  });

  describe('Given an ARCHIVED storage and the user can restore', () => {
    describe('When the panel renders', () => {
      it('Then the Restaurar CTA is shown', () => {
        renderPanel({ status: 'ARCHIVED' });
        expect(screen.getByRole('button', { name: /Restaurar/ })).toBeInTheDocument();
      });

      it('Then the body section is rendered with opacity-60 to signal stopped state', () => {
        renderPanel({ status: 'ARCHIVED' });
        const tipoLabel = screen.getByText(/^Tipo$/);
        const body = tipoLabel.closest('div.flex-1');
        expect(body).not.toBeNull();
        expect(body).toHaveClass('opacity-60');
        expect(body).toHaveTextContent(/Av\. Industrial 1000/);
      });
    });

    describe('When the user clicks Restaurar', () => {
      it('Then onRestore is called with the storage', async () => {
        const user = userEvent.setup();
        const { onRestore, storage } = renderPanel({ status: 'ARCHIVED' });
        await user.click(screen.getByRole('button', { name: /Restaurar/ }));
        expect(onRestore).toHaveBeenCalledWith(storage);
      });
    });
  });

  describe('Given the browser is offline and the storage is ARCHIVED', () => {
    describe('When the user attempts the Restaurar CTA', () => {
      it('Then the button is disabled and onRestore is never called', async () => {
        const user = userEvent.setup();
        const { onRestore } = renderPanel({ status: 'ARCHIVED', isOffline: true });
        const cta = screen.getByRole('button', { name: /Restaurar/ });
        expect(cta).toBeDisabled();
        await user.click(cta);
        expect(onRestore).not.toHaveBeenCalled();
      });
    });
  });

  describe('Given the browser is offline and the storage is FROZEN', () => {
    describe('When the panel renders the Reactivar CTA', () => {
      it('Then the button is disabled with offline styling', () => {
        renderPanel({ status: 'FROZEN', isOffline: true });
        const cta = screen.getByRole('button', { name: /Reactivar/ });
        expect(cta).toBeDisabled();
        expect(cta).toHaveClass('cursor-not-allowed');
      });
    });
  });

  describe('Given a CUSTOM_ROOM storage with roomType set', () => {
    describe('When the panel renders', () => {
      it('Then it shows the room type field', () => {
        renderPanel({
          storage: makeStorage({ type: 'CUSTOM_ROOM', roomType: 'Office' }),
        });
        expect(screen.getByText('Office')).toBeInTheDocument();
      });
    });
  });

  describe('Given a FROZEN storage with frozenAt set', () => {
    describe('When the panel renders', () => {
      it('Then it shows the frozen date', () => {
        renderPanel({
          storage: makeStorage({
            status: 'FROZEN',
            frozenAt: '2026-03-15T08:00:00.000Z',
          }),
        });
        expect(screen.getByText(/Congelado/)).toBeInTheDocument();
      });
    });
  });

  describe('Given an ARCHIVED storage with archivedAt set', () => {
    describe('When the panel renders', () => {
      it('Then it shows the archived date', () => {
        renderPanel({
          storage: makeStorage({
            status: 'ARCHIVED',
            archivedAt: '2026-04-01T12:00:00.000Z',
          }),
        });
        expect(screen.getByText(/Archivado/)).toBeInTheDocument();
      });
    });
  });

  describe('Given an ACTIVE storage and the user can edit', () => {
    describe('When the user clicks Editar', () => {
      it('Then onEdit is called with the storage', async () => {
        const user = userEvent.setup();
        const { onEdit, storage } = renderPanel({ status: 'ACTIVE' });
        await user.click(screen.getByRole('button', { name: /Editar/ }));
        expect(onEdit).toHaveBeenCalledWith(storage);
      });
    });
  });

  describe('Given a storage with a null createdAt', () => {
    describe('When the panel renders', () => {
      it('Then formatDate returns the em-dash fallback', () => {
        renderPanel({
          storage: makeStorage({ createdAt: null as unknown as string }),
        });
        expect(screen.getByText('—')).toBeInTheDocument();
      });
    });
  });

  describe('Given a storage with a date that causes DateTimeFormat to throw', () => {
    describe('When the panel renders', () => {
      it('Then the catch branch returns the raw ISO string', () => {
        const OriginalDTF = Intl.DateTimeFormat;
        vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((...args) => {
          const instance = new OriginalDTF(...args);
          Object.defineProperty(instance, 'format', {
            value: () => { throw new RangeError('Invalid time value'); },
          });
          return instance;
        });
        renderPanel({
          storage: makeStorage({ createdAt: 'bad-date' }),
        });
        expect(screen.getByText('bad-date')).toBeInTheDocument();
        vi.restoreAllMocks();
      });
    });
  });

  describe('Given the user can not update the storage', () => {
    describe('When the panel renders', () => {
      it('Then the Editar button is omitted', () => {
        renderPanel({ canUpdate: false });
        expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument();
      });
    });
  });

  describe('Given the user clicks the close button', () => {
    describe('When the click fires', () => {
      it('Then onClose is called', async () => {
        const user = userEvent.setup();
        const { onClose } = renderPanel();
        await user.click(screen.getByRole('button', { name: /Cerrar/ }));
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Given storage is null (drawer animating out)', () => {
    describe('When the panel renders', () => {
      it('Then no header content is mounted', () => {
        renderPanel({ storage: null });
        expect(screen.queryByText(/WH Norte/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Given an ARCHIVED storage with delete capability and onDelete handler', () => {
    describe('When the user clicks the permanent-delete CTA', () => {
      it('Then onDelete is called with the storage', async () => {
        const user = userEvent.setup();
        const { onDelete, storage } = renderPanel({
          status: 'ARCHIVED',
          canDelete: true,
        });

        await user.click(
          screen.getByRole('button', { name: /permanentDelete\.detailCtaAriaLabel/ }),
        );

        expect(onDelete).toHaveBeenCalledWith(storage);
      });
    });
  });

  describe('Given an ARCHIVED storage but no canDelete capability', () => {
    describe('When the panel renders', () => {
      it('Then the permanent-delete CTA is omitted', () => {
        renderPanel({ status: 'ARCHIVED', canDelete: false });
        expect(
          screen.queryByRole('button', { name: /permanentDelete\.detailCtaAriaLabel/ }),
        ).not.toBeInTheDocument();
      });
    });
  });
});
