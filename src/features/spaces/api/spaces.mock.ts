import type { Space } from '../types/spaces.types';

export const mockSpaces: Space[] = [
  {
    id: 'space-001',
    tenantId: 'tenant-001',
    name: 'Main Store Room',
    type: 'STORE_ROOM',
    status: 'ACTIVE',
    address: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'space-002',
    tenantId: 'tenant-001',
    name: 'Custom Room A',
    type: 'CUSTOM_ROOM',
    status: 'ACTIVE',
    address: null,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'space-003',
    tenantId: 'tenant-001',
    name: 'Old Room',
    type: 'CUSTOM_ROOM',
    status: 'ARCHIVED',
    address: null,
    createdAt: '2026-01-03T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
  },
];

export const mockSpacesService = {
  list: vi.fn().mockResolvedValue(mockSpaces),
  create: vi.fn().mockResolvedValue(mockSpaces[0]),
  update: vi.fn().mockResolvedValue(mockSpaces[0]),
  archive: vi.fn().mockResolvedValue({ ...mockSpaces[0], status: 'ARCHIVED' }),
  restore: vi.fn().mockResolvedValue({ ...mockSpaces[2], status: 'ACTIVE' }),
};
