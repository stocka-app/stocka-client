import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/utils';
import { usePermission } from '@/features/team';
import { useOrganization } from '../hooks/useOrganization';
import { TenantStatusBanner } from '../components/TenantStatusBanner';
import { OrgProfileCard } from '../components/OrgProfileCard';
import { OrgEditForm } from '../components/OrgEditForm';
import { TierQuotasSection } from '../components/TierQuotasSection';
import { AuditLogTable } from '../components/AuditLogTable';
import { DangerZoneSection } from '../components/DangerZoneSection';

type ActiveTab = 'profile' | 'limits' | 'audit';

export default function OrganizationSettingsPage(): React.ReactNode {
  const { t } = useTranslation('organization');
  const canViewAudit = usePermission('REPORT_ADVANCED');

  const { profile, auditLog, isLoading, error, fetchProfile, fetchAuditLog } = useOrganization();

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [auditFetched, setAuditFetched] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleAuditTabClick = (): void => {
    setActiveTab('audit');
    if (!auditFetched) {
      fetchAuditLog();
      setAuditFetched(true);
    }
  };

  const tabs: { key: ActiveTab; label: string; onClick?: () => void }[] = [
    { key: 'profile', label: t('tabs.profile') },
    { key: 'limits', label: t('tabs.limits') },
    { key: 'audit', label: t('tabs.audit'), onClick: handleAuditTabClick },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">
        {t('pageTitle')}
      </h1>

      {/* Status banner */}
      {profile && profile.status !== 'ACTIVE' && (
        <TenantStatusBanner status={profile.status} />
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-0" aria-label="Organization settings tabs">
          {tabs.map(({ key, label, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick ?? (() => setActiveTab(key))}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === key
                  ? 'border-brand text-brand'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300',
              )}
              aria-current={activeTab === key ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <div className="space-y-8">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <span className="text-sm text-neutral-500">
                {t('audit.loading')}
              </span>
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
              {t(error)}
            </div>
          )}

          {profile && !isLoading && (
            <>
              {isEditing ? (
                <OrgEditForm
                  profile={profile}
                  onCancel={() => setIsEditing(false)}
                  onSaved={() => setIsEditing(false)}
                />
              ) : (
                <OrgProfileCard profile={profile} onEdit={() => setIsEditing(true)} />
              )}

              <DangerZoneSection businessName={profile.name} members={[]} />
            </>
          )}
        </div>
      )}

      {activeTab === 'limits' && <TierQuotasSection />}

      {activeTab === 'audit' && (
        <div className="space-y-4">
          {canViewAudit ? (
            <AuditLogTable entries={auditLog} isLoading={isLoading} error={error} />
          ) : (
            <div className="flex items-center justify-center py-12">
              <span className="text-sm text-neutral-500">
                {t('audit.noPermission')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
