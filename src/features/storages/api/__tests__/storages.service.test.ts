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
  archivedAt: null,
  createdAt: '2026-01-15T00:00:00Z',
  updatedAt: '2026-03-20T10:00:00Z',
};

const storagesPageFixture = {
  items: [storageFixture],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
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

  // ── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('calls PATCH /storages/:id with payload', async () => {
      const updated = { ...storageFixture, name: 'Almacen Norte' };
      mockedAxios.patch.mockResolvedValueOnce(envelope(updated));

      const result = await storagesService.update('uuid-1', { name: 'Almacen Norte' });

      expect(mockedAxios.patch).toHaveBeenCalledWith('/storages/uuid-1', { name: 'Almacen Norte' });
      expect(result).toEqual(updated);
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
