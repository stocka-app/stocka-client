import type { Space } from '../types/spaces.types';

export const mockSpaces: Space[] = [
  {
    uuid: 'space-001',
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
    uuid: 'space-002',
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
    uuid: 'space-003',
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

export const mockSpacesService = {
  list: vi.fn().mockResolvedValue(mockSpaces),
  create: vi.fn().mockResolvedValue(mockSpaces[0]),
  update: vi.fn().mockResolvedValue(mockSpaces[0]),
  archive: vi.fn().mockResolvedValue({ ...mockSpaces[0], status: 'ARCHIVED' }),
  restore: vi.fn().mockResolvedValue({ ...mockSpaces[2], status: 'ACTIVE' }),
};
