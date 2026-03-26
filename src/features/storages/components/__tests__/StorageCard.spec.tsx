import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Storage } from '../../types/storages.types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { StorageCard } from '../StorageCard';

const activeWarehouse: Storage = {
  uuid: 'storage-001',
  name: 'Main Warehouse',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: 'Calle 1 #100',
  roomType: null,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const frozenStoreRoom: Storage = {
  uuid: 'storage-002',
  name: 'Frozen Store',
  type: 'STORE_ROOM',
  status: 'FROZEN',
  address: null,
  roomType: null,
  archivedAt: null,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const archivedRoom: Storage = {
  uuid: 'storage-003',
  name: 'Old Custom Room',
  type: 'CUSTOM_ROOM',
  status: 'ARCHIVED',
  address: null,
  roomType: null,
  archivedAt: '2026-03-01T00:00:00.000Z',
  createdAt: '2026-01-03T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

describe('Given StorageCard renders a storage with role-based actions', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onEdit = vi.fn();
  const onArchive = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    onEdit.mockClear();
    onArchive.mockClear();
    onDelete.mockClear();
    user = userEvent.setup();
  });

  describe('When the storage is active', () => {
    it('Then the storage name is rendered', () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('Main Warehouse')).toBeInTheDocument();
    });

    it('Then the type badge label is rendered', () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('types.WAREHOUSE')).toBeInTheDocument();
    });

    it('Then the status label is rendered', () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('statuses.ACTIVE')).toBeInTheDocument();
    });

    it('Then the address is shown when present', () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('Calle 1 #100')).toBeInTheDocument();
    });

    it('Then no address line is rendered when address is null', () => {
      render(<StorageCard storage={{ ...activeWarehouse, address: null }} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('Calle 1 #100')).not.toBeInTheDocument();
    });
  });

  describe('When the storage is active and all action handlers are provided (Manager role)', () => {
    it('Then Ver más, Editar, and Archivar actions are shown', () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('actions.view')).toBeInTheDocument();
      expect(screen.getByText('actions.edit')).toBeInTheDocument();
      expect(screen.getByText('actions.archive')).toBeInTheDocument();
    });

    it('Then the Eliminar action is not shown for an active storage', () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('actions.delete')).not.toBeInTheDocument();
    });
  });

  describe('When the storage is frozen', () => {
    it('Then the frozen status label is rendered', () => {
      render(<StorageCard storage={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('statuses.FROZEN')).toBeInTheDocument();
    });

    it('Then the archive action is not shown for a frozen storage', () => {
      render(<StorageCard storage={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('actions.archive')).not.toBeInTheDocument();
    });

    it('Then the delete action is not shown for a frozen storage', () => {
      render(<StorageCard storage={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('actions.delete')).not.toBeInTheDocument();
    });

    it('Then Ver más is still shown for a frozen storage', () => {
      render(<StorageCard storage={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('actions.view')).toBeInTheDocument();
    });
  });

  describe('When the storage is archived and the delete handler is provided (Owner role)', () => {
    it('Then the archived status label is rendered', () => {
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('statuses.ARCHIVED')).toBeInTheDocument();
    });

    it('Then Ver más, Editar, and Eliminar actions are shown', () => {
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('actions.view')).toBeInTheDocument();
      expect(screen.getByText('actions.edit')).toBeInTheDocument();
      expect(screen.getByText('actions.delete')).toBeInTheDocument();
    });

    it('Then the Archivar action is not shown for an archived storage', () => {
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('actions.archive')).not.toBeInTheDocument();
    });
  });

  describe('When the storage is archived and the restore handler is provided', () => {
    it('Then Restaurar action is shown when onRestore is provided', () => {
      const onRestore = vi.fn();
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} onDelete={onDelete} />);
      expect(screen.getByText('actions.restore')).toBeInTheDocument();
    });

    it('Then Restaurar action is not shown when onRestore is not provided', () => {
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('actions.restore')).not.toBeInTheDocument();
    });
  });

  describe('When the user clicks the Restaurar button on an archived storage', () => {
    it('Then onRestore is called with the storage', async () => {
      const onRestore = vi.fn();
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} onDelete={onDelete} />);
      await user.click(screen.getByText('actions.restore'));
      expect(onRestore).toHaveBeenCalledWith(archivedRoom);
    });
  });

  describe('When no action handlers are provided (Observer role)', () => {
    it('Then only the Ver más action is shown', () => {
      render(<StorageCard storage={activeWarehouse} />);
      expect(screen.getByText('actions.view')).toBeInTheDocument();
      expect(screen.queryByText('actions.edit')).not.toBeInTheDocument();
      expect(screen.queryByText('actions.archive')).not.toBeInTheDocument();
      expect(screen.queryByText('actions.delete')).not.toBeInTheDocument();
    });
  });

  describe('When only the edit handler is provided (Warehouse Keeper role)', () => {
    it('Then Editar is shown but Archivar is not shown for active storages', () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} />);
      expect(screen.getByText('actions.edit')).toBeInTheDocument();
      expect(screen.queryByText('actions.archive')).not.toBeInTheDocument();
    });
  });

  describe('When the user clicks the Editar button', () => {
    it('Then onEdit is called with the storage', async () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await user.click(screen.getByText('actions.edit'));
      expect(onEdit).toHaveBeenCalledWith(activeWarehouse);
    });
  });

  describe('When the user clicks the Archivar button', () => {
    it('Then onArchive is called with the storage', async () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await user.click(screen.getByText('actions.archive'));
      expect(onArchive).toHaveBeenCalledWith(activeWarehouse);
    });
  });

  describe('When the user clicks the Eliminar button on an archived storage', () => {
    it('Then onDelete is called with the storage', async () => {
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await user.click(screen.getByText('actions.delete'));
      expect(onDelete).toHaveBeenCalledWith(archivedRoom);
    });
  });

  describe('When a STORE_ROOM type storage is rendered', () => {
    it('Then the STORE_ROOM type badge label is shown', () => {
      render(<StorageCard storage={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('types.STORE_ROOM')).toBeInTheDocument();
    });
  });

  describe('When a CUSTOM_ROOM type storage is rendered', () => {
    it('Then the CUSTOM_ROOM type badge label is shown', () => {
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('types.CUSTOM_ROOM')).toBeInTheDocument();
    });
  });
});
