// Public barrel — only import from here in other features/router
export { default as StoragesPage } from './pages/StoragesPage';
export { StorageSwitcher } from './components/StorageSwitcher';
export { useStorages } from './hooks/useStorages';
export type { Storage, StorageType, StorageStatus, TenantCapabilities } from './types/storages.types';
