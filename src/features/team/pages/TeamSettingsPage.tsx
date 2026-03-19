import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { useRBACStore } from '@/store/rbac.store';
import { useTeam } from '../hooks/useTeam';
import { FreeTierBanner } from '../components/FreeTierBanner';
import { MembersTable } from '../components/MembersTable';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { RoleChangeConfirmModal } from '../components/RoleChangeConfirmModal';
import { RemoveMemberConfirmModal } from '../components/RemoveMemberConfirmModal';
import { InvitationsTable } from '../components/InvitationsTable';
import { RolesReferenceCards } from '../components/RolesReferenceCards';
import { PermissionGate } from '../components/PermissionGate';
import { usePermission } from '../hooks/usePermission';
import type { TenantRole } from '../types/team.types';
import type { InviteMemberFormData } from '../schemas/team.schema';

type Tab = 'members' | 'invitations' | 'roles';

interface RoleChangeState {
  memberId: string;
  memberName: string;
  oldRole: TenantRole;
  newRole: TenantRole;
}

/**
 * TeamSettingsPage
 *
 * Settings page for team management.
 * Tabs: Miembros | Invitaciones | Roles
 */
export default function TeamSettingsPage(): React.ReactElement {
  const { t } = useTranslation('team');
  const { role } = useRBACStore();
  const canInvite = usePermission('INVITE_MEMBERS');

  const {
    members,
    invitations,
    isLoading,
    fetchMembers,
    fetchInvitations,
    inviteMember,
    changeRole,
    removeMember,
    suspendMember,
    reactivateMember,
    resendInvitation,
    cancelInvitation,
  } = useTeam();

  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [roleChangeState, setRoleChangeState] = useState<RoleChangeState | null>(null);
  const [removeMemberState, setRemoveMemberState] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    void fetchMembers();
    void fetchInvitations();
  }, [fetchMembers, fetchInvitations]);

  const handleInviteSubmit = async (data: InviteMemberFormData): Promise<void> => {
    await inviteMember(data);
    setShowInviteModal(false);
    void fetchInvitations();
  };

  const handleChangeRole = (memberId: string, newRole: TenantRole): void => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    setRoleChangeState({ memberId, memberName: member.name, oldRole: member.role, newRole });
  };

  const handleConfirmRoleChange = async (): Promise<void> => {
    if (!roleChangeState) return;
    await changeRole(roleChangeState.memberId, roleChangeState.newRole);
    setRoleChangeState(null);
  };

  const handleRemove = (memberId: string): void => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return;
    setRemoveMemberState({ id: memberId, name: member.name });
  };

  const handleConfirmRemove = async (): Promise<void> => {
    if (!removeMemberState) return;
    await removeMember(removeMemberState.id);
    setRemoveMemberState(null);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'members', label: t('tabs.members') },
    { id: 'invitations', label: t('tabs.invitations') },
    { id: 'roles', label: t('tabs.roles') },
  ];

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('page.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('page.description')}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-border" role="tablist" aria-label={t('page.title')}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`mr-2 inline-block border-b-2 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div id="tabpanel-members" role="tabpanel" aria-labelledby="tab-members">
          <FreeTierBanner />
          <div className="mb-4 flex justify-end">
            <PermissionGate action="INVITE_MEMBERS">
              <Button type="button" onClick={() => setShowInviteModal(true)} disabled={isLoading}>
                {t('members.inviteButton')}
              </Button>
            </PermissionGate>
          </div>
          <MembersTable
            members={members}
            currentUserRole={role ?? 'VIEWER'}
            onChangeRole={handleChangeRole}
            onSuspend={(id) => void suspendMember(id)}
            onReactivate={(id) => void reactivateMember(id)}
            onRemove={handleRemove}
          />
        </div>
      )}

      {/* Invitations tab */}
      {activeTab === 'invitations' && (
        <div id="tabpanel-invitations" role="tabpanel" aria-labelledby="tab-invitations">
          <InvitationsTable
            invitations={invitations}
            isLoading={isLoading}
            onResend={(id) => void resendInvitation(id)}
            onCancel={(id) => void cancelInvitation(id)}
          />
        </div>
      )}

      {/* Roles tab */}
      {activeTab === 'roles' && (
        <div id="tabpanel-roles" role="tabpanel" aria-labelledby="tab-roles">
          <RolesReferenceCards />
        </div>
      )}

      {/* Invite modal */}
      {showInviteModal && canInvite && (
        <InviteMemberModal
          currentUserRole={role ?? 'VIEWER'}
          isLoading={isLoading}
          onSubmit={handleInviteSubmit}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Role change confirm modal */}
      {roleChangeState && (
        <RoleChangeConfirmModal
          memberName={roleChangeState.memberName}
          oldRole={roleChangeState.oldRole}
          newRole={roleChangeState.newRole}
          isLoading={isLoading}
          onConfirm={() => void handleConfirmRoleChange()}
          onCancel={() => setRoleChangeState(null)}
        />
      )}

      {/* Remove member confirm modal */}
      {removeMemberState && (
        <RemoveMemberConfirmModal
          memberName={removeMemberState.name}
          isLoading={isLoading}
          onConfirm={() => void handleConfirmRemove()}
          onCancel={() => setRemoveMemberState(null)}
        />
      )}
    </div>
  );
}
