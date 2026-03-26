import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSpacesStore } from '../../store/spaces.store';
import { mockSpaces } from '../../api/spaces.mock';
import type { Space } from '../../types/spaces.types';

vi.mock('../../api/spaces.service', () => ({
  spacesService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    restore: vi.fn(),
  },
}));

let mockPermissions: string[] = ['STORAGE_CREATE', 'STORAGE_READ', 'STORAGE_UPDATE', 'STORAGE_DELETE'];

vi.mock('@/store/rbac.store', () => ({
  useRBACStore: () => ({
    canDo: (action: string) => mockPermissions.includes(action),
  }),
}));

import { useSpaces } from '../useSpaces';
import { spacesService } from '../../api/spaces.service';

// Extended mock data with FROZEN and varied types for filter tests
const allSpacesMock: Space[] = [
  {
    uuid: 'space-active-1',
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
    uuid: 'space-active-2',
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
    uuid: 'space-frozen-1',
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
    uuid: 'space-archived-1',
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
  useSpacesStore.setState({ spaces: [], isLoading: false, error: null });
}

describe('Given useSpaces orchestrates space operations', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    vi.mocked(spacesService.list).mockResolvedValue(mockSpaces);
  });

  describe('When the hook mounts', () => {
    it('Then it fetches spaces automatically', async () => {
      renderHook(() => useSpaces());
      await waitFor(() => {
        expect(vi.mocked(spacesService.list)).toHaveBeenCalledTimes(1);
      });
    });

    it('Then spaces are populated from the API', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => {
        expect(result.current.spaces).toHaveLength(mockSpaces.length);
      });
    });

    it('Then activeSpaces only includes ACTIVE spaces', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => {
        result.current.activeSpaces.forEach((s) => {
          expect(s.status).toBe('ACTIVE');
        });
      });
    });

    it('Then archivedSpaces only includes ARCHIVED spaces', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => {
        result.current.archivedSpaces.forEach((s) => {
          expect(s.status).toBe('ARCHIVED');
        });
      });
    });
  });

  describe('When fetchSpaces fails', () => {
    beforeEach(() => {
      vi.mocked(spacesService.list).mockRejectedValue(new Error('Network error'));
    });

    it('Then error is set to loadFailed', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => {
        expect(result.current.error).toBe('loadFailed');
      });
    });
  });

  describe('When createSpace is called with valid data', () => {
    it('Then it calls the service and returns true on success', async () => {
      vi.mocked(spacesService.create).mockResolvedValue(mockSpaces[0]);
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.createSpace({
        name: 'New Space',
        type: 'CUSTOM_ROOM',
      });
      expect(success).toBe(true);
      expect(vi.mocked(spacesService.create)).toHaveBeenCalledTimes(1);
    });

    it('Then returns false when the service throws', async () => {
      vi.mocked(spacesService.create).mockRejectedValue(new Error('Save failed'));
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.createSpace({
        name: 'New Space',
        type: 'CUSTOM_ROOM',
      });
      expect(success).toBe(false);
    });
  });

  describe('When editSpace is called with a valid id and payload', () => {
    it('Then it calls the service and returns true on success', async () => {
      vi.mocked(spacesService.update).mockResolvedValue({ ...mockSpaces[0], name: 'Updated' });
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.editSpace('space-001', { name: 'Updated' });
      expect(success).toBe(true);
    });

    it('Then returns false when the service throws', async () => {
      vi.mocked(spacesService.update).mockRejectedValue(new Error('Update failed'));
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.editSpace('space-001', { name: 'Updated' });
      expect(success).toBe(false);
    });
  });

  describe('When archiveSpace is called with a valid id', () => {
    it('Then it calls the service and returns true on success', async () => {
      vi.mocked(spacesService.archive).mockResolvedValue({ ...mockSpaces[0], status: 'ARCHIVED' });
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.archiveSpace('space-001');
      expect(success).toBe(true);
    });

    it('Then returns false when the service throws', async () => {
      vi.mocked(spacesService.archive).mockRejectedValue(new Error('Archive failed'));
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.archiveSpace('space-001');
      expect(success).toBe(false);
    });
  });

  describe('When restoreSpace is called with a valid id', () => {
    it('Then it calls the service and returns true on success', async () => {
      vi.mocked(spacesService.restore).mockResolvedValue({ ...mockSpaces[2], status: 'ACTIVE' });
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.restoreSpace('space-003');
      expect(success).toBe(true);
    });

    it('Then returns false when the service throws', async () => {
      vi.mocked(spacesService.restore).mockRejectedValue(new Error('Restore failed'));
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.restoreSpace('space-003');
      expect(success).toBe(false);
    });
  });
});

