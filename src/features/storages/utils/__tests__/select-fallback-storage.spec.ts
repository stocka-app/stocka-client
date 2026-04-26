import { describe, expect, it } from 'vitest';
import { selectFallbackStorage } from '@/features/storages/utils/select-fallback-storage';
import type { Storage } from '@/features/storages/types/storages.types';

function buildStorage(overrides: Partial<Storage>): Storage {
  return {
    uuid: '019538a0-0000-7000-8000-000000000000',
    name: 'storage',
    type: 'WAREHOUSE',
    status: 'ACTIVE',
    address: null,
    roomType: null,
    icon: 'inventory_2',
    color: '#000000',
    description: null,
    archivedAt: null,
    frozenAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  } as Storage;
}

describe('selectFallbackStorage', () => {
  describe('Given the tenant has no storages', () => {
    it('Then it returns null', () => {
      const result = selectFallbackStorage([], {
        priorityOrder: ['ACTIVE', 'FROZEN', 'ARCHIVED'],
        sortBy: 'name',
        direction: 'asc',
      });
      expect(result).toBeNull();
    });
  });

  describe('Given multiple storages and an ACTIVE-first priority order', () => {
    it('Then it returns the alphabetically-first ACTIVE storage', () => {
      const storages = [
        buildStorage({ uuid: 'u1', name: 'Bodega Norte', status: 'ACTIVE' }),
        buildStorage({ uuid: 'u2', name: 'Almacén Central', status: 'ACTIVE' }),
        buildStorage({ uuid: 'u3', name: 'Frozen Storage', status: 'FROZEN' }),
      ];

      const result = selectFallbackStorage(storages, {
        priorityOrder: ['ACTIVE', 'FROZEN', 'ARCHIVED'],
        sortBy: 'name',
        direction: 'asc',
      });

      expect(result?.uuid).toBe('u2');
    });
  });

  describe('Given desc direction', () => {
    it('Then it returns the alphabetically-last ACTIVE storage', () => {
      const storages = [
        buildStorage({ uuid: 'u1', name: 'Almacén' }),
        buildStorage({ uuid: 'u2', name: 'Tienda' }),
      ];

      const result = selectFallbackStorage(storages, {
        priorityOrder: ['ACTIVE'],
        sortBy: 'name',
        direction: 'desc',
      });

      expect(result?.uuid).toBe('u2');
    });
  });

  describe('Given no candidates match the first priority status', () => {
    it('Then it falls through to the next status', () => {
      const storages = [
        buildStorage({ uuid: 'u1', name: 'Frozen A', status: 'FROZEN' }),
        buildStorage({ uuid: 'u2', name: 'Archived X', status: 'ARCHIVED' }),
      ];

      const result = selectFallbackStorage(storages, {
        priorityOrder: ['ACTIVE', 'FROZEN', 'ARCHIVED'],
        sortBy: 'name',
        direction: 'asc',
      });

      expect(result?.uuid).toBe('u1');
    });
  });

  describe('Given numeric sortBy (e.g. createdAt as number) with asc direction', () => {
    it('Then it returns the smallest value', () => {
      const storages = [
        buildStorage({ uuid: 'u1', createdAt: '2024-06-01T00:00:00Z' }),
        buildStorage({ uuid: 'u2', createdAt: '2024-01-01T00:00:00Z' }),
      ];

      const result = selectFallbackStorage(storages, {
        priorityOrder: ['ACTIVE'],
        sortBy: 'createdAt',
        direction: 'asc',
      });

      expect(result?.uuid).toBe('u2');
    });
  });

  describe('Given a numeric sort field (asc + desc)', () => {
    it('Then asc returns the smallest and desc returns the largest', () => {
      const storages = [
        buildStorage({ uuid: 'u1' }),
        buildStorage({ uuid: 'u2' }),
      ];
      (storages[0] as unknown as { weight: number }).weight = 5;
      (storages[1] as unknown as { weight: number }).weight = 2;

      const asc = selectFallbackStorage(storages, {
        priorityOrder: ['ACTIVE'],
        sortBy: 'weight' as keyof Storage,
        direction: 'asc',
      });
      expect(asc?.uuid).toBe('u2');

      const desc = selectFallbackStorage(storages, {
        priorityOrder: ['ACTIVE'],
        sortBy: 'weight' as keyof Storage,
        direction: 'desc',
      });
      expect(desc?.uuid).toBe('u1');
    });
  });

  describe('Given a sortBy field where some values are null', () => {
    it('Then nulls are pushed to the end and non-null values win', () => {
      const storages = [
        buildStorage({ uuid: 'u1', address: null }),
        buildStorage({ uuid: 'u2', address: '500 Industrial Ave' }),
        buildStorage({ uuid: 'u3', address: null }),
      ];

      const result = selectFallbackStorage(storages, {
        priorityOrder: ['ACTIVE'],
        sortBy: 'address',
        direction: 'asc',
      });

      expect(result?.uuid).toBe('u2');
    });
  });

  describe('Given all candidates have null in the sortBy field', () => {
    it('Then sort is stable (returns the first by insertion order)', () => {
      const storages = [
        buildStorage({ uuid: 'u1', address: null }),
        buildStorage({ uuid: 'u2', address: null }),
      ];

      const result = selectFallbackStorage(storages, {
        priorityOrder: ['ACTIVE'],
        sortBy: 'address',
        direction: 'asc',
      });

      expect(result?.uuid).toBe('u1');
    });
  });

  describe('Given a sortBy on a boolean-ish field (no string/number), with all values defined', () => {
    it('Then the sort returns 0 (stable insertion order)', () => {
      const storages = [
        buildStorage({ uuid: 'u1', archivedAt: null }),
        buildStorage({ uuid: 'u2', archivedAt: null }),
      ];

      const result = selectFallbackStorage(storages, {
        priorityOrder: ['ACTIVE'],
        sortBy: 'archivedAt',
        direction: 'asc',
      });

      expect(result?.uuid).toBe('u1');
    });
  });

  describe('Given mixed-type non-numeric, non-string values', () => {
    it('Then the sort falls back to 0 (insertion order preserved)', () => {
      const storages = [
        buildStorage({ uuid: 'u1' }),
        buildStorage({ uuid: 'u2' }),
      ];
      (storages[0] as unknown as { flag: boolean }).flag = true;
      (storages[1] as unknown as { flag: boolean }).flag = false;

      const result = selectFallbackStorage(storages, {
        priorityOrder: ['ACTIVE'],
        sortBy: 'flag' as keyof Storage,
        direction: 'asc',
      });

      expect(result?.uuid).toBe('u1');
    });
  });
});
