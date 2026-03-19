import type { ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';

interface PermissionGateProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * PermissionGate
 *
 * Renders children only when the current user has the required permission.
 * Renders fallback (or nothing) otherwise.
 *
 * Full RBAC implementation is tracked in STOC-256.
 */
export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps): ReactNode {
  const hasPermission = usePermission(permission);
  return hasPermission ? children : fallback;
}
