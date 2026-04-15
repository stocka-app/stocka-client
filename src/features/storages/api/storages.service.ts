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

// H-07 per-transition change-type endpoints use singular target segments.
const TYPE_SLUG_SINGULAR: Record<StorageType, string> = {
  WAREHOUSE: 'warehouse',
  STORE_ROOM: 'store-room',
  CUSTOM_ROOM: 'custom-room',
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
  }): Promise<Storage> {
    const { data } = await axiosInstance.patch(`/storages/warehouses/${id}`, payload);
    return storageSchema.parse(unwrap(data));
  },

  async updateStoreRoom(id: string, payload: {
    name?: string;
    description?: string | null;
    address?: string;
  }): Promise<Storage> {
    const { data } = await axiosInstance.patch(`/storages/store-rooms/${id}`, payload);
    return storageSchema.parse(unwrap(data));
  },

  async updateCustomRoom(id: string, payload: {
    name?: string;
    description?: string | null;
    address?: string;
    icon?: string;
    color?: string;
    roomType?: string;
  }): Promise<Storage> {
    const { data } = await axiosInstance.patch(`/storages/custom-rooms/${id}`, payload);
    return storageSchema.parse(unwrap(data));
  },

  async changeType(
    id: string,
    sourceType: StorageType,
    targetType: StorageType,
  ): Promise<{ storageUUID: string }> {
    const url = `/storages/${TYPE_SLUG[sourceType]}/${id}/convert-to-${TYPE_SLUG_SINGULAR[targetType]}`;
    const { data } = await axiosInstance.patch(url);
    return unwrap(data) as { storageUUID: string };
  },

  async archive(id: string, type: StorageType): Promise<Storage> {
    const { data } = await axiosInstance.delete(`/storages/${TYPE_SLUG[type]}/${id}/archive`);
    return storageSchema.parse(unwrap(data));
  },

  async restore(id: string, type: StorageType): Promise<Storage> {
    const { data } = await axiosInstance.post(`/storages/${TYPE_SLUG[type]}/${id}/restore`);
    return storageSchema.parse(unwrap(data));
  },

  async freeze(id: string, type: StorageType): Promise<Storage> {
    const { data } = await axiosInstance.post(`/storages/${TYPE_SLUG[type]}/${id}/freeze`);
    return storageSchema.parse(unwrap(data));
  },

  async unfreeze(id: string, type: StorageType): Promise<Storage> {
    const { data } = await axiosInstance.post(`/storages/${TYPE_SLUG[type]}/${id}/unfreeze`);
    return storageSchema.parse(unwrap(data));
  },

  async deleteStoragePermanent(id: string): Promise<void> {
    await axiosInstance.delete(`/storages/${id}/permanent`);
  },

  async fetchCapabilities(signal?: AbortSignal): Promise<TenantCapabilities> {
    const { data } = await axiosInstance.get('/tenants/me/capabilities', { signal });
    return unwrap(data) as TenantCapabilities;
  },
};
