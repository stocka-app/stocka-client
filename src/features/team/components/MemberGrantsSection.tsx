import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { useRBACStore } from '@/store/rbac.store';
import type { IndividualGrant, RBACAction } from '../types/team.types';

const ALL_ACTIONS: RBACAction[] = [
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
];

interface MemberGrantsSectionProps {
  memberId: string;
  grants: IndividualGrant[];
  isLoading: boolean;
  onAddGrant: (memberId: string, action: RBACAction) => Promise<void>;
  onRemoveGrant: (memberId: string, action: RBACAction) => Promise<void>;
}

/**
 * MemberGrantsSection
 *
 * Displays and manages individual grants for a selected member.
 * Only shows actions that the current user themselves has permission to grant.
 */
export function MemberGrantsSection({
  memberId,
  grants,
  isLoading,
  onAddGrant,
  onRemoveGrant,
}: MemberGrantsSectionProps): React.ReactElement {
  const { t } = useTranslation('team');
  const { canDo } = useRBACStore();

  const grantableActions = ALL_ACTIONS.filter((action) => canDo(action));
  const grantedActions = new Set(grants.map((g) => g.action));

  return (
    <section aria-labelledby="grants-section-title" className="mt-6">
      <h3 id="grants-section-title" className="mb-1 text-base font-semibold">
        {t('grants.title')}
      </h3>
      <p className="mb-4 text-sm text-muted-foreground">{t('grants.description')}</p>

      {grantableActions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('grants.empty')}</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {grantableActions.map((action) => {
            const hasGrant = grantedActions.has(action);

            return (
              <li
                key={action}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="font-medium">{action}</span>
                {hasGrant ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    onClick={() => onRemoveGrant(memberId, action)}
                    className="text-destructive hover:text-destructive"
                  >
                    {t('grants.remove')}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                    onClick={() => onAddGrant(memberId, action)}
                  >
                    {t('grants.add')}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
