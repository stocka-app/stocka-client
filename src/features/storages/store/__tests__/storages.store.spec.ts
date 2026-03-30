import { beforeEach, describe, expect, it } from 'vitest';
import { useStoragesStore } from '../storages.store';
import type { Storage } from '../../types/storages.types';

const space1: Storage = {
  uuid: 'storage-001',
  name: 'Main Store Room',
  type: 'STORE_ROOM',
  status: 'ACTIVE',
  address: null,
  roomType: null,
  archivedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const space2: Storage = {
  uuid: 'storage-002',
  name: 'Custom Room A',
  type: 'CUSTOM_ROOM',
  status: 'ACTIVE',
  address: null,
  roomType: null,
  archivedAt: null,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

function resetStore(): void {
  useStoragesStore.setState({ storages: [], isLoading: false, error: null });
}

describe('Given the storages store manages storage state', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('When the store is in its initial state', () => {
    it('Then storages is an empty array', () => {
      expect(useStoragesStore.getState().storages).toEqual([]);
    });

    it('Then isLoading is false', () => {
      expect(useStoragesStore.getState().isLoading).toBe(false);
    });

    it('Then error is null', () => {
      expect(useStoragesStore.getState().error).toBeNull();
    });
  });

  describe('When setStorages is called with a list of storages', () => {
    it('Then storages is updated', () => {
      useStoragesStore.getState().setStorages([space1, space2]);
      expect(useStoragesStore.getState().storages).toHaveLength(2);
    });
  });

  describe('When addStorage is called', () => {
    it('Then the new storage is appended to the list', () => {
      useStoragesStore.getState().setStorages([space1]);
      useStoragesStore.getState().addStorage(space2);
      expect(useStoragesStore.getState().storages).toHaveLength(2);
      expect(useStoragesStore.getState().storages[1].uuid).toBe('storage-002');
    });
  });

  describe('When updateStorage is called with an existing storage id', () => {
    it('Then the matching storage is replaced', () => {
      useStoragesStore.getState().setStorages([space1]);
      const updated: Storage = { ...space1, name: 'Updated Name' };
      useStoragesStore.getState().updateStorage(updated);
      expect(useStoragesStore.getState().storages[0].name).toBe('Updated Name');
    });

    it('Then no other storage is affected', () => {
      useStoragesStore.getState().setStorages([space1, space2]);
      const updated: Storage = { ...space1, name: 'Updated Name' };
      useStoragesStore.getState().updateStorage(updated);
      expect(useStoragesStore.getState().storages[1].name).toBe('Custom Room A');
    });
  });

  describe('When setLoading is called with true', () => {
    it('Then isLoading becomes true', () => {
      useStoragesStore.getState().setLoading(true);
      expect(useStoragesStore.getState().isLoading).toBe(true);
    });
  });

  describe('When setError is called with an error key', () => {
    it('Then error is set', () => {
      useStoragesStore.getState().setError('loadFailed');
      expect(useStoragesStore.getState().error).toBe('loadFailed');
    });
  });

  describe('When setError is called with null', () => {
    it('Then error is cleared', () => {
      useStoragesStore.getState().setError('loadFailed');
      useStoragesStore.getState().setError(null);
      expect(useStoragesStore.getState().error).toBeNull();
    });
  });

  describe('When reset is called', () => {
    it('Then all state returns to initial values', () => {
      useStoragesStore.getState().setStorages([space1]);
      useStoragesStore.getState().setLoading(true);
      useStoragesStore.getState().setError('loadFailed');
      useStoragesStore.getState().reset();
      const { storages, isLoading, error } = useStoragesStore.getState();
      expect(storages).toEqual([]);
      expect(isLoading).toBe(true);
      expect(error).toBeNull();
    });
  });
});
