import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { RBACAction, TenantRole, TenantTier, TenantStatus } from '@/features/team/types/team.types';

// ─────────────────────────────────────────────────────────────────────────────
// Permission matrix: which roles have which actions by default
// ─────────────────────────────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<TenantRole, RBACAction[]> = {
  OWNER: [
    'VIEW_ORG_CONFIG',
    'EDIT_ORG_CONFIG',
    'VIEW_MEMBERS',
    'INVITE_MEMBERS',
    'CHANGE_MEMBER_ROLE',
    'REMOVE_MEMBER',
    'VIEW_PRODUCTS',
    'CREATE_PRODUCT',
    'EDIT_PRODUCT',
    'DELETE_PRODUCT',
    'VIEW_SPACES',
    'CREATE_EDIT_SPACE',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'VIEW_AUDIT_LOG',
  ],
  PARTNER: [
    'VIEW_ORG_CONFIG',
    'VIEW_MEMBERS',
    'INVITE_MEMBERS',
    'CHANGE_MEMBER_ROLE',
    'VIEW_PRODUCTS',
    'CREATE_PRODUCT',
    'EDIT_PRODUCT',
    'DELETE_PRODUCT',
    'VIEW_SPACES',
    'CREATE_EDIT_SPACE',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'VIEW_AUDIT_LOG',
  ],
  MANAGER: [
    'VIEW_ORG_CONFIG',
    'VIEW_MEMBERS',
    'INVITE_MEMBERS',
    'CHANGE_MEMBER_ROLE',
    'VIEW_PRODUCTS',
    'CREATE_PRODUCT',
    'EDIT_PRODUCT',
    'DELETE_PRODUCT',
    'VIEW_SPACES',
    'CREATE_EDIT_SPACE',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
  ],
  BUYER: ['VIEW_MEMBERS', 'VIEW_PRODUCTS', 'VIEW_SPACES', 'VIEW_REPORTS'],
  WAREHOUSE_KEEPER: ['VIEW_MEMBERS', 'VIEW_PRODUCTS', 'EDIT_PRODUCT', 'VIEW_SPACES', 'VIEW_REPORTS', 'EXPORT_REPORTS'],
  SALES_REP: ['VIEW_MEMBERS', 'VIEW_PRODUCTS', 'VIEW_SPACES', 'VIEW_REPORTS'],
  VIEWER: ['VIEW_MEMBERS', 'VIEW_PRODUCTS', 'VIEW_SPACES', 'VIEW_REPORTS'],
};

// Actions that are considered writes — denied for FREE non-OWNER and for SUSPENDED tenants
const WRITE_ACTIONS: RBACAction[] = [
  'EDIT_ORG_CONFIG',
  'INVITE_MEMBERS',
  'CHANGE_MEMBER_ROLE',
  'REMOVE_MEMBER',
  'CREATE_PRODUCT',
  'EDIT_PRODUCT',
  'DELETE_PRODUCT',
  'CREATE_EDIT_SPACE',
  'EXPORT_REPORTS',
];

// ─────────────────────────────────────────────────────────────────────────────
// Store interface
// ─────────────────────────────────────────────────────────────────────────────

interface RBACState {
  role: TenantRole | null;
  tier: TenantTier | null;
  tenantStatus: TenantStatus;
  grants: RBACAction[];
}

interface RBACActions {
  canDo: (action: RBACAction) => boolean;
  setRole: (role: TenantRole | null) => void;
  setTier: (tier: TenantTier | null) => void;
  setTenantStatus: (status: TenantStatus) => void;
  addGrant: (action: RBACAction) => void;
  removeGrant: (action: RBACAction) => void;
  reset: () => void;
}

type RBACStore = RBACState & RBACActions;

// ─────────────────────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────────────────────

const initialState: RBACState = {
  role: null,
  tier: null,
  tenantStatus: 'ACTIVE',
  grants: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useRBACStore = create<RBACStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Evaluates whether the current user can perform an action.
       *
       * Evaluation order:
       * 1. SUSPENDED tenant → deny all write actions; allow reads
       * 2. Check role permission matrix
       * 3. Check individual grants (additive)
       * 4. FREE tier + non-OWNER → deny all write actions
       */
      canDo: (action: RBACAction): boolean => {
        const { role, tier, tenantStatus, grants } = get();

        // No role means user is not initialized — deny everything
        if (!role) return false;

        // SUSPENDED tenant: block writes, allow reads
        if (tenantStatus === 'SUSPENDED') {
          return !WRITE_ACTIONS.includes(action);
        }

        // Check base role permissions
        const roleAllows = ROLE_PERMISSIONS[role].includes(action);

        // Check individual additive grants
        const grantAllows = grants.includes(action);

        const hasPermission = roleAllows || grantAllows;
        if (!hasPermission) return false;

        // FREE tier: non-OWNER members cannot do write actions
        if (tier === 'FREE' && role !== 'OWNER' && WRITE_ACTIONS.includes(action)) {
          return false;
        }

        return true;
      },

      setRole: (role: TenantRole | null): void => {
        set({ role });
      },

      setTier: (tier: TenantTier | null): void => {
        set({ tier });
      },

      setTenantStatus: (tenantStatus: TenantStatus): void => {
        set({ tenantStatus });
      },

      addGrant: (action: RBACAction): void => {
        const { grants } = get();
        if (!grants.includes(action)) {
          set({ grants: [...grants, action] });
        }
      },

      removeGrant: (action: RBACAction): void => {
        const { grants } = get();
        set({ grants: grants.filter((g) => g !== action) });
      },

      reset: (): void => {
        set(initialState);
      },
    }),
    {
      name: 'rbac-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        role: state.role,
        tier: state.tier,
        tenantStatus: state.tenantStatus,
        grants: state.grants,
      }),
    },
  ),
);
