/**
 * usePermission
 *
 * Returns whether the current user has a given permission.
 * Full RBAC implementation is tracked in STOC-256.
 *
 * Stub: always returns true until the RBAC store is connected.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function usePermission(permission: string): boolean {
  // Stub — always permissive until STOC-256 RBAC is implemented.
  // The permission key will be evaluated against the RBAC store when STOC-256 is merged.
  return true;
}
