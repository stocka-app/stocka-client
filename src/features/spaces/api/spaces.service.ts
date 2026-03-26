import axiosInstance from '@/shared/lib/axios';
import { spaceSchema, spacesListSchema } from '../schemas/spaces.schema';
import type { CreateSpaceFormData, UpdateSpaceFormData } from '../schemas/spaces.schema';
import type { Space } from '../types/spaces.types';

export const spacesService = {
  async list(): Promise<Space[]> {
    const { data } = await axiosInstance.get('/storages');
    return spacesListSchema.parse(data);
  },

  async create(payload: CreateSpaceFormData): Promise<Space> {
    const { data } = await axiosInstance.post('/storages', payload);
    return spaceSchema.parse(data);
  },

  async update(id: string, payload: UpdateSpaceFormData): Promise<Space> {
    const { data } = await axiosInstance.patch(`/storages/${id}`, payload);
    return spaceSchema.parse(data);
  },

  async archive(id: string): Promise<Space> {
    const { data } = await axiosInstance.delete(`/storages/${id}`);
    return spaceSchema.parse(data);
  },

  async restore(id: string): Promise<Space> {
    const { data } = await axiosInstance.post(`/storages/${id}/restore`);
    return spaceSchema.parse(data);
  },
};
