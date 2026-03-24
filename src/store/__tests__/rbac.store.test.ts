import { useRBACStore } from '@/store/rbac.store';
import { api } from '@/shared/lib/axios';
import type { RBACAction } from '@/features/team/types/team.types';

vi.mock('@/shared/lib/axios', () => ({
  api: {
    get: vi.fn(),
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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

/** All read actions */
const READ_PERMISSIONS: RBACAction[] = [
  'TENANT_SETTINGS_READ',
  'MEMBER_READ',
  'PRODUCT_READ',
  'STORAGE_READ',
  'REPORT_READ',
];

/** All write actions */
const WRITE_PERMISSIONS: RBACAction[] = [
  'TENANT_SETTINGS_UPDATE',
  'MEMBER_INVITE',
  'MEMBER_UPDATE_ROLE',
  'MEMBER_REMOVE',
  'PRODUCT_CREATE',
  'PRODUCT_UPDATE',
  'PRODUCT_DELETE',
  'STORAGE_CREATE',
  'INVENTORY_EXPORT',
];

/** All actions an OWNER would have */
const ALL_PERMISSIONS: RBACAction[] = [
  ...READ_PERMISSIONS,
  ...WRITE_PERMISSIONS,
  'REPORT_ADVANCED',
];

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the RBAC store manages permissions', () => {
  beforeEach(() => {
    resetStore();
  });

  // ─── No role ───────────────────────────────────────────────────────────────

  describe('When the user has no role assigned yet', () => {
    it('Then all actions are denied', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_READ')).toBe(false);
      expect(canDo('MEMBER_INVITE')).toBe(false);
    });
  });

  // ─── OWNER / FREE tier ────────────────────────────────────────────────────

  describe('When the OWNER is on the FREE tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'OWNER',
        tier: 'FREE',
        tenantStatus: 'ACTIVE',
        permissions: ALL_PERMISSIONS,
        grants: [],
        loaded: true,
      });
    });

    it('Then the OWNER can perform all write actions', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('TENANT_SETTINGS_UPDATE')).toBe(true);
      expect(canDo('MEMBER_INVITE')).toBe(true);
      expect(canDo('MEMBER_UPDATE_ROLE')).toBe(true);
      expect(canDo('MEMBER_REMOVE')).toBe(true);
      expect(canDo('PRODUCT_CREATE')).toBe(true);
      expect(canDo('PRODUCT_UPDATE')).toBe(true);
      expect(canDo('PRODUCT_DELETE')).toBe(true);
      expect(canDo('STORAGE_CREATE')).toBe(true);
      expect(canDo('INVENTORY_EXPORT')).toBe(true);
    });

    it('Then the OWNER can perform all read actions', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('TENANT_SETTINGS_READ')).toBe(true);
      expect(canDo('MEMBER_READ')).toBe(true);
      expect(canDo('PRODUCT_READ')).toBe(true);
      expect(canDo('STORAGE_READ')).toBe(true);
      expect(canDo('REPORT_READ')).toBe(true);
    });

    it('Then the OWNER can view the audit log', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('REPORT_ADVANCED')).toBe(true);
    });
  });

  // ─── MANAGER / FREE tier ──────────────────────────────────────────────────

  describe('When a MANAGER is on the FREE tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'MANAGER',
        tier: 'FREE',
        tenantStatus: 'ACTIVE',
        permissions: [...READ_PERMISSIONS],
        grants: [],
        loaded: true,
      });
    });

    it('Then the MANAGER cannot perform write actions due to tier restriction', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_INVITE')).toBe(false);
      expect(canDo('MEMBER_UPDATE_ROLE')).toBe(false);
      expect(canDo('PRODUCT_CREATE')).toBe(false);
      expect(canDo('PRODUCT_UPDATE')).toBe(false);
      expect(canDo('PRODUCT_DELETE')).toBe(false);
      expect(canDo('STORAGE_CREATE')).toBe(false);
      expect(canDo('INVENTORY_EXPORT')).toBe(false);
    });

    it('Then the MANAGER can still perform read actions', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_READ')).toBe(true);
      expect(canDo('PRODUCT_READ')).toBe(true);
      expect(canDo('STORAGE_READ')).toBe(true);
      expect(canDo('REPORT_READ')).toBe(true);
      expect(canDo('TENANT_SETTINGS_READ')).toBe(true);
    });

    it('Then the MANAGER cannot view the audit log', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('REPORT_ADVANCED')).toBe(false);
    });
  });

  // ─── VIEWER / FREE tier ───────────────────────────────────────────────────

  describe('When a VIEWER is on the FREE tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'VIEWER',
        tier: 'FREE',
        tenantStatus: 'ACTIVE',
        permissions: ['MEMBER_READ', 'PRODUCT_READ', 'STORAGE_READ', 'REPORT_READ'],
        grants: [],
        loaded: true,
      });
    });

    it('Then the VIEWER can only read', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_READ')).toBe(true);
      expect(canDo('PRODUCT_READ')).toBe(true);
      expect(canDo('MEMBER_INVITE')).toBe(false);
      expect(canDo('PRODUCT_CREATE')).toBe(false);
    });

    it('Then the VIEWER cannot view the audit log', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('REPORT_ADVANCED')).toBe(false);
    });
  });

  // ─── OWNER / STARTER tier ─────────────────────────────────────────────────

  describe('When the OWNER is on the STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'OWNER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        permissions: ALL_PERMISSIONS,
        grants: [],
        loaded: true,
      });
    });

    it('Then the OWNER can perform all actions', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('TENANT_SETTINGS_UPDATE')).toBe(true);
      expect(canDo('MEMBER_INVITE')).toBe(true);
      expect(canDo('MEMBER_REMOVE')).toBe(true);
      expect(canDo('INVENTORY_EXPORT')).toBe(true);
    });
  });

  // ─── MANAGER / STARTER tier ───────────────────────────────────────────────

  describe('When a MANAGER is on the STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'MANAGER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        permissions: [
          ...READ_PERMISSIONS,
          'MEMBER_INVITE',
          'PRODUCT_CREATE',
          'PRODUCT_UPDATE',
          'PRODUCT_DELETE',
          'STORAGE_CREATE',
          'INVENTORY_EXPORT',
        ],
        grants: [],
        loaded: true,
      });
    });

    it('Then the MANAGER can invite members', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_INVITE')).toBe(true);
    });

    it('Then the MANAGER cannot remove members (outside role permissions)', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_REMOVE')).toBe(false);
    });

    it('Then the MANAGER can create and edit products', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('PRODUCT_CREATE')).toBe(true);
      expect(canDo('PRODUCT_UPDATE')).toBe(true);
      expect(canDo('PRODUCT_DELETE')).toBe(true);
    });

    it('Then the MANAGER cannot edit org config', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('TENANT_SETTINGS_UPDATE')).toBe(false);
    });
  });

  // ─── BUYER / STARTER tier ─────────────────────────────────────────────────

  describe('When a BUYER is on the STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'BUYER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        permissions: ['MEMBER_READ', 'PRODUCT_READ', 'STORAGE_READ', 'REPORT_READ'],
        grants: [],
        loaded: true,
      });
    });

    it('Then the BUYER can view members and products', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_READ')).toBe(true);
      expect(canDo('PRODUCT_READ')).toBe(true);
    });

    it('Then the BUYER cannot invite members or create products', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_INVITE')).toBe(false);
      expect(canDo('PRODUCT_CREATE')).toBe(false);
    });
  });

  // ─── WAREHOUSE_KEEPER / STARTER tier ──────────────────────────────────────

  describe('When a WAREHOUSE_KEEPER is on the STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'WAREHOUSE_KEEPER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        permissions: [
          ...READ_PERMISSIONS,
          'PRODUCT_UPDATE',
          'INVENTORY_EXPORT',
        ],
        grants: [],
        loaded: true,
      });
    });

    it('Then the WAREHOUSE_KEEPER can edit products and export reports', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('PRODUCT_UPDATE')).toBe(true);
      expect(canDo('INVENTORY_EXPORT')).toBe(true);
    });

    it('Then the WAREHOUSE_KEEPER cannot create or delete products', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('PRODUCT_CREATE')).toBe(false);
      expect(canDo('PRODUCT_DELETE')).toBe(false);
    });
  });

  // ─── Suspended tenant ─────────────────────────────────────────────────────

  describe('When the tenant is SUSPENDED', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'OWNER',
        tier: 'STARTER',
        tenantStatus: 'SUSPENDED',
        permissions: ALL_PERMISSIONS,
        grants: [],
        loaded: true,
      });
    });

    it('Then no write actions are allowed even for OWNER', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('TENANT_SETTINGS_UPDATE')).toBe(false);
      expect(canDo('MEMBER_INVITE')).toBe(false);
      expect(canDo('PRODUCT_CREATE')).toBe(false);
      expect(canDo('MEMBER_REMOVE')).toBe(false);
      expect(canDo('INVENTORY_EXPORT')).toBe(false);
    });

    it('Then read actions are still allowed', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_READ')).toBe(true);
      expect(canDo('PRODUCT_READ')).toBe(true);
      expect(canDo('STORAGE_READ')).toBe(true);
      expect(canDo('REPORT_READ')).toBe(true);
    });
  });

  // ─── Individual grants ────────────────────────────────────────────────────

  describe('When a VIEWER has an individual MEMBER_INVITE grant', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'VIEWER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        permissions: ['MEMBER_READ', 'PRODUCT_READ', 'STORAGE_READ', 'REPORT_READ'],
        grants: ['MEMBER_INVITE'],
        loaded: true,
      });
    });

    it('Then the VIEWER can invite members thanks to the individual grant', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_INVITE')).toBe(true);
    });

    it('Then the VIEWER still cannot perform other write actions', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('PRODUCT_CREATE')).toBe(false);
      expect(canDo('MEMBER_REMOVE')).toBe(false);
    });
  });

  describe('When a VIEWER with a grant is on FREE tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'VIEWER',
        tier: 'FREE',
        tenantStatus: 'ACTIVE',
        permissions: ['MEMBER_READ', 'PRODUCT_READ', 'STORAGE_READ', 'REPORT_READ'],
        grants: ['MEMBER_INVITE'],
        loaded: true,
      });
    });

    it('Then the grant allows the write action (permissions + grants evaluation)', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_INVITE')).toBe(true);
    });
  });

  // ─── setRole ──────────────────────────────────────────────────────────────

  describe('When setRole is called', () => {
    it('Then the role is updated in the store', () => {
      const { setRole } = useRBACStore.getState();
      setRole('MANAGER');
      expect(useRBACStore.getState().role).toBe('MANAGER');
    });

    it('Then setting role to null clears the role', () => {
      useRBACStore.setState({ role: 'OWNER' });
      const { setRole } = useRBACStore.getState();
      setRole(null);
      expect(useRBACStore.getState().role).toBeNull();
    });
  });

  // ─── setTier ──────────────────────────────────────────────────────────────

  describe('When setTier is called', () => {
    it('Then the tier is updated in the store', () => {
      const { setTier } = useRBACStore.getState();
      setTier('GROWTH');
      expect(useRBACStore.getState().tier).toBe('GROWTH');
    });

    it('Then setting tier to null clears the tier', () => {
      useRBACStore.setState({ tier: 'STARTER' });
      const { setTier } = useRBACStore.getState();
      setTier(null);
      expect(useRBACStore.getState().tier).toBeNull();
    });
  });

  // ─── setTenantStatus ──────────────────────────────────────────────────────

  describe('When setTenantStatus is called', () => {
    it('Then the tenant status is updated', () => {
      const { setTenantStatus } = useRBACStore.getState();
      setTenantStatus('SUSPENDED');
      expect(useRBACStore.getState().tenantStatus).toBe('SUSPENDED');
    });
  });

  // ─── addGrant ─────────────────────────────────────────────────────────────

  describe('When addGrant is called with a new action', () => {
    it('Then the action is added to the grants list', () => {
      const { addGrant } = useRBACStore.getState();
      addGrant('MEMBER_INVITE');
      expect(useRBACStore.getState().grants).toContain('MEMBER_INVITE');
    });
  });

  describe('When addGrant is called with an already-granted action', () => {
    beforeEach(() => {
      useRBACStore.setState({ grants: ['MEMBER_INVITE'] });
    });

    it('Then the action is not duplicated in the grants list', () => {
      const { addGrant } = useRBACStore.getState();
      addGrant('MEMBER_INVITE');
      const { grants } = useRBACStore.getState();
      expect(grants.filter((g: RBACAction) => g === 'MEMBER_INVITE')).toHaveLength(1);
    });
  });

  // ─── removeGrant ──────────────────────────────────────────────────────────

  describe('When removeGrant is called', () => {
    beforeEach(() => {
      useRBACStore.setState({ grants: ['MEMBER_INVITE', 'INVENTORY_EXPORT'] });
    });

    it('Then the action is removed from the grants list', () => {
      const { removeGrant } = useRBACStore.getState();
      removeGrant('MEMBER_INVITE');
      expect(useRBACStore.getState().grants).not.toContain('MEMBER_INVITE');
    });

    it('Then other grants remain intact', () => {
      const { removeGrant } = useRBACStore.getState();
      removeGrant('MEMBER_INVITE');
      expect(useRBACStore.getState().grants).toContain('INVENTORY_EXPORT');
    });
  });

  // ─── reset ────────────────────────────────────────────────────────────────

  describe('When reset is called after state has been modified', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'MANAGER',
        tier: 'GROWTH',
        tenantStatus: 'SUSPENDED',
        permissions: ['MEMBER_READ'],
        grants: ['MEMBER_INVITE'],
        loaded: true,
      });
    });

    it('Then the store returns to its initial state', () => {
      const { reset } = useRBACStore.getState();
      reset();
      const state = useRBACStore.getState();
      expect(state.role).toBeNull();
      expect(state.tier).toBeNull();
      expect(state.tenantStatus).toBe('ACTIVE');
      expect(state.permissions).toEqual([]);
      expect(state.grants).toEqual([]);
      expect(state.loaded).toBe(false);
    });
  });

  // ─── PARTNER role ─────────────────────────────────────────────────────────

  describe('When a PARTNER is on the STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'PARTNER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        permissions: [
          ...READ_PERMISSIONS,
          'MEMBER_INVITE',
          'MEMBER_UPDATE_ROLE',
          'PRODUCT_CREATE',
          'PRODUCT_UPDATE',
          'PRODUCT_DELETE',
          'STORAGE_CREATE',
          'INVENTORY_EXPORT',
          'REPORT_ADVANCED',
        ],
        grants: [],
        loaded: true,
      });
    });

    it('Then the PARTNER can invite members and change roles', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_INVITE')).toBe(true);
      expect(canDo('MEMBER_UPDATE_ROLE')).toBe(true);
    });

    it('Then the PARTNER cannot remove members', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_REMOVE')).toBe(false);
    });

    it('Then the PARTNER can view org config but not edit it', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('TENANT_SETTINGS_READ')).toBe(true);
      expect(canDo('TENANT_SETTINGS_UPDATE')).toBe(false);
    });

    it('Then the PARTNER can view the audit log', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('REPORT_ADVANCED')).toBe(true);
    });
  });

  // ─── SALES_REP role ───────────────────────────────────────────────────────

  describe('When a SALES_REP is on the STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'SALES_REP',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        permissions: ['MEMBER_READ', 'PRODUCT_READ', 'STORAGE_READ', 'REPORT_READ'],
        grants: [],
        loaded: true,
      });
    });

    it('Then the SALES_REP can view products and reports', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('PRODUCT_READ')).toBe(true);
      expect(canDo('REPORT_READ')).toBe(true);
    });

    it('Then the SALES_REP cannot create products or export reports', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('PRODUCT_CREATE')).toBe(false);
      expect(canDo('INVENTORY_EXPORT')).toBe(false);
    });
  });

  // ─── loadPermissions ─────────────────────────────────────────────────────

  describe('When loadPermissions is called and API responds successfully', () => {
    beforeEach(async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          role: 'MANAGER',
          tier: 'STARTER',
          actions: ['PRODUCT_READ', 'PRODUCT_CREATE', 'STORAGE_READ'],
          grants: ['REPORT_ADVANCED'],
        },
      });

      await useRBACStore.getState().loadPermissions();
    });

    it('Then it sets role, tier, permissions, and grants from the API response', () => {
      const state = useRBACStore.getState();
      expect(state.role).toBe('MANAGER');
      expect(state.tier).toBe('STARTER');
      expect(state.permissions).toEqual(['PRODUCT_READ', 'PRODUCT_CREATE', 'STORAGE_READ']);
      expect(state.grants).toEqual(['REPORT_ADVANCED']);
      expect(state.loaded).toBe(true);
    });

    it('Then canDo allows permissions from the API', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('PRODUCT_READ')).toBe(true);
      expect(canDo('PRODUCT_CREATE')).toBe(true);
      expect(canDo('REPORT_ADVANCED')).toBe(true);
    });

    it('Then canDo denies actions not in permissions or grants', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('MEMBER_INVITE')).toBe(false);
    });
  });

  describe('When loadPermissions is called and API fails', () => {
    beforeEach(async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

      useRBACStore.setState({
        role: 'OWNER',
        tier: 'FREE',
        permissions: ['PRODUCT_READ'],
        grants: [],
        loaded: true,
        tenantStatus: 'ACTIVE',
      });

      await useRBACStore.getState().loadPermissions();
    });

    it('Then it keeps existing state (graceful degradation)', () => {
      const state = useRBACStore.getState();
      expect(state.role).toBe('OWNER');
      expect(state.tier).toBe('FREE');
      expect(state.permissions).toEqual(['PRODUCT_READ']);
      expect(state.loaded).toBe(true);
    });
  });

  // ─── SUSPENDED tenant write action check ─────────────────────────────────

  describe('When tenant is SUSPENDED and user has write permissions', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'OWNER',
        tier: 'STARTER',
        tenantStatus: 'SUSPENDED',
        permissions: ['PRODUCT_CREATE', 'PRODUCT_READ', 'STORAGE_CREATE', 'STORAGE_UPDATE', 'STORAGE_DELETE', 'INVENTORY_EXPORT'],
        grants: [],
        loaded: true,
      });
    });

    it('Then canDo allows read actions', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('PRODUCT_READ')).toBe(true);
    });

    it('Then canDo blocks STORAGE_UPDATE as a write action', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('STORAGE_UPDATE')).toBe(false);
    });

    it('Then canDo blocks STORAGE_DELETE as a write action', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('STORAGE_DELETE')).toBe(false);
    });

    it('Then canDo blocks INVENTORY_EXPORT as a write action', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('INVENTORY_EXPORT')).toBe(false);
    });
  });

  // ─── OWNER / GROWTH tier ──────────────────────────────────────────────────

  describe('When the OWNER is on the GROWTH tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'OWNER',
        tier: 'GROWTH',
        tenantStatus: 'ACTIVE',
        permissions: ALL_PERMISSIONS,
        grants: [],
        loaded: true,
      });
    });

    it('Then the OWNER can perform all actions on GROWTH tier', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('TENANT_SETTINGS_UPDATE')).toBe(true);
      expect(canDo('MEMBER_INVITE')).toBe(true);
      expect(canDo('MEMBER_UPDATE_ROLE')).toBe(true);
      expect(canDo('MEMBER_REMOVE')).toBe(true);
      expect(canDo('PRODUCT_CREATE')).toBe(true);
      expect(canDo('PRODUCT_UPDATE')).toBe(true);
      expect(canDo('PRODUCT_DELETE')).toBe(true);
      expect(canDo('STORAGE_CREATE')).toBe(true);
      expect(canDo('INVENTORY_EXPORT')).toBe(true);
      expect(canDo('TENANT_SETTINGS_READ')).toBe(true);
      expect(canDo('MEMBER_READ')).toBe(true);
      expect(canDo('PRODUCT_READ')).toBe(true);
      expect(canDo('STORAGE_READ')).toBe(true);
      expect(canDo('REPORT_READ')).toBe(true);
      expect(canDo('REPORT_ADVANCED')).toBe(true);
    });
  });

  // ─── OWNER / ENTERPRISE tier ──────────────────────────────────────────────

  describe('When the OWNER is on the ENTERPRISE tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'OWNER',
        tier: 'ENTERPRISE',
        tenantStatus: 'ACTIVE',
        permissions: ALL_PERMISSIONS,
        grants: [],
        loaded: true,
      });
    });

    it('Then the OWNER can perform all actions on ENTERPRISE tier', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('TENANT_SETTINGS_UPDATE')).toBe(true);
      expect(canDo('MEMBER_INVITE')).toBe(true);
      expect(canDo('MEMBER_UPDATE_ROLE')).toBe(true);
      expect(canDo('MEMBER_REMOVE')).toBe(true);
      expect(canDo('PRODUCT_CREATE')).toBe(true);
      expect(canDo('PRODUCT_UPDATE')).toBe(true);
      expect(canDo('PRODUCT_DELETE')).toBe(true);
      expect(canDo('STORAGE_CREATE')).toBe(true);
      expect(canDo('INVENTORY_EXPORT')).toBe(true);
      expect(canDo('TENANT_SETTINGS_READ')).toBe(true);
      expect(canDo('MEMBER_READ')).toBe(true);
      expect(canDo('PRODUCT_READ')).toBe(true);
      expect(canDo('STORAGE_READ')).toBe(true);
      expect(canDo('REPORT_READ')).toBe(true);
      expect(canDo('REPORT_ADVANCED')).toBe(true);
    });
  });

  // ─── CANCELLED tenant ─────────────────────────────────────────────────────
  // canDo only has a special branch for SUSPENDED. CANCELLED falls through to
  // the default: permissions.includes(action) || grants.includes(action).
  // This means CANCELLED behaves identically to ACTIVE — writes are not blocked.

  describe('When the tenant status is CANCELLED', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'OWNER',
        tier: 'STARTER',
        tenantStatus: 'CANCELLED',
        permissions: ALL_PERMISSIONS,
        grants: [],
        loaded: true,
      });
    });

    it('Then write actions are still allowed (CANCELLED is not SUSPENDED)', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('TENANT_SETTINGS_UPDATE')).toBe(true);
      expect(canDo('MEMBER_INVITE')).toBe(true);
      expect(canDo('PRODUCT_CREATE')).toBe(true);
      expect(canDo('MEMBER_REMOVE')).toBe(true);
      expect(canDo('INVENTORY_EXPORT')).toBe(true);
    });

    it('Then read actions are allowed', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('TENANT_SETTINGS_READ')).toBe(true);
      expect(canDo('MEMBER_READ')).toBe(true);
      expect(canDo('PRODUCT_READ')).toBe(true);
      expect(canDo('STORAGE_READ')).toBe(true);
      expect(canDo('REPORT_READ')).toBe(true);
    });
  });

  // ─── loaded:false — role set but permissions not yet hydrated ─────────────

  describe('When the store has a role but permissions have not loaded yet (loaded:false)', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'OWNER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        permissions: [],
        grants: [],
        loaded: false,
      });
    });

    it('Then canDo returns false for all actions since permissions array is empty', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('TENANT_SETTINGS_UPDATE')).toBe(false);
      expect(canDo('MEMBER_INVITE')).toBe(false);
      expect(canDo('PRODUCT_READ')).toBe(false);
      expect(canDo('MEMBER_READ')).toBe(false);
      expect(canDo('REPORT_ADVANCED')).toBe(false);
    });
  });

  // ─── Individual grant with empty permissions ───────────────────────────────

  describe('When the user has no role-based permissions but has an individual grant', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'MANAGER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        permissions: [],
        grants: ['PRODUCT_CREATE'],
        loaded: true,
      });
    });

    it('Then the granted action is allowed despite empty permissions list', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('PRODUCT_CREATE')).toBe(true);
    });

    it('Then other non-granted actions are still denied', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('PRODUCT_READ')).toBe(false);
      expect(canDo('MEMBER_INVITE')).toBe(false);
      expect(canDo('TENANT_SETTINGS_UPDATE')).toBe(false);
    });
  });
});
