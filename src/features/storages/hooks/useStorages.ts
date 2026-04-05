import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useStoragesStore } from '../store/storages.store';
import { useRBACStore } from '@/store/rbac.store';
import { storagesService } from '../api/storages.service';
import type { ListStoragesParams } from '../api/storages.service';
import type {
  CreateStorageFormData,
  UpdateStorageFormData,
  CreateWarehouseFormData,
  CreateStoreRoomFormData,
  CreateCustomRoomFormData,
} from '../schemas/storages.schema';
import type { Storage, StorageStatus, StorageType } from '../types/storages.types';

const STORAGES_PAGE_LIMIT = 50;

type CreateError = 'name_taken' | 'tier_limit' | 'server_error' | null;

function resolveCreateError(err: unknown): CreateError {
  // The response interceptor transforms AxiosErrors into plain ApiError objects
  // before they reach this hook. Check the ApiError shape first.
  const apiErr = err as Partial<{ statusCode: number; error: string }>;
  if (apiErr?.error === 'STORAGE_NAME_ALREADY_EXISTS') return 'name_taken';
  if (apiErr?.statusCode === 403) return 'tier_limit';

  // Fallback: raw AxiosError (e.g. cancelled requests bypass the interceptor)
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const code = (err.response?.data as { error?: string } | undefined)?.error;
    if (code === 'STORAGE_NAME_ALREADY_EXISTS') return 'name_taken';
    if (status === 403) return 'tier_limit';
  }

  return 'server_error';
}

export function useStorages(): {
  storages: Storage[];
  activeStorages: Storage[];
  frozenStorages: Storage[];
  archivedStorages: Storage[];
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
  createWarehouse: (payload: CreateWarehouseFormData) => Promise<{ error: CreateError }>;
  createStoreRoom: (payload: CreateStoreRoomFormData) => Promise<{ error: CreateError }>;
  createCustomRoom: (payload: CreateCustomRoomFormData) => Promise<{ error: CreateError }>;
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
        setLoading(false);
      } catch (err) {
        // AbortController cleanup (StrictMode) — ignore silently, don't set error
        // or loading state. The finally block also checks for abort to prevent
        // a flash of empty state between StrictMode's unmount and remount.
        if (axios.isCancel(err)) return;
        if (overrides.signal?.aborted) return;
        console.error('[useStorages] fetchStorages error (will set loadFailed):', err);
        setError('loadFailed');
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

  const createWarehouse = useCallback(
    async (payload: CreateWarehouseFormData): Promise<{ error: CreateError }> => {
      try {
        await storagesService.createWarehouse(payload);
        await fetchStorages();
        return { error: null };
      } catch (err) {
        return { error: resolveCreateError(err) };
      }
    },
    [fetchStorages],
  );

  const createStoreRoom = useCallback(
    async (payload: CreateStoreRoomFormData): Promise<{ error: CreateError }> => {
      try {
        await storagesService.createStoreRoom(payload);
        await fetchStorages();
        return { error: null };
      } catch (err) {
        return { error: resolveCreateError(err) };
      }
    },
    [fetchStorages],
  );

  const createCustomRoom = useCallback(
    async (payload: CreateCustomRoomFormData): Promise<{ error: CreateError }> => {
      try {
        await storagesService.createCustomRoom({
          name: payload.name,
          roomType: payload.icon,
          address: payload.address,
          description: payload.description,
          icon: payload.icon,
          color: payload.color,
        });
        await fetchStorages();
        return { error: null };
      } catch (err) {
        return { error: resolveCreateError(err) };
      }
    },
    [fetchStorages],
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
    createWarehouse,
    createStoreRoom,
    createCustomRoom,
    editStorage,
    archiveStorage,
    restoreStorage,
  };
}
