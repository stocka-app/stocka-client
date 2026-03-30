import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import { useStoragesStore } from '../../store/storages.store';
import type { Storage, StoragesPage } from '../../types/storages.types';

vi.mock('../../api/storages.service', () => ({
  storagesService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    restore: vi.fn(),
  },
}));

let mockPermissions: string[] = [
  'STORAGE_CREATE',
  'STORAGE_READ',
  'STORAGE_UPDATE',
  'STORAGE_DELETE',
  'STORAGE_FREEZE',
  'STORAGE_ARCHIVE',
];

vi.mock('@/store/rbac.store', () => ({
  useRBACStore: () => ({
    canDo: (action: string) => mockPermissions.includes(action),
  }),
}));

import { useStorages } from '../useStorages';
import { storagesService } from '../../api/storages.service';

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockStoragesItems: Storage[] = [
  {
    uuid: 'storage-001',
    name: 'Main Store Room',
    type: 'STORE_ROOM',
    status: 'ACTIVE',
    address: null,
    roomType: null,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    uuid: 'storage-002',
    name: 'Custom Room A',
    type: 'CUSTOM_ROOM',
    status: 'ACTIVE',
    address: null,
    roomType: null,
    archivedAt: null,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    uuid: 'storage-003',
    name: 'Old Room',
    type: 'CUSTOM_ROOM',
    status: 'ARCHIVED',
    address: null,
    roomType: null,
    archivedAt: '2026-03-01T00:00:00.000Z',
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
];

const mockPage: StoragesPage = {
  items: mockStoragesItems,
  total: mockStoragesItems.length,
  page: 1,
  limit: 50,
  totalPages: 1,
};

// Extended mock data with FROZEN and varied types for filter tests
const allStoragesItems: Storage[] = [
  {
    uuid: 'storage-active-1',
    name: 'Almacén Central',
    type: 'WAREHOUSE',
    status: 'ACTIVE',
    address: 'Calle 1',
    roomType: null,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    uuid: 'storage-active-2',
    name: 'Sala Principal',
    type: 'CUSTOM_ROOM',
    status: 'ACTIVE',
    address: null,
    roomType: 'Display',
    archivedAt: null,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    uuid: 'storage-frozen-1',
    name: 'Bodega Norte',
    type: 'STORE_ROOM',
    status: 'FROZEN',
    address: null,
    roomType: null,
    archivedAt: null,
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
  {
    uuid: 'storage-archived-1',
    name: 'Almacén Viejo',
    type: 'WAREHOUSE',
    status: 'ARCHIVED',
    address: 'Calle Vieja',
    roomType: null,
    archivedAt: '2026-03-01T00:00:00.000Z',
    createdAt: '2026-01-04T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
];

const allStoragesMockPage: StoragesPage = {
  items: allStoragesItems,
  total: allStoragesItems.length,
  page: 1,
  limit: 50,
  totalPages: 1,
};

function resetStore(): void {
  useStoragesStore.setState({
    storages: [],
    total: 0,
    page: 1,
    totalPages: 0,
    isLoading: false,
    error: null,
  });
}

// ─── Mount and data loading ───────────────────────────────────────────────────

describe('Given useStorages orchestrates storage operations', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    vi.mocked(storagesService.list).mockResolvedValue(mockPage);
  });

  describe('When the hook mounts', () => {
    it('Then it fetches storages automatically', async () => {
      renderHook(() => useStorages());
      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledTimes(1);
      });
    });

    it('Then storages are populated from the API', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => {
        expect(result.current.storages).toHaveLength(mockStoragesItems.length);
      });
    });

    it('Then pagination state is populated from the API response', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => {
        expect(result.current.total).toBe(mockPage.total);
        expect(result.current.page).toBe(mockPage.page);
        expect(result.current.totalPages).toBe(mockPage.totalPages);
      });
    });

    it('Then activeStorages only includes ACTIVE storages', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => {
        result.current.activeStorages.forEach((s) => {
          expect(s.status).toBe('ACTIVE');
        });
      });
    });

    it('Then archivedStorages only includes ARCHIVED storages', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => {
        result.current.archivedStorages.forEach((s) => {
          expect(s.status).toBe('ARCHIVED');
        });
      });
    });
  });

  describe('When fetchStorages fails', () => {
    beforeEach(() => {
      vi.mocked(storagesService.list).mockRejectedValue(new Error('Network error'));
    });

    it('Then error is set to loadFailed', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => {
        expect(result.current.error).toBe('loadFailed');
      });
    });
  });

  describe('When createStorage is called with valid data', () => {
    it('Then it calls the service and returns true on success', async () => {
      vi.mocked(storagesService.create).mockResolvedValue(mockStoragesItems[0]);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.createStorage({
        name: 'New Storage',
        type: 'CUSTOM_ROOM',
      });
      expect(success).toBe(true);
      expect(vi.mocked(storagesService.create)).toHaveBeenCalledTimes(1);
    });

    it('Then returns false when the service throws', async () => {
      vi.mocked(storagesService.create).mockRejectedValue(new Error('Save failed'));
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.createStorage({
        name: 'New Storage',
        type: 'CUSTOM_ROOM',
      });
      expect(success).toBe(false);
    });
  });

  describe('When editStorage is called with a valid id and payload', () => {
    it('Then it calls the service and returns true on success', async () => {
      vi.mocked(storagesService.update).mockResolvedValue({ ...mockStoragesItems[0], name: 'Updated' });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.editStorage('storage-001', { name: 'Updated' });
      expect(success).toBe(true);
    });

    it('Then returns false when the service throws', async () => {
      vi.mocked(storagesService.update).mockRejectedValue(new Error('Update failed'));
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.editStorage('storage-001', { name: 'Updated' });
      expect(success).toBe(false);
    });
  });

  describe('When archiveStorage is called with a valid id', () => {
    it('Then it calls the service and returns true on success', async () => {
      vi.mocked(storagesService.archive).mockResolvedValue({ ...mockStoragesItems[0], status: 'ARCHIVED' });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.archiveStorage('storage-001');
      expect(success).toBe(true);
    });

    it('Then returns false when the service throws', async () => {
      vi.mocked(storagesService.archive).mockRejectedValue(new Error('Archive failed'));
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.archiveStorage('storage-001');
      expect(success).toBe(false);
    });
  });

  describe('When restoreStorage is called with a valid id', () => {
    it('Then it calls the service and returns true on success', async () => {
      vi.mocked(storagesService.restore).mockResolvedValue({ ...mockStoragesItems[2], status: 'ACTIVE' });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.restoreStorage('storage-003');
      expect(success).toBe(true);
    });

    it('Then returns false when the service throws', async () => {
      vi.mocked(storagesService.restore).mockRejectedValue(new Error('Restore failed'));
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.restoreStorage('storage-003');
      expect(success).toBe(false);
    });
  });
});

