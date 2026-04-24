import { describe, it, expect, vi, beforeEach } from 'vitest';
import axiosInstance from '@/shared/lib/axios';
import { storagesService } from '../storages.service';

vi.mock('@/shared/lib/axios', () => {
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  };
  return { default: instance, api: instance };
});

const mockedAxios = vi.mocked(axiosInstance);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const storageFixture = {
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Almacen Central',
  type: 'WAREHOUSE' as const,
  status: 'ACTIVE' as const,
  address: 'Av. Reforma 123',
  roomType: null,
  icon: 'warehouse',
  color: '#3B82F6',
  description: null,
  archivedAt: null,
  frozenAt: null,
  createdAt: '2026-01-15T00:00:00Z',
  updatedAt: '2026-03-20T10:00:00Z',
};

const storagesPageFixture = {
  items: [storageFixture],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
  summary: { active: 1, frozen: 0, archived: 0 },
  typeSummary: {
    WAREHOUSE: { active: 1, frozen: 0, archived: 0 },
    STORE_ROOM: { active: 0, frozen: 0, archived: 0 },
    CUSTOM_ROOM: { active: 0, frozen: 0, archived: 0 },
  },
};

/** Backend envelope wrapper */
const envelope = <T>(payload: T) => ({
  data: { data: payload, success: true },
});

