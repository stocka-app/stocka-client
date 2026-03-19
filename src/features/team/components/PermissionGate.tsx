import type { ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';
import type { RBACAction } from '../types/team.types';

interface PermissionGateProps {
  action: RBACAction;
  children: ReactNode;
  fallback?: ReactNode;
  mode?: 'hide' | 'disable';
}

/**
 * PermissionGate
 *
 * Conditionally renders children based on whether the current user has
 * permission to perform the given action.
 *
 * - mode="hide" (default): renders null when no permission
 * - mode="disable": renders children with disabled attribute when no permission
 */
export function PermissionGate({
  action,
  children,
  fallback = null,
  mode = 'hide',
}: PermissionGateProps): ReactNode {
  const hasPermission = usePermission(action);

  if (hasPermission) {
    return children;
  }

  if (mode === 'disable') {
    return (
      <span aria-disabled="true" className="pointer-events-none opacity-50">
        {children}
      </span>
    );
  }

  return fallback;
}
