import { describe, expect, it } from 'vitest';
import { createStorageSchema, storageSchema, storageStatusSchema, storagesListSchema } from '../storages.schema';

describe('Given the storages schemas validate domain data', () => {
  // ─── storageStatusSchema ───────────────────────────────────────────────────────

  describe('When storageStatusSchema receives FROZEN', () => {
    it('Then it parses successfully', () => {
      const result = storageStatusSchema.safeParse('FROZEN');
      expect(result.success).toBe(true);
    });
  });

  describe('When storageStatusSchema receives an invalid value', () => {
    it('Then it fails validation', () => {
      const result = storageStatusSchema.safeParse('DELETED');
      expect(result.success).toBe(false);
    });
  });

  // ─── storageSchema ────────────────────────────────────────────────────────────

  describe('When storageSchema parses a valid storage object', () => {
    const validSpace = {
      uuid: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Main Warehouse',
      type: 'WAREHOUSE',
      status: 'ACTIVE',
      address: '123 Main St',
      roomType: null,
      archivedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    it('Then it returns the parsed object', () => {
      const result = storageSchema.safeParse(validSpace);
      expect(result.success).toBe(true);
    });
  });

  describe('When storageSchema parses a storage with FROZEN status', () => {
    it('Then it parses successfully', () => {
      const result = storageSchema.safeParse({
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Frozen Room',
        type: 'CUSTOM_ROOM',
        status: 'FROZEN',
        address: null,
        roomType: null,
        archivedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When storageSchema parses an archived storage with archivedAt date', () => {
    it('Then it parses successfully', () => {
      const result = storageSchema.safeParse({
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Old Room',
        type: 'CUSTOM_ROOM',
        status: 'ARCHIVED',
        address: null,
        roomType: null,
        archivedAt: '2026-03-01T12:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-03-01T12:00:00.000Z',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When storageSchema parses a CUSTOM_ROOM with a roomType', () => {
    it('Then it parses successfully and preserves roomType', () => {
      const result = storageSchema.safeParse({
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Exhibition Hall',
        type: 'CUSTOM_ROOM',
        status: 'ACTIVE',
        address: null,
        roomType: 'Exhibition',
        archivedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.roomType).toBe('Exhibition');
      }
    });
  });

  describe('When storageSchema receives an invalid type', () => {
    it('Then it fails validation', () => {
      const result = storageSchema.safeParse({
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test',
        type: 'INVALID_TYPE',
        status: 'ACTIVE',
        address: null,
        roomType: null,
        archivedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── storagesListSchema ────────────────────────────────────────────────────────

  describe('When storagesListSchema receives an array of valid storages', () => {
    it('Then it parses successfully', () => {
      const result = storagesListSchema.safeParse([]);
      expect(result.success).toBe(true);
    });
  });

  // ─── createStorageSchema ───────────────────────────────────────────────────────

  describe('When createStorageSchema receives a valid CUSTOM_ROOM', () => {
    it('Then it parses successfully without address', () => {
      const result = createStorageSchema.safeParse({
        name: 'Room A',
        type: 'CUSTOM_ROOM',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When createStorageSchema receives a WAREHOUSE without address', () => {
    it('Then it fails with an address error', () => {
      const result = createStorageSchema.safeParse({
        name: 'Main Bodega',
        type: 'WAREHOUSE',
        address: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const addressError = result.error.issues.find((i) => i.path.includes('address'));
        expect(addressError).toBeDefined();
      }
    });
  });

  describe('When createStorageSchema receives a WAREHOUSE with a valid address', () => {
    it('Then it parses successfully', () => {
      const result = createStorageSchema.safeParse({
        name: 'Main Bodega',
        type: 'WAREHOUSE',
        address: '123 Main St, Monterrey, 64000',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When createStorageSchema receives an empty name', () => {
    it('Then it fails validation', () => {
      const result = createStorageSchema.safeParse({
        name: '',
        type: 'STORE_ROOM',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('When createStorageSchema receives a name exceeding 80 characters', () => {
    it('Then it fails validation', () => {
      const result = createStorageSchema.safeParse({
        name: 'a'.repeat(81),
        type: 'STORE_ROOM',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('When createStorageSchema receives a STORE_ROOM without address', () => {
    it('Then it parses successfully (address is optional for non-WAREHOUSE types)', () => {
      const result = createStorageSchema.safeParse({
        name: 'Storage A',
        type: 'STORE_ROOM',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When createStorageSchema receives a WAREHOUSE with whitespace-only address', () => {
    it('Then it fails validation', () => {
      const result = createStorageSchema.safeParse({
        name: 'Big Warehouse',
        type: 'WAREHOUSE',
        address: '   ',
      });
      expect(result.success).toBe(false);
    });
  });
});
