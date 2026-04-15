import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useStoragesStore } from '../store/storages.store';
import { useRBACStore } from '@/store/rbac.store';
import { useTierCapabilities, STORAGE_TYPE_TO_FEATURE } from '@/shared/hooks/useTierCapabilities';
import { storagesService } from '../api/storages.service';
import type { ListStoragesParams } from '../api/storages.service';
import type {
  CreateStorageFormData,
  CreateWarehouseFormData,
  CreateStoreRoomFormData,
  CreateCustomRoomFormData,
} from '../schemas/storages.schema';
import type { Storage, StorageStatus, StorageType, StorageStatusSummary } from '../types/storages.types';

const STORAGES_PAGE_LIMIT = 50;

type CreateError = 'name_taken' | 'tier_limit' | 'server_error' | null;
type EditError = 'name_taken' | 'address_required' | 'server_error' | null;
type ChangeTypeError = 'archived' | 'frozen' | 'tier_limit' | 'address_required' | 'server_error' | null;

export interface EditStoragePayload {
  name?: string;
  description?: string | null;
  address?: string;
  icon?: string;
  color?: string;
  roomType?: string;
}

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

function resolveEditError(err: unknown): EditError {
  // H-07: STORAGE_ARCHIVED_CANNOT_BE_UPDATED no longer exists — metadata is
  // editable in ARCHIVED. Type-change is still blocked by change handlers
  // (STORAGE_TYPE_LOCKED_WHILE_ARCHIVED) which flows through resolveChangeTypeError.
  const apiErr = err as Partial<{ statusCode: number; error: string }>;
  if (apiErr?.error === 'STORAGE_NAME_ALREADY_EXISTS') return 'name_taken';
  if (apiErr?.error === 'STORAGE_ADDRESS_REQUIRED_FOR_WAREHOUSE') return 'address_required';

  if (axios.isAxiosError(err)) {
    const code = (err.response?.data as { error?: string } | undefined)?.error;
    if (code === 'STORAGE_NAME_ALREADY_EXISTS') return 'name_taken';
    if (code === 'STORAGE_ADDRESS_REQUIRED_FOR_WAREHOUSE') return 'address_required';
  }

  return 'server_error';
}

function resolveChangeTypeError(err: unknown): ChangeTypeError {
  // H-07 (Paso 1 BE): per-transition handlers emit STORAGE_TYPE_LOCKED_WHILE_ARCHIVED
  // for ARCHIVED (same naming convention as WhileFrozen). The legacy code used
  // STORAGE_ARCHIVED_CANNOT_BE_UPDATED — kept below for backwards-compat during
  // rolling deploys; can be removed once BE is fully rolled out.
  const apiErr = err as Partial<{ statusCode: number; error: string }>;
  if (
    apiErr?.error === 'STORAGE_TYPE_LOCKED_WHILE_ARCHIVED' ||
    apiErr?.error === 'STORAGE_ARCHIVED_CANNOT_BE_UPDATED'
  ) return 'archived';
  if (apiErr?.error === 'STORAGE_TYPE_LOCKED_WHILE_FROZEN') return 'frozen';
  if (apiErr?.error === 'STORAGE_ADDRESS_REQUIRED_FOR_WAREHOUSE') return 'address_required';
  if (apiErr?.statusCode === 403) return 'tier_limit';

  if (axios.isAxiosError(err)) {
    const code = (err.response?.data as { error?: string } | undefined)?.error;
    if (code === 'STORAGE_TYPE_LOCKED_WHILE_ARCHIVED' || code === 'STORAGE_ARCHIVED_CANNOT_BE_UPDATED') return 'archived';
    if (code === 'STORAGE_TYPE_LOCKED_WHILE_FROZEN') return 'frozen';
    if (code === 'STORAGE_ADDRESS_REQUIRED_FOR_WAREHOUSE') return 'address_required';
    if (err.response?.status === 403) return 'tier_limit';
  }

  return 'server_error';
}

const EMPTY_SUMMARY: StorageStatusSummary = { active: 0, frozen: 0, archived: 0 };

interface TypeCounts {
  WAREHOUSE: number;
  STORE_ROOM: number;
  CUSTOM_ROOM: number;
  total: number;
}

const EMPTY_TYPE_COUNTS: TypeCounts = { WAREHOUSE: 0, STORE_ROOM: 0, CUSTOM_ROOM: 0, total: 0 };

