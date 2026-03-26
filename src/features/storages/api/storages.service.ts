import axiosInstance from '@/shared/lib/axios';
import { storageSchema, storagesPageSchema } from '../schemas/storages.schema';
import type { CreateStorageFormData, UpdateStorageFormData } from '../schemas/storages.schema';
import type { Storage, StoragesPage, StorageStatus, StorageType, TenantCapabilities } from '../types/storages.types';

export interface ListStoragesParams {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: 'ASC' | 'DESC';
  status?: StorageStatus;
  type?: StorageType;
}

export const storagesService = {
  async list(params: ListStoragesParams = {}): Promise<StoragesPage> {
    const { data } = await axiosInstance.get('/storages', { params });
    return storagesPageSchema.parse(data);
  },

  async create(payload: CreateStorageFormData): Promise<Storage> {
    const { data } = await axiosInstance.post('/storages', payload);
    return storageSchema.parse(data);
  },

  async update(id: string, payload: UpdateStorageFormData): Promise<Storage> {
    const { data } = await axiosInstance.patch(`/storages/${id}`, payload);
    return storageSchema.parse(data);
  },

  async archive(id: string): Promise<Storage> {
    const { data } = await axiosInstance.delete(`/storages/${id}`);
    return storageSchema.parse(data);
  },

  async restore(id: string): Promise<Storage> {
    const { data } = await axiosInstance.post(`/storages/${id}/restore`);
    return storageSchema.parse(data);
  },

  async fetchCapabilities(): Promise<TenantCapabilities> {
    const { data } = await axiosInstance.get<TenantCapabilities>('/tenants/me/capabilities');
    return data;
  },
};
