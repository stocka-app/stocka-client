import type { z } from 'zod';
import type { spaceSchema, spaceTypeSchema, spaceStatusSchema } from '../schemas/spaces.schema';
import type { TenantTier } from '@/features/team/types/team.types';

export type SpaceType = z.infer<typeof spaceTypeSchema>;
export type SpaceStatus = z.infer<typeof spaceStatusSchema>;
export type Space = z.infer<typeof spaceSchema>;

export const SPACE_TIER_LIMITS: Record<TenantTier, Record<SpaceType, number>> = {
  FREE: { CUSTOM_ROOM: 1, STORE_ROOM: 1, WAREHOUSE: 0 },
  STARTER: { CUSTOM_ROOM: 3, STORE_ROOM: 3, WAREHOUSE: 1 },
  GROWTH: { CUSTOM_ROOM: 10, STORE_ROOM: 10, WAREHOUSE: 10 },
  ENTERPRISE: { CUSTOM_ROOM: -1, STORE_ROOM: -1, WAREHOUSE: -1 },
};
