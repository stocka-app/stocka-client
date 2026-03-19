// Hook
export { useOrganization } from './hooks/useOrganization';

// Page (lazy-loaded from router — not exported here to avoid eager imports)
// Use: lazy(() => import('@/features/organization/pages/OrganizationSettingsPage'))

// Store (for advanced uses — prefer useOrganization)
export { useOrganizationStore } from './store/organization.store';

// Types
export type {
  TenantStatus,
  BusinessType,
  TenantTier,
  OrgProfile,
  QuotaLimit,
  TierQuotas,
  AuditLogEntry,
} from './types/organization.types';
