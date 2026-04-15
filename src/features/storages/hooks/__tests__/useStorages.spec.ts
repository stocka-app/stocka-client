import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import { useStoragesStore } from '../../store/storages.store';
import type { Storage, StoragesPage } from '../../types/storages.types';

vi.mock('../../api/storages.service', () => ({
  storagesService: {
    list: vi.fn(),
    create: vi.fn(),
    createWarehouse: vi.fn(),
    createStoreRoom: vi.fn(),
    createCustomRoom: vi.fn(),
    updateWarehouse: vi.fn(),
    updateStoreRoom: vi.fn(),
    updateCustomRoom: vi.fn(),
    changeType: vi.fn(),
    archive: vi.fn(),
    restore: vi.fn(),
    freeze: vi.fn(),
    unfreeze: vi.fn(),
    deleteStoragePermanent: vi.fn(),
    fetchCapabilities: vi.fn(),
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

// Default: STARTER — all storage types allowed
let mockIsAllowed = vi.fn<(feature: string) => boolean>(() => true);

vi.mock('@/shared/hooks/useTierCapabilities', () => ({
  useTierCapabilities: () => ({ isAllowed: mockIsAllowed }),
  STORAGE_TYPE_TO_FEATURE: {
    WAREHOUSE:   'warehouses',
    STORE_ROOM:  'storeRooms',
    CUSTOM_ROOM: 'customRooms',
  },
}));

import { useStorages } from '../useStorages';
import { storagesService } from '../../api/storages.service';
import type { CreateWarehouseFormData, CreateStoreRoomFormData, CreateCustomRoomFormData } from '../../schemas/storages.schema';

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockStoragesItems: Storage[] = [
  {
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
  },
  {
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
  },
  {
    uuid: 'storage-003',
    name: 'Old Room',
    type: 'CUSTOM_ROOM',
    status: 'ARCHIVED',
    address: null,
    roomType: null,
    icon: 'restaurant',
    color: '#0D9488',
    description: null,
    archivedAt: '2026-03-01T00:00:00.000Z',
    frozenAt: null,
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
  summary: { active: mockStoragesItems.length, frozen: 0, archived: 0 },
  typeSummary: {
    WAREHOUSE: { active: 0, frozen: 0, archived: 0 },
    STORE_ROOM: { active: 0, frozen: 0, archived: 0 },
    CUSTOM_ROOM: { active: 0, frozen: 0, archived: 0 },
  },
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
    icon: 'warehouse',
    color: '#3B82F6',
    description: null,
    archivedAt: null,
    frozenAt: null,
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
    icon: 'storefront',
    color: '#0D9488',
    description: null,
    archivedAt: null,
    frozenAt: null,
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
    icon: 'inventory_2',
    color: '#D97706',
    description: null,
    archivedAt: null,
    frozenAt: '2026-02-01T00:00:00.000Z',
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
    icon: 'warehouse',
    color: '#3B82F6',
    description: null,
    archivedAt: '2026-03-01T00:00:00.000Z',
    frozenAt: null,
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
  // 2 active (WAREHOUSE + CUSTOM_ROOM), 1 frozen (STORE_ROOM), 1 archived (WAREHOUSE)
  summary: { active: 2, frozen: 1, archived: 1 },
  typeSummary: {
    WAREHOUSE: { active: 1, frozen: 0, archived: 1 },
    STORE_ROOM: { active: 0, frozen: 1, archived: 0 },
    CUSTOM_ROOM: { active: 1, frozen: 0, archived: 0 },
  },
};

function resetStore(): void {
  useStoragesStore.setState({
    storages: [],
    total: 0,
    page: 1,
    totalPages: 0,
    isLoading: false,
    error: null,
    activeStorageId: null,
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

  describe('When createWarehouse is called with valid data', () => {
    it('Then it calls the service and returns error: null on success', async () => {
      vi.mocked(storagesService.createWarehouse).mockResolvedValue({ storageUUID: 'new-uuid' });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.createWarehouse({
        name: 'New Warehouse',
        address: '123 Main St',
      } as CreateWarehouseFormData);
      expect(response.error).toBeNull();
      expect(vi.mocked(storagesService.createWarehouse)).toHaveBeenCalledTimes(1);
    });

    it('Then returns error: name_taken when service responds with STORAGE_NAME_ALREADY_EXISTS', async () => {
      const axiosError = Object.assign(new Error('Conflict'), {
        isAxiosError: true,
        response: { status: 409, data: { error: 'STORAGE_NAME_ALREADY_EXISTS' } },
      });
      vi.mocked(storagesService.createWarehouse).mockRejectedValue(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.createWarehouse({
        name: 'Duplicate',
        address: '123 Main St',
      } as CreateWarehouseFormData);
      expect(response.error).toBe('name_taken');
    });

    it('Then returns error: tier_limit when service responds with 403', async () => {
      const axiosError = Object.assign(new Error('Forbidden'), {
        isAxiosError: true,
        response: { status: 403, data: {} },
      });
      vi.mocked(storagesService.createWarehouse).mockRejectedValue(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.createWarehouse({
        name: 'Blocked',
        address: '123 Main St',
      } as CreateWarehouseFormData);
      expect(response.error).toBe('tier_limit');
    });

    it('Then returns error: name_taken when the interceptor resolves a plain ApiError with STORAGE_NAME_ALREADY_EXISTS', async () => {
      vi.mocked(storagesService.createWarehouse).mockRejectedValue({
        error: 'STORAGE_NAME_ALREADY_EXISTS',
        statusCode: 409,
        message: 'Storage name already exists',
      });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.createWarehouse({
        name: 'Duplicate',
        address: '123 Main St',
      } as CreateWarehouseFormData);
      expect(response.error).toBe('name_taken');
    });

    it('Then returns error: tier_limit when the interceptor resolves a plain ApiError with statusCode 403', async () => {
      vi.mocked(storagesService.createWarehouse).mockRejectedValue({
        error: 'TIER_LIMIT_REACHED',
        statusCode: 403,
        message: 'Tier limit reached',
      });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.createWarehouse({
        name: 'Blocked',
        address: '123 Main St',
      } as CreateWarehouseFormData);
      expect(response.error).toBe('tier_limit');
    });

    it('Then returns error: server_error for a non-axios error', async () => {
      vi.mocked(storagesService.createWarehouse).mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.createWarehouse({
        name: 'New',
        address: '123 Main St',
      } as CreateWarehouseFormData);
      expect(response.error).toBe('server_error');
    });

    it('Then returns error: server_error for an axios error that is not 403 or name_taken', async () => {
      const axiosError = Object.assign(new Error('Internal error'), {
        isAxiosError: true,
        response: { status: 500, data: {} },
      });
      vi.mocked(storagesService.createWarehouse).mockRejectedValue(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.createWarehouse({
        name: 'New',
        address: '123 Main St',
      } as CreateWarehouseFormData);
      expect(response.error).toBe('server_error');
    });
  });

  describe('When createStoreRoom is called with valid data', () => {
    it('Then it calls the service and returns error: null on success', async () => {
      vi.mocked(storagesService.createStoreRoom).mockResolvedValue({ storageUUID: 'new-uuid' });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.createStoreRoom({
        name: 'New Store Room',
        address: 'Calle 1',
      } as CreateStoreRoomFormData);
      expect(response.error).toBeNull();
      expect(vi.mocked(storagesService.createStoreRoom)).toHaveBeenCalledTimes(1);
    });

    it('Then returns error: name_taken when the name already exists', async () => {
      const axiosError = Object.assign(new Error('Conflict'), {
        isAxiosError: true,
        response: { status: 409, data: { error: 'STORAGE_NAME_ALREADY_EXISTS' } },
      });
      vi.mocked(storagesService.createStoreRoom).mockRejectedValue(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.createStoreRoom({
        name: 'Duplicate',
        address: 'Calle 1',
      } as CreateStoreRoomFormData);
      expect(response.error).toBe('name_taken');
    });

    it('Then returns error: server_error for a generic failure', async () => {
      vi.mocked(storagesService.createStoreRoom).mockRejectedValue(new Error('Server down'));
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.createStoreRoom({
        name: 'New',
        address: 'Calle 1',
      } as CreateStoreRoomFormData);
      expect(response.error).toBe('server_error');
    });
  });

  describe('When createCustomRoom is called with valid data', () => {
    it('Then it calls the service and returns error: null on success', async () => {
      vi.mocked(storagesService.createCustomRoom).mockResolvedValue({ storageUUID: 'new-uuid' });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.createCustomRoom({
        name: 'Kitchen',
        address: 'Floor 1',
        icon: 'restaurant',
        color: '#0D9488',
      } as CreateCustomRoomFormData);
      expect(response.error).toBeNull();
      expect(vi.mocked(storagesService.createCustomRoom)).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Kitchen', roomType: 'restaurant', icon: 'restaurant' }),
      );
    });

    it('Then returns error: tier_limit when the 403 response is received', async () => {
      const axiosError = Object.assign(new Error('Forbidden'), {
        isAxiosError: true,
        response: { status: 403, data: {} },
      });
      vi.mocked(storagesService.createCustomRoom).mockRejectedValue(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.createCustomRoom({
        name: 'Blocked',
        address: 'Floor 1',
        icon: 'restaurant',
        color: '#0D9488',
      } as CreateCustomRoomFormData);
      expect(response.error).toBe('tier_limit');
    });

    it('Then returns error: server_error for a generic failure', async () => {
      vi.mocked(storagesService.createCustomRoom).mockRejectedValue(new Error('Server down'));
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.createCustomRoom({
        name: 'New',
        address: 'Floor 1',
        icon: 'restaurant',
        color: '#0D9488',
      } as CreateCustomRoomFormData);
      expect(response.error).toBe('server_error');
    });
  });

  describe('When editStorage is called with a valid id and payload', () => {
    it('Then it calls the service and returns error: null on success', async () => {
      // mockStoragesItems[0] is type STORE_ROOM — hook dispatches to updateStoreRoom
      vi.mocked(storagesService.updateStoreRoom).mockResolvedValue(mockStoragesItems[0]);
      vi.mocked(storagesService.list).mockResolvedValue(mockPage);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.editStorage('storage-001', 'STORE_ROOM', { name: 'Updated' });
      expect(response.error).toBeNull();
    });

    it('Then returns error when the service throws', async () => {
      vi.mocked(storagesService.updateStoreRoom).mockRejectedValue(new Error('Update failed'));
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.editStorage('storage-001', 'STORE_ROOM', { name: 'Updated' });
      expect(response.error).toBe('server_error');
    });
  });

  describe('When editStorage is called and the service throws a plain ApiError', () => {
    it('Then returns error: address_required when plain ApiError carries STORAGE_ADDRESS_REQUIRED_FOR_WAREHOUSE', async () => {
      vi.mocked(storagesService.updateWarehouse).mockRejectedValue({
        error: 'STORAGE_ADDRESS_REQUIRED_FOR_WAREHOUSE',
        statusCode: 400,
      });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.editStorage('storage-wh', 'WAREHOUSE', { address: '' });
      expect(response.error).toBe('address_required');
    });
  });

  describe('When editStorage is called and the service throws a raw AxiosError', () => {
    it('Then returns error: server_error when AxiosError has no matching error code', async () => {
      const axiosError = Object.assign(new Error('Internal Error'), {
        isAxiosError: true,
        response: { status: 500, data: { error: 'UNKNOWN_ERROR' } },
      });
      vi.mocked(storagesService.updateStoreRoom).mockRejectedValue(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.editStorage('storage-001', 'STORE_ROOM', { name: 'New' });
      expect(response.error).toBe('server_error');
    });

    it('Then returns error: name_taken when AxiosError carries STORAGE_NAME_ALREADY_EXISTS', async () => {
      const axiosError = Object.assign(new Error('Conflict'), {
        isAxiosError: true,
        response: { status: 409, data: { error: 'STORAGE_NAME_ALREADY_EXISTS' } },
      });
      vi.mocked(storagesService.updateStoreRoom).mockRejectedValue(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.editStorage('storage-001', 'STORE_ROOM', { name: 'Dup' });
      expect(response.error).toBe('name_taken');
    });

    it('Then returns error: address_required when AxiosError carries STORAGE_ADDRESS_REQUIRED_FOR_WAREHOUSE', async () => {
      const axiosError = Object.assign(new Error('BadRequest'), {
        isAxiosError: true,
        response: { status: 400, data: { error: 'STORAGE_ADDRESS_REQUIRED_FOR_WAREHOUSE' } },
      });
      vi.mocked(storagesService.updateWarehouse).mockRejectedValue(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.editStorage('storage-wh', 'WAREHOUSE', { address: '' });
      expect(response.error).toBe('address_required');
    });
  });

  describe('When editStorage is called with a WAREHOUSE type', () => {
    it('Then it dispatches to updateWarehouse and returns error: null on success', async () => {
      vi.mocked(storagesService.updateWarehouse).mockResolvedValue({
        ...mockStoragesItems[0],
        uuid: 'storage-wh',
        type: 'WAREHOUSE',
        name: 'Updated WH',
      });
      vi.mocked(storagesService.list).mockResolvedValue(mockPage);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.editStorage('storage-wh', 'WAREHOUSE', { name: 'Updated WH' });
      expect(response.error).toBeNull();
      expect(vi.mocked(storagesService.updateWarehouse)).toHaveBeenCalledWith(
        'storage-wh',
        { name: 'Updated WH' },
      );
    });

    it('Then returns a resolved edit error when updateWarehouse throws', async () => {
      vi.mocked(storagesService.updateWarehouse).mockRejectedValue(new Error('WH update failed'));
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.editStorage('storage-wh', 'WAREHOUSE', { name: 'Updated WH' });
      expect(response.error).toBe('server_error');
    });
  });

  describe('When editStorage is called with a CUSTOM_ROOM type', () => {
    it('Then it dispatches to updateCustomRoom and returns error: null on success', async () => {
      vi.mocked(storagesService.updateCustomRoom).mockResolvedValue({
        ...mockStoragesItems[0],
        uuid: 'storage-cr',
        type: 'CUSTOM_ROOM',
        name: 'Updated CR',
      });
      vi.mocked(storagesService.list).mockResolvedValue(mockPage);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.editStorage('storage-cr', 'CUSTOM_ROOM', { name: 'Updated CR' });
      expect(response.error).toBeNull();
      expect(vi.mocked(storagesService.updateCustomRoom)).toHaveBeenCalledWith(
        'storage-cr',
        { name: 'Updated CR' },
      );
    });

    it('Then returns a resolved edit error when updateCustomRoom throws with name_taken', async () => {
      vi.mocked(storagesService.updateCustomRoom).mockRejectedValue({
        error: 'STORAGE_NAME_ALREADY_EXISTS',
        statusCode: 409,
      });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.editStorage('storage-cr', 'CUSTOM_ROOM', { name: 'Duplicate' });
      expect(response.error).toBe('name_taken');
    });
  });

  describe('When changeStorageType is called with a valid id and target type', () => {
    it('Then it calls service.changeType and returns error: null on success', async () => {
      vi.mocked(storagesService.changeType).mockResolvedValue({ storageUUID: 'storage-001' });
      vi.mocked(storagesService.list).mockResolvedValue(mockPage);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.changeStorageType('storage-001', 'CUSTOM_ROOM');
      expect(response.error).toBeNull();
      expect(vi.mocked(storagesService.changeType)).toHaveBeenCalledWith('storage-001', 'CUSTOM_ROOM');
    });

    it('Then returns error: tier_limit when the service responds with 403', async () => {
      const axiosError = Object.assign(new Error('Forbidden'), {
        isAxiosError: true,
        response: { status: 403, data: {} },
      });
      vi.mocked(storagesService.changeType).mockRejectedValue(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.changeStorageType('storage-001', 'WAREHOUSE');
      expect(response.error).toBe('tier_limit');
    });

    it('Then returns error: frozen when service responds with STORAGE_TYPE_LOCKED_WHILE_FROZEN', async () => {
      vi.mocked(storagesService.changeType).mockRejectedValue({
        error: 'STORAGE_TYPE_LOCKED_WHILE_FROZEN',
        statusCode: 422,
      });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.changeStorageType('storage-001', 'STORE_ROOM');
      expect(response.error).toBe('frozen');
    });

    it('Then returns error: server_error for a generic failure', async () => {
      vi.mocked(storagesService.changeType).mockRejectedValue(new Error('Generic fail'));
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.changeStorageType('storage-001', 'WAREHOUSE');
      expect(response.error).toBe('server_error');
    });

    it('Then returns error: archived when plain ApiError carries STORAGE_TYPE_LOCKED_WHILE_ARCHIVED', async () => {
      vi.mocked(storagesService.changeType).mockRejectedValue({
        error: 'STORAGE_TYPE_LOCKED_WHILE_ARCHIVED',
        statusCode: 422,
      });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.changeStorageType('storage-001', 'STORE_ROOM');
      expect(response.error).toBe('archived');
    });

    it('Then returns error: address_required when plain ApiError carries STORAGE_ADDRESS_REQUIRED_FOR_WAREHOUSE', async () => {
      vi.mocked(storagesService.changeType).mockRejectedValue({
        error: 'STORAGE_ADDRESS_REQUIRED_FOR_WAREHOUSE',
        statusCode: 400,
      });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.changeStorageType('storage-001', 'WAREHOUSE');
      expect(response.error).toBe('address_required');
    });

    it('Then returns error: tier_limit when plain ApiError carries statusCode 403', async () => {
      vi.mocked(storagesService.changeType).mockRejectedValue({
        error: 'TIER_LIMIT_REACHED',
        statusCode: 403,
      });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.changeStorageType('storage-001', 'WAREHOUSE');
      expect(response.error).toBe('tier_limit');
    });

    it('Then returns error: archived when raw AxiosError carries STORAGE_TYPE_LOCKED_WHILE_ARCHIVED', async () => {
      const axiosError = Object.assign(new Error('Unprocessable'), {
        isAxiosError: true,
        response: { status: 422, data: { error: 'STORAGE_TYPE_LOCKED_WHILE_ARCHIVED' } },
      });
      vi.mocked(storagesService.changeType).mockRejectedValue(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.changeStorageType('storage-001', 'STORE_ROOM');
      expect(response.error).toBe('archived');
    });

    it('Then returns error: frozen when raw AxiosError carries STORAGE_TYPE_LOCKED_WHILE_FROZEN', async () => {
      const axiosError = Object.assign(new Error('Unprocessable'), {
        isAxiosError: true,
        response: { status: 422, data: { error: 'STORAGE_TYPE_LOCKED_WHILE_FROZEN' } },
      });
      vi.mocked(storagesService.changeType).mockRejectedValue(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.changeStorageType('storage-001', 'STORE_ROOM');
      expect(response.error).toBe('frozen');
    });

    it('Then returns error: address_required when raw AxiosError carries STORAGE_ADDRESS_REQUIRED_FOR_WAREHOUSE', async () => {
      const axiosError = Object.assign(new Error('BadRequest'), {
        isAxiosError: true,
        response: { status: 400, data: { error: 'STORAGE_ADDRESS_REQUIRED_FOR_WAREHOUSE' } },
      });
      vi.mocked(storagesService.changeType).mockRejectedValue(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.changeStorageType('storage-001', 'WAREHOUSE');
      expect(response.error).toBe('address_required');
    });

    it('Then returns error: server_error when raw AxiosError has no matching error code and non-403 status', async () => {
      const axiosError = Object.assign(new Error('Internal Server Error'), {
        isAxiosError: true,
        response: { status: 500, data: { error: 'UNKNOWN_ERROR' } },
      });
      vi.mocked(storagesService.changeType).mockRejectedValue(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.changeStorageType('storage-001', 'CUSTOM_ROOM');
      expect(response.error).toBe('server_error');
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

  describe('When freezeStorage is called with a valid id', () => {
    it('Then it calls service.freeze with the correct id and type, and returns true on success', async () => {
      const frozen: Storage = { ...mockStoragesItems[0], status: 'FROZEN', frozenAt: '2026-02-01T00:00:00.000Z' };
      vi.mocked(storagesService.freeze).mockResolvedValue(frozen);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      // mockStoragesItems[0] is STORE_ROOM type
      const success = await result.current.freezeStorage('storage-001');

      expect(success).toBe(true);
      expect(vi.mocked(storagesService.freeze)).toHaveBeenCalledWith('storage-001', 'STORE_ROOM');
    });

    it('Then it applies the updated storage in place without a full refetch (DT-H05-14)', async () => {
      const frozen: Storage = { ...mockStoragesItems[0], status: 'FROZEN', frozenAt: '2026-02-01T00:00:00.000Z' };
      vi.mocked(storagesService.freeze).mockResolvedValue(frozen);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      vi.clearAllMocks();
      vi.mocked(storagesService.freeze).mockResolvedValue(frozen);

      await act(async () => {
        await result.current.freezeStorage('storage-001');
      });

      // No additional list() call — we trust the DTO returned by freeze().
      expect(vi.mocked(storagesService.list)).not.toHaveBeenCalled();
      expect(
        result.current.storages.find((s) => s.uuid === 'storage-001')?.status,
      ).toBe('FROZEN');
    });

    it('Then returns false when the target storage id does not exist in the current list', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.freezeStorage('non-existent-uuid');

      expect(success).toBe(false);
      expect(vi.mocked(storagesService.freeze)).not.toHaveBeenCalled();
    });

    it('Then returns false when the service throws', async () => {
      vi.mocked(storagesService.freeze).mockRejectedValue(new Error('Freeze failed'));
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.freezeStorage('storage-001');
      expect(success).toBe(false);
    });
  });

  describe('When unfreezeStorage is called with a valid id', () => {
    it('Then it calls service.unfreeze with the correct id and type, and returns true on success', async () => {
      const frozenItem: Storage = {
        ...mockStoragesItems[0],
        uuid: 'storage-frozen',
        status: 'FROZEN',
        type: 'WAREHOUSE',
        frozenAt: '2026-02-01T00:00:00.000Z',
      };
      const reactivated: Storage = { ...frozenItem, status: 'ACTIVE', frozenAt: null };
      const pageWithFrozen: StoragesPage = {
        ...mockPage,
        items: [...mockStoragesItems, frozenItem],
        total: mockStoragesItems.length + 1,
      };
      vi.mocked(storagesService.list).mockResolvedValue(pageWithFrozen);
      vi.mocked(storagesService.unfreeze).mockResolvedValue(reactivated);

      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.unfreezeStorage('storage-frozen');

      expect(success).toBe(true);
      expect(vi.mocked(storagesService.unfreeze)).toHaveBeenCalledWith('storage-frozen', 'WAREHOUSE');
    });

    it('Then it applies the updated storage in place without a full refetch (DT-H05-14)', async () => {
      const frozenItem: Storage = {
        ...mockStoragesItems[0],
        uuid: 'storage-frozen',
        status: 'FROZEN',
        type: 'STORE_ROOM',
        frozenAt: '2026-02-01T00:00:00.000Z',
      };
      const reactivated: Storage = { ...frozenItem, status: 'ACTIVE', frozenAt: null };
      const pageWithFrozen: StoragesPage = {
        ...mockPage,
        items: [...mockStoragesItems, frozenItem],
        total: mockStoragesItems.length + 1,
      };
      vi.mocked(storagesService.list).mockResolvedValue(pageWithFrozen);
      vi.mocked(storagesService.unfreeze).mockResolvedValue(reactivated);

      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      vi.clearAllMocks();
      vi.mocked(storagesService.unfreeze).mockResolvedValue(reactivated);

      await act(async () => {
        await result.current.unfreezeStorage('storage-frozen');
      });

      expect(vi.mocked(storagesService.list)).not.toHaveBeenCalled();
      expect(
        result.current.storages.find((s) => s.uuid === 'storage-frozen')?.status,
      ).toBe('ACTIVE');
    });

    it('Then returns false when the target storage id does not exist in the current list', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.unfreezeStorage('non-existent-uuid');

      expect(success).toBe(false);
      expect(vi.mocked(storagesService.unfreeze)).not.toHaveBeenCalled();
    });

    it('Then returns false when the service throws', async () => {
      const frozenItem: Storage = {
        ...mockStoragesItems[0],
        uuid: 'storage-frozen',
        status: 'FROZEN',
        type: 'CUSTOM_ROOM',
        frozenAt: '2026-02-01T00:00:00.000Z',
      };
      vi.mocked(storagesService.list).mockResolvedValue({
        ...mockPage,
        items: [...mockStoragesItems, frozenItem],
      });
      vi.mocked(storagesService.unfreeze).mockRejectedValue(new Error('Unfreeze failed'));

      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.unfreezeStorage('storage-frozen');
      expect(success).toBe(false);
    });
  });

  describe('When getIsLastActive is called', () => {
    it('Then returns true when the given storage is the only ACTIVE one in the list', async () => {
      // mockStoragesItems has 2 ACTIVE + 1 ARCHIVED — narrow to 1 ACTIVE
      const singleActivePage: StoragesPage = {
        ...mockPage,
        items: [
          mockStoragesItems[0], // ACTIVE
          mockStoragesItems[2], // ARCHIVED
        ],
        summary: { active: 1, frozen: 0, archived: 1 },
      };
      vi.mocked(storagesService.list).mockResolvedValue(singleActivePage);

      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      expect(result.current.getIsLastActive('storage-001')).toBe(true);
    });

    it('Then returns false when there are multiple ACTIVE storages in the list', async () => {
      const { result } = renderHook(() => useStorages());
      // mockPage has 2 ACTIVE storages (storage-001 and storage-002)
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      expect(result.current.getIsLastActive('storage-001')).toBe(false);
    });

    it('Then returns false when the id points to a non-ACTIVE storage', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      // storage-003 is ARCHIVED
      expect(result.current.getIsLastActive('storage-003')).toBe(false);
    });

    it('Then returns false when the id does not exist in the current list', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      expect(result.current.getIsLastActive('non-existent-uuid')).toBe(false);
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

  describe('When fetchStorages is called manually while searchQuery is active', () => {
    it('Then it passes the active searchQuery to the API', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => result.current.setSearchQuery('bodega'));
      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'bodega' }),
        );
      });

      vi.clearAllMocks();
      vi.mocked(storagesService.list).mockResolvedValue(allStoragesMockPage);

      await act(async () => {
        await result.current.fetchStorages();
      });

      expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'bodega' }),
      );
    });
  });

  describe('When fetchStorages is called manually while filterStatus is active', () => {
    it('Then it passes the active filterStatus to the API', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => result.current.setFilterStatus('FROZEN'));
      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'FROZEN' }),
        );
      });

      vi.clearAllMocks();
      vi.mocked(storagesService.list).mockResolvedValue(allStoragesMockPage);

      await act(async () => {
        await result.current.fetchStorages();
      });

      expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'FROZEN' }),
      );
    });
  });

  describe('When the user switches tabs (setFilterType) while filterStatus and searchQuery are active', () => {
    it('Then filterStatus and searchQuery are reset so only the new tab filters reach the API', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      // Set status and search first, then switch tab — tab switch must clear the rest
      act(() => {
        result.current.setFilterStatus('ACTIVE');
        result.current.setFilterType('STORE_ROOM');
        result.current.setSearchQuery('almacén');
      });

      // filterStatus was cleared by setFilterType; only type + search remain
      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'STORE_ROOM', search: 'almacén' }),
        );
      });

      const latestCall = vi.mocked(storagesService.list).mock.lastCall?.[0];
      expect(latestCall).not.toHaveProperty('status');
    });

    it('Then manual fetchStorages also reflects only the remaining active filters', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      act(() => {
        result.current.setFilterStatus('ACTIVE');
        result.current.setFilterType('STORE_ROOM');
      });

      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'STORE_ROOM' }),
        );
      });

      vi.clearAllMocks();
      vi.mocked(storagesService.list).mockResolvedValue(allStoragesMockPage);

      await act(async () => {
        await result.current.fetchStorages();
      });

      expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'STORE_ROOM' }),
      );
      const latestCall = vi.mocked(storagesService.list).mock.lastCall?.[0];
      expect(latestCall).not.toHaveProperty('status');
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
    summary: { active: 3, frozen: 0, archived: 0 },
    typeSummary: {
      WAREHOUSE: { active: 0, frozen: 0, archived: 0 },
      STORE_ROOM: { active: 0, frozen: 0, archived: 0 },
      CUSTOM_ROOM: { active: 0, frozen: 0, archived: 0 },
    },
  };

  const pageTwoMock: StoragesPage = {
    items: [mockStoragesItems[1]],
    total: 3,
    page: 2,
    limit: 1,
    totalPages: 3,
    summary: { active: 3, frozen: 0, archived: 0 },
    typeSummary: {
      WAREHOUSE: { active: 0, frozen: 0, archived: 0 },
      STORE_ROOM: { active: 0, frozen: 0, archived: 0 },
      CUSTOM_ROOM: { active: 0, frozen: 0, archived: 0 },
    },
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
        'STORAGE_UNFREEZE',
        'STORAGE_ARCHIVE',
      ];
    });

    it('Then canCreate, canUpdate, canFreeze, canUnfreeze, canArchive, canDelete are all true', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      expect(result.current.canCreate).toBe(true);
      expect(result.current.canUpdate).toBe(true);
      expect(result.current.canFreeze).toBe(true);
      expect(result.current.canUnfreeze).toBe(true);
      expect(result.current.canArchive).toBe(true);
      expect(result.current.canDelete).toBe(true);
    });
  });

  describe('When the user has STORAGE_UNFREEZE but not STORAGE_FREEZE', () => {
    beforeEach(() => {
      mockPermissions = ['STORAGE_READ', 'STORAGE_UNFREEZE'];
    });

    it('Then canUnfreeze is true and canFreeze is false', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      expect(result.current.canUnfreeze).toBe(true);
      expect(result.current.canFreeze).toBe(false);
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

    it('Then canUnfreeze is false', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      expect(result.current.canUnfreeze).toBe(false);
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

// ─────────────────────────────────────────────────────────────────────────────
// Tier gate — isGated and fetch prevention
// ─────────────────────────────────────────────────────────────────────────────

describe('Given a FREE tier tenant where warehouses are not allowed', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    mockIsAllowed = vi.fn((feature: string) => feature !== 'warehouses');
    vi.mocked(storagesService.list).mockResolvedValue(mockPage);
  });

  describe('When the user selects the Warehouses filter tab', () => {
    it('Then isGated is true', async () => {
      const { result } = renderHook(() => useStorages());
      act(() => { result.current.setFilterType('WAREHOUSE'); });
      await waitFor(() => {
        expect(result.current.isGated).toBe(true);
      });
    });

    it('Then no API fetch is made for warehouses', async () => {
      vi.mocked(storagesService.list).mockClear();
      const { result } = renderHook(() => useStorages());
      // Initial mount fetch (no filter)
      await waitFor(() => expect(vi.mocked(storagesService.list)).toHaveBeenCalledTimes(1));

      vi.mocked(storagesService.list).mockClear();
      act(() => { result.current.setFilterType('WAREHOUSE'); });

      // Allow any potential async ticks
      await new Promise((r) => setTimeout(r, 50));
      expect(vi.mocked(storagesService.list)).not.toHaveBeenCalled();
    });

    it('Then stale storages from the previous tab are cleared so stats bars show empty', async () => {
      const { result } = renderHook(() => useStorages());
      // Wait for initial fetch to populate storages
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      // Switch to gated warehouse tab
      act(() => { result.current.setFilterType('WAREHOUSE'); });

      await waitFor(() => {
        expect(result.current.storages).toHaveLength(0);
        expect(result.current.activeStorages).toHaveLength(0);
        expect(result.current.frozenStorages).toHaveLength(0);
        expect(result.current.total).toBe(0);
      });
    });
  });

  describe('When the user is on the All tab (no filter)', () => {
    it('Then isGated is false', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => {
        expect(result.current.isGated).toBe(false);
      });
    });
  });
});

