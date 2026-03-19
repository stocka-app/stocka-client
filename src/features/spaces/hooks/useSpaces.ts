import { useCallback, useEffect } from 'react';
import { useSpacesStore } from '../store/spaces.store';
import { spacesService } from '../api/spaces.service';
import type { CreateSpaceFormData, UpdateSpaceFormData } from '../schemas/spaces.schema';

export function useSpaces(): {
  spaces: ReturnType<typeof useSpacesStore>['spaces'];
  activeSpaces: ReturnType<typeof useSpacesStore>['spaces'];
  archivedSpaces: ReturnType<typeof useSpacesStore>['spaces'];
  isLoading: boolean;
  error: string | null;
  fetchSpaces: () => Promise<void>;
  createSpace: (payload: CreateSpaceFormData) => Promise<boolean>;
  editSpace: (id: string, payload: UpdateSpaceFormData) => Promise<boolean>;
  archiveSpace: (id: string) => Promise<boolean>;
  restoreSpace: (id: string) => Promise<boolean>;
} {
  const { spaces, isLoading, error, setSpaces, addSpace, updateSpace, setLoading, setError } =
    useSpacesStore();

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

  const activeSpaces = spaces.filter((s) => s.status === 'ACTIVE');
  const archivedSpaces = spaces.filter((s) => s.status === 'ARCHIVED');

  return {
    spaces,
    activeSpaces,
    archivedSpaces,
    isLoading,
    error,
    fetchSpaces,
    createSpace,
    editSpace,
    archiveSpace,
    restoreSpace,
  };
}
