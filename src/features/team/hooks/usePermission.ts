import { useRBACStore } from '@/store/rbac.store';
import type { RBACAction } from '../types/team.types';

/**
 * usePermission
 *
 * Returns true if the current user has permission to perform the given action.
 * Reads from the global RBAC store.
 */
export function usePermission(action: RBACAction): boolean {
  const { canDo } = useRBACStore();
  return canDo(action);
}
