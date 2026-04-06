import type { TenantTier } from '@/features/team/types/team.types';

export interface FeatureLimit {
  allowed: boolean;
  limit: number; // -1 = unlimited
}

export interface TierCapabilities {
  warehouses: FeatureLimit;
  storeRooms: FeatureLimit;
  customRooms: FeatureLimit;
  invitations: boolean;
  maxMembers: number; // -1 = unlimited
}

/**
 * Static capability map indexed by tenant tier.
 *
 * Source of truth for FRONTEND UX gating only — the backend enforces limits
 * independently. For numeric storage limits (warehouses / storeRooms /
 * customRooms), the JWT `tierLimits` claim takes priority over these values
 * when available. See `useTierCapabilities` for the resolution order.
 */
export const TIER_CAPABILITIES: Record<TenantTier, TierCapabilities> = {
  FREE: {
    warehouses:  { allowed: false, limit: 0 },
    storeRooms:  { allowed: true,  limit: 1 },
    customRooms: { allowed: true,  limit: 1 },
    invitations: false,
    maxMembers:  1,
  },
  STARTER: {
    warehouses:  { allowed: true, limit: 1 },
    storeRooms:  { allowed: true, limit: 3 },
    customRooms: { allowed: true, limit: 3 },
    invitations: true,
    maxMembers:  5,
  },
  GROWTH: {
    warehouses:  { allowed: true, limit: 10 },
    storeRooms:  { allowed: true, limit: 10 },
    customRooms: { allowed: true, limit: 10 },
    invitations: true,
    maxMembers:  25,
  },
  ENTERPRISE: {
    warehouses:  { allowed: true, limit: -1 },
    storeRooms:  { allowed: true, limit: -1 },
    customRooms: { allowed: true, limit: -1 },
    invitations: true,
    maxMembers:  -1,
  },
};
