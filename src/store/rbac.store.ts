import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/shared/lib/axios';
import type { RBACAction, TenantRole, TenantTier, TenantStatus } from '@/features/team/types/team.types';

// ─────────────────────────────────────────────────────────────────────────────
// Store interface
// ─────────────────────────────────────────────────────────────────────────────

interface RBACState {
  role: TenantRole | null;
  tier: TenantTier | null;
  tenantStatus: TenantStatus;
  /** Role-based permissions loaded from API */
  permissions: RBACAction[];
  /** Individual additive grants loaded from API */
  grants: RBACAction[];
  /** Whether permissions have been loaded from API */
  loaded: boolean;
}

interface RBACActions {
  canDo: (action: RBACAction) => boolean;
  loadPermissions: () => Promise<void>;
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
  permissions: [],
  grants: [],
  loaded: false,
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
       * 1. No role → deny everything
       * 2. SUSPENDED tenant → deny all write actions; allow reads
       * 3. Check permissions from API (role-based)
       * 4. Check individual grants (additive)
       */
      canDo: (action: RBACAction): boolean => {
        const { role, tenantStatus, permissions, grants } = get();

        // No role means user is not initialized — deny everything
        if (!role) return false;

        // SUSPENDED tenant: block writes, allow reads
        if (tenantStatus === 'SUSPENDED') {
          return permissions.includes(action) && !isWriteAction(action);
        }

        return permissions.includes(action) || grants.includes(action);
      },

      /**
       * Load effective permissions from the RBAC API.
       * GET /api/rbac/my-permissions
       */
      loadPermissions: async (): Promise<void> => {
        try {
          const response = await api.get('/rbac/my-permissions');
          const data = response.data as {
            role: TenantRole;
            tier: TenantTier;
            actions: RBACAction[];
            grants: RBACAction[];
          };

          set({
            role: data.role,
            tier: data.tier,
            permissions: data.actions,
            grants: data.grants,
            loaded: true,
          });
        } catch {
          // Graceful degradation: if API is unavailable, keep existing state
        }
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
        permissions: state.permissions,
        grants: state.grants,
        loaded: state.loaded,
      }),
    },
  ),
);

// ─────────────────────────────────────────────────────────────────────────────
// Write actions — derived from SystemAction semantics (CREATE/UPDATE/DELETE)
// ─────────────────────────────────────────────────────────────────────────────

const WRITE_ACTIONS: RBACAction[] = [
  'TENANT_SETTINGS_UPDATE',
  'MEMBER_INVITE',
  'MEMBER_UPDATE_ROLE',
  'MEMBER_REMOVE',
  'PRODUCT_CREATE',
  'PRODUCT_UPDATE',
  'PRODUCT_DELETE',
  'STORAGE_CREATE',
  'STORAGE_UPDATE',
  'STORAGE_DELETE',
  'INVENTORY_EXPORT',
];

function isWriteAction(action: RBACAction): boolean {
  return WRITE_ACTIONS.includes(action);
}
