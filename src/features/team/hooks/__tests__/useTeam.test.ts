import { renderHook, act } from '@testing-library/react';
import { teamService } from '@/features/team/api/team.service';
import { mockMembers, mockInvitations, mockGrants } from '@/features/team/api/team.mock';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('@/features/team/api/team.service', () => ({
  teamService: {
    getMembers: vi.fn(),
    getInvitations: vi.fn(),
    inviteMember: vi.fn(),
    changeRole: vi.fn(),
    removeMember: vi.fn(),
    suspendMember: vi.fn(),
    reactivateMember: vi.fn(),
    resendInvitation: vi.fn(),
    cancelInvitation: vi.fn(),
    getGrants: vi.fn(),
    addGrant: vi.fn(),
    removeGrant: vi.fn(),
    getCurrentUserRole: vi.fn(),
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Import hook after mocks
// ─────────────────────────────────────────────────────────────────────────────

async function getHook(): Promise<typeof import('@/features/team/hooks/useTeam').useTeam> {
  const { useTeam } = await import('@/features/team/hooks/useTeam');
  return useTeam;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the useTeam hook manages team state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── fetchMembers ──────────────────────────────────────────────────────────

  describe('When the user visits the team page and members are loaded', () => {
    beforeEach(() => {
      vi.mocked(teamService.getMembers).mockResolvedValue({ data: mockMembers, success: true });
    });

    it('Then the members list is populated', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchMembers();
      });

      expect(result.current.members).toEqual(mockMembers);
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('When the server fails to return members', () => {
    beforeEach(() => {
      vi.mocked(teamService.getMembers).mockRejectedValue(new Error('Network error'));
    });

    it('Then an error is set and members remain empty', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchMembers();
      });

      expect(result.current.members).toEqual([]);
      expect(result.current.error).toBe('errors.fetchMembers');
    });
  });

  // ─── fetchInvitations ─────────────────────────────────────────────────────

  describe('When the user visits the invitations tab and invitations are loaded', () => {
    beforeEach(() => {
      vi.mocked(teamService.getInvitations).mockResolvedValue({ data: mockInvitations, success: true });
    });

    it('Then the invitations list is populated', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchInvitations();
      });

      expect(result.current.invitations).toEqual(mockInvitations);
      expect(result.current.error).toBeNull();
    });
  });

  describe('When the server fails to return invitations', () => {
    beforeEach(() => {
      vi.mocked(teamService.getInvitations).mockRejectedValue(new Error('Timeout'));
    });

    it('Then an error is set', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchInvitations();
      });

      expect(result.current.error).toBe('errors.fetchInvitations');
    });
  });

  // ─── inviteMember ─────────────────────────────────────────────────────────

  describe('When the user sends a valid invitation', () => {
    beforeEach(() => {
      vi.mocked(teamService.inviteMember).mockResolvedValue(undefined);
    });

    it('Then the service call completes without error', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.inviteMember({ email: 'test@company.com', role: 'BUYER' });
      });

      expect(teamService.inviteMember).toHaveBeenCalledWith({ email: 'test@company.com', role: 'BUYER' });
      expect(result.current.error).toBeNull();
    });
  });

  describe('When sending an invitation fails', () => {
    beforeEach(() => {
      vi.mocked(teamService.inviteMember).mockRejectedValue(new Error('Bad request'));
    });

    it('Then an error is set in the hook state', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.inviteMember({ email: 'test@company.com', role: 'BUYER' });
      });

      expect(result.current.error).toBe('invite.error');
    });
  });

  // ─── changeRole ───────────────────────────────────────────────────────────

  describe('When a manager changes a member role and it succeeds', () => {
    beforeEach(() => {
      vi.mocked(teamService.getMembers).mockResolvedValue({ data: mockMembers, success: true });
      vi.mocked(teamService.changeRole).mockResolvedValue(undefined);
    });

    it('Then the member role is updated locally', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchMembers();
      });

      await act(async () => {
        await result.current.changeRole('member-uuid-002', 'BUYER');
      });

      const updatedMember = result.current.members.find((m) => m.id === 'member-uuid-002');
      expect(updatedMember?.role).toBe('BUYER');
    });
  });

  describe('When changing role fails', () => {
    beforeEach(() => {
      vi.mocked(teamService.changeRole).mockRejectedValue(new Error('Forbidden'));
    });

    it('Then an error is set in the hook state', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.changeRole('member-uuid-002', 'BUYER');
      });

      expect(result.current.error).toBe('changeRole.error');
    });
  });

  // ─── removeMember ─────────────────────────────────────────────────────────

  describe('When a member is removed successfully', () => {
    beforeEach(() => {
      vi.mocked(teamService.getMembers).mockResolvedValue({ data: mockMembers, success: true });
      vi.mocked(teamService.removeMember).mockResolvedValue(undefined);
    });

    it('Then the member is removed from the local list', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchMembers();
      });

      await act(async () => {
        await result.current.removeMember('member-uuid-002');
      });

      expect(result.current.members.find((m) => m.id === 'member-uuid-002')).toBeUndefined();
    });
  });

  describe('When removing a member fails', () => {
    beforeEach(() => {
      vi.mocked(teamService.removeMember).mockRejectedValue(new Error('Forbidden'));
    });

    it('Then an error is set in the hook state', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.removeMember('member-uuid-002');
      });

      expect(result.current.error).toBe('removeMember.error');
    });
  });

  // ─── suspendMember ────────────────────────────────────────────────────────

  describe('When a member is suspended successfully', () => {
    beforeEach(() => {
      vi.mocked(teamService.getMembers).mockResolvedValue({ data: mockMembers, success: true });
      vi.mocked(teamService.suspendMember).mockResolvedValue(undefined);
    });

    it('Then the member status is updated to SUSPENDED locally', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchMembers();
      });

      await act(async () => {
        await result.current.suspendMember('member-uuid-002');
      });

      const updatedMember = result.current.members.find((m) => m.id === 'member-uuid-002');
      expect(updatedMember?.status).toBe('SUSPENDED');
    });
  });

  describe('When suspending a member fails', () => {
    beforeEach(() => {
      vi.mocked(teamService.suspendMember).mockRejectedValue(new Error('Forbidden'));
    });

    it('Then an error is set in the hook state', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.suspendMember('member-uuid-002');
      });

      expect(result.current.error).toBe('suspendMember.error');
    });
  });

  // ─── reactivateMember ─────────────────────────────────────────────────────

  describe('When a suspended member is reactivated successfully', () => {
    const suspendedMembers = [
      { ...mockMembers[0] },
      { ...mockMembers[1], status: 'SUSPENDED' as const },
    ];

    beforeEach(() => {
      vi.mocked(teamService.getMembers).mockResolvedValue({ data: suspendedMembers, success: true });
      vi.mocked(teamService.reactivateMember).mockResolvedValue(undefined);
    });

    it('Then the member status is updated to ACTIVE locally', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchMembers();
      });

      await act(async () => {
        await result.current.reactivateMember('member-uuid-002');
      });

      const updatedMember = result.current.members.find((m) => m.id === 'member-uuid-002');
      expect(updatedMember?.status).toBe('ACTIVE');
    });
  });

  describe('When reactivating a member fails', () => {
    beforeEach(() => {
      vi.mocked(teamService.reactivateMember).mockRejectedValue(new Error('Forbidden'));
    });

    it('Then an error is set in the hook state', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.reactivateMember('member-uuid-002');
      });

      expect(result.current.error).toBe('reactivateMember.error');
    });
  });

  // ─── resendInvitation ─────────────────────────────────────────────────────

  describe('When the user resends an invitation', () => {
    beforeEach(() => {
      vi.mocked(teamService.resendInvitation).mockResolvedValue(undefined);
    });

    it('Then the service call completes without error', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.resendInvitation('invitation-uuid-001');
      });

      expect(teamService.resendInvitation).toHaveBeenCalledWith('invitation-uuid-001');
      expect(result.current.error).toBeNull();
    });
  });

  describe('When resending an invitation fails', () => {
    beforeEach(() => {
      vi.mocked(teamService.resendInvitation).mockRejectedValue(new Error('Not found'));
    });

    it('Then an error is set in the hook state', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.resendInvitation('invitation-uuid-001');
      });

      expect(result.current.error).toBe('invitations.resendError');
    });
  });

  // ─── cancelInvitation ─────────────────────────────────────────────────────

  describe('When the user cancels a pending invitation', () => {
    beforeEach(() => {
      vi.mocked(teamService.getInvitations).mockResolvedValue({ data: mockInvitations, success: true });
      vi.mocked(teamService.cancelInvitation).mockResolvedValue(undefined);
    });

    it('Then the invitation is removed from the local list', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchInvitations();
      });

      await act(async () => {
        await result.current.cancelInvitation('invitation-uuid-001');
      });

      expect(result.current.invitations.find((i) => i.id === 'invitation-uuid-001')).toBeUndefined();
    });
  });

  describe('When cancelling an invitation fails', () => {
    beforeEach(() => {
      vi.mocked(teamService.cancelInvitation).mockRejectedValue(new Error('Not found'));
    });

    it('Then an error is set in the hook state', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.cancelInvitation('invitation-uuid-001');
      });

      expect(result.current.error).toBe('invitations.cancelError');
    });
  });

  // ─── selectMember ─────────────────────────────────────────────────────────

  describe('When the user selects a member from the list', () => {
    beforeEach(() => {
      vi.mocked(teamService.getMembers).mockResolvedValue({ data: mockMembers, success: true });
    });

    it('Then the selected member is set', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchMembers();
      });

      act(() => {
        result.current.selectMember('member-uuid-002');
      });

      expect(result.current.selectedMember?.id).toBe('member-uuid-002');
    });

    it('Then selecting null clears the selection', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchMembers();
      });

      act(() => {
        result.current.selectMember('member-uuid-001');
      });

      act(() => {
        result.current.selectMember(null);
      });

      expect(result.current.selectedMember).toBeNull();
    });

    it('Then selecting an unknown id sets selectedMember to null', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchMembers();
      });

      act(() => {
        result.current.selectMember('nonexistent-id');
      });

      expect(result.current.selectedMember).toBeNull();
    });
  });

  // ─── fetchGrants ──────────────────────────────────────────────────────────

  describe('When the user views grants for a member', () => {
    beforeEach(() => {
      vi.mocked(teamService.getGrants).mockResolvedValue({ data: mockGrants, success: true });
    });

    it('Then the grants list is populated', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchGrants('member-uuid-003');
      });

      expect(result.current.grants).toEqual(mockGrants);
      expect(result.current.error).toBeNull();
    });
  });

  describe('When fetching grants fails', () => {
    beforeEach(() => {
      vi.mocked(teamService.getGrants).mockRejectedValue(new Error('Forbidden'));
    });

    it('Then an error is set in the hook state', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchGrants('member-uuid-003');
      });

      expect(result.current.error).toBe('grants.addError');
    });
  });

  // ─── addGrant ─────────────────────────────────────────────────────────────

  describe('When a manager adds a grant to a member and it succeeds', () => {
    beforeEach(() => {
      vi.mocked(teamService.addGrant).mockResolvedValue(undefined);
      vi.mocked(teamService.getGrants).mockResolvedValue({
        data: [
          {
            memberId: 'member-uuid-003',
            action: 'INVITE_MEMBERS',
            grantedAt: '2026-03-10T00:00:00.000Z',
            grantedBy: 'member-uuid-001',
          },
        ],
        success: true,
      });
    });

    it('Then the grants list is refreshed', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.addGrant('member-uuid-003', 'INVITE_MEMBERS');
      });

      expect(teamService.addGrant).toHaveBeenCalledWith('member-uuid-003', 'INVITE_MEMBERS');
      expect(result.current.grants.some((g) => g.action === 'INVITE_MEMBERS')).toBe(true);
    });
  });

  describe('When adding a grant fails', () => {
    beforeEach(() => {
      vi.mocked(teamService.addGrant).mockRejectedValue(new Error('Forbidden'));
    });

    it('Then an error is set in the hook state', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.addGrant('member-uuid-003', 'INVITE_MEMBERS');
      });

      expect(result.current.error).toBe('grants.addError');
    });
  });

  // ─── removeGrant ──────────────────────────────────────────────────────────

  describe('When a grant is removed successfully', () => {
    const existingGrant = {
      memberId: 'member-uuid-003',
      action: 'INVITE_MEMBERS' as const,
      grantedAt: '2026-03-10T00:00:00.000Z',
      grantedBy: 'member-uuid-001',
    };

    beforeEach(() => {
      vi.mocked(teamService.getGrants).mockResolvedValue({ data: [existingGrant], success: true });
      vi.mocked(teamService.removeGrant).mockResolvedValue(undefined);
    });

    it('Then the grant is removed from the local list', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.fetchGrants('member-uuid-003');
      });

      await act(async () => {
        await result.current.removeGrant('member-uuid-003', 'INVITE_MEMBERS');
      });

      expect(result.current.grants.find((g) => g.action === 'INVITE_MEMBERS')).toBeUndefined();
    });
  });

  describe('When removing a grant fails', () => {
    beforeEach(() => {
      vi.mocked(teamService.removeGrant).mockRejectedValue(new Error('Forbidden'));
    });

    it('Then an error is set in the hook state', async () => {
      const useTeam = await getHook();
      const { result } = renderHook(() => useTeam());

      await act(async () => {
        await result.current.removeGrant('member-uuid-003', 'INVITE_MEMBERS');
      });

      expect(result.current.error).toBe('grants.removeError');
    });
  });
});
