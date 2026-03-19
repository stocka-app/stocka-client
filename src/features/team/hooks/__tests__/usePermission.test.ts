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
    grants: [],
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
      useRBACStore.setState({ role: 'OWNER', tier: 'STARTER', tenantStatus: 'ACTIVE', grants: [] });
    });

    it('Then the permission is granted', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('INVITE_MEMBERS'));
      expect(result.current).toBe(true);
    });
  });

  describe('When a MANAGER on FREE tier checks a write action', () => {
    beforeEach(() => {
      useRBACStore.setState({ role: 'MANAGER', tier: 'FREE', tenantStatus: 'ACTIVE', grants: [] });
    });

    it('Then the permission is denied due to tier restriction', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('CREATE_PRODUCT'));
      expect(result.current).toBe(false);
    });
  });

  describe('When a VIEWER checks a read action', () => {
    beforeEach(() => {
      useRBACStore.setState({ role: 'VIEWER', tier: 'STARTER', tenantStatus: 'ACTIVE', grants: [] });
    });

    it('Then the read permission is granted', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('VIEW_MEMBERS'));
      expect(result.current).toBe(true);
    });
  });

  describe('When the tenant is SUSPENDED and the OWNER checks a write action', () => {
    beforeEach(() => {
      useRBACStore.setState({ role: 'OWNER', tier: 'STARTER', tenantStatus: 'SUSPENDED', grants: [] });
    });

    it('Then the permission is denied', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('EDIT_ORG_CONFIG'));
      expect(result.current).toBe(false);
    });
  });

  describe('When no role is assigned', () => {
    it('Then all permissions are denied', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('VIEW_MEMBERS'));
      expect(result.current).toBe(false);
    });
  });

  describe('When a BUYER has an individual EXPORT_REPORTS grant on STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'BUYER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        grants: ['EXPORT_REPORTS'],
      });
    });

    it('Then the permission is granted due to the individual grant', async () => {
      const usePermission = await getHook();
      const { result } = renderHook(() => usePermission('EXPORT_REPORTS'));
      expect(result.current).toBe(true);
    });
  });
});
