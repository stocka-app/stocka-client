import { api } from '@/shared/lib/axios';
import {
  orgProfileResponseSchema,
  tierQuotasResponseSchema,
  auditLogResponseSchema,
  type OrgProfileResponse,
  type TierQuotasResponse,
  type AuditLogResponse,
  type UpdateOrgRequest,
} from '../schemas/organization.schema';

/**
 * Unwraps the standard backend envelope { data: T, success: boolean }.
 * The TransformInterceptor on the server wraps every response in this shape,
 * so every service method must peel it off before Zod-parsing the payload.
 */
function unwrap<T>(envelope: { data: T; success: boolean }): T {
  return envelope.data;
}

/**
 * Organization service
 *
 * All API calls for the organization settings feature.
 * Responses are validated with Zod — invalid responses throw a ZodError.
 * Network errors propagate to the caller (hook) which handles them gracefully.
 */
export const organizationService = {
  /**
   * Fetch the current tenant's profile
   * GET /api/tenants/me/profile
   */
  async getOrgProfile(): Promise<OrgProfileResponse> {
    const { data } = await api.get('/tenants/me/profile');
    return orgProfileResponseSchema.parse(unwrap(data));
  },

  /**
   * Update the current tenant's profile
   * PATCH /api/tenants/me/profile
   */
  async updateOrgProfile(data: UpdateOrgRequest): Promise<OrgProfileResponse> {
    const { data: responseData } = await api.patch('/tenants/me/profile', data);
    return orgProfileResponseSchema.parse(unwrap(responseData));
  },

  /**
   * Upload a new logo for the current tenant
   * POST /api/tenants/me/logo
   */
  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/tenants/me/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrap(data) as { logoUrl: string };
  },

  /**
   * Check if a business name is available (not taken by another tenant)
   * GET /api/tenants/check-name?name=...
   */
  async checkNameAvailability(name: string): Promise<{ available: boolean }> {
    const { data } = await api.get('/tenants/check-name', { params: { name } });
    return unwrap(data) as { available: boolean };
  },

  /**
   * Fetch tier quotas (usage counts vs limits) for the current tenant
   * GET /api/tenants/me/quotas
   */
  async getTierQuotas(): Promise<TierQuotasResponse> {
    const { data } = await api.get('/tenants/me/quotas');
    return tierQuotasResponseSchema.parse(unwrap(data));
  },

  /**
   * Fetch the audit log for the current tenant
   * GET /api/tenants/me/audit-log
   */
  async getAuditLog(): Promise<AuditLogResponse> {
    const { data } = await api.get('/tenants/me/audit-log');
    return auditLogResponseSchema.parse(unwrap(data));
  },

  /**
   * Transfer ownership of the tenant to another member
   * POST /api/tenants/me/transfer-ownership
   */
  async transferOwnership(newOwnerId: string): Promise<void> {
    await api.post('/tenants/me/transfer-ownership', { newOwnerId });
  },

  /**
   * Request cancellation of the tenant organization
   * POST /api/tenants/me/cancel
   */
  async cancelOrganization(): Promise<void> {
    await api.post('/tenants/me/cancel');
  },
};