// ─── Derived data and filter/search/sort ──────────────────────────────────────

describe('Given useSpaces with mixed-status spaces (ACTIVE, FROZEN, ARCHIVED)', () => {
  beforeEach(() => {
    mockPermissions = ['STORAGE_CREATE', 'STORAGE_READ', 'STORAGE_UPDATE', 'STORAGE_DELETE'];
    useSpacesStore.setState({ spaces: [], isLoading: false, error: null });
    vi.clearAllMocks();
    vi.mocked(spacesService.list).mockResolvedValue(allSpacesMock);
  });

  describe('When the hook mounts', () => {
    it('Then frozenSpaces only includes FROZEN spaces', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));
      result.current.frozenSpaces.forEach((s) => expect(s.status).toBe('FROZEN'));
      expect(result.current.frozenSpaces).toHaveLength(1);
    });

    it('Then filteredSpaces defaults to all spaces sorted A→Z', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));
      const names = result.current.filteredSpaces.map((s) => s.name);
      expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    });
  });

  describe('When setFilterStatus is called with FROZEN', () => {
    it('Then filteredSpaces contains only FROZEN spaces', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      act(() => result.current.setFilterStatus('FROZEN'));

      expect(result.current.filteredSpaces.every((s) => s.status === 'FROZEN')).toBe(true);
    });
  });

  describe('When setFilterType is called with WAREHOUSE', () => {
    it('Then filteredSpaces contains only WAREHOUSE spaces', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      act(() => result.current.setFilterType('WAREHOUSE'));

      expect(result.current.filteredSpaces.every((s) => s.type === 'WAREHOUSE')).toBe(true);
    });
  });

  describe('When setFilterStatus and setSearchQuery are both set', () => {
    it('Then filteredSpaces applies both criteria (AND logic)', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      act(() => {
        result.current.setFilterStatus('ACTIVE');
        result.current.setSearchQuery('alma');
      });

      // Only ACTIVE spaces whose name contains 'alma' (case-insensitive)
      expect(result.current.filteredSpaces).toHaveLength(1);
      expect(result.current.filteredSpaces[0].uuid).toBe('space-active-1');
    });
  });

  describe('When filterByStatus FROZEN and filterByName bodega are both applied', () => {
    it('Then filteredSpaces returns only frozen spaces whose name contains bodega', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      act(() => {
        result.current.setFilterStatus('FROZEN');
        result.current.setSearchQuery('bodega');
      });

      expect(result.current.filteredSpaces).toHaveLength(1);
      expect(result.current.filteredSpaces[0].uuid).toBe('space-frozen-1');
      expect(result.current.filteredSpaces[0].status).toBe('FROZEN');
    });
  });

  describe('When setSortOrder is set to desc', () => {
    it('Then filteredSpaces is sorted Z→A by name', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      act(() => result.current.setSortOrder('desc'));

      const names = result.current.filteredSpaces.map((s) => s.name);
      expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
    });
  });

  describe('When setFilterStatus is reset to null', () => {
    it('Then filteredSpaces returns all spaces again', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      act(() => result.current.setFilterStatus('ACTIVE'));
      expect(result.current.filteredSpaces.length).toBeLessThan(allSpacesMock.length);

      act(() => result.current.setFilterStatus(null));
      expect(result.current.filteredSpaces).toHaveLength(allSpacesMock.length);
    });
  });
});

// ─── Permission flags ─────────────────────────────────────────────────────────

describe('Given useSpaces resolves permission flags from the RBAC store', () => {
  beforeEach(() => {
    useSpacesStore.setState({ spaces: [], isLoading: false, error: null });
    vi.clearAllMocks();
    vi.mocked(spacesService.list).mockResolvedValue(mockSpaces);
  });

  describe('When the user has all storage permissions', () => {
    beforeEach(() => {
      mockPermissions = ['STORAGE_CREATE', 'STORAGE_READ', 'STORAGE_UPDATE', 'STORAGE_DELETE'];
    });

    it('Then canCreate, canUpdate, canFreeze, canArchive, canDelete are all true', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

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
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      expect(result.current.canFreeze).toBe(false);
    });

    it('Then canCreate is false', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      expect(result.current.canCreate).toBe(false);
    });

    it('Then canArchive is false', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      expect(result.current.canArchive).toBe(false);
    });
  });
});
