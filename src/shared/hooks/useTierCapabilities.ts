import { useRBACStore } from '@/store/rbac.store';
import { useAuthenticationStore } from '@/features/authentication/store/authentication.store';
import { useUpgradeModalStore } from '@/store/upgrade-modal.store';
import { TIER_CAPABILITIES } from '@/shared/config/tier-capabilities';
import type { TierCapabilities } from '@/shared/config/tier-capabilities';
import type { TenantTier } from '@/features/team/types/team.types';
import type { TierLimitReason } from '@/store/upgrade-modal.store';

// ─── Feature type aliases ─────────────────────────────────────────────────────

export type StorageFeature = 'warehouses' | 'storeRooms' | 'customRooms';
export type TierFeature = StorageFeature | 'invitations';

/**
 * Maps StorageType enum values (backend) to TierCapabilities keys (frontend).
 * Used by feature hooks to derive `isGated` from a `filterType` value.
 */
export const STORAGE_TYPE_TO_FEATURE: Record<string, StorageFeature> = {
  WAREHOUSE:   'warehouses',
  STORE_ROOM:  'storeRooms',
  CUSTOM_ROOM: 'customRooms',
};

// ─── Return shape ─────────────────────────────────────────────────────────────

/**
 * Numeric limits keyed by StorageType enum — preserves backward compatibility
 * with components that pass limits as a `Record<StorageType, number>` map
 * (e.g. `CreateStorageDrawer`, `StorageLimitsSection`).
 */
export interface StorageLimitsMap {
  WAREHOUSE:   number;
  STORE_ROOM:  number;
  CUSTOM_ROOM: number;
}

export interface UseTierCapabilitiesResult {
  tier: TenantTier | null;
  caps: TierCapabilities;
  /** Numeric limits per StorageType — JWT tierLimits preferred over static map */
  storageLimits: StorageLimitsMap;
  /** Returns true when the feature is accessible on the current tier */
  isAllowed: (feature: TierFeature) => boolean;
  /** Returns the numeric limit for a storage feature (-1 = unlimited) */
  getLimit: (feature: StorageFeature) => number;
  /** Returns true when currentCount has reached the tier ceiling for the feature */
  isAtLimit: (feature: StorageFeature, currentCount: number) => boolean;
  openUpgradeModal: (reason: TierLimitReason, feature: string) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useTierCapabilities
 *
 * Global hook that exposes the current tenant's tier-based feature access.
 * Replaces the feature-scoped `useCapabilities` from storages — any module
 * can consume this hook without duplicating capability resolution logic.
 *
 * Data resolution order (no extra network calls):
 * 1. JWT `tierLimits` claim → numeric storage limits (instant, from auth store)
 * 2. Static `TIER_CAPABILITIES` map keyed by `tier` from rbac.store
 * 3. Fallback to FREE when tier is null / unrecognized
 */
export function useTierCapabilities(): UseTierCapabilitiesResult {
  const tier = useRBACStore((s) => s.tier);
  const user = useAuthenticationStore((s) => s.user);
  const openModal = useUpgradeModalStore((s) => s.open);

  const tierLimits = user?.tierLimits ?? null;

  const caps: TierCapabilities =
    tier !== null && tier in TIER_CAPABILITIES
      ? TIER_CAPABILITIES[tier]
      : TIER_CAPABILITIES.FREE;

  // JWT dynamic values take priority — they reflect live backend state.
  // The static map acts as an offline/fallback when the JWT claim is absent.
  const storageLimits: StorageLimitsMap = {
    WAREHOUSE:   tierLimits?.maxWarehouses  ?? caps.warehouses.limit,
    STORE_ROOM:  tierLimits?.maxStoreRooms  ?? caps.storeRooms.limit,
    CUSTOM_ROOM: tierLimits?.maxCustomRooms ?? caps.customRooms.limit,
  };

  const getLimit = (feature: StorageFeature): number => {
    if (feature === 'warehouses')  return storageLimits.WAREHOUSE;
    if (feature === 'storeRooms')  return storageLimits.STORE_ROOM;
    return storageLimits.CUSTOM_ROOM;
  };

  const isAllowed = (feature: TierFeature): boolean => {
    if (feature === 'invitations') return caps.invitations;
    const limit = getLimit(feature as StorageFeature);
    return limit === -1 || limit > 0;
  };

  const isAtLimit = (feature: StorageFeature, currentCount: number): boolean => {
    const limit = getLimit(feature);
    return limit !== -1 && currentCount >= limit;
  };

  return {
    tier,
    caps,
    storageLimits,
    isAllowed,
    getLimit,
    isAtLimit,
    openUpgradeModal: openModal,
  };
}