// ─── Server-side filtering, search and sort ───────────────────────────────────

describe('Given useStorages with mixed-status storages (ACTIVE, FROZEN, ARCHIVED)', () => {
  beforeEach(() => {
    mockPermissions = [
      'STORAGE_CREATE',
      'STORAGE_READ',
      'STORAGE_UPDATE',
      'STORAGE_DELETE',
      'STORAGE_FREEZE',
      'STORAGE_ARCHIVE',
    ];
    resetStore();
    vi.clearAllMocks();
    vi.mocked(storagesService.list).mockResolvedValue(allStoragesMockPage);
  });

  describe('When the hook mounts', () => {
    it('Then frozenStorages only includes FROZEN storages from the current page', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));
      result.current.frozenStorages.forEach((s) => expect(s.status).toBe('FROZEN'));
      expect(result.current.frozenStorages).toHaveLength(1);
    });

    it('Then storagesService.list is called with default params on mount', async () => {
      renderHook(() => useStorages());
      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1, limit: 50, sortOrder: 'ASC' }),
        );
      });
    });
  });

  describe('When setFilterStatus is called with FROZEN', () => {
    it('Then storagesService.list is called with status=FROZEN and page reset to 1', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => result.current.setFilterStatus('FROZEN'));

      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'FROZEN', page: 1 }),
        );
      });
    });
  });

  describe('When setFilterType is called with WAREHOUSE', () => {
    it('Then storagesService.list is called with type=WAREHOUSE and page reset to 1', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => result.current.setFilterType('WAREHOUSE'));

      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'WAREHOUSE', page: 1 }),
        );
      });
    });
  });

  describe('When setSearchQuery is called with a search term', () => {
    it('Then storagesService.list is called with the search param and page reset to 1', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => result.current.setSearchQuery('bodega'));

      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'bodega', page: 1 }),
        );
      });
    });
  });

  describe('When setSortOrder is set to DESC', () => {
    it('Then storagesService.list is called with sortOrder=DESC and page reset to 1', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => result.current.setSortOrder('DESC'));

      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
          expect.objectContaining({ sortOrder: 'DESC', page: 1 }),
        );
      });
    });
  });

  describe('When setFilterStatus is reset to null', () => {
    it('Then storagesService.list is called without a status param', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => result.current.setFilterStatus('ACTIVE'));
      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'ACTIVE' }),
        );
      });

      vi.clearAllMocks();
      vi.mocked(storagesService.list).mockResolvedValue(allStoragesMockPage);

      act(() => result.current.setFilterStatus(null));
      await waitFor(() => {
        const lastCall = vi.mocked(storagesService.list).mock.lastCall?.[0];
        expect(lastCall).not.toHaveProperty('status');
      });
    });
  });
});

