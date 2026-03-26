import type { z } from 'zod';
import type {
  storageSchema,
  storageTypeSchema,
  storageStatusSchema,
  storagesPageSchema,
} from '../schemas/storages.schema';
import type { TenantTier } from '@/features/team/types/team.types';

export type StorageType = z.infer<typeof storageTypeSchema>;
export type StorageStatus = z.infer<typeof storageStatusSchema>;
export type Storage = z.infer<typeof storageSchema>;
export type StoragesPage = z.infer<typeof storagesPageSchema>;

/**
 * Response from GET /tenants/me/capabilities.
 * Returned by the backend when fetching dynamic tier limits.
 */
export interface TenantCapabilities {
  tier: string;
  maxCustomRooms: number;
  maxStoreRooms: number;
  maxWarehouses: number;
}

/**
 * FALLBACK only — used when JWT claims are unavailable and the
 * capabilities API is unreachable. The primary source of tier limits
 * is now the JWT `tierLimits` claim, with GET /tenants/me/capabilities
 * as the live fallback.
 */
export const STORAGE_TIER_LIMITS: Record<TenantTier, Record<StorageType, number>> = {
  FREE: { CUSTOM_ROOM: 1, STORE_ROOM: 1, WAREHOUSE: 0 },
  STARTER: { CUSTOM_ROOM: 3, STORE_ROOM: 3, WAREHOUSE: 1 },
  GROWTH: { CUSTOM_ROOM: 10, STORE_ROOM: 10, WAREHOUSE: 10 },
  ENTERPRISE: { CUSTOM_ROOM: -1, STORE_ROOM: -1, WAREHOUSE: -1 },
};
