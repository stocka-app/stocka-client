/**
 * Team feature barrel export.
 *
 * This feature provides RBAC permission hooks and gates for role-based UI control.
 * Full RBAC implementation is tracked in STOC-256.
 *
 * Currently exports stub implementations that default to permissive behavior
 * until the full RBAC policy engine is connected.
 */
export { usePermission } from './hooks/usePermission';
export { PermissionGate } from './components/PermissionGate';
