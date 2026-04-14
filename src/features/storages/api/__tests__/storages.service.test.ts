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

  // ── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('calls POST /storages with payload and returns unwrapped + parsed storage', async () => {
      mockedAxios.post.mockResolvedValueOnce(envelope(storageFixture));

      const payload = { name: 'Almacen Central', type: 'WAREHOUSE' as const, address: 'Av. Reforma 123' };
      const result = await storagesService.create(payload);

      expect(mockedAxios.post).toHaveBeenCalledWith('/storages', payload);
      expect(result).toEqual(storageFixture);
    });
  });

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
    it('calls PATCH /storages/warehouses/:id with payload and returns storageUUID', async () => {
      mockedAxios.patch.mockResolvedValueOnce(envelope({ storageUUID: 'uuid-1' }));

      const result = await storagesService.updateWarehouse('uuid-1', { name: 'Almacen Norte' });

      expect(mockedAxios.patch).toHaveBeenCalledWith('/storages/warehouses/uuid-1', { name: 'Almacen Norte' });
      expect(result).toEqual({ storageUUID: 'uuid-1' });
    });
  });

  // ── updateStoreRoom ───────────────────────────────────────────────────────

  describe('updateStoreRoom', () => {
    it('calls PATCH /storages/store-rooms/:id with payload and returns storageUUID', async () => {
      mockedAxios.patch.mockResolvedValueOnce(envelope({ storageUUID: 'uuid-2' }));

      const result = await storagesService.updateStoreRoom('uuid-2', { name: 'Back Store Updated' });

      expect(mockedAxios.patch).toHaveBeenCalledWith('/storages/store-rooms/uuid-2', { name: 'Back Store Updated' });
      expect(result).toEqual({ storageUUID: 'uuid-2' });
    });
  });

  // ── updateCustomRoom ──────────────────────────────────────────────────────

  describe('updateCustomRoom', () => {
    it('calls PATCH /storages/custom-rooms/:id with payload and returns storageUUID', async () => {
      mockedAxios.patch.mockResolvedValueOnce(envelope({ storageUUID: 'uuid-3' }));

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
      expect(result).toEqual({ storageUUID: 'uuid-3' });
    });
  });

  // ── changeType ────────────────────────────────────────────────────────────

  describe('changeType', () => {
    it('calls PATCH /storages/:id/type with the new type and returns storageUUID', async () => {
      mockedAxios.patch.mockResolvedValueOnce(envelope({ storageUUID: 'uuid-1' }));

      const result = await storagesService.changeType('uuid-1', 'STORE_ROOM');

      expect(mockedAxios.patch).toHaveBeenCalledWith('/storages/uuid-1/type', { type: 'STORE_ROOM' });
      expect(result).toEqual({ storageUUID: 'uuid-1' });
    });
  });

  // ── archive ──────────────────────────────────────────────────────────────

  describe('archive', () => {
    it('calls DELETE /storages/:id and returns the archived storage', async () => {
      const archived = { ...storageFixture, status: 'ARCHIVED' as const, archivedAt: '2026-03-28T12:00:00Z' };
      mockedAxios.delete.mockResolvedValueOnce(envelope(archived));

      const result = await storagesService.archive('uuid-1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/storages/uuid-1');
      expect(result).toEqual(archived);
    });
  });

  // ── restore ──────────────────────────────────────────────────────────────

  describe('restore', () => {
    it('calls POST /storages/:id/restore and returns the restored storage', async () => {
      mockedAxios.post.mockResolvedValueOnce(envelope(storageFixture));

      const result = await storagesService.restore('uuid-1');

      expect(mockedAxios.post).toHaveBeenCalledWith('/storages/uuid-1/restore');
      expect(result).toEqual(storageFixture);
    });
  });

  // ── destroy ──────────────────────────────────────────────────────────────

  describe('destroy', () => {
    it('calls DELETE /storages/:id/permanent', async () => {
      mockedAxios.delete.mockResolvedValueOnce({ data: {} });

      await storagesService.destroy('uuid-1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/storages/uuid-1/permanent');
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
