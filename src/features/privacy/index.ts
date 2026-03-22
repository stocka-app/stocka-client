// Hook
export { usePrivacy } from './hooks/usePrivacy';

// Page (lazy-loaded from router — not exported here to avoid eager imports)
// Use: lazy(() => import('@/features/privacy/pages/PrivacySettingsPage'))

// Types
export type { ConsentRecord, ConsentsState } from './types/privacy.types';
