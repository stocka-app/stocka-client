import { describe, expect, it } from 'vitest';
import {
  createStorageSchema,
  storageSchema,
  storageStatusSchema,
  storagesListSchema,
  createWarehouseFormSchema,
  createStoreRoomFormSchema,
  createCustomRoomFormSchema,
} from '../storages.schema';

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
      icon: 'warehouse',
      color: '#3B82F6',
      description: null,
      archivedAt: null,
      frozenAt: null,
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
        icon: 'category',
        color: '#6B7280',
        description: null,
        archivedAt: null,
        frozenAt: '2026-02-01T00:00:00.000Z',
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
        icon: 'category',
        color: '#6B7280',
        description: null,
        archivedAt: '2026-03-01T12:00:00.000Z',
        frozenAt: null,
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
        icon: 'museum',
        color: '#8B5CF6',
        description: 'Exhibition space',
        archivedAt: null,
        frozenAt: null,
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
        icon: 'warehouse',
        color: '#3B82F6',
        description: null,
        archivedAt: null,
        frozenAt: null,
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

  // ─── createWarehouseFormSchema ────────────────────────────────────────────────

  describe('When createWarehouseFormSchema receives valid data without description', () => {
    it('Then it parses successfully', () => {
      const result = createWarehouseFormSchema.safeParse({
        name: 'Main Warehouse',
        address: '123 Main St',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When createWarehouseFormSchema receives a description with 5 or more characters', () => {
    it('Then it parses successfully', () => {
      const result = createWarehouseFormSchema.safeParse({
        name: 'Main Warehouse',
        address: '123 Main St',
        description: 'Large storage area',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When createWarehouseFormSchema receives an empty string description', () => {
    it('Then it transforms empty string to undefined and passes', () => {
      const result = createWarehouseFormSchema.safeParse({
        name: 'Main Warehouse',
        address: '123 Main St',
        description: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });
  });

  describe('When createWarehouseFormSchema receives a short description (under 5 chars)', () => {
    it('Then it fails the minimum length refine', () => {
      const result = createWarehouseFormSchema.safeParse({
        name: 'Main Warehouse',
        address: '123 Main St',
        description: 'Hi',
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── createStoreRoomFormSchema ────────────────────────────────────────────────

  describe('When createStoreRoomFormSchema receives valid data without description', () => {
    it('Then it parses successfully', () => {
      const result = createStoreRoomFormSchema.safeParse({
        name: 'Back Store',
        address: 'Calle 1',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When createStoreRoomFormSchema receives an empty string description', () => {
    it('Then it transforms empty string to undefined and passes', () => {
      const result = createStoreRoomFormSchema.safeParse({
        name: 'Back Store',
        address: 'Calle 1',
        description: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });
  });

  describe('When createStoreRoomFormSchema receives a description shorter than 5 characters', () => {
    it('Then it fails the minimum length refine', () => {
      const result = createStoreRoomFormSchema.safeParse({
        name: 'Back Store',
        address: 'Calle 1',
        description: 'abc',
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── createCustomRoomFormSchema ───────────────────────────────────────────────

  describe('When createCustomRoomFormSchema receives valid data with icon and color', () => {
    it('Then it parses successfully with provided icon and color', () => {
      const result = createCustomRoomFormSchema.safeParse({
        name: 'Kitchen',
        address: 'Floor 1',
        icon: 'restaurant',
        color: '#FF5733',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.icon).toBe('restaurant');
        expect(result.data.color).toBe('#FF5733');
      }
    });
  });

  describe('When createCustomRoomFormSchema receives data without icon or color', () => {
    it('Then it uses the default icon and color', () => {
      const result = createCustomRoomFormSchema.safeParse({
        name: 'Office',
        address: 'Floor 2',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.icon).toBe('restaurant');
        expect(result.data.color).toBe('#0D9488');
      }
    });
  });

  describe('When createCustomRoomFormSchema receives an empty string description', () => {
    it('Then it transforms empty string to undefined and passes', () => {
      const result = createCustomRoomFormSchema.safeParse({
        name: 'Office',
        address: 'Floor 2',
        description: '',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });
  });

  describe('When createCustomRoomFormSchema receives a description shorter than 5 characters', () => {
    it('Then it fails the minimum length refine', () => {
      const result = createCustomRoomFormSchema.safeParse({
        name: 'Office',
        address: 'Floor 2',
        description: 'ok',
      });
      expect(result.success).toBe(false);
    });
  });
});
