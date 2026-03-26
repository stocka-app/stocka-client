import { useState, useEffect, useCallback } from 'react';
import { useAuthenticationStore } from '@/features/authentication/store/authentication.store';
import { storagesService } from '@/features/storages/api/storages.service';
import { STORAGE_TIER_LIMITS } from '@/features/storages/types/storages.types';
import type { StorageType, TenantCapabilities } from '@/features/storages/types/storages.types';
import type { TenantTier } from '@/features/team/types/team.types';

/**
 * Result shape — maps each StorageType to its numeric limit.
 * -1 means unlimited (ENTERPRISE tier).
 */
export type StorageLimitsMap = Record<StorageType, number>;

/**
 * Converts a TenantCapabilities or JWT tierLimits object into the
 * StorageLimitsMap that components consume.
 */
function toLimitsMap(caps: TenantCapabilities): StorageLimitsMap {
  return {
    CUSTOM_ROOM: caps.maxCustomRooms,
    STORE_ROOM: caps.maxStoreRooms,
    WAREHOUSE: caps.maxWarehouses,
  };
}

/**
 * Returns a fallback StorageLimitsMap from the hardcoded constant,
 * keyed by tier name. Defaults to FREE if the tier is unrecognized.
 *
 * Exported for unit testing — not part of the public API of the feature.
 */
export function getFallbackLimits(tier: string | null): StorageLimitsMap {
  const effectiveTier = (tier ?? 'FREE') as TenantTier;
  return STORAGE_TIER_LIMITS[effectiveTier] ?? STORAGE_TIER_LIMITS.FREE;
}

interface UseCapabilitiesResult {
  limits: StorageLimitsMap;
  isLoading: boolean;
}

/**
 * useCapabilities
 *
 * Returns per-StorageType numeric limits for the current tenant.
 *
 * Resolution order:
 * 1. JWT `tierLimits` claim (instant, no network call)
 * 2. GET /tenants/me/capabilities (API fallback)
 * 3. Hardcoded STORAGE_TIER_LIMITS constant (offline fallback)
 */
export function useCapabilities(): UseCapabilitiesResult {
  const user = useAuthenticationStore((s) => s.user);
  const tierLimits = user?.tierLimits ?? null;

  const [apiLimits, setApiLimits] = useState<StorageLimitsMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFromAPI = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const caps = await storagesService.fetchCapabilities();
      setApiLimits(toLimitsMap(caps));
    } catch {
      // API unavailable — will fall back to hardcoded limits
      setApiLimits(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only call the API if JWT doesn't have tierLimits
    if (!tierLimits) {
      void fetchFromAPI();
    }
  }, [tierLimits, fetchFromAPI]);

  // Priority: JWT claim > API response > hardcoded fallback
  if (tierLimits) {
    return { limits: toLimitsMap(tierLimits), isLoading: false };
  }

  if (apiLimits) {
    return { limits: apiLimits, isLoading: false };
  }

  const tier = user?.role ? (user.tierLimits?.tier ?? null) : null;
  return { limits: getFallbackLimits(tier), isLoading };
}
