// Public barrel — only import from here in other features/router
export { default as StoragesPage } from './pages/StoragesPage';
export { StorageSwitcher } from './components/StorageSwitcher';
export { StorageStatusBanner } from './components/StorageStatusBanner';
export { useStorages } from './hooks/useStorages';
export type { Storage, StorageType, StorageStatus, TenantCapabilities } from './types/storages.types';
