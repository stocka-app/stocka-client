import { beforeEach, describe, expect, it } from 'vitest';
import { useSpacesStore } from '../spaces.store';
import type { Space } from '../../types/spaces.types';

const space1: Space = {
  id: 'space-001',
  tenantId: 'tenant-001',
  name: 'Main Store Room',
  type: 'STORE_ROOM',
  status: 'ACTIVE',
  address: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const space2: Space = {
  id: 'space-002',
  tenantId: 'tenant-001',
  name: 'Custom Room A',
  type: 'CUSTOM_ROOM',
  status: 'ACTIVE',
  address: null,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

function resetStore(): void {
  useSpacesStore.setState({ spaces: [], isLoading: false, error: null });
}

describe('Given the spaces store manages space state', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('When the store is in its initial state', () => {
    it('Then spaces is an empty array', () => {
      expect(useSpacesStore.getState().spaces).toEqual([]);
    });

    it('Then isLoading is false', () => {
      expect(useSpacesStore.getState().isLoading).toBe(false);
    });

    it('Then error is null', () => {
      expect(useSpacesStore.getState().error).toBeNull();
    });
  });

  describe('When setSpaces is called with a list of spaces', () => {
    it('Then spaces is updated', () => {
      useSpacesStore.getState().setSpaces([space1, space2]);
      expect(useSpacesStore.getState().spaces).toHaveLength(2);
    });
  });

  describe('When addSpace is called', () => {
    it('Then the new space is appended to the list', () => {
      useSpacesStore.getState().setSpaces([space1]);
      useSpacesStore.getState().addSpace(space2);
      expect(useSpacesStore.getState().spaces).toHaveLength(2);
      expect(useSpacesStore.getState().spaces[1].id).toBe('space-002');
    });
  });

  describe('When updateSpace is called with an existing space id', () => {
    it('Then the matching space is replaced', () => {
      useSpacesStore.getState().setSpaces([space1]);
      const updated: Space = { ...space1, name: 'Updated Name' };
      useSpacesStore.getState().updateSpace(updated);
      expect(useSpacesStore.getState().spaces[0].name).toBe('Updated Name');
    });

    it('Then no other space is affected', () => {
      useSpacesStore.getState().setSpaces([space1, space2]);
      const updated: Space = { ...space1, name: 'Updated Name' };
      useSpacesStore.getState().updateSpace(updated);
      expect(useSpacesStore.getState().spaces[1].name).toBe('Custom Room A');
    });
  });

  describe('When setLoading is called with true', () => {
    it('Then isLoading becomes true', () => {
      useSpacesStore.getState().setLoading(true);
      expect(useSpacesStore.getState().isLoading).toBe(true);
    });
  });

  describe('When setError is called with an error key', () => {
    it('Then error is set', () => {
      useSpacesStore.getState().setError('loadFailed');
      expect(useSpacesStore.getState().error).toBe('loadFailed');
    });
  });

  describe('When setError is called with null', () => {
    it('Then error is cleared', () => {
      useSpacesStore.getState().setError('loadFailed');
      useSpacesStore.getState().setError(null);
      expect(useSpacesStore.getState().error).toBeNull();
    });
  });

  describe('When reset is called', () => {
    it('Then all state returns to initial values', () => {
      useSpacesStore.getState().setSpaces([space1]);
      useSpacesStore.getState().setLoading(true);
      useSpacesStore.getState().setError('loadFailed');
      useSpacesStore.getState().reset();
      const { spaces, isLoading, error } = useSpacesStore.getState();
      expect(spaces).toEqual([]);
      expect(isLoading).toBe(false);
      expect(error).toBeNull();
    });
  });
});
