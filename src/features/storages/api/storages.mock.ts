import type { Storage, StoragesPage } from '../types/storages.types';

export const mockStorages: Storage[] = [
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
    icon: 'other_houses',
    color: '#7C3AED',
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
    icon: 'other_houses',
    color: '#6B7280',
    description: null,
    archivedAt: '2026-03-01T00:00:00.000Z',
    frozenAt: null,
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
];

export const mockStoragesPage: StoragesPage = {
  items: mockStorages,
  total: mockStorages.length,
  page: 1,
  limit: 50,
  totalPages: 1,
  summary: { active: 2, frozen: 0, archived: 1 },
  typeSummary: {
    WAREHOUSE: { active: 0, frozen: 0, archived: 0 },
    STORE_ROOM: { active: 1, frozen: 0, archived: 0 },
    CUSTOM_ROOM: { active: 1, frozen: 0, archived: 1 },
  },
};

export const mockStoragesService = {
  list: vi.fn().mockResolvedValue(mockStoragesPage),
  create: vi.fn().mockResolvedValue(mockStorages[0]),
  update: vi.fn().mockResolvedValue(mockStorages[0]),
  archive: vi.fn().mockResolvedValue({ ...mockStorages[0], status: 'ARCHIVED' }),
  restore: vi.fn().mockResolvedValue({ ...mockStorages[2], status: 'ACTIVE' }),
};
