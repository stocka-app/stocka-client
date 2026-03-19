import type { organizationService } from './organization.service';

/**
 * Mock of organizationService for use in unit tests.
 *
 * Usage:
 *   vi.mock('@/features/organization/api/organization.service', async () => {
 *     const { mockOrganizationService } = await import('@/features/organization/api/organization.mock');
 *     return { organizationService: mockOrganizationService };
 *   });
 */
export const mockOrganizationService: typeof organizationService = {
  getOrgProfile: vi.fn().mockResolvedValue({
    id: 'tenant-uuid-001',
    name: 'Ferretería Central',
    slug: 'ferreteria-central',
    businessType: 'RETAIL',
    rfc: 'FCE123456789',
    logoUrl: null,
    status: 'ACTIVE',
    tier: 'STARTER',
    createdAt: '2026-01-01T00:00:00.000Z',
  }),

  updateOrgProfile: vi.fn().mockResolvedValue({
    id: 'tenant-uuid-001',
    name: 'Ferretería Central Updated',
    slug: 'ferreteria-central',
    businessType: 'RETAIL',
    rfc: 'FCE123456789',
    logoUrl: null,
    status: 'ACTIVE',
    tier: 'STARTER',
    createdAt: '2026-01-01T00:00:00.000Z',
  }),

  uploadLogo: vi.fn().mockResolvedValue({
    logoUrl: 'https://cdn.example.com/logo.png',
  }),

  checkNameAvailability: vi.fn().mockResolvedValue({ available: true }),

  getTierQuotas: vi.fn().mockResolvedValue({
    warehouses: { used: 1, max: 3 },
    members: { used: 2, max: 5 },
    products: { used: 50, max: 1000 },
  }),

  getAuditLog: vi.fn().mockResolvedValue([
    {
      id: 'audit-001',
      timestamp: '2026-03-01T10:00:00.000Z',
      actorId: 'user-001',
      actorName: 'Roberto Medina',
      action: 'PROFILE_UPDATED',
      details: 'Changed name to Ferretería Central',
    },
  ]),

  transferOwnership: vi.fn().mockResolvedValue(undefined),

  cancelOrganization: vi.fn().mockResolvedValue(undefined),
};