// ─── Manual fetchStorages call ────────────────────────────────────────────────

describe('Given useStorages exposes a manual fetchStorages function', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    vi.mocked(storagesService.list).mockResolvedValue(allStoragesMockPage);
  });

  describe('When fetchStorages is called directly without any active filters', () => {
    it('Then it triggers a new API call with the current default params', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      vi.clearAllMocks();
      vi.mocked(storagesService.list).mockResolvedValue(allStoragesMockPage);

      await act(async () => {
        await result.current.fetchStorages();
      });

      expect(vi.mocked(storagesService.list)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, sortOrder: 'ASC' }),
      );
    });
  });

  describe('When fetchStorages is called with status, type, and search filters active', () => {
    it('Then it passes all active filters to the API', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => {
        result.current.setFilterStatus('ACTIVE');
        result.current.setFilterType('WAREHOUSE');
        result.current.setSearchQuery('almacén');
      });

      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'ACTIVE', type: 'WAREHOUSE', search: 'almacén' }),
        );
      });

      vi.clearAllMocks();
      vi.mocked(storagesService.list).mockResolvedValue(allStoragesMockPage);

      await act(async () => {
        await result.current.fetchStorages();
      });

      expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'ACTIVE', type: 'WAREHOUSE', search: 'almacén' }),
      );
    });
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

