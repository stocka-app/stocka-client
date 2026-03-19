import { useRBACStore } from '@/store/rbac.store';
import type { RBACAction } from '@/features/team/types/team.types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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

describe('Given the RBAC store manages permissions', () => {
  beforeEach(() => {
    resetStore();
  });

  // ─── No role ───────────────────────────────────────────────────────────────

  describe('When the user has no role assigned yet', () => {
    it('Then all actions are denied', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('VIEW_MEMBERS')).toBe(false);
      expect(canDo('INVITE_MEMBERS')).toBe(false);
    });
  });

  // ─── OWNER / FREE tier ────────────────────────────────────────────────────

  describe('When the OWNER is on the FREE tier', () => {
    beforeEach(() => {
      useRBACStore.setState({ role: 'OWNER', tier: 'FREE', tenantStatus: 'ACTIVE', grants: [] });
    });

    it('Then the OWNER can perform all write actions', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('EDIT_ORG_CONFIG')).toBe(true);
      expect(canDo('INVITE_MEMBERS')).toBe(true);
      expect(canDo('CHANGE_MEMBER_ROLE')).toBe(true);
      expect(canDo('REMOVE_MEMBER')).toBe(true);
      expect(canDo('CREATE_PRODUCT')).toBe(true);
      expect(canDo('EDIT_PRODUCT')).toBe(true);
      expect(canDo('DELETE_PRODUCT')).toBe(true);
      expect(canDo('CREATE_EDIT_SPACE')).toBe(true);
      expect(canDo('EXPORT_REPORTS')).toBe(true);
    });

    it('Then the OWNER can perform all read actions', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('VIEW_ORG_CONFIG')).toBe(true);
      expect(canDo('VIEW_MEMBERS')).toBe(true);
      expect(canDo('VIEW_PRODUCTS')).toBe(true);
      expect(canDo('VIEW_SPACES')).toBe(true);
      expect(canDo('VIEW_REPORTS')).toBe(true);
    });

    it('Then the OWNER can view the audit log', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('VIEW_AUDIT_LOG')).toBe(true);
    });
  });

  // ─── MANAGER / FREE tier ──────────────────────────────────────────────────

  describe('When a MANAGER is on the FREE tier', () => {
    beforeEach(() => {
      useRBACStore.setState({ role: 'MANAGER', tier: 'FREE', tenantStatus: 'ACTIVE', grants: [] });
    });

    it('Then the MANAGER cannot perform write actions due to tier restriction', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('INVITE_MEMBERS')).toBe(false);
      expect(canDo('CHANGE_MEMBER_ROLE')).toBe(false);
      expect(canDo('CREATE_PRODUCT')).toBe(false);
      expect(canDo('EDIT_PRODUCT')).toBe(false);
      expect(canDo('DELETE_PRODUCT')).toBe(false);
      expect(canDo('CREATE_EDIT_SPACE')).toBe(false);
      expect(canDo('EXPORT_REPORTS')).toBe(false);
    });

    it('Then the MANAGER can still perform read actions', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('VIEW_MEMBERS')).toBe(true);
      expect(canDo('VIEW_PRODUCTS')).toBe(true);
      expect(canDo('VIEW_SPACES')).toBe(true);
      expect(canDo('VIEW_REPORTS')).toBe(true);
      expect(canDo('VIEW_ORG_CONFIG')).toBe(true);
    });

    it('Then the MANAGER cannot view the audit log', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('VIEW_AUDIT_LOG')).toBe(false);
    });
  });

  // ─── VIEWER / FREE tier ───────────────────────────────────────────────────

  describe('When a VIEWER is on the FREE tier', () => {
    beforeEach(() => {
      useRBACStore.setState({ role: 'VIEWER', tier: 'FREE', tenantStatus: 'ACTIVE', grants: [] });
    });

    it('Then the VIEWER can only read', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('VIEW_MEMBERS')).toBe(true);
      expect(canDo('VIEW_PRODUCTS')).toBe(true);
      expect(canDo('INVITE_MEMBERS')).toBe(false);
      expect(canDo('CREATE_PRODUCT')).toBe(false);
    });

    it('Then the VIEWER cannot view the audit log', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('VIEW_AUDIT_LOG')).toBe(false);
    });
  });

  // ─── OWNER / STARTER tier ─────────────────────────────────────────────────

  describe('When the OWNER is on the STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({ role: 'OWNER', tier: 'STARTER', tenantStatus: 'ACTIVE', grants: [] });
    });

    it('Then the OWNER can perform all actions', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('EDIT_ORG_CONFIG')).toBe(true);
      expect(canDo('INVITE_MEMBERS')).toBe(true);
      expect(canDo('REMOVE_MEMBER')).toBe(true);
      expect(canDo('EXPORT_REPORTS')).toBe(true);
    });
  });

  // ─── MANAGER / STARTER tier ───────────────────────────────────────────────

  describe('When a MANAGER is on the STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({ role: 'MANAGER', tier: 'STARTER', tenantStatus: 'ACTIVE', grants: [] });
    });

    it('Then the MANAGER can invite members', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('INVITE_MEMBERS')).toBe(true);
    });

    it('Then the MANAGER cannot remove members (outside role permissions)', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('REMOVE_MEMBER')).toBe(false);
    });

    it('Then the MANAGER can create and edit products', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('CREATE_PRODUCT')).toBe(true);
      expect(canDo('EDIT_PRODUCT')).toBe(true);
      expect(canDo('DELETE_PRODUCT')).toBe(true);
    });

    it('Then the MANAGER cannot edit org config', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('EDIT_ORG_CONFIG')).toBe(false);
    });
  });

  // ─── BUYER / STARTER tier ─────────────────────────────────────────────────

  describe('When a BUYER is on the STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({ role: 'BUYER', tier: 'STARTER', tenantStatus: 'ACTIVE', grants: [] });
    });

    it('Then the BUYER can view members and products', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('VIEW_MEMBERS')).toBe(true);
      expect(canDo('VIEW_PRODUCTS')).toBe(true);
    });

    it('Then the BUYER cannot invite members or create products', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('INVITE_MEMBERS')).toBe(false);
      expect(canDo('CREATE_PRODUCT')).toBe(false);
    });
  });

  // ─── WAREHOUSE_KEEPER / STARTER tier ──────────────────────────────────────

  describe('When a WAREHOUSE_KEEPER is on the STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({ role: 'WAREHOUSE_KEEPER', tier: 'STARTER', tenantStatus: 'ACTIVE', grants: [] });
    });

    it('Then the WAREHOUSE_KEEPER can edit products and export reports', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('EDIT_PRODUCT')).toBe(true);
      expect(canDo('EXPORT_REPORTS')).toBe(true);
    });

    it('Then the WAREHOUSE_KEEPER cannot create or delete products', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('CREATE_PRODUCT')).toBe(false);
      expect(canDo('DELETE_PRODUCT')).toBe(false);
    });
  });

  // ─── Suspended tenant ─────────────────────────────────────────────────────

  describe('When the tenant is SUSPENDED', () => {
    beforeEach(() => {
      useRBACStore.setState({ role: 'OWNER', tier: 'STARTER', tenantStatus: 'SUSPENDED', grants: [] });
    });

    it('Then no write actions are allowed even for OWNER', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('EDIT_ORG_CONFIG')).toBe(false);
      expect(canDo('INVITE_MEMBERS')).toBe(false);
      expect(canDo('CREATE_PRODUCT')).toBe(false);
      expect(canDo('REMOVE_MEMBER')).toBe(false);
      expect(canDo('EXPORT_REPORTS')).toBe(false);
    });

    it('Then read actions are still allowed', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('VIEW_MEMBERS')).toBe(true);
      expect(canDo('VIEW_PRODUCTS')).toBe(true);
      expect(canDo('VIEW_SPACES')).toBe(true);
      expect(canDo('VIEW_REPORTS')).toBe(true);
    });
  });

  // ─── Individual grants ────────────────────────────────────────────────────

  describe('When a VIEWER has an individual INVITE_MEMBERS grant', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'VIEWER',
        tier: 'STARTER',
        tenantStatus: 'ACTIVE',
        grants: ['INVITE_MEMBERS'],
      });
    });

    it('Then the VIEWER can invite members thanks to the individual grant', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('INVITE_MEMBERS')).toBe(true);
    });

    it('Then the VIEWER still cannot perform other write actions', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('CREATE_PRODUCT')).toBe(false);
      expect(canDo('REMOVE_MEMBER')).toBe(false);
    });
  });

  describe('When a VIEWER with a grant is on FREE tier', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'VIEWER',
        tier: 'FREE',
        tenantStatus: 'ACTIVE',
        grants: ['INVITE_MEMBERS'],
      });
    });

    it('Then the FREE tier restriction overrides the individual grant for write actions', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('INVITE_MEMBERS')).toBe(false);
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
      addGrant('INVITE_MEMBERS');
      expect(useRBACStore.getState().grants).toContain('INVITE_MEMBERS');
    });
  });

  describe('When addGrant is called with an already-granted action', () => {
    beforeEach(() => {
      useRBACStore.setState({ grants: ['INVITE_MEMBERS'] });
    });

    it('Then the action is not duplicated in the grants list', () => {
      const { addGrant } = useRBACStore.getState();
      addGrant('INVITE_MEMBERS');
      const { grants } = useRBACStore.getState();
      expect(grants.filter((g: RBACAction) => g === 'INVITE_MEMBERS')).toHaveLength(1);
    });
  });

  // ─── removeGrant ──────────────────────────────────────────────────────────

  describe('When removeGrant is called', () => {
    beforeEach(() => {
      useRBACStore.setState({ grants: ['INVITE_MEMBERS', 'EXPORT_REPORTS'] });
    });

    it('Then the action is removed from the grants list', () => {
      const { removeGrant } = useRBACStore.getState();
      removeGrant('INVITE_MEMBERS');
      expect(useRBACStore.getState().grants).not.toContain('INVITE_MEMBERS');
    });

    it('Then other grants remain intact', () => {
      const { removeGrant } = useRBACStore.getState();
      removeGrant('INVITE_MEMBERS');
      expect(useRBACStore.getState().grants).toContain('EXPORT_REPORTS');
    });
  });

  // ─── reset ────────────────────────────────────────────────────────────────

  describe('When reset is called after state has been modified', () => {
    beforeEach(() => {
      useRBACStore.setState({
        role: 'MANAGER',
        tier: 'GROWTH',
        tenantStatus: 'SUSPENDED',
        grants: ['INVITE_MEMBERS'],
      });
    });

    it('Then the store returns to its initial state', () => {
      const { reset } = useRBACStore.getState();
      reset();
      const state = useRBACStore.getState();
      expect(state.role).toBeNull();
      expect(state.tier).toBeNull();
      expect(state.tenantStatus).toBe('ACTIVE');
      expect(state.grants).toEqual([]);
    });
  });

  // ─── PARTNER role ─────────────────────────────────────────────────────────

  describe('When a PARTNER is on the STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({ role: 'PARTNER', tier: 'STARTER', tenantStatus: 'ACTIVE', grants: [] });
    });

    it('Then the PARTNER can invite members and change roles', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('INVITE_MEMBERS')).toBe(true);
      expect(canDo('CHANGE_MEMBER_ROLE')).toBe(true);
    });

    it('Then the PARTNER cannot remove members', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('REMOVE_MEMBER')).toBe(false);
    });

    it('Then the PARTNER can view org config but not edit it', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('VIEW_ORG_CONFIG')).toBe(true);
      expect(canDo('EDIT_ORG_CONFIG')).toBe(false);
    });

    it('Then the PARTNER can view the audit log', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('VIEW_AUDIT_LOG')).toBe(true);
    });
  });

  // ─── SALES_REP role ───────────────────────────────────────────────────────

  describe('When a SALES_REP is on the STARTER tier', () => {
    beforeEach(() => {
      useRBACStore.setState({ role: 'SALES_REP', tier: 'STARTER', tenantStatus: 'ACTIVE', grants: [] });
    });

    it('Then the SALES_REP can view products and reports', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('VIEW_PRODUCTS')).toBe(true);
      expect(canDo('VIEW_REPORTS')).toBe(true);
    });

    it('Then the SALES_REP cannot create products or export reports', () => {
      const { canDo } = useRBACStore.getState();
      expect(canDo('CREATE_PRODUCT')).toBe(false);
      expect(canDo('EXPORT_REPORTS')).toBe(false);
    });
  });
});
