import type { OrgProfile, TierQuotas, AuditLogEntry } from '@/features/organization/types/organization.types';

/**
 * Default mock profile for organization tests.
 */
export const mockProfile: OrgProfile = {
  id: 'tenant-uuid-001',
  name: 'Ferretería Central',
  slug: 'ferreteria-central',
  businessType: 'RETAIL',
  rfc: 'FCE123456789',
  logoUrl: null,
  status: 'ACTIVE',
  tier: 'STARTER',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const mockQuotas: TierQuotas = {
  warehouses: { used: 1, max: 3 },
  members: { used: 2, max: 5 },
  products: { used: 50, max: 1000 },
};

export const mockAuditLog: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: '2026-03-01T10:00:00.000Z',
    actorId: 'user-001',
    actorName: 'Roberto Medina',
    action: 'PROFILE_UPDATED',
    details: 'Changed name to Ferretería Central',
  },
];

/**
 * Mock return value for useOrganization hook.
 *
 * Usage in test file:
 *   vi.mock('@/features/organization', async () => {
 *     const { mockUseOrganization } = await import('@/test/mocks/organization.mock');
 *     return { useOrganization: mockUseOrganization };
 *   });
 */
export const mockUseOrganization = vi.fn().mockReturnValue({
  profile: mockProfile,
  quotas: mockQuotas,
  auditLog: mockAuditLog,
  isLoading: false,
  isSaving: false,
  isCheckingName: false,
  nameAvailable: null,
  error: null,
  fetchProfile: vi.fn().mockResolvedValue(undefined),
  fetchQuotas: vi.fn().mockResolvedValue(undefined),
  fetchAuditLog: vi.fn().mockResolvedValue(undefined),
  updateProfile: vi.fn().mockResolvedValue(undefined),
  uploadLogo: vi.fn().mockResolvedValue(undefined),
  checkNameAvailability: vi.fn().mockResolvedValue(undefined),
  transferOwnership: vi.fn().mockResolvedValue(undefined),
  cancelOrganization: vi.fn().mockResolvedValue(undefined),
});
