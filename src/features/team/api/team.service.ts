import { api } from '@/shared/lib/axios';
import {
  memberListResponseSchema,
  invitationListResponseSchema,
  grantListResponseSchema,
  type MemberListResponse,
  type InvitationListResponse,
  type GrantListResponse,
} from '../schemas/team.schema';
import type { TenantRole, TenantTier, TenantStatus, RBACAction } from '../types/team.types';

export interface InviteMemberRequest {
  email: string;
  role: TenantRole;
  message?: string;
}

export interface CurrentUserRoleResponse {
  role: TenantRole;
  tier: TenantTier;
  tenantStatus: TenantStatus;
}

/**
 * Team service
 *
 * All API calls for the team feature.
 * Responses are validated with Zod — invalid responses throw a ZodError.
 * Network errors propagate to the caller (hook) which handles them gracefully.
 *
 * Graceful degradation: if the backend is not yet available, calls will fail
 * and the hook handles the error without breaking the UI.
 */
export const teamService = {
  /**
   * Get all team members for the current tenant
   * GET /api/tenants/me/members
   */
  async getMembers(): Promise<MemberListResponse> {
    const response = await api.get('/tenants/me/members');
    return memberListResponseSchema.parse(response.data);
  },

  /**
   * Get all pending invitations for the current tenant
   * GET /api/tenants/me/invitations
   */
  async getInvitations(): Promise<InvitationListResponse> {
    const response = await api.get('/tenants/me/invitations');
    return invitationListResponseSchema.parse(response.data);
  },

  /**
   * Invite a new member to the tenant
   * POST /api/tenants/me/invitations
   */
  async inviteMember(data: InviteMemberRequest): Promise<void> {
    await api.post('/tenants/me/invitations', data);
  },

  /**
   * Change a member's role
   * PATCH /api/tenants/me/members/:memberId/role
   */
  async changeRole(memberId: string, newRole: TenantRole): Promise<void> {
    await api.patch(`/tenants/me/members/${memberId}/role`, { role: newRole });
  },

  /**
   * Remove a member from the tenant
   * DELETE /api/tenants/me/members/:memberId
   */
  async removeMember(memberId: string): Promise<void> {
    await api.delete(`/tenants/me/members/${memberId}`);
  },

  /**
   * Suspend a member's access
   * PATCH /api/tenants/me/members/:memberId/suspend
   */
  async suspendMember(memberId: string): Promise<void> {
    await api.patch(`/tenants/me/members/${memberId}/suspend`);
  },

  /**
   * Reactivate a suspended member
   * PATCH /api/tenants/me/members/:memberId/reactivate
   */
  async reactivateMember(memberId: string): Promise<void> {
    await api.patch(`/tenants/me/members/${memberId}/reactivate`);
  },

  /**
   * Resend an invitation email
   * POST /api/tenants/me/invitations/:invitationId/resend
   */
  async resendInvitation(invitationId: string): Promise<void> {
    await api.post(`/tenants/me/invitations/${invitationId}/resend`);
  },

  /**
   * Cancel a pending invitation
   * DELETE /api/tenants/me/invitations/:invitationId
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    await api.delete(`/tenants/me/invitations/${invitationId}`);
  },

  /**
   * Get individual grants for a specific member
   * GET /api/tenants/me/members/:memberId/grants
   */
  async getGrants(memberId: string): Promise<GrantListResponse> {
    const response = await api.get(`/tenants/me/members/${memberId}/grants`);
    return grantListResponseSchema.parse(response.data);
  },

  /**
   * Add an individual grant to a member
   * POST /api/tenants/me/members/:memberId/grants
   */
  async addGrant(memberId: string, action: RBACAction): Promise<void> {
    await api.post(`/tenants/me/members/${memberId}/grants`, { action });
  },

  /**
   * Remove an individual grant from a member
   * DELETE /api/tenants/me/members/:memberId/grants/:action
   */
  async removeGrant(memberId: string, action: RBACAction): Promise<void> {
    await api.delete(`/tenants/me/members/${memberId}/grants/${action}`);
  },

  /**
   * Get the current user's role, tier and tenant status
   * GET /api/tenants/me/my-role
   */
  async getCurrentUserRole(): Promise<CurrentUserRoleResponse> {
    const response = await api.get('/tenants/me/my-role');
    return response.data as CurrentUserRoleResponse;
  },
};
