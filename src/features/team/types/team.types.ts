export type TenantRole =
  | 'OWNER'
  | 'PARTNER'
  | 'MANAGER'
  | 'BUYER'
  | 'WAREHOUSE_KEEPER'
  | 'SALES_REP'
  | 'VIEWER';

export type TenantTier = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

export type MemberStatus = 'ACTIVE' | 'SUSPENDED';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

export type RBACAction =
  | 'VIEW_ORG_CONFIG'
  | 'EDIT_ORG_CONFIG'
  | 'VIEW_MEMBERS'
  | 'INVITE_MEMBERS'
  | 'CHANGE_MEMBER_ROLE'
  | 'REMOVE_MEMBER'
  | 'VIEW_PRODUCTS'
  | 'CREATE_PRODUCT'
  | 'EDIT_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'VIEW_SPACES'
  | 'CREATE_EDIT_SPACE'
  | 'VIEW_REPORTS'
  | 'EXPORT_REPORTS';

export interface TenantMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: TenantRole;
  status: MemberStatus;
  joinedAt: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: TenantRole;
  sentAt: string;
  expiresAt: string;
  status: InvitationStatus;
}

export interface IndividualGrant {
  memberId: string;
  action: RBACAction;
  grantedAt: string;
  grantedBy: string;
}
