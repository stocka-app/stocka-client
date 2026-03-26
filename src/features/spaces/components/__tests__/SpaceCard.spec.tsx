import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Space } from '../../types/spaces.types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

let mockPermissions: string[] = [];

vi.mock('@/store/rbac.store', () => ({
  useRBACStore: () => ({
    canDo: (action: string) => mockPermissions.includes(action),
  }),
}));

import { SpaceCard } from '../SpaceCard';

const activeWarehouse: Space = {
  uuid: 'space-001',
  name: 'Main Warehouse',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: 'Calle 1 #100',
  roomType: null,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const frozenStoreRoom: Space = {
  uuid: 'space-002',
  name: 'Frozen Store',
  type: 'STORE_ROOM',
  status: 'FROZEN',
  address: null,
  roomType: null,
  archivedAt: null,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const archivedRoom: Space = {
  uuid: 'space-003',
  name: 'Old Custom Room',
  type: 'CUSTOM_ROOM',
  status: 'ARCHIVED',
  address: null,
  roomType: null,
  archivedAt: '2026-03-01T00:00:00.000Z',
  createdAt: '2026-01-03T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

const ALL_STORAGE = ['STORAGE_CREATE', 'STORAGE_READ', 'STORAGE_UPDATE', 'STORAGE_DELETE'];
const UPDATE_ONLY = ['STORAGE_READ', 'STORAGE_UPDATE'];
const READ_ONLY = ['STORAGE_READ'];

describe('Given SpaceCard renders a space with role-based actions', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onEdit = vi.fn();
  const onArchive = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    mockPermissions = ALL_STORAGE;
    onEdit.mockClear();
    onArchive.mockClear();
    onDelete.mockClear();
    user = userEvent.setup();
  });

  describe('When the space is active', () => {
    it('Then the space name is rendered', () => {
      render(<SpaceCard space={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('Main Warehouse')).toBeInTheDocument();
    });

    it('Then the type badge label is rendered', () => {
      render(<SpaceCard space={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('types.WAREHOUSE')).toBeInTheDocument();
    });

    it('Then the status label is rendered', () => {
      render(<SpaceCard space={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('statuses.ACTIVE')).toBeInTheDocument();
    });

    it('Then the address is shown when present', () => {
      render(<SpaceCard space={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('Calle 1 #100')).toBeInTheDocument();
    });

    it('Then no address line is rendered when address is null', () => {
      render(<SpaceCard space={{ ...activeWarehouse, address: null }} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('Calle 1 #100')).not.toBeInTheDocument();
    });
  });

  describe('When the space is active and the user is a Manager (STORAGE_UPDATE + STORAGE_DELETE)', () => {
    it('Then Ver más, Editar, and Archivar actions are shown', () => {
      mockPermissions = ALL_STORAGE;
      render(<SpaceCard space={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('actions.view')).toBeInTheDocument();
      expect(screen.getByText('actions.edit')).toBeInTheDocument();
      expect(screen.getByText('actions.archive')).toBeInTheDocument();
    });

    it('Then the Eliminar action is not shown for an active space', () => {
      mockPermissions = ALL_STORAGE;
      render(<SpaceCard space={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('actions.delete')).not.toBeInTheDocument();
    });
  });

  describe('When the space is frozen', () => {
    it('Then the frozen status label is rendered', () => {
      render(<SpaceCard space={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('statuses.FROZEN')).toBeInTheDocument();
    });

    it('Then the archive action is not shown for a frozen space', () => {
      mockPermissions = ALL_STORAGE;
      render(<SpaceCard space={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('actions.archive')).not.toBeInTheDocument();
    });

    it('Then the delete action is not shown for a frozen space', () => {
      mockPermissions = ALL_STORAGE;
      render(<SpaceCard space={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('actions.delete')).not.toBeInTheDocument();
    });

    it('Then Ver más is still shown for a frozen space', () => {
      mockPermissions = ALL_STORAGE;
      render(<SpaceCard space={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('actions.view')).toBeInTheDocument();
    });
  });

  describe('When the space is archived and the user has STORAGE_DELETE permission', () => {
    it('Then the archived status label is rendered', () => {
      render(<SpaceCard space={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('statuses.ARCHIVED')).toBeInTheDocument();
    });

    it('Then Ver más, Editar, and Eliminar actions are shown', () => {
      mockPermissions = ALL_STORAGE;
      render(<SpaceCard space={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('actions.view')).toBeInTheDocument();
      expect(screen.getByText('actions.edit')).toBeInTheDocument();
      expect(screen.getByText('actions.delete')).toBeInTheDocument();
    });

    it('Then the Archivar action is not shown for an archived space', () => {
      mockPermissions = ALL_STORAGE;
      render(<SpaceCard space={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('actions.archive')).not.toBeInTheDocument();
    });
  });

  describe('When the space is archived and the user has STORAGE_CREATE permission', () => {
    it('Then Restaurar action is shown when onRestore is provided', () => {
      mockPermissions = ALL_STORAGE;
      const onRestore = vi.fn();
      render(<SpaceCard space={archivedRoom} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} onDelete={onDelete} />);
      expect(screen.getByText('actions.restore')).toBeInTheDocument();
    });

    it('Then Restaurar action is not shown when onRestore is not provided', () => {
      mockPermissions = ALL_STORAGE;
      render(<SpaceCard space={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.queryByText('actions.restore')).not.toBeInTheDocument();
    });
  });

  describe('When the user clicks the Restaurar button on an archived space', () => {
    it('Then onRestore is called with the space', async () => {
      mockPermissions = ALL_STORAGE;
      const onRestore = vi.fn();
      render(<SpaceCard space={archivedRoom} onEdit={onEdit} onArchive={onArchive} onRestore={onRestore} onDelete={onDelete} />);
      await user.click(screen.getByText('actions.restore'));
      expect(onRestore).toHaveBeenCalledWith(archivedRoom);
    });
  });

  describe('When the user is an Observer (no write permissions)', () => {
    beforeEach(() => {
      mockPermissions = READ_ONLY;
    });

    it('Then only the Ver más action is shown', () => {
      render(<SpaceCard space={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('actions.view')).toBeInTheDocument();
      expect(screen.queryByText('actions.edit')).not.toBeInTheDocument();
      expect(screen.queryByText('actions.archive')).not.toBeInTheDocument();
      expect(screen.queryByText('actions.delete')).not.toBeInTheDocument();
    });
  });

  describe('When the user has STORAGE_UPDATE but not STORAGE_DELETE (Warehouse Keeper)', () => {
    beforeEach(() => {
      mockPermissions = UPDATE_ONLY;
    });

    it('Then Editar is shown but Archivar is not shown for active spaces', () => {
      render(<SpaceCard space={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('actions.edit')).toBeInTheDocument();
      expect(screen.queryByText('actions.archive')).not.toBeInTheDocument();
    });
  });

  describe('When the user clicks the Editar button', () => {
    it('Then onEdit is called with the space', async () => {
      mockPermissions = ALL_STORAGE;
      render(<SpaceCard space={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await user.click(screen.getByText('actions.edit'));
      expect(onEdit).toHaveBeenCalledWith(activeWarehouse);
    });
  });

  describe('When the user clicks the Archivar button', () => {
    it('Then onArchive is called with the space', async () => {
      mockPermissions = ALL_STORAGE;
      render(<SpaceCard space={activeWarehouse} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await user.click(screen.getByText('actions.archive'));
      expect(onArchive).toHaveBeenCalledWith(activeWarehouse);
    });
  });

  describe('When the user clicks the Eliminar button on an archived space', () => {
    it('Then onDelete is called with the space', async () => {
      mockPermissions = ALL_STORAGE;
      render(<SpaceCard space={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      await user.click(screen.getByText('actions.delete'));
      expect(onDelete).toHaveBeenCalledWith(archivedRoom);
    });
  });

  describe('When a STORE_ROOM type space is rendered', () => {
    it('Then the STORE_ROOM type badge label is shown', () => {
      render(<SpaceCard space={frozenStoreRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('types.STORE_ROOM')).toBeInTheDocument();
    });
  });

  describe('When a CUSTOM_ROOM type space is rendered', () => {
    it('Then the CUSTOM_ROOM type badge label is shown', () => {
      render(<SpaceCard space={archivedRoom} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />);
      expect(screen.getByText('types.CUSTOM_ROOM')).toBeInTheDocument();
    });
  });
});