describe('Given a STARTER tier tenant where all storage types are allowed', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    mockIsAllowed = vi.fn(() => true);
    vi.mocked(storagesService.list).mockResolvedValue(mockPage);
  });

  describe('When the user selects the Warehouses filter tab', () => {
    it('Then isGated is false', async () => {
      const { result } = renderHook(() => useStorages());
      act(() => { result.current.setFilterType('WAREHOUSE'); });
      await waitFor(() => {
        expect(result.current.isGated).toBe(false);
      });
    });

    it('Then the API is called with the warehouse filter', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(vi.mocked(storagesService.list)).toHaveBeenCalledTimes(1));

      vi.mocked(storagesService.list).mockClear();
      act(() => { result.current.setFilterType('WAREHOUSE'); });

      await waitFor(() => {
        expect(vi.mocked(storagesService.list)).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'WAREHOUSE' }),
        );
      });
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════
// Active context (H-03 — STOC-344)
// ═════════════════════════════════════════════════════════════════════════

describe('Given useStorages exposes active-context derived data', () => {
  beforeEach(() => {
    resetStore();
    vi.mocked(storagesService.list).mockResolvedValue(allStoragesMockPage);
  });

  // ── FE-UH8 ─────────────────────────────────────────────────────────────
  describe('Given the store contains storages and an activeStorageId pointing to the CUSTOM_ROOM', () => {
    it('Then `sortedStorages` has the active one first and the rest A→Z', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.setActiveStorage('storage-active-2'); // "Almacén Norte" CUSTOM_ROOM
      });

      await waitFor(() => {
        expect(result.current.sortedStorages[0].uuid).toBe('storage-active-2');
      });
    });
  });

  describe('Given the store has no active storage set', () => {
    it('Then `sortedStorages` preserves the server order from the current page', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.activeStorageId).toBeNull();
      expect(result.current.sortedStorages).toEqual(result.current.storages);
    });
  });

  describe('Given the activeStorageId points to a storage not on the current page', () => {
    it('Then `sortedStorages` falls back to the plain server order', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.setActiveStorage('storage-ghost-that-does-not-exist');
      });

      // Fallback: sortedStorages === storages (server order)
      expect(result.current.sortedStorages).toEqual(result.current.storages);
    });
  });

  // ── FE-UH9 ─────────────────────────────────────────────────────────────
  describe('When the user calls setActiveStorage with a new uuid', () => {
    it('Then `activeStorageId` reflects the new value', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.setActiveStorage('storage-frozen-1');
      });

      expect(result.current.activeStorageId).toBe('storage-frozen-1');
    });
  });

  // ── FE-UH10 ────────────────────────────────────────────────────────────
  describe('Given a stale activeStorageId pointing to a deleted storage', () => {
    it('Then hydrateActiveStorage promotes the first ACTIVE storage A→Z', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      // Set a stale id pointing to a storage not present in the fetched data
      act(() => {
        result.current.setActiveStorage('deleted-storage');
      });

      act(() => {
        result.current.hydrateActiveStorage();
      });

      // allStoragesItems sorted by name A→Z filtering ACTIVE only:
      //   "Almacén Central" (storage-active-1, WAREHOUSE, ACTIVE)
      //   "Almacén Norte"   (storage-active-2, CUSTOM_ROOM, ACTIVE)
      // First ACTIVE A→Z → storage-active-1
      expect(result.current.activeStorageId).toBe('storage-active-1');
    });
  });

  describe('Given the store has mixed statuses', () => {
    it('Then `storages` includes ACTIVE + FROZEN + ARCHIVED items', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const statuses = result.current.storages.map((s) => s.status);
      expect(statuses).toContain('ACTIVE');
      expect(statuses).toContain('FROZEN');
      expect(statuses).toContain('ARCHIVED');
    });
  });

  describe('Given the store is empty', () => {
    beforeEach(() => {
      vi.mocked(storagesService.list).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        summary: { active: 0, frozen: 0, archived: 0 },
        typeSummary: {
          WAREHOUSE: { active: 0, frozen: 0, archived: 0 },
          STORE_ROOM: { active: 0, frozen: 0, archived: 0 },
          CUSTOM_ROOM: { active: 0, frozen: 0, archived: 0 },
        },
      });
    });

    it('Then activeStorage is null and storages is empty', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.storages).toEqual([]);
      expect(result.current.activeStorage).toBeNull();
    });
  });

  describe('Given the activeStorageId is set to a visible storage', () => {
    it('Then `activeStorage` resolves to the full Storage object', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.setActiveStorage('storage-active-1');
      });

      expect(result.current.activeStorage).not.toBeNull();
      expect(result.current.activeStorage?.uuid).toBe('storage-active-1');
      expect(result.current.activeStorage?.name).toBe('Almacén Central');
    });
  });

  // ── archive/restore no-target + catch branches (coverage) ─────────────────

  describe('When archiveStorage is called with a storage not in the current list', () => {
    it('Then it returns false without calling the service', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.archiveStorage('non-existent-uuid');
      expect(success).toBe(false);
      expect(vi.mocked(storagesService.archive)).not.toHaveBeenCalled();
    });
  });

  describe('When restoreStorage is called with a storage not in the current list', () => {
    it('Then it returns false without calling the service', async () => {
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const success = await result.current.restoreStorage('non-existent-uuid');
      expect(success).toBe(false);
      expect(vi.mocked(storagesService.restore)).not.toHaveBeenCalled();
    });
  });

  // ── deleteStoragePermanent (DT-H07-9 stub) ─────────────────────────────────

  describe('When deleteStoragePermanent stub is called', () => {
    it('Then it returns not_implemented for plain ApiError statusCode 501', async () => {
      vi.mocked(storagesService.deleteStoragePermanent).mockRejectedValueOnce({ statusCode: 501 });
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.deleteStoragePermanent('storage-001');
      expect(response.error).toBe('not_implemented');
    });

    it('Then it returns not_implemented for raw AxiosError with status 501', async () => {
      const axiosError = Object.assign(new Error('Not Implemented'), {
        isAxiosError: true,
        response: { status: 501, data: {} },
      });
      vi.mocked(storagesService.deleteStoragePermanent).mockRejectedValueOnce(axiosError);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.deleteStoragePermanent('storage-001');
      expect(response.error).toBe('not_implemented');
    });

    it('Then it returns server_error for a generic failure', async () => {
      vi.mocked(storagesService.deleteStoragePermanent).mockRejectedValueOnce(new Error('boom'));
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.deleteStoragePermanent('storage-001');
      expect(response.error).toBe('server_error');
    });

    it('Then it returns server_error when the service unexpectedly resolves', async () => {
      vi.mocked(storagesService.deleteStoragePermanent).mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useStorages());
      await waitFor(() => expect(result.current.storages.length).toBeGreaterThan(0));

      const response = await result.current.deleteStoragePermanent('storage-001');
      expect(response.error).toBe('server_error');
    });
  });
});
