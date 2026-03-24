import { renderHook } from '@testing-library/react';
import { useRBACStore } from '@/store/rbac.store';

// ─────────────────────────────────────────────────────────────────────────────
// Import hook after mocks
// ─────────────────────────────────────────────────────────────────────────────

async function getHook(): Promise<typeof import('@/features/team/hooks/usePermission').usePermission> {
  const { usePermission } = await import('@/features/team/hooks/usePermission');
  return usePermission;
}

function resetStore(): void {
  useRBACStore.setState({
    role: null,
    tier: null,
    tenantStatus: 'ACTIVE',
    permissions: [],
    grants: [],
    loaded: false,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the usePermission hook evaluates permissions', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('When the OWNER on STARTER tier checks a write action', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'OWNER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        permissions: [
          'TENANT_SETTINGS_READ', 'TENANT_SETTINGS_UPDATE',
          'MEMBER_READ', 'MEMBER_INVITE', 'MEMBER_UPDATE_ROLE', 'MEMBER_REMOVE',
          'PRODUCT_READ', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
          'STORAGE_READ', 'STORAGE_CREATE',
          'REPORT_READ', 'REPORT_ADVANCED', 'INVENTORY_EXPORT',
        ],
        grants: [],
        loaded: true,
      });
    });

    it('Then the permission is granted', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('MEMBER_INVITE'));
      expect(result.current).toBe(true);
    });
  });

  describe('When a MANAGER on FREE tier checks a write action', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'MANAGER',
        tier: 'FREE',
        tenantStatus: 'ACTIVE',
        permissions: ['MEMBER_READ', 'PRODUCT_READ', 'STORAGE_READ', 'REPORT_READ', 'TENANT_SETTINGS_READ'],
        grants: [],
        loaded: true,
      });
    });

    it('Then the permission is denied due to tier restriction', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('PRODUCT_CREATE'));
      expect(result.current).toBe(false);
    });
  });

  describe('When a VIEWER checks a read action', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'VIEWER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        permissions: ['MEMBER_READ', 'PRODUCT_READ', 'STORAGE_READ', 'REPORT_READ'],
        grants: [],
        loaded: true,
      });
    });

    it('Then the read permission is granted', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('MEMBER_READ'));
      expect(result.current).toBe(true);
    });
  });

  describe('When the tenant is SUSPENDED and the OWNER checks a write action', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'OWNER',
        tier: 'STARTER',
        tenantStatus: 'SUSPENDED',
        permissions: [
          'TENANT_SETTINGS_READ', 'TENANT_SETTINGS_UPDATE',
          'MEMBER_READ', 'MEMBER_INVITE', 'MEMBER_UPDATE_ROLE', 'MEMBER_REMOVE',
          'PRODUCT_READ', 'PRODUCT_CREATE', 'PRODUCT_UPDATE', 'PRODUCT_DELETE',
          'STORAGE_READ', 'STORAGE_CREATE',
          'REPORT_READ', 'REPORT_ADVANCED', 'INVENTORY_EXPORT',
        ],
        grants: [],
        loaded: true,
      });
    });

    it('Then the permission is denied', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('TENANT_SETTINGS_UPDATE'));
      expect(result.current).toBe(false);
    });
  });

  describe('When no role is assigned', () => {
    it('Then all permissions are denied', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('MEMBER_READ'));
      expect(result.current).toBe(false);
    });
  });

  describe('When a BUYER has an individual INVENTORY_EXPORT grant on STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'BUYER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        permissions: ['MEMBER_READ', 'PRODUCT_READ', 'STORAGE_READ', 'REPORT_READ'],
        grants: ['INVENTORY_EXPORT'],
        loaded: true,
      });
    });

    it('Then the permission is granted due to the individual grant', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('INVENTORY_EXPORT'));
      expect(result.current).toBe(true);
    });
  });

  describe('When the OWNER is in a CANCELLED tenant and checks a read action', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'OWNER',
        tier: 'STARTER',
        tenantStatus: 'CANCELLED',
        permissions: [
          'TENANT_SETTINGS_READ',
          'MEMBER_READ',
          'PRODUCT_READ',
          'STORAGE_READ',
          'REPORT_READ',
        ],
        grants: [],
        loaded: true,
      });
    });

    it('Then the read permission is allowed (CANCELLED is not restricted like SUSPENDED)', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('PRODUCT_READ'));
      expect(result.current).toBe(true);
    });
  });

  describe('When a WAREHOUSE_KEEPER has an individual PRODUCT_CREATE grant', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'WAREHOUSE_KEEPER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        permissions: [
          'STORAGE_READ',
          'STORAGE_UPDATE',
          'PRODUCT_READ',
          'PRODUCT_UPDATE',
          'INVENTORY_EXPORT',
          'REPORT_READ',
          'TENANT_SETTINGS_READ',
        ],
        grants: ['PRODUCT_CREATE'],
        loaded: true,
      });
    });

    it('Then the PRODUCT_CREATE action is allowed due to the individual grant', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('PRODUCT_CREATE'));
      expect(result.current).toBe(true);
    });
  });
});
