import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/components/ui/card';
import type { TenantRole } from '../types/team.types';

const ROLES: TenantRole[] = [
  'OWNER',
  'PARTNER',
  'MANAGER',
  'BUYER',
  'WAREHOUSE_KEEPER',
  'SALES_REP',
  'VIEWER',
];

/**
 * RolesReferenceCards
 *
 * Renders a grid of 7 cards — one per role — showing the role name,
 * description, hierarchy level and key permissions.
 */
export function RolesReferenceCards(): React.ReactElement {
  const { t } = useTranslation('team');

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ROLES.map((role) => {
        const permissions = t(`roles.permissions.${role}`, { returnObjects: true }) as string[];

        return (
          <Card key={role} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t(`roles.${role}`)}</CardTitle>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {t(`roles.hierarchy.${role}`)}
                </span>
              </div>
              <CardDescription>{t(`roles.descriptions.${role}`)}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-1">
                {Array.isArray(permissions)
                  ? permissions.map((permission, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-0.5 shrink-0 text-primary" aria-hidden="true">
                          •
                        </span>
                        {permission}
                      </li>
                    ))
                  : null}
              </ul>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
