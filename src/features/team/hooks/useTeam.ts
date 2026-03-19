import { useState, useCallback } from 'react';
import { teamService } from '../api/team.service';
import type { TenantMember, PendingInvitation, IndividualGrant, TenantRole, RBACAction } from '../types/team.types';
import type { InviteMemberRequest } from '../api/team.service';

interface UseTeamState {
  members: TenantMember[];
  invitations: PendingInvitation[];
  selectedMember: TenantMember | null;
  grants: IndividualGrant[];
  isLoading: boolean;
  error: string | null;
}

interface UseTeamReturn extends UseTeamState {
  fetchMembers: () => Promise<void>;
  fetchInvitations: () => Promise<void>;
  inviteMember: (data: InviteMemberRequest) => Promise<void>;
  changeRole: (memberId: string, role: TenantRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  suspendMember: (memberId: string) => Promise<void>;
  reactivateMember: (memberId: string) => Promise<void>;
  resendInvitation: (id: string) => Promise<void>;
  cancelInvitation: (id: string) => Promise<void>;
  selectMember: (id: string | null) => void;
  fetchGrants: (memberId: string) => Promise<void>;
  addGrant: (memberId: string, action: RBACAction) => Promise<void>;
  removeGrant: (memberId: string, action: RBACAction) => Promise<void>;
}

/**
 * useTeam
 *
 * Central hook for the team feature.
 * Orchestrates API calls and local state.
 * Components never call the service directly — they go through this hook.
 * Errors are captured in local state and never re-thrown.
 */
export function useTeam(): UseTeamReturn {
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [selectedMember, setSelectedMember] = useState<TenantMember | null>(null);
  const [grants, setGrants] = useState<IndividualGrant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await teamService.getMembers();
      setMembers(response.data);
    } catch {
      setError('errors.fetchMembers');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchInvitations = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await teamService.getInvitations();
      setInvitations(response.data);
    } catch {
      setError('errors.fetchInvitations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const inviteMember = useCallback(async (data: InviteMemberRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await teamService.inviteMember(data);
    } catch {
      setError('invite.error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changeRole = useCallback(async (memberId: string, role: TenantRole): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await teamService.changeRole(memberId, role);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role } : m)),
      );
    } catch {
      setError('changeRole.error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeMember = useCallback(async (memberId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await teamService.removeMember(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      setError('removeMember.error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const suspendMember = useCallback(async (memberId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await teamService.suspendMember(memberId);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, status: 'SUSPENDED' } : m)),
      );
    } catch {
      setError('suspendMember.error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reactivateMember = useCallback(async (memberId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await teamService.reactivateMember(memberId);
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, status: 'ACTIVE' } : m)),
      );
    } catch {
      setError('reactivateMember.error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendInvitation = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await teamService.resendInvitation(id);
    } catch {
      setError('invitations.resendError');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelInvitation = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await teamService.cancelInvitation(id);
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    } catch {
      setError('invitations.cancelError');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectMember = useCallback(
    (id: string | null): void => {
      if (id === null) {
        setSelectedMember(null);
        return;
      }
      const found = members.find((m) => m.id === id) ?? null;
      setSelectedMember(found);
    },
    [members],
  );

  const fetchGrants = useCallback(async (memberId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await teamService.getGrants(memberId);
      setGrants(response.data);
    } catch {
      setError('grants.addError');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addGrant = useCallback(async (memberId: string, action: RBACAction): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await teamService.addGrant(memberId, action);
      const response = await teamService.getGrants(memberId);
      setGrants(response.data);
    } catch {
      setError('grants.addError');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeGrant = useCallback(async (memberId: string, action: RBACAction): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await teamService.removeGrant(memberId, action);
      setGrants((prev) => prev.filter((g) => g.action !== action));
    } catch {
      setError('grants.removeError');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    members,
    invitations,
    selectedMember,
    grants,
    isLoading,
    error,
    fetchMembers,
    fetchInvitations,
    inviteMember,
    changeRole,
    removeMember,
    suspendMember,
    reactivateMember,
    resendInvitation,
    cancelInvitation,
    selectMember,
    fetchGrants,
    addGrant,
    removeGrant,
  };
}
