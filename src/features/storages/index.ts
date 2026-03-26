// Public barrel — only import from here in other features/router
export { default as StoragesPage } from './pages/StoragesPage';
export { useStorages } from './hooks/useStorages';
export { useCapabilities } from './hooks/useCapabilities';
export type { Storage, StorageType, StorageStatus, TenantCapabilities } from './types/storages.types';
export { STORAGE_TIER_LIMITS } from './types/storages.types';
