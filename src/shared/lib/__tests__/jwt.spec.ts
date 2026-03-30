import { decodeJwtPayload, extractTenantContext } from '@/shared/lib/jwt';
import type { StockaJwtPayload } from '@/shared/lib/jwt';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildFakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

// ---------------------------------------------------------------------------
// decodeJwtPayload
// ---------------------------------------------------------------------------

describe('decodeJwtPayload', () => {
  describe('Given a valid JWT with a standard payload', () => {
    it('Then it returns the decoded payload', () => {
      const payload: StockaJwtPayload = {
        sub: '00000000-0000-0000-0000-000000000001',
        email: 'user@example.com',
        tenantId: 'tenant-123',
        role: 'owner',
        displayName: 'Roberto Medina',
        tierLimits: null,
        iat: 1700000000,
        exp: 1700003600,
      };

      const token = buildFakeJwt(payload as unknown as Record<string, unknown>);
      const result = decodeJwtPayload<StockaJwtPayload>(token);

      expect(result.sub).toBe(payload.sub);
      expect(result.email).toBe(payload.email);
      expect(result.tenantId).toBe(payload.tenantId);
      expect(result.role).toBe(payload.role);
      expect(result.displayName).toBe(payload.displayName);
    });
  });

  describe('Given a valid JWT with null tenantId and role', () => {
    it('Then it returns null values for those fields', () => {
      const token = buildFakeJwt({
        sub: 'user-1',
        email: 'test@test.com',
        tenantId: null,
        role: null,
        displayName: null,
        iat: 1700000000,
        exp: 1700003600,
      });

      const result = decodeJwtPayload<StockaJwtPayload>(token);
      expect(result.tenantId).toBeNull();
      expect(result.role).toBeNull();
      expect(result.displayName).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// extractTenantContext
// ---------------------------------------------------------------------------

describe('extractTenantContext', () => {
  describe('Given a valid JWT with tenantId, role, displayName and tierLimits', () => {
    it('Then it returns all tenant context fields including tierLimits', () => {
      const token = buildFakeJwt({
        sub: 'user-1',
        email: 'test@test.com',
        tenantId: 'tenant-abc',
        role: 'admin',
        displayName: 'Roberto Medina',
        tierLimits: {
          tier: 'STARTER',
          maxCustomRooms: 3,
          maxStoreRooms: 3,
          maxWarehouses: 1,
        },
        iat: 1700000000,
        exp: 1700003600,
      });

      const result = extractTenantContext(token);

      expect(result.tenantId).toBe('tenant-abc');
      expect(result.role).toBe('admin');
      expect(result.displayName).toBe('Roberto Medina');
      expect(result.tierLimits).toEqual({
        tier: 'STARTER',
        maxCustomRooms: 3,
        maxStoreRooms: 3,
        maxWarehouses: 1,
      });
    });
  });

  describe('Given a valid JWT with tenantId and role but no tierLimits', () => {
    it('Then it returns tierLimits as null', () => {
      const token = buildFakeJwt({
        sub: 'user-1',
        email: 'test@test.com',
        tenantId: 'tenant-abc',
        role: 'admin',
        displayName: 'Roberto Medina',
        iat: 1700000000,
        exp: 1700003600,
      });

      const result = extractTenantContext(token);

      expect(result.tenantId).toBe('tenant-abc');
      expect(result.role).toBe('admin');
      expect(result.tierLimits).toBeNull();
    });
  });

  describe('Given a valid JWT with missing tenantId, role and displayName', () => {
    it('Then it returns null for all fields', () => {
      const token = buildFakeJwt({
        sub: 'user-1',
        email: 'test@test.com',
        iat: 1700000000,
        exp: 1700003600,
      });

      const result = extractTenantContext(token);

      expect(result.tenantId).toBeNull();
      expect(result.role).toBeNull();
      expect(result.displayName).toBeNull();
      expect(result.tierLimits).toBeNull();
    });
  });

  describe('Given a malformed token that causes a parsing error', () => {
    it('Then it catches the error and returns null for all fields', () => {
      const result = extractTenantContext('not.a.valid.jwt');

      expect(result.tenantId).toBeNull();
      expect(result.role).toBeNull();
      expect(result.displayName).toBeNull();
      expect(result.tierLimits).toBeNull();
    });
  });

  describe('Given a completely invalid string (not even dot-separated)', () => {
    it('Then it catches the error and returns null for all fields', () => {
      const result = extractTenantContext('garbage');

      expect(result.tenantId).toBeNull();
      expect(result.role).toBeNull();
      expect(result.displayName).toBeNull();
      expect(result.tierLimits).toBeNull();
    });
  });
});
