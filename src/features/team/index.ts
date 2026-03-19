// Hook exports
export { useTeam } from './hooks/useTeam';
export { usePermission } from './hooks/usePermission';

// Component exports
export { PermissionGate } from './components/PermissionGate';
export { FreeTierBanner } from './components/FreeTierBanner';
export { MembersTable } from './components/MembersTable';
export { InvitationsTable } from './components/InvitationsTable';
export { RolesReferenceCards } from './components/RolesReferenceCards';
export { MemberGrantsSection } from './components/MemberGrantsSection';
export { InviteMemberModal } from './components/InviteMemberModal';
export { RoleChangeConfirmModal } from './components/RoleChangeConfirmModal';
export { RemoveMemberConfirmModal } from './components/RemoveMemberConfirmModal';

// Page (lazy-loaded from router — not exported here to avoid eager imports)
// Use: lazy(() => import('@/features/team/pages/TeamSettingsPage'))

// Types
export type {
  TenantRole,
  TenantTier,
  TenantStatus,
  MemberStatus,
  InvitationStatus,
  RBACAction,
  TenantMember,
  PendingInvitation,
  IndividualGrant,
} from './types/team.types';
