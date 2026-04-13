import axiosInstance from '@/shared/lib/axios';
import { storageSchema, storagesPageSchema } from '../schemas/storages.schema';
import type { CreateStorageFormData } from '../schemas/storages.schema';
import type { Storage, StoragesPage, StorageStatus, StorageType, TenantCapabilities } from '../types/storages.types';

export interface ListStoragesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: StorageStatus;
  type?: StorageType;
  signal?: AbortSignal;
}

/**
 * Unwraps the standard backend envelope { data: T, success: boolean }.
 * The TransformInterceptor on the server wraps every response in this shape,
 * so every service method must peel it off before Zod-parsing the payload.
 */
function unwrap<T>(envelope: { data: T; success: boolean }): T {
  return envelope.data;
}

const TYPE_SLUG: Record<StorageType, string> = {
  WAREHOUSE: 'warehouses',
  STORE_ROOM: 'store-rooms',
  CUSTOM_ROOM: 'custom-rooms',
};

export const storagesService = {
  async list({ signal, ...queryParams }: ListStoragesParams = {}): Promise<StoragesPage> {
    const { data } = await axiosInstance.get('/storages', { params: queryParams, signal });
    return storagesPageSchema.parse(unwrap(data));
  },

  async create(payload: CreateStorageFormData): Promise<Storage> {
    const { data } = await axiosInstance.post('/storages', payload);
    return storageSchema.parse(unwrap(data));
  },

  async createWarehouse(payload: {
    name: string;
    address: string;
    description?: string;
  }): Promise<{ storageUUID: string }> {
    const { data } = await axiosInstance.post('/storages/warehouses', payload);
    return unwrap(data) as { storageUUID: string };
  },

  async createStoreRoom(payload: {
    name: string;
    address: string;
    description?: string;
  }): Promise<{ storageUUID: string }> {
    const { data } = await axiosInstance.post('/storages/store-rooms', payload);
    return unwrap(data) as { storageUUID: string };
  },

  async createCustomRoom(payload: {
    name: string;
    roomType: string;
    address: string;
    description?: string;
    icon?: string;
    color?: string;
  }): Promise<{ storageUUID: string }> {
    const { data } = await axiosInstance.post('/storages/custom-rooms', payload);
    return unwrap(data) as { storageUUID: string };
  },

  async updateWarehouse(id: string, payload: {
    name?: string;
    description?: string | null;
    address?: string;
  }): Promise<{ storageUUID: string }> {
    const { data } = await axiosInstance.patch(`/storages/warehouses/${id}`, payload);
    return unwrap(data) as { storageUUID: string };
  },

  async updateStoreRoom(id: string, payload: {
    name?: string;
    description?: string | null;
    address?: string;
  }): Promise<{ storageUUID: string }> {
    const { data } = await axiosInstance.patch(`/storages/store-rooms/${id}`, payload);
    return unwrap(data) as { storageUUID: string };
  },

  async updateCustomRoom(id: string, payload: {
    name?: string;
    description?: string | null;
    address?: string;
    icon?: string;
    color?: string;
    roomType?: string;
  }): Promise<{ storageUUID: string }> {
    const { data } = await axiosInstance.patch(`/storages/custom-rooms/${id}`, payload);
    return unwrap(data) as { storageUUID: string };
  },

  async changeType(id: string, type: StorageType): Promise<{ storageUUID: string }> {
    const { data } = await axiosInstance.patch(`/storages/${id}/type`, { type });
    return unwrap(data) as { storageUUID: string };
  },

  async archive(id: string): Promise<Storage> {
    const { data } = await axiosInstance.delete(`/storages/${id}`);
    return storageSchema.parse(unwrap(data));
  },

  async restore(id: string): Promise<Storage> {
    const { data } = await axiosInstance.post(`/storages/${id}/restore`);
    return storageSchema.parse(unwrap(data));
  },

  async freeze(id: string, type: StorageType): Promise<void> {
    await axiosInstance.post(`/storages/${TYPE_SLUG[type]}/${id}/freeze`);
  },

  async unfreeze(id: string, type: StorageType): Promise<void> {
    await axiosInstance.post(`/storages/${TYPE_SLUG[type]}/${id}/unfreeze`);
  },

  async destroy(id: string): Promise<void> {
    await axiosInstance.delete(`/storages/${id}/permanent`);
  },

  async fetchCapabilities(signal?: AbortSignal): Promise<TenantCapabilities> {
    const { data } = await axiosInstance.get('/tenants/me/capabilities', { signal });
    return unwrap(data) as TenantCapabilities;
  },
};
