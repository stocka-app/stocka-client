import { useCallback, useEffect, useState } from 'react';
import { useStoragesStore } from '../store/storages.store';
import { useRBACStore } from '@/store/rbac.store';
import { storagesService } from '../api/storages.service';
import type { CreateStorageFormData, UpdateStorageFormData } from '../schemas/storages.schema';
import type { StorageStatus, StorageType } from '../types/storages.types';

export function useStorages(): {
  storages: ReturnType<typeof useStoragesStore>['storages'];
  activeStorages: ReturnType<typeof useStoragesStore>['storages'];
  frozenStorages: ReturnType<typeof useStoragesStore>['storages'];
  archivedStorages: ReturnType<typeof useStoragesStore>['storages'];
  filteredStorages: ReturnType<typeof useStoragesStore>['storages'];
  isLoading: boolean;
  error: string | null;
  filterStatus: StorageStatus | null;
  filterType: StorageType | null;
  searchQuery: string;
  sortOrder: 'asc' | 'desc';
  setFilterStatus: (status: StorageStatus | null) => void;
  setFilterType: (type: StorageType | null) => void;
  setSearchQuery: (query: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  canCreate: boolean;
  canUpdate: boolean;
  canFreeze: boolean;
  canArchive: boolean;
  canDelete: boolean;
  fetchStorages: () => Promise<void>;
  createStorage: (payload: CreateStorageFormData) => Promise<boolean>;
  editStorage: (id: string, payload: UpdateStorageFormData) => Promise<boolean>;
  archiveStorage: (id: string) => Promise<boolean>;
  restoreStorage: (id: string) => Promise<boolean>;
} {
  const { storages, isLoading, error, setStorages, addStorage, updateStorage, setLoading, setError } =
    useStoragesStore();
  const { canDo } = useRBACStore();

  const [filterStatus, setFilterStatus] = useState<StorageStatus | null>(null);
  const [filterType, setFilterType] = useState<StorageType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchStorages = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await storagesService.list();
      setStorages(data);
    } catch {
      setError('loadFailed');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setStorages]);

  useEffect(() => {
    fetchStorages();
  }, [fetchStorages]);

  const createStorage = useCallback(
    async (payload: CreateStorageFormData): Promise<boolean> => {
      try {
        const storage = await storagesService.create(payload);
        addStorage(storage);
        return true;
      } catch {
        return false;
      }
    },
    [addStorage],
  );

  const editStorage = useCallback(
    async (id: string, payload: UpdateStorageFormData): Promise<boolean> => {
      try {
        const storage = await storagesService.update(id, payload);
        updateStorage(storage);
        return true;
      } catch {
        return false;
      }
    },
    [updateStorage],
  );

  const archiveStorage = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const storage = await storagesService.archive(id);
        updateStorage(storage);
        return true;
      } catch {
        return false;
      }
    },
    [updateStorage],
  );

  const restoreStorage = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const storage = await storagesService.restore(id);
        updateStorage(storage);
        return true;
      } catch {
        return false;
      }
    },
    [updateStorage],
  );

  // ── Derived status lists ───────────────────────────────────────────────────

  const activeStorages = storages.filter((s) => s.status === 'ACTIVE');
  const frozenStorages = storages.filter((s) => s.status === 'FROZEN');
  const archivedStorages = storages.filter((s) => s.status === 'ARCHIVED');

  // ── Filtered + sorted list (AND logic) ────────────────────────────────────

  const filteredStorages = storages
    .filter((s) => filterStatus === null || s.status === filterStatus)
    .filter((s) => filterType === null || s.type === filterType)
    .filter(
      (s) =>
        searchQuery === '' || s.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

  // ── Permission flags ───────────────────────────────────────────────────────

  const canCreate = canDo('STORAGE_CREATE');
  const canUpdate = canDo('STORAGE_UPDATE');
  const canFreeze = canDo('STORAGE_FREEZE');
  const canArchive = canDo('STORAGE_ARCHIVE');
  const canDelete = canDo('STORAGE_DELETE');

  return {
    storages,
    activeStorages,
    frozenStorages,
    archivedStorages,
    filteredStorages,
    isLoading,
    error,
    filterStatus,
    filterType,
    searchQuery,
    sortOrder,
    setFilterStatus,
    setFilterType,
    setSearchQuery,
    setSortOrder,
    canCreate,
    canUpdate,
    canFreeze,
    canArchive,
    canDelete,
    fetchStorages,
    createStorage,
    editStorage,
    archiveStorage,
    restoreStorage,
  };
}
