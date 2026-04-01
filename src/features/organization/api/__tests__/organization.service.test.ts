import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '@/shared/lib/axios';
import { organizationService } from '../organization.service';

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

const orgProfile = {
  id: 'tenant-uuid-1',
  name: 'Mi Negocio',
  slug: 'mi-negocio',
  businessType: 'RETAIL' as const,
  rfc: 'XAXX010101000',
  logoUrl: null,
  status: 'ACTIVE' as const,
  tier: 'STARTER' as const,
  createdAt: '2026-01-15T00:00:00Z',
};

const tierQuotas = {
  warehouses: { used: 1, max: 3 },
  members: { used: 2, max: 5 },
  products: { used: 10, max: 100 },
};

const auditLog = [
  {
    id: 'log-1',
    timestamp: '2026-03-28T10:00:00Z',
    actorId: 'user-uuid-1',
    actorName: 'Roberto',
    action: 'MEMBER_INVITED',
    details: 'Invited dev@stocka.mx as MANAGER',
  },
];

// ── Tests ────────────────────────────────────────────────────────────────────

describe('organizationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getOrgProfile ────────────────────────────────────────────────────────

  describe('getOrgProfile', () => {
    it('calls GET /tenants/me/profile and returns Zod-parsed response', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { success: true, data: orgProfile } });

      const result = await organizationService.getOrgProfile();

      expect(mockedApi.get).toHaveBeenCalledWith('/tenants/me/profile');
      expect(result).toEqual(orgProfile);
    });

    it('propagates errors to the caller', async () => {
      mockedApi.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(organizationService.getOrgProfile()).rejects.toThrow('Network error');
    });
  });

  // ── updateOrgProfile ─────────────────────────────────────────────────────

  describe('updateOrgProfile', () => {
    it('calls PATCH /tenants/me/profile with update data', async () => {
      mockedApi.patch.mockResolvedValueOnce({ data: { success: true, data: orgProfile } });

      const updateData = { name: 'Nuevo Nombre', businessType: 'RESTAURANT' as const };
      const result = await organizationService.updateOrgProfile(updateData);

      expect(mockedApi.patch).toHaveBeenCalledWith('/tenants/me/profile', updateData);
      expect(result).toEqual(orgProfile);
    });
  });

  // ── uploadLogo ───────────────────────────────────────────────────────────

  describe('uploadLogo', () => {
    it('calls POST /tenants/me/logo with FormData and multipart header', async () => {
      const logoUrl = 'https://cdn.stocka.mx/logos/tenant-1.png';
      mockedApi.post.mockResolvedValueOnce({ data: { success: true, data: { logoUrl } } });

      const file = new File(['logo-bytes'], 'logo.png', { type: 'image/png' });
      const result = await organizationService.uploadLogo(file);

      expect(mockedApi.post).toHaveBeenCalledWith(
        '/tenants/me/logo',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      expect(result).toEqual({ logoUrl });
    });
  });

  // ── checkNameAvailability ────────────────────────────────────────────────

  describe('checkNameAvailability', () => {
    it('calls GET /tenants/check-name with name as query param', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { success: true, data: { available: true } } });

      const result = await organizationService.checkNameAvailability('Mi Tienda');

      expect(mockedApi.get).toHaveBeenCalledWith('/tenants/check-name', { params: { name: 'Mi Tienda' } });
      expect(result).toEqual({ available: true });
    });

    it('returns available: false when the name is taken', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { success: true, data: { available: false } } });

      const result = await organizationService.checkNameAvailability('Taken Name');

      expect(result).toEqual({ available: false });
    });
  });

  // ── getTierQuotas ────────────────────────────────────────────────────────

  describe('getTierQuotas', () => {
    it('calls GET /tenants/me/quotas and returns Zod-parsed response', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { success: true, data: tierQuotas } });

      const result = await organizationService.getTierQuotas();

      expect(mockedApi.get).toHaveBeenCalledWith('/tenants/me/quotas');
      expect(result).toEqual(tierQuotas);
    });
  });

  // ── getAuditLog ──────────────────────────────────────────────────────────

  describe('getAuditLog', () => {
    it('calls GET /tenants/me/audit-log and returns Zod-parsed response', async () => {
      mockedApi.get.mockResolvedValueOnce({ data: { success: true, data: auditLog } });

      const result = await organizationService.getAuditLog();

      expect(mockedApi.get).toHaveBeenCalledWith('/tenants/me/audit-log');
      expect(result).toEqual(auditLog);
    });
  });

  // ── transferOwnership ────────────────────────────────────────────────────

  describe('transferOwnership', () => {
    it('calls POST /tenants/me/transfer-ownership with newOwnerId', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: { success: true, data: {} } });

      await organizationService.transferOwnership('new-owner-uuid');

      expect(mockedApi.post).toHaveBeenCalledWith('/tenants/me/transfer-ownership', {
        newOwnerId: 'new-owner-uuid',
      });
    });

    it('propagates errors to the caller', async () => {
      mockedApi.post.mockRejectedValueOnce(new Error('Forbidden'));

      await expect(organizationService.transferOwnership('x')).rejects.toThrow('Forbidden');
    });
  });

  // ── cancelOrganization ───────────────────────────────────────────────────

  describe('cancelOrganization', () => {
    it('calls POST /tenants/me/cancel', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: { success: true, data: {} } });

      await organizationService.cancelOrganization();

      expect(mockedApi.post).toHaveBeenCalledWith('/tenants/me/cancel');
    });
  });
});
