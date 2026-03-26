import { useCallback, useEffect, useState } from 'react';
import { useSpacesStore } from '../store/spaces.store';
import { useRBACStore } from '@/store/rbac.store';
import { spacesService } from '../api/spaces.service';
import type { CreateSpaceFormData, UpdateSpaceFormData } from '../schemas/spaces.schema';
import type { SpaceStatus, SpaceType } from '../types/spaces.types';

export function useSpaces(): {
  spaces: ReturnType<typeof useSpacesStore>['spaces'];
  activeSpaces: ReturnType<typeof useSpacesStore>['spaces'];
  frozenSpaces: ReturnType<typeof useSpacesStore>['spaces'];
  archivedSpaces: ReturnType<typeof useSpacesStore>['spaces'];
  filteredSpaces: ReturnType<typeof useSpacesStore>['spaces'];
  isLoading: boolean;
  error: string | null;
  filterStatus: SpaceStatus | null;
  filterType: SpaceType | null;
  searchQuery: string;
  sortOrder: 'asc' | 'desc';
  setFilterStatus: (status: SpaceStatus | null) => void;
  setFilterType: (type: SpaceType | null) => void;
  setSearchQuery: (query: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  canCreate: boolean;
  canUpdate: boolean;
  canFreeze: boolean;
  canArchive: boolean;
  canDelete: boolean;
  fetchSpaces: () => Promise<void>;
  createSpace: (payload: CreateSpaceFormData) => Promise<boolean>;
  editSpace: (id: string, payload: UpdateSpaceFormData) => Promise<boolean>;
  archiveSpace: (id: string) => Promise<boolean>;
  restoreSpace: (id: string) => Promise<boolean>;
} {
  const { spaces, isLoading, error, setSpaces, addSpace, updateSpace, setLoading, setError } =
    useSpacesStore();
  const { canDo } = useRBACStore();

  const [filterStatus, setFilterStatus] = useState<SpaceStatus | null>(null);
  const [filterType, setFilterType] = useState<SpaceType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchSpaces = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const data = await spacesService.list();
      setSpaces(data);
    } catch {
      setError('loadFailed');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setSpaces]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const createSpace = useCallback(
    async (payload: CreateSpaceFormData): Promise<boolean> => {
      try {
        const space = await spacesService.create(payload);
        addSpace(space);
        return true;
      } catch {
        return false;
      }
    },
    [addSpace],
  );

  const editSpace = useCallback(
    async (id: string, payload: UpdateSpaceFormData): Promise<boolean> => {
      try {
        const space = await spacesService.update(id, payload);
        updateSpace(space);
        return true;
      } catch {
        return false;
      }
    },
    [updateSpace],
  );

  const archiveSpace = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const space = await spacesService.archive(id);
        updateSpace(space);
        return true;
      } catch {
        return false;
      }
    },
    [updateSpace],
  );

  const restoreSpace = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const space = await spacesService.restore(id);
        updateSpace(space);
        return true;
      } catch {
        return false;
      }
    },
    [updateSpace],
  );

  // ── Derived status lists ───────────────────────────────────────────────────

  const activeSpaces = spaces.filter((s) => s.status === 'ACTIVE');
  const frozenSpaces = spaces.filter((s) => s.status === 'FROZEN');
  const archivedSpaces = spaces.filter((s) => s.status === 'ARCHIVED');

  // ── Filtered + sorted list (AND logic) ────────────────────────────────────

  const filteredSpaces = spaces
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
  const canFreeze = canDo('STORAGE_UPDATE');
  const canArchive = canDo('STORAGE_DELETE');
  const canDelete = canDo('STORAGE_DELETE');

  return {
    spaces,
    activeSpaces,
    frozenSpaces,
    archivedSpaces,
    filteredSpaces,
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
    fetchSpaces,
    createSpace,
    editSpace,
    archiveSpace,
    restoreSpace,
  };
}
