import type { Storage } from '../types/storages.types';

export const mockStorages: Storage[] = [
  {
    uuid: 'storage-001',
    name: 'Main Store Room',
    type: 'STORE_ROOM',
    status: 'ACTIVE',
    address: null,
    roomType: null,
    archivedAt: null,
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
    archivedAt: null,
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
    archivedAt: '2026-03-01T00:00:00.000Z',
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
];

export const mockStoragesService = {
  list: vi.fn().mockResolvedValue(mockStorages),
  create: vi.fn().mockResolvedValue(mockStorages[0]),
  update: vi.fn().mockResolvedValue(mockStorages[0]),
  archive: vi.fn().mockResolvedValue({ ...mockStorages[0], status: 'ARCHIVED' }),
  restore: vi.fn().mockResolvedValue({ ...mockStorages[2], status: 'ACTIVE' }),
};
