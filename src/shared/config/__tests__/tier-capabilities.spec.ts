import { describe, it, expect } from 'vitest';
import { TIER_CAPABILITIES } from '../tier-capabilities';

// ─────────────────────────────────────────────────────────────────────────────
// tier-capabilities — static map validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the TIER_CAPABILITIES static map', () => {
  describe('When checking plan coverage', () => {
    it('Then all four tiers are defined', () => {
      expect(TIER_CAPABILITIES).toHaveProperty('FREE');
      expect(TIER_CAPABILITIES).toHaveProperty('STARTER');
      expect(TIER_CAPABILITIES).toHaveProperty('GROWTH');
      expect(TIER_CAPABILITIES).toHaveProperty('ENTERPRISE');
    });

    it('Then each tier has all required capability keys', () => {
      for (const tier of Object.keys(TIER_CAPABILITIES) as Array<keyof typeof TIER_CAPABILITIES>) {
        const caps = TIER_CAPABILITIES[tier];
        expect(caps).toHaveProperty('warehouses');
        expect(caps).toHaveProperty('storeRooms');
        expect(caps).toHaveProperty('customRooms');
        expect(caps).toHaveProperty('invitations');
        expect(caps).toHaveProperty('maxMembers');
      }
    });
  });

  describe('When checking FREE tier restrictions', () => {
    it('Then warehouses are not allowed', () => {
      expect(TIER_CAPABILITIES.FREE.warehouses.allowed).toBe(false);
      expect(TIER_CAPABILITIES.FREE.warehouses.limit).toBe(0);
    });

    it('Then store rooms are allowed with limit 1', () => {
      expect(TIER_CAPABILITIES.FREE.storeRooms.allowed).toBe(true);
      expect(TIER_CAPABILITIES.FREE.storeRooms.limit).toBe(1);
    });

    it('Then custom rooms are allowed with limit 1', () => {
      expect(TIER_CAPABILITIES.FREE.customRooms.allowed).toBe(true);
      expect(TIER_CAPABILITIES.FREE.customRooms.limit).toBe(1);
    });

    it('Then invitations are not allowed', () => {
      expect(TIER_CAPABILITIES.FREE.invitations).toBe(false);
    });

    it('Then team is limited to 1 member', () => {
      expect(TIER_CAPABILITIES.FREE.maxMembers).toBe(1);
    });
  });

  describe('When checking STARTER tier capabilities', () => {
    it('Then warehouses are allowed with limit 1', () => {
      expect(TIER_CAPABILITIES.STARTER.warehouses.allowed).toBe(true);
      expect(TIER_CAPABILITIES.STARTER.warehouses.limit).toBe(1);
    });

    it('Then invitations are allowed', () => {
      expect(TIER_CAPABILITIES.STARTER.invitations).toBe(true);
    });
  });

  describe('When checking ENTERPRISE tier capabilities', () => {
    it('Then all storage types are unlimited (-1)', () => {
      expect(TIER_CAPABILITIES.ENTERPRISE.warehouses.limit).toBe(-1);
      expect(TIER_CAPABILITIES.ENTERPRISE.storeRooms.limit).toBe(-1);
      expect(TIER_CAPABILITIES.ENTERPRISE.customRooms.limit).toBe(-1);
    });

    it('Then team members are unlimited (-1)', () => {
      expect(TIER_CAPABILITIES.ENTERPRISE.maxMembers).toBe(-1);
    });
  });

  describe('When checking tier progression', () => {
    it('Then warehouse limits increase from STARTER to GROWTH', () => {
      expect(TIER_CAPABILITIES.STARTER.warehouses.limit).toBeLessThan(
        TIER_CAPABILITIES.GROWTH.warehouses.limit,
      );
    });

    it('Then member limits increase across tiers', () => {
      expect(TIER_CAPABILITIES.FREE.maxMembers).toBeLessThan(TIER_CAPABILITIES.STARTER.maxMembers);
      expect(TIER_CAPABILITIES.STARTER.maxMembers).toBeLessThan(TIER_CAPABILITIES.GROWTH.maxMembers);
    });
  });
});
