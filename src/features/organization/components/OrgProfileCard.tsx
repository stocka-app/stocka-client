import { useTranslation } from 'react-i18next';
import { Building2, Edit2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { usePermission } from '@/features/team';
import type { OrgProfile } from '../types/organization.types';

interface OrgProfileCardProps {
  profile: OrgProfile;
  onEdit: () => void;
}

const STATUS_STYLES = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300',
  SUSPENDED: 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300',
};

const TIER_STYLES: Record<string, string> = {
  FREE: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  STARTER: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300',
  GROWTH: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-300',
  ENTERPRISE: 'bg-brand/10 text-brand dark:bg-brand/20',
};

export function OrgProfileCard({ profile, onEdit }: OrgProfileCardProps): React.ReactNode {
  const { t } = useTranslation('organization');
  const canEdit = usePermission('EDIT_ORG_CONFIG');

  const formattedDate = new Date(profile.createdAt).toLocaleDateString();

  return (
    <div className="space-y-6">
      {/* Header: Logo + Name + Edit button */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.logoUrl ? (
            <img
              src={profile.logoUrl}
              alt={t('profile.fields.logoPreviewAlt')}
              className="h-16 w-16 rounded-xl object-cover border border-neutral-200 dark:border-neutral-700"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-brand/10 flex items-center justify-center border border-brand/20">
              <Building2 className="h-8 w-8 text-brand" aria-hidden="true" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {profile.name}
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">/{profile.slug}</p>
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-brand bg-brand/10 hover:bg-brand/20 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t('profile.editButton')}
          </button>
        )}
      </div>

      {/* Fields grid */}
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {t('profile.fields.businessType')}
          </dt>
          <dd className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
            {t(`profile.businessTypes.${profile.businessType}`)}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {t('profile.fields.rfc')}
          </dt>
          <dd className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
            {profile.rfc ?? '—'}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {t('profile.fields.status')}
          </dt>
          <dd className="mt-1">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                STATUS_STYLES[profile.status],
              )}
            >
              {t(`profile.status.${profile.status}`)}
            </span>
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {t('profile.fields.tier')}
          </dt>
          <dd className="mt-1">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                TIER_STYLES[profile.tier],
              )}
            >
              {t(`profile.tiers.${profile.tier}`)}
            </span>
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {t('profile.fields.slug')}
          </dt>
          <dd className="mt-1 text-sm text-neutral-900 dark:text-neutral-100 font-mono">
            {profile.slug}
          </dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            {t('profile.fields.createdAt')}
          </dt>
          <dd className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">
            {formattedDate}
          </dd>
        </div>
      </dl>
    </div>
  );
}
