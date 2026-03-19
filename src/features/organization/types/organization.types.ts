export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

export type BusinessType =
  | 'RETAIL'
  | 'RESTAURANT'
  | 'WORKSHOP'
  | 'SERVICES'
  | 'HEALTH'
  | 'EDUCATION'
  | 'EVENTS'
  | 'AGRICULTURE'
  | 'OTHER';

export type TenantTier = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export interface OrgProfile {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;
  rfc: string | null;
  logoUrl: string | null;
  status: TenantStatus;
  tier: TenantTier;
  createdAt: string; // ISO 8601
}

export interface QuotaLimit {
  used: number;
  max: number; // -1 = unlimited
}

export interface TierQuotas {
  warehouses: QuotaLimit;
  members: QuotaLimit;
  products: QuotaLimit;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  details: string;
}

export interface OrgProfileState {
  profile: OrgProfile | null;
  quotas: TierQuotas | null;
  auditLog: AuditLogEntry[];
  isLoading: boolean;
  isSaving: boolean;
  isCheckingName: boolean;
  nameAvailable: boolean | null;
  error: string | null;
}

export interface OrgProfileActions {
  setProfile: (profile: OrgProfile | null) => void;
  setQuotas: (quotas: TierQuotas | null) => void;
  setAuditLog: (auditLog: AuditLogEntry[]) => void;
  setLoading: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setCheckingName: (isCheckingName: boolean) => void;
  setNameAvailable: (nameAvailable: boolean | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type OrgStore = OrgProfileState & OrgProfileActions;
