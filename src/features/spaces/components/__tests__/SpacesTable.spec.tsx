import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Space } from '../../types/spaces.types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

let canDoResult = true;

vi.mock('@/store/rbac.store', () => ({
  useRBACStore: () => ({ canDo: () => canDoResult }),
}));

import { SpacesTable } from '../SpacesTable';

const activeSpaces: Space[] = [
  {
    id: 'space-001',
    tenantId: 'tenant-001',
    name: 'Main Store Room',
    type: 'STORE_ROOM',
    status: 'ACTIVE',
    address: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'space-002',
    tenantId: 'tenant-001',
    name: 'Custom Room A',
    type: 'CUSTOM_ROOM',
    status: 'ACTIVE',
    address: '123 Main St',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

const archivedSpaces: Space[] = [
  {
    id: 'space-003',
    tenantId: 'tenant-001',
    name: 'Old Room',
    type: 'CUSTOM_ROOM',
    status: 'ARCHIVED',
    address: null,
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
];

describe('Given SpacesTable renders spaces with actions', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onEdit = vi.fn();
  const onArchive = vi.fn();
  const onRestore = vi.fn();

  beforeEach(() => {
    canDoResult = true;
    onEdit.mockClear();
    onArchive.mockClear();
    onRestore.mockClear();
    user = userEvent.setup();
  });

  describe('When the table has active spaces and user can edit', () => {
    it('Then space names are rendered', () => {
      render(
        <SpacesTable
          spaces={activeSpaces}
          onEdit={onEdit}
          onArchive={onArchive}
        />,
      );
      expect(screen.getByText('Main Store Room')).toBeInTheDocument();
      expect(screen.getByText('Custom Room A')).toBeInTheDocument();
    });

    it('Then type labels are shown', () => {
      render(
        <SpacesTable
          spaces={activeSpaces}
          onEdit={onEdit}
          onArchive={onArchive}
        />,
      );
      expect(screen.getAllByText('types.STORE_ROOM').length).toBeGreaterThan(0);
    });

    it('Then addresses are shown (or — for null)', () => {
      render(
        <SpacesTable
          spaces={activeSpaces}
          onEdit={onEdit}
          onArchive={onArchive}
        />,
      );
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('Then edit and archive buttons are shown', () => {
      render(
        <SpacesTable
          spaces={activeSpaces}
          onEdit={onEdit}
          onArchive={onArchive}
        />,
      );
      expect(screen.getAllByText('actions.edit').length).toBeGreaterThan(0);
      expect(screen.getAllByText('actions.archive').length).toBeGreaterThan(0);
    });
  });

  describe('When the user clicks the edit button on a space', () => {
    it('Then onEdit is called with that space', async () => {
      render(
        <SpacesTable
          spaces={activeSpaces}
          onEdit={onEdit}
          onArchive={onArchive}
        />,
      );
      const editButtons = screen.getAllByText('actions.edit');
      await user.click(editButtons[0]);
      expect(onEdit).toHaveBeenCalledWith(activeSpaces[0]);
    });
  });

  describe('When the user clicks the archive button on a space', () => {
    it('Then onArchive is called with that space', async () => {
      render(
        <SpacesTable
          spaces={activeSpaces}
          onEdit={onEdit}
          onArchive={onArchive}
        />,
      );
      const archiveButtons = screen.getAllByText('actions.archive');
      await user.click(archiveButtons[0]);
      expect(onArchive).toHaveBeenCalledWith(activeSpaces[0]);
    });
  });

  describe('When the user does not have CREATE_EDIT_SPACE permission', () => {
    beforeEach(() => {
      canDoResult = false;
    });

    it('Then edit buttons are not shown', () => {
      render(
        <SpacesTable
          spaces={activeSpaces}
          onEdit={onEdit}
          onArchive={onArchive}
        />,
      );
      expect(screen.queryByText('actions.edit')).not.toBeInTheDocument();
    });

    it('Then archive buttons are not shown', () => {
      render(
        <SpacesTable
          spaces={activeSpaces}
          onEdit={onEdit}
          onArchive={onArchive}
        />,
      );
      expect(screen.queryByText('actions.archive')).not.toBeInTheDocument();
    });
  });

  describe('When the table shows archived spaces', () => {
    it('Then restore buttons are shown', () => {
      render(
        <SpacesTable
          spaces={archivedSpaces}
          onEdit={onEdit}
          onArchive={onArchive}
          onRestore={onRestore}
          showArchived={true}
        />,
      );
      expect(screen.getByText('actions.restore')).toBeInTheDocument();
    });

    it('Then clicking restore calls onRestore with the space', async () => {
      render(
        <SpacesTable
          spaces={archivedSpaces}
          onEdit={onEdit}
          onArchive={onArchive}
          onRestore={onRestore}
          showArchived={true}
        />,
      );
      await user.click(screen.getByText('actions.restore'));
      expect(onRestore).toHaveBeenCalledWith(archivedSpaces[0]);
    });
  });

  describe('When the spaces array is empty on active tab', () => {
    it('Then the empty state message is shown', () => {
      render(
        <SpacesTable
          spaces={[]}
          onEdit={onEdit}
          onArchive={onArchive}
        />,
      );
      expect(screen.getByText('table.empty')).toBeInTheDocument();
    });
  });

  describe('When the spaces array is empty on archived tab', () => {
    it('Then the archived empty state message is shown', () => {
      render(
        <SpacesTable
          spaces={[]}
          onEdit={onEdit}
          onArchive={onArchive}
          showArchived={true}
        />,
      );
      expect(screen.getByText('table.emptyArchived')).toBeInTheDocument();
    });
  });
});
