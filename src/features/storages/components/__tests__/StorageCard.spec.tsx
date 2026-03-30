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

/**
 * Opens the three-dot context menu and returns a scoped container for querying menu items.
 * Radix DropdownMenu renders content in a portal, so we query the full document body.
 */
async function openContextMenu(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  const trigger = screen.getByRole('button', { name: 'actions.menu' });
  await user.click(trigger);
}

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
    it('Then Ver más, Editar, and Archivar actions are shown', async () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await openContextMenu(user);
      expect(await screen.findByRole('menuitem', { name: 'actions.view' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'actions.edit' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'actions.archive' })).toBeInTheDocument();
    });

    it('Then the Eliminar action is not shown for an active storage', async () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await openContextMenu(user);
      await screen.findByRole('menuitem', { name: 'actions.view' });
      expect(screen.queryByRole('menuitem', { name: 'actions.delete' })).not.toBeInTheDocument();
    });
  });

  describe('When the storage is frozen', () => {
    it('Then the frozen status label is rendered', () => {
      render(<StorageCard storage={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('statuses.FROZEN')).toBeInTheDocument();
    });

    it('Then the archive action is not shown for a frozen storage', async () => {
      render(<StorageCard storage={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await openContextMenu(user);
      await screen.findByRole('menuitem', { name: 'actions.view' });
      expect(screen.queryByRole('menuitem', { name: 'actions.archive' })).not.toBeInTheDocument();
    });

    it('Then the delete action is not shown for a frozen storage', async () => {
      render(<StorageCard storage={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await openContextMenu(user);
      await screen.findByRole('menuitem', { name: 'actions.view' });
      expect(screen.queryByRole('menuitem', { name: 'actions.delete' })).not.toBeInTheDocument();
    });

    it('Then Ver más is still shown for a frozen storage', async () => {
      render(<StorageCard storage={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await openContextMenu(user);
      expect(await screen.findByRole('menuitem', { name: 'actions.view' })).toBeInTheDocument();
    });
  });

  describe('When the storage is archived and the delete handler is provided (Owner role)', () => {
    it('Then the archived status label is rendered', () => {
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('statuses.ARCHIVED')).toBeInTheDocument();
    });

    it('Then Ver más, Editar, and Eliminar actions are shown', async () => {
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await openContextMenu(user);
      expect(await screen.findByRole('menuitem', { name: 'actions.view' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'actions.edit' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'actions.delete' })).toBeInTheDocument();
    });

    it('Then the Archivar action is not shown for an archived storage', async () => {
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await openContextMenu(user);
      await screen.findByRole('menuitem', { name: 'actions.view' });
      expect(screen.queryByRole('menuitem', { name: 'actions.archive' })).not.toBeInTheDocument();
    });
  });

  describe('When the storage is archived and the restore handler is provided', () => {
    it('Then Restaurar action is shown when onRestore is provided', async () => {
      const onRestore = vi.fn();
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} onDelete={onDelete} />);
      await openContextMenu(user);
      expect(await screen.findByRole('menuitem', { name: 'actions.restore' })).toBeInTheDocument();
    });

    it('Then Restaurar action is not shown when onRestore is not provided', async () => {
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await openContextMenu(user);
      await screen.findByRole('menuitem', { name: 'actions.view' });
      expect(screen.queryByRole('menuitem', { name: 'actions.restore' })).not.toBeInTheDocument();
    });
  });

  describe('When the user clicks the Restaurar button on an archived storage', () => {
    it('Then onRestore is called with the storage', async () => {
      const onRestore = vi.fn();
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} onDelete={onDelete} />);
      await openContextMenu(user);
      const restoreItem = await screen.findByRole('menuitem', { name: 'actions.restore' });
      await user.click(restoreItem);
      expect(onRestore).toHaveBeenCalledWith(archivedRoom);
    });
  });

  describe('When no action handlers are provided (Observer role)', () => {
    it('Then only the Ver más action is shown', async () => {
      render(<StorageCard storage={activeWarehouse} />);
      await openContextMenu(user);
      expect(await screen.findByRole('menuitem', { name: 'actions.view' })).toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'actions.edit' })).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'actions.archive' })).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'actions.delete' })).not.toBeInTheDocument();
    });
  });

  describe('When only the edit handler is provided (Warehouse Keeper role)', () => {
    it('Then Editar is shown but Archivar is not shown for active storages', async () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} />);
      await openContextMenu(user);
      expect(await screen.findByRole('menuitem', { name: 'actions.edit' })).toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'actions.archive' })).not.toBeInTheDocument();
    });
  });

  describe('When the user clicks the Editar button', () => {
    it('Then onEdit is called with the storage', async () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await openContextMenu(user);
      const editItem = await screen.findByRole('menuitem', { name: 'actions.edit' });
      await user.click(editItem);
      expect(onEdit).toHaveBeenCalledWith(activeWarehouse);
    });
  });

  describe('When the user clicks the Archivar button', () => {
    it('Then onArchive is called with the storage', async () => {
      render(<StorageCard storage={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await openContextMenu(user);
      const archiveItem = await screen.findByRole('menuitem', { name: 'actions.archive' });
      await user.click(archiveItem);
      expect(onArchive).toHaveBeenCalledWith(activeWarehouse);
    });
  });

  describe('When the user clicks the Eliminar button on an archived storage', () => {
    it('Then onDelete is called with the storage', async () => {
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await openContextMenu(user);
      const deleteItem = await screen.findByRole('menuitem', { name: 'actions.delete' });
      await user.click(deleteItem);
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

  describe('When a CUSTOM_ROOM storage has a roomType value', () => {
    it('Then the roomType label is rendered', () => {
      const roomWithType: Storage = {
        ...archivedRoom,
        type: 'CUSTOM_ROOM',
        roomType: 'Exhibition',
      };
      render(<StorageCard storage={roomWithType} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('Exhibition')).toBeInTheDocument();
    });
  });

  describe('When a CUSTOM_ROOM storage has a null roomType', () => {
    it('Then no roomType label is rendered', () => {
      render(<StorageCard storage={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('Exhibition')).not.toBeInTheDocument();
    });
  });

  describe('When a non-CUSTOM_ROOM storage has a roomType value', () => {
    it('Then the roomType label is not rendered', () => {
      const warehouseWithRoomType: Storage = {
        ...activeWarehouse,
        roomType: 'SomeType',
      };
      render(<StorageCard storage={warehouseWithRoomType} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('SomeType')).not.toBeInTheDocument();
    });
  });
});
