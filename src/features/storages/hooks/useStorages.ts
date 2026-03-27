import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useStoragesStore } from '../store/storages.store';
import { useRBACStore } from '@/store/rbac.store';
import { storagesService } from '../api/storages.service';
import type { ListStoragesParams } from '../api/storages.service';
import type { CreateStorageFormData, UpdateStorageFormData } from '../schemas/storages.schema';
import type { StorageStatus, StorageType } from '../types/storages.types';

const STORAGES_PAGE_LIMIT = 50;

export function useStorages(): {
  storages: ReturnType<typeof useStoragesStore>['storages'];
  activeStorages: ReturnType<typeof useStoragesStore>['storages'];
  frozenStorages: ReturnType<typeof useStoragesStore>['storages'];
  archivedStorages: ReturnType<typeof useStoragesStore>['storages'];
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filterStatus: StorageStatus | null;
  filterType: StorageType | null;
  searchQuery: string;
  sortOrder: 'ASC' | 'DESC';
  setFilterStatus: (status: StorageStatus | null) => void;
  setFilterType: (type: StorageType | null) => void;
  setSearchQuery: (query: string) => void;
  setSortOrder: (order: 'ASC' | 'DESC') => void;
  setPage: (page: number) => void;
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
  const {
    storages,
    total,
    page,
    totalPages,
    isLoading,
    error,
    setStorages,
    setPagination,
    addStorage,
    updateStorage,
    setLoading,
    setError,
  } = useStoragesStore();
  const { canDo } = useRBACStore();

  const [filterStatus, setFilterStatusState] = useState<StorageStatus | null>(null);
  const [filterType, setFilterTypeState] = useState<StorageType | null>(null);
  const [searchQuery, setSearchQueryState] = useState('');
  const [sortOrder, setSortOrderState] = useState<'ASC' | 'DESC'>('ASC');
  const [currentPage, setCurrentPageState] = useState(1);

  // Keep a ref with the latest filter values so fetchStorages can be called
  // with current state without being a dep of useEffect (avoids infinite loop).
  const filtersRef = useRef({ filterStatus, filterType, searchQuery, sortOrder, currentPage });
  filtersRef.current = { filterStatus, filterType, searchQuery, sortOrder, currentPage };

  const fetchStorages = useCallback(
    async (overrides: Partial<ListStoragesParams> = {}): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const { filterStatus: status, filterType: type, searchQuery: search, sortOrder: order, currentPage: pg } =
          filtersRef.current;
        const params: ListStoragesParams = {
          page: pg,
          limit: STORAGES_PAGE_LIMIT,
          sortOrder: order,
          ...(status !== null ? { status } : {}),
          ...(type !== null ? { type } : {}),
          ...(search !== '' ? { search } : {}),
          ...overrides,
        };
        const result = await storagesService.list(params);
        setStorages(result.items);
        setPagination(result.total, result.page, result.totalPages);
      } catch (err) {
        // AbortController cleanup (StrictMode) — ignore silently, don't set error.
        // Also ignore errors that arrive after the signal was already aborted:
        // the 401 interceptor may retry a request whose signal was concurrently
        // aborted; that retry can fail, but the component has already moved on.
        if (axios.isCancel(err)) return;
        if (overrides.signal?.aborted) return;
        console.error('[useStorages] fetchStorages error (will set loadFailed):', err);
        setError('loadFailed');
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setStorages, setPagination],
  );

  // Re-fetch whenever any filter/page state changes.
  // AbortController ensures the in-flight request from the prior render (or
  // StrictMode's simulated unmount) is cancelled before the new one fires,
  // preventing duplicate requests and 401-cascade from concurrent calls.
  useEffect(() => {
    const controller = new AbortController();
    void fetchStorages({ signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterType, searchQuery, sortOrder, currentPage]);

  // ── Filter setters — reset page to 1 on any filter change ─────────────────

  const setFilterStatus = useCallback((status: StorageStatus | null): void => {
    setFilterStatusState(status);
    setCurrentPageState(1);
  }, []);

  const setFilterType = useCallback((type: StorageType | null): void => {
    setFilterTypeState(type);
    setCurrentPageState(1);
  }, []);

  const setSearchQuery = useCallback((query: string): void => {
    setSearchQueryState(query);
    setCurrentPageState(1);
  }, []);

  const setSortOrder = useCallback((order: 'ASC' | 'DESC'): void => {
    setSortOrderState(order);
    setCurrentPageState(1);
  }, []);

  const setPage = useCallback((p: number): void => {
    setCurrentPageState(p);
  }, []);

  // ── CRUD operations ────────────────────────────────────────────────────────

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

  // ── Derived status subsets from current page items ─────────────────────────

  const activeStorages = storages.filter((s) => s.status === 'ACTIVE');
  const frozenStorages = storages.filter((s) => s.status === 'FROZEN');
  const archivedStorages = storages.filter((s) => s.status === 'ARCHIVED');

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
    total,
    page,
    totalPages,
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
    setPage,
    canCreate,
    canUpdate,
    canFreeze,
    canArchive,
    canDelete,
    fetchStorages: () =>
      fetchStorages({
        page: currentPage,
        sortOrder,
        ...(filterStatus !== null ? { status: filterStatus } : {}),
        ...(filterType !== null ? { type: filterType } : {}),
        ...(searchQuery !== '' ? { search: searchQuery } : {}),
      }),
    createStorage,
    editStorage,
    archiveStorage,
    restoreStorage,
  };
}
