import { useTranslation } from 'react-i18next';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { PermissionGate } from './PermissionGate';
import type { TenantMember, TenantRole } from '../types/team.types';
import { usePermission } from '../hooks/usePermission';

const ROLE_HIERARCHY: Record<TenantRole, number> = {
  OWNER: 7,
  PARTNER: 6,
  MANAGER: 5,
  BUYER: 4,
  WAREHOUSE_KEEPER: 4,
  SALES_REP: 4,
  VIEWER: 1,
};

const ALL_ROLES: TenantRole[] = [
  'OWNER',
  'PARTNER',
  'MANAGER',
  'BUYER',
  'WAREHOUSE_KEEPER',
  'SALES_REP',
  'VIEWER',
];

interface MembersTableProps {
  members: TenantMember[];
  currentUserRole: TenantRole;
  onChangeRole: (memberId: string, newRole: TenantRole) => void;
  onSuspend: (memberId: string) => void;
  onReactivate: (memberId: string) => void;
  onRemove: (memberId: string) => void;
}

function getRoleSelectableOptions(currentUserRole: TenantRole): TenantRole[] {
  const currentLevel = ROLE_HIERARCHY[currentUserRole];
  return ALL_ROLES.filter((r) => ROLE_HIERARCHY[r] < currentLevel);
}

/**
 * MembersTable
 *
 * Renders the team members in a table.
 * Role dropdown is visible only to users with CHANGE_MEMBER_ROLE permission
 * and filtered by hierarchy (can't promote to role >= own level).
 * OWNER row has no change role or remove actions.
 */
export function MembersTable({
  members,
  currentUserRole,
  onChangeRole,
  onSuspend,
  onReactivate,
  onRemove,
}: MembersTableProps): React.ReactElement {
  const { t } = useTranslation('team');
  const canChangeRole = usePermission('CHANGE_MEMBER_ROLE');
  const canRemove = usePermission('REMOVE_MEMBER');
  const selectableRoles = getRoleSelectableOptions(currentUserRole);

  if (members.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{t('members.empty')}</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              {t('members.table.name')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              {t('members.table.email')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              {t('members.table.role')}
            </th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">
              {t('members.table.status')}
            </th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
              {t('members.table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {members.map((member) => {
            const isOwner = member.role === 'OWNER';
            const isActive = member.status === 'ACTIVE';

            return (
              <tr key={member.id} className="bg-background hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{member.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{member.email}</td>
                <td className="px-4 py-3">
                  {canChangeRole && !isOwner && selectableRoles.length > 0 ? (
                    <select
                      aria-label={t('members.table.role')}
                      value={member.role}
                      onChange={(e) => onChangeRole(member.id, e.target.value as TenantRole)}
                      className="rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {ALL_ROLES.filter(
                        (r) => r === member.role || selectableRoles.includes(r),
                      ).map((role) => (
                        <option key={role} value={role}>
                          {t(`roles.${role}`)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{t(`roles.${member.role}`)}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'
                    }`}
                  >
                    {t(`status.${member.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {!isOwner && (
                    <PermissionGate action="REMOVE_MEMBER">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={t('members.table.actions')}
                            className="rounded p-1 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isActive ? (
                            <DropdownMenuItem onClick={() => onSuspend(member.id)}>
                              {t('actions.suspend')}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => onReactivate(member.id)}>
                              {t('actions.reactivate')}
                            </DropdownMenuItem>
                          )}
                          {canRemove && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onRemove(member.id)}
                            >
                              {t('actions.remove')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </PermissionGate>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