describe('Given useStorages with multi-page results', () => {
  const pageOneMock: StoragesPage = {
    items: [mockStoragesItems[0]],
    total: 3,
    page: 1,
    limit: 1,
    totalPages: 3,
  };

  const pageTwoMock: StoragesPage = {
    items: [mockStoragesItems[1]],
    total: 3,
    page: 2,
    limit: 1,
    totalPages: 3,
  };

  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    vi.mocked(storagesService.list).mockResolvedValue(pageOneMock);
  });

  describe('When the hook mounts on page 1', () => {
    it('Then totalPages is exposed from the paginated response', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => {
        expect(result.current.totalPages).toBe(3);
        expect(result.current.total).toBe(3);
        expect(result.current.page).toBe(1);
      });
    });
  });

  describe('When setPage is called with page 2', () => {
    it('Then storagesService.list is called with page=2', async () => {
      vi.mocked(storagesService.list).mockResolvedValueOnce(pageOneMock).mockResolvedValue(pageTwoMock);

      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages).toHaveLength(1));

      act(() => result.current.setPage(2));

      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 }),
        );
      });
    });

    it('Then storages are updated to the items of the new page', async () => {
      vi.mocked(storagesService.list).mockResolvedValueOnce(pageOneMock).mockResolvedValue(pageTwoMock);

      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages[0].uuid).toBe('storage-001'));

      act(() => result.current.setPage(2));

      await waitFor(() => {
        expect(result.current.storages[0].uuid).toBe('storage-002');
        expect(result.current.page).toBe(2);
      });
    });
  });
});

// ─── Fetch cancellation and signal abort guards ────────────────────────────────

describe('Given useStorages handles fetch cancellation', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe('When the fetch is cancelled via a CanceledError (axios.isCancel)', () => {
    it('Then error state is not set (cancel is silently ignored)', async () => {
      vi.mocked(storagesService.list).mockRejectedValue(new axios.CanceledError('aborted'));

      const { result } = renderHook(() => useStorages());

      // Cancel returns early without changing loading state, so wait for
      // the mock to have been called to confirm the fetch was attempted.
      await waitFor(() => {
        expect(storagesService.list).toHaveBeenCalled();
      });

      // isLoading stays true because cancel intentionally avoids flashing
      // empty state between StrictMode unmount/remount cycles.
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('When the fetch fails with a generic error but the AbortController signal is already aborted', () => {
    it('Then error state is not set (aborted signal guard short-circuits before setError)', async () => {
      let rejectWith!: (e: Error) => void;
      vi.mocked(storagesService.list).mockImplementation(
        () => new Promise<StoragesPage>((_, reject) => { rejectWith = reject; }),
      );

      const { unmount } = renderHook(() => useStorages());

      // Unmounting triggers cleanup: controller.abort() → signal.aborted = true
      unmount();

      // Reject with a non-cancel error — the aborted signal guard should catch it
      rejectWith(new Error('Generic error after abort'));

      // Allow the catch block to execute
      await new Promise<void>((resolve) => setTimeout(resolve, 50));

      // Error must NOT be set (the aborted signal guard short-circuited before setError)
      expect(useStoragesStore.getState().error).toBeNull();
    });
  });
});

// ─── Permission flags ─────────────────────────────────────────────────────────

describe('Given useStorages resolves permission flags from the RBAC store', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    vi.mocked(storagesService.list).mockResolvedValue(mockPage);
  });

  describe('When the user has all storage permissions', () => {
    beforeEach(() => {
      mockPermissions = [
        'STORAGE_CREATE',
        'STORAGE_READ',
        'STORAGE_UPDATE',
        'STORAGE_DELETE',
        'STORAGE_FREEZE',
        'STORAGE_ARCHIVE',
      ];
    });

    it('Then canCreate, canUpdate, canFreeze, canArchive, canDelete are all true', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      expect(result.current.canCreate).toBe(true);
      expect(result.current.canUpdate).toBe(true);
      expect(result.current.canFreeze).toBe(true);
      expect(result.current.canArchive).toBe(true);
      expect(result.current.canDelete).toBe(true);
    });
  });

  describe('When the user only has STORAGE_READ (WAREHOUSE_KEEPER role)', () => {
    beforeEach(() => {
      mockPermissions = ['STORAGE_READ'];
    });

    it('Then canFreeze is false', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      expect(result.current.canFreeze).toBe(false);
    });

    it('Then canCreate is false', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      expect(result.current.canCreate).toBe(false);
    });

    it('Then canArchive is false', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      expect(result.current.canArchive).toBe(false);
    });
  });
});
