import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/shared/lib/axios';
import { teamService } from '../team.service';

vi.mock('@/shared/lib/axios', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

// ── Fixtures ─────────────────────────────────────────────────────────────────

const memberFixture = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  userId: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Roberto',
  email: 'roberto@stocka.mx',
  role: 'OWNER' as const,
  status: 'ACTIVE' as const,
  joinedAt: '2026-01-15T00:00:00Z',
};

const membersResponse = {
  data: [memberFixture],
  success: true,
};

const invitationFixture = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  email: 'invite@stocka.mx',
  role: 'MANAGER' as const,
  sentAt: '2026-03-20T10:00:00Z',
  expiresAt: '2026-04-03T10:00:00Z',
  status: 'PENDING' as const,
};

const invitationsResponse = {
  data: [invitationFixture],
  success: true,
};

const grantFixture = {
  memberId: '550e8400-e29b-41d4-a716-446655440000',
  action: 'STORAGE_CREATE' as const,
  grantedAt: '2026-03-25T10:00:00Z',
  grantedBy: '550e8400-e29b-41d4-a716-446655440003',
};

const grantsResponse = {
  data: [grantFixture],
  success: true,
};

const currentUserRoleResponse = {
  role: 'OWNER' as const,
  tier: 'STARTER' as const,
  tenantStatus: 'ACTIVE' as const,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('teamService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getMembers ───────────────────────────────────────────────────────────

  describe('getMembers', () => {
    it('calls GET /tenants/me/members and returns Zod-parsed response', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: membersResponse });

      const result = await teamService.getMembers();

      expect(mockedApi.get).toHaveBeenCalledWith('/tenants/me/members');
      expect(result).toEqual(membersResponse);
    });

    it('propagates errors to the caller', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(teamService.getMembers()).rejects.toThrow('Network error');
    });
  });

  // ── getInvitations ───────────────────────────────────────────────────────

  describe('getInvitations', () => {
    it('calls GET /tenants/me/invitations and returns Zod-parsed response', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: invitationsResponse });

      const result = await teamService.getInvitations();

      expect(mockedApi.get).toHaveBeenCalledWith('/tenants/me/invitations');
      expect(result).toEqual(invitationsResponse);
    });
  });

  // ── inviteMember ─────────────────────────────────────────────────────────

  describe('inviteMember', () => {
    it('calls POST /tenants/me/invitations with invite data', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: {} });

      const data = { email: 'new@stocka.mx', role: 'SALES_REP' as const, message: 'Welcome!' };
      await teamService.inviteMember(data);

      expect(mockedApi.post).toHaveBeenCalledWith('/tenants/me/invitations', data);
    });
  });

  // ── changeRole ───────────────────────────────────────────────────────────

  describe('changeRole', () => {
    it('calls PATCH /tenants/me/members/:memberId/role with new role', async () => {
      mockedApi.patch.mockResolvedValueOnce({ data: {} });

      await teamService.changeRole('member-uuid', 'MANAGER');

      expect(mockedApi.patch).toHaveBeenCalledWith('/tenants/me/members/member-uuid/role', {
        role: 'MANAGER',
      });
    });
  });

  // ── removeMember ─────────────────────────────────────────────────────────

  describe('removeMember', () => {
    it('calls DELETE /tenants/me/members/:memberId', async () => {
      mockedApi.delete.mockResolvedValueOnce({ data: {} });

      await teamService.removeMember('member-uuid');

      expect(mockedApi.delete).toHaveBeenCalledWith('/tenants/me/members/member-uuid');
    });
  });

  // ── suspendMember ────────────────────────────────────────────────────────

  describe('suspendMember', () => {
    it('calls PATCH /tenants/me/members/:memberId/suspend', async () => {
      mockedApi.patch.mockResolvedValueOnce({ data: {} });

      await teamService.suspendMember('member-uuid');

      expect(mockedApi.patch).toHaveBeenCalledWith('/tenants/me/members/member-uuid/suspend');
    });
  });

  // ── reactivateMember ─────────────────────────────────────────────────────

  describe('reactivateMember', () => {
    it('calls PATCH /tenants/me/members/:memberId/reactivate', async () => {
      mockedApi.patch.mockResolvedValueOnce({ data: {} });

      await teamService.reactivateMember('member-uuid');

      expect(mockedApi.patch).toHaveBeenCalledWith('/tenants/me/members/member-uuid/reactivate');
    });
  });

  // ── resendInvitation ─────────────────────────────────────────────────────

  describe('resendInvitation', () => {
    it('calls POST /tenants/me/invitations/:invitationId/resend', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: {} });

      await teamService.resendInvitation('inv-uuid');

      expect(mockedApi.post).toHaveBeenCalledWith('/tenants/me/invitations/inv-uuid/resend');
    });
  });

  // ── cancelInvitation ─────────────────────────────────────────────────────

  describe('cancelInvitation', () => {
    it('calls DELETE /tenants/me/invitations/:invitationId', async () => {
      mockedApi.delete.mockResolvedValueOnce({ data: {} });

      await teamService.cancelInvitation('inv-uuid');

      expect(mockedApi.delete).toHaveBeenCalledWith('/tenants/me/invitations/inv-uuid');
    });
  });

  // ── getGrants ────────────────────────────────────────────────────────────

  describe('getGrants', () => {
    it('calls GET /tenants/me/members/:memberId/grants and returns Zod-parsed response', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: grantsResponse });

      const result = await teamService.getGrants('member-uuid');

      expect(mockedApi.get).toHaveBeenCalledWith('/tenants/me/members/member-uuid/grants');
      expect(result).toEqual(grantsResponse);
    });
  });

  // ── addGrant ─────────────────────────────────────────────────────────────

  describe('addGrant', () => {
    it('calls POST /tenants/me/members/:memberId/grants with action', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: {} });

      await teamService.addGrant('member-uuid', 'STORAGE_CREATE');

      expect(mockedApi.post).toHaveBeenCalledWith('/tenants/me/members/member-uuid/grants', {
        action: 'STORAGE_CREATE',
      });
    });
  });

  // ── removeGrant ──────────────────────────────────────────────────────────

  describe('removeGrant', () => {
    it('calls DELETE /tenants/me/members/:memberId/grants/:action', async () => {
      mockedApi.delete.mockResolvedValueOnce({ data: {} });

      await teamService.removeGrant('member-uuid', 'STORAGE_DELETE');

      expect(mockedApi.delete).toHaveBeenCalledWith('/tenants/me/members/member-uuid/grants/STORAGE_DELETE');
    });
  });

  // ── getCurrentUserRole ───────────────────────────────────────────────────

  describe('getCurrentUserRole', () => {
    it('calls GET /tenants/me/my-role and returns the role response', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: currentUserRoleResponse });

      const result = await teamService.getCurrentUserRole();

      expect(mockedApi.get).toHaveBeenCalledWith('/tenants/me/my-role');
      expect(result).toEqual(currentUserRoleResponse);
    });
  });
});