const capabilitiesFixture = {
  tier: 'STARTER',
  maxCustomRooms: 3,
  maxStoreRooms: 3,
  maxWarehouses: 1,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('storagesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('calls GET /storages with query params and returns unwrapped + parsed page', async () => {
      mockedAxios.get.mockResolvedValueOnce(envelope(storagesPageFixture));

      const result = await storagesService.list({ page: 1, limit: 10, search: 'central' });

      expect(mockedAxios.get).toHaveBeenCalledWith('/storages', {
        params: { page: 1, limit: 10, search: 'central' },
        signal: undefined,
      });
      expect(result).toEqual(storagesPageFixture);
    });

    it('passes abort signal separately from query params', async () => {
      mockedAxios.get.mockResolvedValueOnce(envelope(storagesPageFixture));
      const controller = new AbortController();

      await storagesService.list({ signal: controller.signal, page: 2 });

      expect(mockedAxios.get).toHaveBeenCalledWith('/storages', {
        params: { page: 2 },
        signal: controller.signal,
      });
    });

    it('works with no arguments', async () => {
      mockedAxios.get.mockResolvedValueOnce(envelope(storagesPageFixture));

      await storagesService.list();

      expect(mockedAxios.get).toHaveBeenCalledWith('/storages', {
        params: {},
        signal: undefined,
      });
    });

    it('propagates errors to the caller', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(storagesService.list()).rejects.toThrow('Network error');
    });
  });

  // The unified POST /storages endpoint was removed by the per-type refactor.
  // Per-type creates are covered by createWarehouse/createStoreRoom/createCustomRoom below.

  // ── createWarehouse ──────────────────────────────────────────────────────

  describe('createWarehouse', () => {
    it('calls POST /storages/warehouses with payload and returns storageUUID', async () => {
      mockedAxios.post.mockResolvedValueOnce(envelope({ storageUUID: 'new-uuid-1' }));

      const payload = { name: 'Main Warehouse', address: 'Av. Industrial 1' };
      const result = await storagesService.createWarehouse(payload);

      expect(mockedAxios.post).toHaveBeenCalledWith('/storages/warehouses', payload);
      expect(result).toEqual({ storageUUID: 'new-uuid-1' });
    });
  });

  // ── createStoreRoom ───────────────────────────────────────────────────────

  describe('createStoreRoom', () => {
    it('calls POST /storages/store-rooms with payload and returns storageUUID', async () => {
      mockedAxios.post.mockResolvedValueOnce(envelope({ storageUUID: 'new-uuid-2' }));

      const payload = { name: 'Back Store', address: 'Calle 5' };
      const result = await storagesService.createStoreRoom(payload);

      expect(mockedAxios.post).toHaveBeenCalledWith('/storages/store-rooms', payload);
      expect(result).toEqual({ storageUUID: 'new-uuid-2' });
    });
  });

  // ── createCustomRoom ──────────────────────────────────────────────────────

  describe('createCustomRoom', () => {
    it('calls POST /storages/custom-rooms with payload and returns storageUUID', async () => {
      mockedAxios.post.mockResolvedValueOnce(envelope({ storageUUID: 'new-uuid-3' }));

      const payload = {
        name: 'Kitchen',
        roomType: 'restaurant',
        address: 'Floor 1',
        icon: 'restaurant',
        color: '#0D9488',
      };
      const result = await storagesService.createCustomRoom(payload);

      expect(mockedAxios.post).toHaveBeenCalledWith('/storages/custom-rooms', payload);
      expect(result).toEqual({ storageUUID: 'new-uuid-3' });
    });
  });

  // ── updateWarehouse ──────────────────────────────────────────────────────

  describe('updateWarehouse', () => {
    it('calls PATCH /storages/warehouses/:id with payload and returns the updated Storage', async () => {
      const updated = { ...storageFixture, name: 'Almacen Norte' };
      mockedAxios.patch.mockResolvedValueOnce(envelope(updated));

      const result = await storagesService.updateWarehouse('uuid-1', { name: 'Almacen Norte' });

      expect(mockedAxios.patch).toHaveBeenCalledWith('/storages/warehouses/uuid-1', { name: 'Almacen Norte' });
      expect(result).toEqual(updated);
    });
  });

  // ── updateStoreRoom ───────────────────────────────────────────────────────

  describe('updateStoreRoom', () => {
    it('calls PATCH /storages/store-rooms/:id with payload and returns the updated Storage', async () => {
      const updated = { ...storageFixture, type: 'STORE_ROOM' as const, name: 'Back Store Updated' };
      mockedAxios.patch.mockResolvedValueOnce(envelope(updated));

      const result = await storagesService.updateStoreRoom('uuid-2', { name: 'Back Store Updated' });

      expect(mockedAxios.patch).toHaveBeenCalledWith('/storages/store-rooms/uuid-2', { name: 'Back Store Updated' });
      expect(result).toEqual(updated);
    });
  });

  // ── updateCustomRoom ──────────────────────────────────────────────────────

  describe('updateCustomRoom', () => {
    it('calls PATCH /storages/custom-rooms/:id with payload and returns the updated Storage', async () => {
      const updated = {
        ...storageFixture,
        type: 'CUSTOM_ROOM' as const,
        name: 'Updated Kitchen',
        icon: 'kitchen',
        color: '#0D9488',
        roomType: 'Kitchen',
      };
      mockedAxios.patch.mockResolvedValueOnce(envelope(updated));

      const result = await storagesService.updateCustomRoom('uuid-3', {
        name: 'Updated Kitchen',
        icon: 'kitchen',
        color: '#0D9488',
      });

      expect(mockedAxios.patch).toHaveBeenCalledWith('/storages/custom-rooms/uuid-3', {
        name: 'Updated Kitchen',
        icon: 'kitchen',
        color: '#0D9488',
      });
      expect(result).toEqual(updated);
    });
  });

  // ── changeType ────────────────────────────────────────────────────────────

  describe('changeType', () => {
    it('calls PATCH /storages/{source-plural}/:id/convert-to-{target-singular} with empty body by default', async () => {
      mockedAxios.patch.mockResolvedValueOnce(envelope({ storageUUID: 'uuid-1' }));

      const result = await storagesService.changeType('uuid-1', 'WAREHOUSE', 'STORE_ROOM');

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/storages/warehouses/uuid-1/convert-to-store-room',
        {},
      );
      expect(result).toEqual({ storageUUID: 'uuid-1' });
    });

    it('resolves the custom-room→warehouse transition to the correct URL', async () => {
      mockedAxios.patch.mockResolvedValueOnce(envelope({ storageUUID: 'uuid-2' }));

      await storagesService.changeType('uuid-2', 'CUSTOM_ROOM', 'WAREHOUSE');

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/storages/custom-rooms/uuid-2/convert-to-warehouse',
        {},
      );
    });

    it('forwards metadata payload as the request body when provided', async () => {
      mockedAxios.patch.mockResolvedValueOnce(envelope({ storageUUID: 'uuid-3' }));

      await storagesService.changeType('uuid-3', 'WAREHOUSE', 'CUSTOM_ROOM', {
        name: 'Kitchen',
        roomType: 'Restaurant',
        icon: 'restaurant',
        color: '#0D9488',
      });

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        '/storages/warehouses/uuid-3/convert-to-custom-room',
        {
          name: 'Kitchen',
          roomType: 'Restaurant',
          icon: 'restaurant',
          color: '#0D9488',
        },
      );
    });
  });

  // ── archive ──────────────────────────────────────────────────────────────

  describe('archive', () => {
    it('calls DELETE /storages/{type}/:id/archive and returns the archived storage', async () => {
      const archived = { ...storageFixture, status: 'ARCHIVED' as const, archivedAt: '2026-03-28T12:00:00Z' };
      mockedAxios.delete.mockResolvedValueOnce(envelope(archived));

      const result = await storagesService.archive('uuid-1', 'WAREHOUSE');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/storages/warehouses/uuid-1/archive');
      expect(result).toEqual(archived);
    });
  });

  // ── restore ──────────────────────────────────────────────────────────────

  describe('restore', () => {
    it('calls POST /storages/{type}/:id/restore and returns the restored storage', async () => {
      mockedAxios.post.mockResolvedValueOnce(envelope(storageFixture));

      const result = await storagesService.restore('uuid-1', 'WAREHOUSE');

      expect(mockedAxios.post).toHaveBeenCalledWith('/storages/warehouses/uuid-1/restore');
      expect(result).toEqual(storageFixture);
    });
  });

  // ── permanentDelete ───────────────────────────────────────────────────────
  // TODO STOC-383: tests del método real `permanentDelete(id, type)` que
  // reemplazó al stub `deleteStoragePermanent(id)`. Se escriben en Paso 8
  // (FASE 5) junto con los demás tests del plan H-08. Skip intencional.

  describe.skip('permanentDelete', () => {
    it('calls DELETE /storages/:slug/:id/permanent per type', () => {
      // placeholder
    });
  });

  // ── freeze ───────────────────────────────────────────────────────────────

  describe('freeze', () => {
    it('calls POST /storages/warehouses/:id/freeze for WAREHOUSE type', async () => {
      mockedAxios.post.mockResolvedValueOnce(envelope(storageFixture));

      await storagesService.freeze('uuid-1', 'WAREHOUSE');

      expect(mockedAxios.post).toHaveBeenCalledWith('/storages/warehouses/uuid-1/freeze');
    });

    it('calls POST /storages/store-rooms/:id/freeze for STORE_ROOM type', async () => {
      mockedAxios.post.mockResolvedValueOnce(envelope(storageFixture));

      await storagesService.freeze('uuid-2', 'STORE_ROOM');

      expect(mockedAxios.post).toHaveBeenCalledWith('/storages/store-rooms/uuid-2/freeze');
    });

    it('calls POST /storages/custom-rooms/:id/freeze for CUSTOM_ROOM type', async () => {
      mockedAxios.post.mockResolvedValueOnce(envelope(storageFixture));

      await storagesService.freeze('uuid-3', 'CUSTOM_ROOM');

      expect(mockedAxios.post).toHaveBeenCalledWith('/storages/custom-rooms/uuid-3/freeze');
    });
  });

  // ── unfreeze ─────────────────────────────────────────────────────────────

  describe('unfreeze', () => {
    it('calls POST /storages/warehouses/:id/unfreeze for WAREHOUSE type', async () => {
      mockedAxios.post.mockResolvedValueOnce(envelope(storageFixture));

      await storagesService.unfreeze('uuid-1', 'WAREHOUSE');

      expect(mockedAxios.post).toHaveBeenCalledWith('/storages/warehouses/uuid-1/unfreeze');
    });

    it('calls POST /storages/store-rooms/:id/unfreeze for STORE_ROOM type', async () => {
      mockedAxios.post.mockResolvedValueOnce(envelope(storageFixture));

      await storagesService.unfreeze('uuid-2', 'STORE_ROOM');

      expect(mockedAxios.post).toHaveBeenCalledWith('/storages/store-rooms/uuid-2/unfreeze');
    });

    it('calls POST /storages/custom-rooms/:id/unfreeze for CUSTOM_ROOM type', async () => {
      mockedAxios.post.mockResolvedValueOnce(envelope(storageFixture));

      await storagesService.unfreeze('uuid-3', 'CUSTOM_ROOM');

      expect(mockedAxios.post).toHaveBeenCalledWith('/storages/custom-rooms/uuid-3/unfreeze');
    });
  });

  // ── fetchCapabilities ────────────────────────────────────────────────────

  describe('fetchCapabilities', () => {
    it('calls GET /tenants/me/capabilities and returns unwrapped capabilities', async () => {
      mockedAxios.get.mockResolvedValueOnce(envelope(capabilitiesFixture));

      const result = await storagesService.fetchCapabilities();

      expect(mockedAxios.get).toHaveBeenCalledWith('/tenants/me/capabilities', { signal: undefined });
      expect(result).toEqual(capabilitiesFixture);
    });

    it('passes abort signal when provided', async () => {
      mockedAxios.get.mockResolvedValueOnce(envelope(capabilitiesFixture));
      const controller = new AbortController();

      await storagesService.fetchCapabilities(controller.signal);

      expect(mockedAxios.get).toHaveBeenCalledWith('/tenants/me/capabilities', { signal: controller.signal });
    });
  });
});
