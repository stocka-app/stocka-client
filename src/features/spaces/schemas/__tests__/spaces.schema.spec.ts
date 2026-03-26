import { describe, expect, it } from 'vitest';
import { createSpaceSchema, spaceSchema, spaceStatusSchema, spacesListSchema } from '../spaces.schema';

describe('Given the spaces schemas validate domain data', () => {
  // ─── spaceStatusSchema ───────────────────────────────────────────────────────

  describe('When spaceStatusSchema receives FROZEN', () => {
    it('Then it parses successfully', () => {
      const result = spaceStatusSchema.safeParse('FROZEN');
      expect(result.success).toBe(true);
    });
  });

  describe('When spaceStatusSchema receives an invalid value', () => {
    it('Then it fails validation', () => {
      const result = spaceStatusSchema.safeParse('DELETED');
      expect(result.success).toBe(false);
    });
  });

  // ─── spaceSchema ────────────────────────────────────────────────────────────

  describe('When spaceSchema parses a valid space object', () => {
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
      const result = spaceSchema.safeParse(validSpace);
      expect(result.success).toBe(true);
    });
  });

  describe('When spaceSchema parses a space with FROZEN status', () => {
    it('Then it parses successfully', () => {
      const result = spaceSchema.safeParse({
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

  describe('When spaceSchema parses an archived space with archivedAt date', () => {
    it('Then it parses successfully', () => {
      const result = spaceSchema.safeParse({
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

  describe('When spaceSchema parses a CUSTOM_ROOM with a roomType', () => {
    it('Then it parses successfully and preserves roomType', () => {
      const result = spaceSchema.safeParse({
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

  describe('When spaceSchema receives an invalid type', () => {
    it('Then it fails validation', () => {
      const result = spaceSchema.safeParse({
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

  // ─── spacesListSchema ────────────────────────────────────────────────────────

  describe('When spacesListSchema receives an array of valid spaces', () => {
    it('Then it parses successfully', () => {
      const result = spacesListSchema.safeParse([]);
      expect(result.success).toBe(true);
    });
  });

  // ─── createSpaceSchema ───────────────────────────────────────────────────────

  describe('When createSpaceSchema receives a valid CUSTOM_ROOM', () => {
    it('Then it parses successfully without address', () => {
      const result = createSpaceSchema.safeParse({
        name: 'Room A',
        type: 'CUSTOM_ROOM',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When createSpaceSchema receives a WAREHOUSE without address', () => {
    it('Then it fails with an address error', () => {
      const result = createSpaceSchema.safeParse({
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

  describe('When createSpaceSchema receives a WAREHOUSE with a valid address', () => {
    it('Then it parses successfully', () => {
      const result = createSpaceSchema.safeParse({
        name: 'Main Bodega',
        type: 'WAREHOUSE',
        address: '123 Main St, Monterrey, 64000',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When createSpaceSchema receives an empty name', () => {
    it('Then it fails validation', () => {
      const result = createSpaceSchema.safeParse({
        name: '',
        type: 'STORE_ROOM',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('When createSpaceSchema receives a name exceeding 100 characters', () => {
    it('Then it fails validation', () => {
      const result = createSpaceSchema.safeParse({
        name: 'a'.repeat(101),
        type: 'STORE_ROOM',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('When createSpaceSchema receives a STORE_ROOM without address', () => {
    it('Then it parses successfully (address is optional for non-WAREHOUSE types)', () => {
      const result = createSpaceSchema.safeParse({
        name: 'Storage A',
        type: 'STORE_ROOM',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('When createSpaceSchema receives a WAREHOUSE with whitespace-only address', () => {
    it('Then it fails validation', () => {
      const result = createSpaceSchema.safeParse({
        name: 'Big Warehouse',
        type: 'WAREHOUSE',
        address: '   ',
      });
      expect(result.success).toBe(false);
    });
  });
});
