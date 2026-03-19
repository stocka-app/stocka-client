import { z } from 'zod';

// =============================================================================
// ENUMS
// =============================================================================

export const TenantStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED']);

export const BusinessTypeSchema = z.enum([
  'RETAIL',
  'RESTAURANT',
  'WORKSHOP',
  'SERVICES',
  'HEALTH',
  'EDUCATION',
  'EVENTS',
  'AGRICULTURE',
  'OTHER',
]);

export const TenantTierSchema = z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']);

// =============================================================================
// FORM SCHEMAS
// =============================================================================

/**
 * Update organization profile form — name, businessType, rfc
 */
export const updateOrgSchema = z.object({
  name: z
    .string()
    .min(1, 'validation.nameRequired')
    .min(2, 'validation.nameTooShort')
    .max(100, 'validation.nameTooLong'),
  businessType: BusinessTypeSchema,
  rfc: z.string().max(20, 'validation.rfcTooLong').optional(),
});

/**
 * Cancel organization — requires typing the exact business name
 * The match against profile.name is validated in the hook
 */
export const cancelOrgSchema = z.object({
  confirmName: z.string().min(1, 'validation.confirmNameRequired'),
});

/**
 * Transfer ownership — requires a valid UUID for the new owner
 */
export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().uuid('validation.newOwnerRequired'),
});

// =============================================================================
// API RESPONSE SCHEMAS
// =============================================================================

const QuotaLimitSchema = z.object({
  used: z.number(),
  max: z.number(), // -1 = unlimited
});

/**
 * Response: GET /api/tenants/me/profile
 * PATCH /api/tenants/me/profile
 */
export const orgProfileResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  businessType: BusinessTypeSchema,
  rfc: z.string().nullable(),
  logoUrl: z.string().nullable(),
  status: TenantStatusSchema,
  tier: TenantTierSchema,
  createdAt: z.string(),
});

/**
 * Response: GET /api/tenants/me/quotas
 */
export const tierQuotasResponseSchema = z.object({
  warehouses: QuotaLimitSchema,
  members: QuotaLimitSchema,
  products: QuotaLimitSchema,
});

const auditLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  action: z.string(),
  details: z.string(),
});

/**
 * Response: GET /api/tenants/me/audit-log
 */
export const auditLogResponseSchema = z.array(auditLogEntrySchema);

// =============================================================================
// INFERRED TYPES
// =============================================================================

export type UpdateOrgFormData = z.infer<typeof updateOrgSchema>;
export type CancelOrgFormData = z.infer<typeof cancelOrgSchema>;
export type TransferOwnershipFormData = z.infer<typeof transferOwnershipSchema>;
export type OrgProfileResponse = z.infer<typeof orgProfileResponseSchema>;
export type TierQuotasResponse = z.infer<typeof tierQuotasResponseSchema>;
export type AuditLogEntrySchema = z.infer<typeof auditLogEntrySchema>;
export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;

// Request types
export interface UpdateOrgRequest {
  name: string;
  businessType: z.infer<typeof BusinessTypeSchema>;
  rfc?: string;
}
