export interface ConsentRecord {
  consentType: 'terms_of_service' | 'privacy_policy' | 'marketing_communications' | 'anonymous_analytics';
  granted: boolean;
  documentVersion: string;
  grantedAt: string;
}

export interface ConsentsState {
  marketing: boolean;
  analytics: boolean;
  termsAcceptedAt: string | null;
  privacyAcceptedAt: string | null;
}
