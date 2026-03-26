import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useStoragesStore } from '../../store/storages.store';
import { mockStorages } from '../../api/storages.mock';
import type { Storage } from '../../types/storages.types';

vi.mock('../../api/storages.service', () => ({
  storagesService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    restore: vi.fn(),
  },
}));

let mockPermissions: string[] = ['STORAGE_CREATE', 'STORAGE_READ', 'STORAGE_UPDATE', 'STORAGE_DELETE', 'STORAGE_FREEZE', 'STORAGE_ARCHIVE'];

vi.mock('@/store/rbac.store', () => ({
  useRBACStore: () => ({
    canDo: (action: string) => mockPermissions.includes(action),
  }),
}));

import { useStorages } from '../useStorages';
import { storagesService } from '../../api/storages.service';

// Extended mock data with FROZEN and varied types for filter tests
const allStoragesMock: Storage[] = [
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

function resetStore(): void {
  useStoragesStore.setState({ storages: [], isLoading: false, error: null });
}

describe('Given useStorages orchestrates storage operations', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    vi.mocked(storagesService.list).mockResolvedValue(mockStorages);
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
        expect(result.current.storages).toHaveLength(mockStorages.length);
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
      vi.mocked(storagesService.create).mockResolvedValue(mockStorages[0]);
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
      vi.mocked(storagesService.update).mockResolvedValue({ ...mockStorages[0], name: 'Updated' });
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
      vi.mocked(storagesService.archive).mockResolvedValue({ ...mockStorages[0], status: 'ARCHIVED' });
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
      vi.mocked(storagesService.restore).mockResolvedValue({ ...mockStorages[2], status: 'ACTIVE' });
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

// ─── Derived data and filter/search/sort ──────────────────────────────────────

describe('Given useStorages with mixed-status storages (ACTIVE, FROZEN, ARCHIVED)', () => {
  beforeEach(() => {
    mockPermissions = ['STORAGE_CREATE', 'STORAGE_READ', 'STORAGE_UPDATE', 'STORAGE_DELETE', 'STORAGE_FREEZE', 'STORAGE_ARCHIVE'];
    useStoragesStore.setState({ storages: [], isLoading: false, error: null });
    vi.clearAllMocks();
    vi.mocked(storagesService.list).mockResolvedValue(allStoragesMock);
  });

  describe('When the hook mounts', () => {
    it('Then frozenStorages only includes FROZEN storages', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));
      result.current.frozenStorages.forEach((s) => expect(s.status).toBe('FROZEN'));
      expect(result.current.frozenStorages).toHaveLength(1);
    });

    it('Then filteredStorages defaults to all storages sorted A→Z', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));
      const names = result.current.filteredStorages.map((s) => s.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });
  });

  describe('When setFilterStatus is called with FROZEN', () => {
    it('Then filteredStorages contains only FROZEN storages', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => result.current.setFilterStatus('FROZEN'));

      expect(result.current.filteredStorages.every((s) => s.status === 'FROZEN')).toBe(true);
    });
  });

  describe('When setFilterType is called with WAREHOUSE', () => {
    it('Then filteredStorages contains only WAREHOUSE storages', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => result.current.setFilterType('WAREHOUSE'));

      expect(result.current.filteredStorages.every((s) => s.type === 'WAREHOUSE')).toBe(true);
    });
  });

  describe('When setFilterStatus and setSearchQuery are both set', () => {
    it('Then filteredStorages applies both criteria (AND logic)', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => {
        result.current.setFilterStatus('ACTIVE');
        result.current.setSearchQuery('alma');
      });

      // Only ACTIVE storages whose name contains 'alma' (case-insensitive)
      expect(result.current.filteredStorages).toHaveLength(1);
      expect(result.current.filteredStorages[0].uuid).toBe('storage-active-1');
    });
  });

  describe('When filterByStatus FROZEN and filterByName bodega are both applied', () => {
    it('Then filteredStorages returns only frozen storages whose name contains bodega', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => {
        result.current.setFilterStatus('FROZEN');
        result.current.setSearchQuery('bodega');
      });

      expect(result.current.filteredStorages).toHaveLength(1);
      expect(result.current.filteredStorages[0].uuid).toBe('storage-frozen-1');
      expect(result.current.filteredStorages[0].status).toBe('FROZEN');
    });
  });

  describe('When setSortOrder is set to desc', () => {
    it('Then filteredStorages is sorted Z→A by name', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => result.current.setSortOrder('desc'));

      const names = result.current.filteredStorages.map((s) => s.name);
      expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
    });
  });

  describe('When setFilterStatus is reset to null', () => {
    it('Then filteredStorages returns all storages again', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => result.current.setFilterStatus('ACTIVE'));
      expect(result.current.filteredStorages.length).toBeLessThan(allStoragesMock.length);

      act(() => result.current.setFilterStatus(null));
      expect(result.current.filteredStorages).toHaveLength(allStoragesMock.length);
    });
  });
});

// ─── Permission flags ─────────────────────────────────────────────────────────

describe('Given useStorages resolves permission flags from the RBAC store', () => {
  beforeEach(() => {
    useStoragesStore.setState({ storages: [], isLoading: false, error: null });
    vi.clearAllMocks();
    vi.mocked(storagesService.list).mockResolvedValue(mockStorages);
  });

  describe('When the user has all storage permissions', () => {
    beforeEach(() => {
      mockPermissions = ['STORAGE_CREATE', 'STORAGE_READ', 'STORAGE_UPDATE', 'STORAGE_DELETE', 'STORAGE_FREEZE', 'STORAGE_ARCHIVE'];
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
