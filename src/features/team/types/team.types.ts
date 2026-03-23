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
  | 'STORAGE_CREATE'
  | 'STORAGE_READ'
  | 'STORAGE_UPDATE'
  | 'STORAGE_DELETE'
  | 'MEMBER_INVITE'
  | 'MEMBER_READ'
  | 'MEMBER_UPDATE_ROLE'
  | 'MEMBER_REMOVE'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_READ'
  | 'PRODUCT_UPDATE'
  | 'PRODUCT_DELETE'
  | 'REPORT_READ'
  | 'REPORT_ADVANCED'
  | 'INVENTORY_EXPORT'
  | 'TENANT_SETTINGS_READ'
  | 'TENANT_SETTINGS_UPDATE';

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
