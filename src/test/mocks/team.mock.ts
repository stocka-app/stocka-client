import type { TenantMember, PendingInvitation, IndividualGrant } from '@/features/team/types/team.types';

/**
 * Shared mock for useTeam hook.
 *
 * Usage in test file:
 *   vi.mock('@/features/team', async () => {
 *     const { mockUseTeam } = await import('@/test/mocks/team.mock');
 *     return { useTeam: mockUseTeam, usePermission: vi.fn().mockReturnValue(true), PermissionGate: ({ children }: { children: ReactNode }) => children };
 *   });
 */
export const mockMembers: TenantMember[] = [
  {
    id: 'member-uuid-001',
    userId: 'user-uuid-001',
    name: 'Roberto Medina',
    email: 'roberto@stocka.mx',
    role: 'OWNER',
    status: 'ACTIVE',
    joinedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'member-uuid-002',
    userId: 'user-uuid-002',
    name: 'Ana García',
    email: 'ana@stocka.mx',
    role: 'MANAGER',
    status: 'ACTIVE',
    joinedAt: '2026-02-01T00:00:00.000Z',
  },
];

export const mockInvitations: PendingInvitation[] = [
  {
    id: 'invitation-uuid-001',
    email: 'invited@empresa.com',
    role: 'BUYER',
    sentAt: '2026-03-16T10:00:00.000Z',
    expiresAt: '2026-03-19T10:00:00.000Z',
    status: 'PENDING',
  },
];

export const mockGrants: IndividualGrant[] = [];

export const mockUseTeam = (): ReturnType<typeof import('@/features/team/hooks/useTeam').useTeam> => ({
  members: mockMembers,
  invitations: mockInvitations,
  selectedMember: null,
  grants: mockGrants,
  isLoading: false,
  error: null,
  fetchMembers: vi.fn().mockResolvedValue(undefined),
  fetchInvitations: vi.fn().mockResolvedValue(undefined),
  inviteMember: vi.fn().mockResolvedValue(undefined),
  changeRole: vi.fn().mockResolvedValue(undefined),
  removeMember: vi.fn().mockResolvedValue(undefined),
  suspendMember: vi.fn().mockResolvedValue(undefined),
  reactivateMember: vi.fn().mockResolvedValue(undefined),
  resendInvitation: vi.fn().mockResolvedValue(undefined),
  cancelInvitation: vi.fn().mockResolvedValue(undefined),
  selectMember: vi.fn(),
  selectMember: vi.fn(),
  fetchGrants: vi.fn().mockResolvedValue(undefined),
  addGrant: vi.fn().mockResolvedValue(undefined),
  removeGrant: vi.fn().mockResolvedValue(undefined),
});
