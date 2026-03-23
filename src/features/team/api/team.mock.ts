import type { TenantMember, PendingInvitation, IndividualGrant } from '../types/team.types';

// ─────────────────────────────────────────────────────────────────────────────
// Fixture data
// ─────────────────────────────────────────────────────────────────────────────

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
  {
    id: 'member-uuid-003',
    userId: 'user-uuid-003',
    name: 'Carlos López',
    email: 'carlos@stocka.mx',
    role: 'VIEWER',
    status: 'SUSPENDED',
    joinedAt: '2026-02-15T00:00:00.000Z',
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
  {
    id: 'invitation-uuid-002',
    email: 'expired@empresa.com',
    role: 'SALES_REP',
    sentAt: '2026-03-01T10:00:00.000Z',
    expiresAt: '2026-03-04T10:00:00.000Z',
    status: 'EXPIRED',
  },
];

export const mockGrants: IndividualGrant[] = [
  {
    memberId: 'member-uuid-003',
    action: 'MEMBER_INVITE',
    grantedAt: '2026-03-10T00:00:00.000Z',
    grantedBy: 'member-uuid-001',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Mock service
// ─────────────────────────────────────────────────────────────────────────────

export const mockTeamService = {
  getMembers: vi.fn().mockResolvedValue({ data: mockMembers, success: true }),
  getInvitations: vi.fn().mockResolvedValue({ data: mockInvitations, success: true }),
  inviteMember: vi.fn().mockResolvedValue(undefined),
  changeRole: vi.fn().mockResolvedValue(undefined),
  removeMember: vi.fn().mockResolvedValue(undefined),
  suspendMember: vi.fn().mockResolvedValue(undefined),
  reactivateMember: vi.fn().mockResolvedValue(undefined),
  resendInvitation: vi.fn().mockResolvedValue(undefined),
  cancelInvitation: vi.fn().mockResolvedValue(undefined),
  getGrants: vi.fn().mockResolvedValue({ data: mockGrants, success: true }),
  addGrant: vi.fn().mockResolvedValue(undefined),
  removeGrant: vi.fn().mockResolvedValue(undefined),
  getCurrentUserRole: vi.fn().mockResolvedValue({ role: 'OWNER', tier: 'STARTER', tenantStatus: 'ACTIVE' }),
};