export function useStorages(): {
  storages: Storage[];
  /** Current page sorted with the active-context storage in position #0 (if present) and the rest A→Z by name. Consumed by StoragesPage grid to honor the "contexto actual primero" rule. */
  sortedStorages: Storage[];
  activeStorages: Storage[];
  frozenStorages: Storage[];
  archivedStorages: Storage[];
  /** UUID of the storage the user is currently operating in (persisted in localStorage via the store). Null when no selection has been made yet. */
  activeStorageId: string | null;
  /** Resolved `Storage` object for `activeStorageId`, or null if the id is unset, unknown, or points to a storage not present in the current page. */
  activeStorage: Storage | null;
  summary: StorageStatusSummary;
  typeCounts: TypeCounts;
  total: number;
  page: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  filterStatus: StorageStatus | null;
  filterType: StorageType | null;
  searchQuery: string;
  sortOrder: 'ASC' | 'DESC';
  /** True when the active filterType is completely locked on the current tier */
  isGated: boolean;
  setFilterStatus: (status: StorageStatus | null) => void;
  setFilterType: (type: StorageType | null) => void;
  setSearchQuery: (query: string) => void;
  setSortOrder: (order: 'ASC' | 'DESC') => void;
  setPage: (page: number) => void;
  /** Set the active context storage. Passing `null` clears the selection. Persists via the store's tenant-scoped localStorage adapter. */
  setActiveStorage: (id: string | null) => void;
  /** Validates the persisted `activeStorageId` against the current storages. If the id is stale (storage no longer exists) or unset, auto-selects the first ACTIVE storage sorted A→Z. No-op if the persisted id is still valid. */
  hydrateActiveStorage: () => void;
  canCreate: boolean;
  canUpdate: boolean;
  canFreeze: boolean;
  canUnfreeze: boolean;
  canArchive: boolean;
  canRestore: boolean;
  canDelete: boolean;
  fetchStorages: () => Promise<void>;
  createStorage: (payload: CreateStorageFormData) => Promise<boolean>;
  createWarehouse: (payload: CreateWarehouseFormData) => Promise<{ error: CreateError }>;
  createStoreRoom: (payload: CreateStoreRoomFormData) => Promise<{ error: CreateError }>;
  createCustomRoom: (payload: CreateCustomRoomFormData) => Promise<{ error: CreateError }>;
  editStorage: (id: string, type: StorageType, payload: EditStoragePayload) => Promise<{ error: EditError }>;
  changeStorageType: (id: string, targetType: StorageType) => Promise<{ error: ChangeTypeError }>;
  archiveStorage: (id: string) => Promise<boolean>;
  restoreStorage: (id: string) => Promise<boolean>;
  /** H-07 stub — triggers the 501 endpoint so the UX path is exercised end-to-end. Always resolves with `not_implemented`. */
  deleteStoragePermanent: (id: string) => Promise<{ error: 'not_implemented' | 'server_error' }>;
  freezeStorage: (id: string) => Promise<boolean>;
  unfreezeStorage: (id: string) => Promise<boolean>;
  getIsLastActive: (id: string) => boolean;
} {
  const {
    storages,
    activeStorageId,
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
    setActiveStorage,
    hydrateActiveStorage,
  } = useStoragesStore();
  const { canDo } = useRBACStore();
  const { isAllowed } = useTierCapabilities();

  const [filterStatus, setFilterStatusState] = useState<StorageStatus | null>(null);
  const [filterType, setFilterTypeState] = useState<StorageType | null>(null);
  const [searchQuery, setSearchQueryState] = useState('');
  const [sortOrder, setSortOrderState] = useState<'ASC' | 'DESC'>('ASC');
  const [currentPage, setCurrentPageState] = useState(1);
  const [summary, setSummary] = useState<StorageStatusSummary>(EMPTY_SUMMARY);
  const [typeCounts, setTypeCounts] = useState<TypeCounts>(EMPTY_TYPE_COUNTS);

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
        setSummary(result.summary);
        const ts = result.typeSummary;
        setTypeCounts({
          WAREHOUSE: ts.WAREHOUSE.active + ts.WAREHOUSE.frozen + ts.WAREHOUSE.archived,
          STORE_ROOM: ts.STORE_ROOM.active + ts.STORE_ROOM.frozen + ts.STORE_ROOM.archived,
          CUSTOM_ROOM: ts.CUSTOM_ROOM.active + ts.CUSTOM_ROOM.frozen + ts.CUSTOM_ROOM.archived,
          total:
            ts.WAREHOUSE.active + ts.WAREHOUSE.frozen + ts.WAREHOUSE.archived +
            ts.STORE_ROOM.active + ts.STORE_ROOM.frozen + ts.STORE_ROOM.archived +
            ts.CUSTOM_ROOM.active + ts.CUSTOM_ROOM.frozen + ts.CUSTOM_ROOM.archived,
        });
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
    [setLoading, setError, setStorages, setPagination, setSummary],
  );

  // isGated: the selected filter type is completely locked on the current tier.
  // Derived here so it's stable for both the effect dep and the return value.
  const isGated =
    filterType !== null &&
    !isAllowed(STORAGE_TYPE_TO_FEATURE[filterType]);

  // Re-fetch whenever any filter/page state changes.
  // Skip entirely when the active filter type is tier-gated — no point in
  // hitting the network for a resource the tenant cannot access.
  // AbortController ensures the in-flight request from the prior render (or
  // StrictMode's simulated unmount) is cancelled before the new one fires,
  // preventing duplicate requests and 401-cascade from concurrent calls.
  useEffect(() => {
    if (isGated) {
      // Clear stale results so stats bars and card lists show empty for the locked tab.
      setStorages([]);
      setPagination(0, 1, 1);
      setSummary(EMPTY_SUMMARY);
      return;
    }
    const controller = new AbortController();
    void fetchStorages({ signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterType, searchQuery, sortOrder, currentPage, isGated]);


  // ── Filter setters — reset page to 1 on any filter change ─────────────────

  const setFilterStatus = useCallback((status: StorageStatus | null): void => {
    setFilterStatusState(status);
    setCurrentPageState(1);
  }, []);

  const setFilterType = useCallback((type: StorageType | null): void => {
    setFilterTypeState(type);
    setFilterStatusState(null);
    setSearchQueryState('');
    setSortOrderState('ASC');
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
    async (id: string, type: StorageType, payload: EditStoragePayload): Promise<{ error: EditError }> => {
      try {
        // DT-H07-4: BE now returns the updated Storage — propagate in place
        // via updateStorage instead of a full refetch (drops one network trip).
        let updated: Storage;
        switch (type) {
          case 'WAREHOUSE':
            updated = await storagesService.updateWarehouse(id, payload);
            break;
          case 'STORE_ROOM':
            updated = await storagesService.updateStoreRoom(id, payload);
            break;
          case 'CUSTOM_ROOM':
            updated = await storagesService.updateCustomRoom(id, payload);
            break;
        }
        updateStorage(updated);
        return { error: null };
      } catch (err) {
        return { error: resolveEditError(err) };
      }
    },
    [updateStorage],
  );

  const changeStorageType = useCallback(
    async (id: string, targetType: StorageType): Promise<{ error: ChangeTypeError }> => {
      try {
        await storagesService.changeType(id, targetType);
        await fetchStorages();
        return { error: null };
      } catch (err) {
        return { error: resolveChangeTypeError(err) };
      }
    },
    [fetchStorages],
  );

  // Applies a status-flip locally to the summary counters so we don't have to
  // refetch the whole list after a freeze/unfreeze/archive/restore. The BE
  // endpoints return the updated storage (post-H07 refactor), so we can
  // propagate the change in place. The `type` param is kept for future
  // per-type counter adjustments; current summary is tenant-wide.
  const shiftStatusCounters = useCallback(
    (_type: StorageType, from: StorageStatus, to: StorageStatus): void => {
      setSummary((prev) => ({
        active: prev.active + (to === 'ACTIVE' ? 1 : 0) - (from === 'ACTIVE' ? 1 : 0),
        frozen: prev.frozen + (to === 'FROZEN' ? 1 : 0) - (from === 'FROZEN' ? 1 : 0),
        archived: prev.archived + (to === 'ARCHIVED' ? 1 : 0) - (from === 'ARCHIVED' ? 1 : 0),
      }));
    },
    [],
  );

  const archiveStorage = useCallback(
    async (id: string): Promise<boolean> => {
      const target = storages.find((s) => s.uuid === id);
      if (!target) return false;
      try {
        const updated = await storagesService.archive(id, target.type);
        updateStorage(updated);
        shiftStatusCounters(target.type, target.status, updated.status);
        return true;
      } catch {
        return false;
      }
    },
    [storages, updateStorage, shiftStatusCounters],
  );

  const restoreStorage = useCallback(
    async (id: string): Promise<boolean> => {
      const target = storages.find((s) => s.uuid === id);
      if (!target) return false;
      try {
        const updated = await storagesService.restore(id, target.type);
        updateStorage(updated);
        shiftStatusCounters(target.type, target.status, updated.status);
        return true;
      } catch {
        return false;
      }
    },
    [storages, updateStorage, shiftStatusCounters],
  );

  const deleteStoragePermanent = useCallback(
    async (id: string): Promise<{ error: 'not_implemented' | 'server_error' }> => {
      try {
        await storagesService.deleteStoragePermanent(id);
        // BE should return 501, so success is unexpected in Sprint 2. Treat as server_error for safety.
        return { error: 'server_error' };
      } catch (err) {
        const apiErr = err as Partial<{ statusCode: number; error: string }>;
        if (apiErr?.statusCode === 501) return { error: 'not_implemented' };
        if (axios.isAxiosError(err) && err.response?.status === 501) return { error: 'not_implemented' };
        return { error: 'server_error' };
      }
    },
    [],
  );

  const freezeStorage = useCallback(
    async (id: string): Promise<boolean> => {
      const target = storages.find((s) => s.uuid === id);
      if (!target) return false;
      try {
        const updated = await storagesService.freeze(id, target.type);
        updateStorage(updated);
        shiftStatusCounters(target.type, target.status, updated.status);
        return true;
      } catch {
        return false;
      }
    },
    [storages, updateStorage, shiftStatusCounters],
  );

  const unfreezeStorage = useCallback(
    async (id: string): Promise<boolean> => {
      const target = storages.find((s) => s.uuid === id);
      if (!target) return false;
      try {
        const updated = await storagesService.unfreeze(id, target.type);
        updateStorage(updated);
        shiftStatusCounters(target.type, target.status, updated.status);
        return true;
      } catch {
        return false;
      }
    },
    [storages, updateStorage, shiftStatusCounters],
  );

  const getIsLastActive = useCallback(
    (id: string): boolean => {
      const target = storages.find((s) => s.uuid === id);
      if (!target || target.status !== 'ACTIVE') return false;
      return storages.filter((s) => s.status === 'ACTIVE').length === 1;
    },
    [storages],
  );

  // ── Derived status subsets from current page items ─────────────────────────

  const activeStorages = storages.filter((s) => s.status === 'ACTIVE');
  const frozenStorages = storages.filter((s) => s.status === 'FROZEN');
  const archivedStorages = storages.filter((s) => s.status === 'ARCHIVED');

  // ── Active-context derived data (H-03 — STOC-344) ─────────────────────────
  //
  // `activeStorage` resolves the persisted `activeStorageId` against the
  // current page of storages. Returns null if the id is unset or points to a
  // storage not in the current view (either stale/deleted or on another page
  // of the paginated result — the caller must decide which).
  //
  // `sortedStorages` is the current page with the active storage moved to
  // position #0 and the rest kept in server order. Consumed by `StoragesPage`
  // (grid) to honor the "contexto actual primero" rule without disturbing
  // the server-side sort.
  const activeStorage = useMemo<Storage | null>(
    () =>
      activeStorageId !== null ? storages.find((s) => s.uuid === activeStorageId) ?? null : null,
    [activeStorageId, storages],
  );

  const sortedStorages = useMemo<Storage[]>(() => {
    if (activeStorageId === null) return storages;
    const active = storages.find((s) => s.uuid === activeStorageId);
    if (!active) return storages;
    const rest = storages.filter((s) => s.uuid !== activeStorageId);
    return [active, ...rest];
  }, [activeStorageId, storages]);

  // ── Permission flags ───────────────────────────────────────────────────────

  const canCreate = canDo('STORAGE_CREATE');
  const canUpdate = canDo('STORAGE_UPDATE');
  const canFreeze = canDo('STORAGE_FREEZE');
  const canUnfreeze = canDo('STORAGE_UNFREEZE');
  const canArchive = canDo('STORAGE_ARCHIVE');
  const canRestore = canDo('STORAGE_RESTORE');
  const canDelete = canDo('STORAGE_DELETE');

  return {
    storages,
    sortedStorages,
    activeStorages,
    frozenStorages,
    archivedStorages,
    activeStorageId,
    activeStorage,
    summary,
    typeCounts,
    total,
    page,
    totalPages,
    isLoading,
    error,
    filterStatus,
    filterType,
    searchQuery,
    sortOrder,
    isGated,
    setFilterStatus,
    setFilterType,
    setSearchQuery,
    setSortOrder,
    setPage,
    setActiveStorage,
    hydrateActiveStorage,
    canCreate,
    canUpdate,
    canFreeze,
    canUnfreeze,
    canArchive,
    canRestore,
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
    changeStorageType,
    archiveStorage,
    restoreStorage,
    deleteStoragePermanent,
    freezeStorage,
    unfreezeStorage,
    getIsLastActive,
  };
}
