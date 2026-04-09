import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStoragesStore, selectSortedStorages, selectActiveStorage } from '../storages.store';
import type { Storage } from '../../types/storages.types';

// ── Tenant-scoped persistence mock ─────────────────────────────────────────
//
// The store's persist adapter reads `tenantId` from `useAuthenticationStore`
// and scopes the localStorage key by it. Mock the authentication store so
// tests can simulate logged-in / logged-out scenarios without touching the
// real auth feature.
const { mockAuthState } = vi.hoisted(() => ({
  mockAuthState: { tenantId: 'tenant-1' as string | null },
}));
vi.mock('@/features/authentication', () => ({
  useAuthenticationStore: {
    getState: (): { user: { tenantId: string | null } | null } => ({
      user: mockAuthState.tenantId !== null ? { tenantId: mockAuthState.tenantId } : null,
    }),
  },
}));

const space1: Storage = {
  uuid: 'storage-001',
  name: 'Main Store Room',
  type: 'STORE_ROOM',
  status: 'ACTIVE',
  address: null,
  roomType: null,
  icon: 'inventory_2',
  color: '#D97706',
  description: null,
  archivedAt: null,
  frozenAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const space2: Storage = {
  uuid: 'storage-002',
  name: 'Custom Room A',
  type: 'CUSTOM_ROOM',
  status: 'ACTIVE',
  address: null,
  roomType: null,
  icon: 'restaurant',
  color: '#0D9488',
  description: null,
  archivedAt: null,
  frozenAt: null,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const archivedStorage: Storage = {
  uuid: 'storage-003',
  name: 'Archived Warehouse',
  type: 'WAREHOUSE',
  status: 'ARCHIVED',
  address: null,
  roomType: null,
  icon: 'warehouse',
  color: '#3b82f6',
  description: null,
  archivedAt: '2026-03-01T00:00:00.000Z',
  frozenAt: null,
  createdAt: '2026-01-03T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

const warehouseActive: Storage = {
  uuid: 'storage-004',
  name: 'Almacén Central',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: null,
  roomType: null,
  icon: 'warehouse',
  color: '#3b82f6',
  description: null,
  archivedAt: null,
  frozenAt: null,
  createdAt: '2026-01-04T00:00:00.000Z',
  updatedAt: '2026-01-04T00:00:00.000Z',
};

function resetStore(): void {
  useStoragesStore.setState({
    storages: [],
    isLoading: false,
    error: null,
    activeStorageId: null,
  });
  mockAuthState.tenantId = 'tenant-1';
  localStorage.clear();
}

describe('Given the storages store manages storage state', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('When the store is in its initial state', () => {
    it('Then storages is an empty array', () => {
      expect(useStoragesStore.getState().storages).toEqual([]);
    });

    it('Then isLoading is false', () => {
      expect(useStoragesStore.getState().isLoading).toBe(false);
    });

    it('Then error is null', () => {
      expect(useStoragesStore.getState().error).toBeNull();
    });
  });

  describe('When setStorages is called with a list of storages', () => {
    it('Then storages is updated', () => {
      useStoragesStore.getState().setStorages([space1, space2]);
      expect(useStoragesStore.getState().storages).toHaveLength(2);
    });
  });

  describe('When addStorage is called', () => {
    it('Then the new storage is appended to the list', () => {
      useStoragesStore.getState().setStorages([space1]);
      useStoragesStore.getState().addStorage(space2);
      expect(useStoragesStore.getState().storages).toHaveLength(2);
      expect(useStoragesStore.getState().storages[1].uuid).toBe('storage-002');
    });
  });

  describe('When updateStorage is called with an existing storage id', () => {
    it('Then the matching storage is replaced', () => {
      useStoragesStore.getState().setStorages([space1]);
      const updated: Storage = { ...space1, name: 'Updated Name' };
      useStoragesStore.getState().updateStorage(updated);
      expect(useStoragesStore.getState().storages[0].name).toBe('Updated Name');
    });

    it('Then no other storage is affected', () => {
      useStoragesStore.getState().setStorages([space1, space2]);
      const updated: Storage = { ...space1, name: 'Updated Name' };
      useStoragesStore.getState().updateStorage(updated);
      expect(useStoragesStore.getState().storages[1].name).toBe('Custom Room A');
    });
  });

  describe('When setLoading is called with true', () => {
    it('Then isLoading becomes true', () => {
      useStoragesStore.getState().setLoading(true);
      expect(useStoragesStore.getState().isLoading).toBe(true);
    });
  });

  describe('When setError is called with an error key', () => {
    it('Then error is set', () => {
      useStoragesStore.getState().setError('loadFailed');
      expect(useStoragesStore.getState().error).toBe('loadFailed');
    });
  });

  describe('When setError is called with null', () => {
    it('Then error is cleared', () => {
      useStoragesStore.getState().setError('loadFailed');
      useStoragesStore.getState().setError(null);
      expect(useStoragesStore.getState().error).toBeNull();
    });
  });

  describe('When reset is called', () => {
    it('Then all state returns to initial values', () => {
      useStoragesStore.getState().setStorages([space1]);
      useStoragesStore.getState().setLoading(true);
      useStoragesStore.getState().setError('loadFailed');
      useStoragesStore.getState().reset();
      const { storages, isLoading, error } = useStoragesStore.getState();
      expect(storages).toEqual([]);
      expect(isLoading).toBe(true);
      expect(error).toBeNull();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════
// Active context (H-03 — STOC-343)
// ═════════════════════════════════════════════════════════════════════════

describe('Given the store tracks the active storage context', () => {
  beforeEach(() => {
    resetStore();
  });

  // ── FE-STORE-1 ─────────────────────────────────────────────────────────
  describe('Given the store has no active storage', () => {
    describe('When the user selects a storage via setActiveStorage', () => {
      beforeEach(() => {
        useStoragesStore.getState().setActiveStorage('storage-001');
      });

      it('Then activeStorageId reflects the new selection', () => {
        expect(useStoragesStore.getState().activeStorageId).toBe('storage-001');
      });

      it('Then the tenant-scoped localStorage key contains the new id', () => {
        const stored = localStorage.getItem('stocka:active-storage:tenant-1');
        expect(stored).not.toBeNull();
        expect(stored).toContain('storage-001');
      });
    });
  });

  describe('When setActiveStorage is called with null', () => {
    beforeEach(() => {
      useStoragesStore.getState().setActiveStorage('storage-001');
      useStoragesStore.getState().setActiveStorage(null);
    });

    it('Then activeStorageId is cleared', () => {
      expect(useStoragesStore.getState().activeStorageId).toBeNull();
    });
  });

  // ── FE-STORE-2 ─────────────────────────────────────────────────────────
  describe('Given an activeStorageId that no longer exists in the current storages', () => {
    beforeEach(() => {
      useStoragesStore.setState({
        storages: [space1, space2, warehouseActive],
        activeStorageId: 'storage-that-was-deleted',
      });
      useStoragesStore.getState().hydrateActiveStorage();
    });

    it('Then hydrateActiveStorage promotes the first ACTIVE storage A→Z', () => {
      // Sorted A→Z: "Almacén Central" (warehouseActive), "Custom Room A" (space2), "Main Store Room" (space1)
      expect(useStoragesStore.getState().activeStorageId).toBe('storage-004');
    });
  });

  describe('Given hydrateActiveStorage runs with a valid activeStorageId', () => {
    beforeEach(() => {
      useStoragesStore.setState({
        storages: [space1, space2],
        activeStorageId: 'storage-001',
      });
      useStoragesStore.getState().hydrateActiveStorage();
    });

    it('Then the valid activeStorageId is preserved', () => {
      expect(useStoragesStore.getState().activeStorageId).toBe('storage-001');
    });
  });

  describe('Given there are only ARCHIVED storages in the tenant', () => {
    beforeEach(() => {
      useStoragesStore.setState({
        storages: [archivedStorage],
        activeStorageId: null,
      });
      useStoragesStore.getState().hydrateActiveStorage();
    });

    it('Then activeStorageId stays null (no ACTIVE to fall back to)', () => {
      expect(useStoragesStore.getState().activeStorageId).toBeNull();
    });
  });

  describe('Given an empty storages array', () => {
    beforeEach(() => {
      useStoragesStore.setState({ storages: [], activeStorageId: null });
      useStoragesStore.getState().hydrateActiveStorage();
    });

    it('Then activeStorageId remains null', () => {
      expect(useStoragesStore.getState().activeStorageId).toBeNull();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════
// Selectors
// ═════════════════════════════════════════════════════════════════════════

describe('Given the selectSortedStorages selector', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('When the active storage is in the middle of the alphabet', () => {
    it('Then the active storage is returned first and the rest are sorted A→Z', () => {
      const state = {
        ...useStoragesStore.getState(),
        storages: [space1, space2, warehouseActive],
        activeStorageId: 'storage-002', // "Custom Room A"
      };
      const sorted = selectSortedStorages(state);
      expect(sorted[0].uuid).toBe('storage-002');
      // Rest A→Z: "Almacén Central" (storage-004), "Main Store Room" (storage-001)
      expect(sorted[1].uuid).toBe('storage-004');
      expect(sorted[2].uuid).toBe('storage-001');
    });
  });

  describe('When there is no active storage', () => {
    it('Then the full list is returned in plain A→Z order', () => {
      const state = {
        ...useStoragesStore.getState(),
        storages: [space1, space2, warehouseActive],
        activeStorageId: null,
      };
      const sorted = selectSortedStorages(state);
      expect(sorted.map((s) => s.name)).toEqual([
        'Almacén Central',
        'Custom Room A',
        'Main Store Room',
      ]);
    });
  });

  describe('When the activeStorageId points to a storage that no longer exists', () => {
    it('Then the plain A→Z list is returned without breaking', () => {
      const state = {
        ...useStoragesStore.getState(),
        storages: [space1, space2],
        activeStorageId: 'storage-ghost',
      };
      const sorted = selectSortedStorages(state);
      expect(sorted).toHaveLength(2);
      expect(sorted[0].name).toBe('Custom Room A');
    });
  });
});

describe('Given the selectActiveStorage selector', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('When activeStorageId points to an existing storage', () => {
    it('Then the matching Storage is returned', () => {
      const state = {
        ...useStoragesStore.getState(),
        storages: [space1, space2],
        activeStorageId: 'storage-001',
      };
      expect(selectActiveStorage(state)).toBe(space1);
    });
  });

  describe('When activeStorageId is null', () => {
    it('Then null is returned', () => {
      const state = {
        ...useStoragesStore.getState(),
        storages: [space1],
        activeStorageId: null,
      };
      expect(selectActiveStorage(state)).toBeNull();
    });
  });

  describe('When activeStorageId is stale (points to a deleted storage)', () => {
    it('Then null is returned', () => {
      const state = {
        ...useStoragesStore.getState(),
        storages: [space1],
        activeStorageId: 'storage-ghost',
      };
      expect(selectActiveStorage(state)).toBeNull();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════
// Tenant-scoped persist adapter
// ═════════════════════════════════════════════════════════════════════════

describe('Given the tenant-scoped localStorage adapter', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('When the user is logged in', () => {
    describe('When setActiveStorage writes a value', () => {
      beforeEach(() => {
        mockAuthState.tenantId = 'tenant-1';
        useStoragesStore.getState().setActiveStorage('storage-001');
      });

      it('Then the value lands under the tenant-scoped key', () => {
        expect(localStorage.getItem('stocka:active-storage:tenant-1')).not.toBeNull();
      });

      it('Then the non-scoped key is NOT used', () => {
        expect(localStorage.getItem('stocka:active-storage')).toBeNull();
      });
    });
  });

  describe('When the user has no tenantId (logged out)', () => {
    beforeEach(() => {
      mockAuthState.tenantId = null;
      useStoragesStore.getState().setActiveStorage('storage-001');
    });

    it('Then nothing is written to localStorage', () => {
      expect(localStorage.length).toBe(0);
    });

    it('Then the in-memory state still updates', () => {
      expect(useStoragesStore.getState().activeStorageId).toBe('storage-001');
    });
  });

  describe('When switching between two tenants', () => {
    it('Then each tenant has its own isolated activeStorageId', () => {
      mockAuthState.tenantId = 'tenant-1';
      useStoragesStore.getState().setActiveStorage('storage-001');

      mockAuthState.tenantId = 'tenant-2';
      useStoragesStore.getState().setActiveStorage('storage-002');

      expect(localStorage.getItem('stocka:active-storage:tenant-1')).toContain('storage-001');
      expect(localStorage.getItem('stocka:active-storage:tenant-2')).toContain('storage-002');
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════
// Partialize — only activeStorageId is persisted
// ═════════════════════════════════════════════════════════════════════════

describe('Given the persist partialize rule', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('When the store has ephemeral fields populated', () => {
    beforeEach(() => {
      useStoragesStore.setState({
        storages: [space1, space2],
        isLoading: true,
        error: 'loadFailed',
        activeStorageId: 'storage-001',
      });
      // Trigger a persist rehydration by touching setActiveStorage again
      useStoragesStore.getState().setActiveStorage('storage-001');
    });

    it('Then only activeStorageId is serialized to localStorage', () => {
      const raw = localStorage.getItem('stocka:active-storage:tenant-1');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw ?? '{}') as { state: Record<string, unknown> };
      expect(parsed.state).toEqual({ activeStorageId: 'storage-001' });
      expect(parsed.state).not.toHaveProperty('storages');
      expect(parsed.state).not.toHaveProperty('isLoading');
      expect(parsed.state).not.toHaveProperty('error');
    });
  });
});
