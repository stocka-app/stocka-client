import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSpacesStore } from '../../store/spaces.store';
import { mockSpaces } from '../../api/spaces.mock';

vi.mock('../../api/spaces.service', () => ({
  spacesService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    restore: vi.fn(),
  },
}));

import { useSpaces } from '../useSpaces';
import { spacesService } from '../../api/spaces.service';

function resetStore(): void {
  useSpacesStore.setState({ spaces: [], isLoading: false, error: null });
}

describe('Given useSpaces orchestrates space operations', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
    vi.mocked(spacesService.list).mockResolvedValue(mockSpaces);
  });

  describe('When the hook mounts', () => {
    it('Then it fetches spaces automatically', async () => {
      renderHook(() => useSpaces());
      await waitFor(() => {
        expect(vi.mocked(spacesService.list)).toHaveBeenCalledTimes(1);
      });
    });

    it('Then spaces are populated from the API', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => {
        expect(result.current.spaces).toHaveLength(mockSpaces.length);
      });
    });

    it('Then activeSpaces only includes ACTIVE spaces', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => {
        result.current.activeSpaces.forEach((s) => {
          expect(s.status).toBe('ACTIVE');
        });
      });
    });

    it('Then archivedSpaces only includes ARCHIVED spaces', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => {
        result.current.archivedSpaces.forEach((s) => {
          expect(s.status).toBe('ARCHIVED');
        });
      });
    });
  });

  describe('When fetchSpaces fails', () => {
    beforeEach(() => {
      vi.mocked(spacesService.list).mockRejectedValue(new Error('Network error'));
    });

    it('Then error is set to loadFailed', async () => {
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => {
        expect(result.current.error).toBe('loadFailed');
      });
    });
  });

  describe('When createSpace is called with valid data', () => {
    it('Then it calls the service and returns true on success', async () => {
      vi.mocked(spacesService.create).mockResolvedValue(mockSpaces[0]);
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.createSpace({
        name: 'New Space',
        type: 'CUSTOM_ROOM',
      });
      expect(success).toBe(true);
      expect(vi.mocked(spacesService.create)).toHaveBeenCalledTimes(1);
    });

    it('Then returns false when the service throws', async () => {
      vi.mocked(spacesService.create).mockRejectedValue(new Error('Save failed'));
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.createSpace({
        name: 'New Space',
        type: 'CUSTOM_ROOM',
      });
      expect(success).toBe(false);
    });
  });

  describe('When editSpace is called with a valid id and payload', () => {
    it('Then it calls the service and returns true on success', async () => {
      vi.mocked(spacesService.update).mockResolvedValue({ ...mockSpaces[0], name: 'Updated' });
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.editSpace('space-001', { name: 'Updated' });
      expect(success).toBe(true);
    });

    it('Then returns false when the service throws', async () => {
      vi.mocked(spacesService.update).mockRejectedValue(new Error('Update failed'));
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.editSpace('space-001', { name: 'Updated' });
      expect(success).toBe(false);
    });
  });

  describe('When archiveSpace is called with a valid id', () => {
    it('Then it calls the service and returns true on success', async () => {
      vi.mocked(spacesService.archive).mockResolvedValue({ ...mockSpaces[0], status: 'ARCHIVED' });
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.archiveSpace('space-001');
      expect(success).toBe(true);
    });

    it('Then returns false when the service throws', async () => {
      vi.mocked(spacesService.archive).mockRejectedValue(new Error('Archive failed'));
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.archiveSpace('space-001');
      expect(success).toBe(false);
    });
  });

  describe('When restoreSpace is called with a valid id', () => {
    it('Then it calls the service and returns true on success', async () => {
      vi.mocked(spacesService.restore).mockResolvedValue({ ...mockSpaces[2], status: 'ACTIVE' });
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.restoreSpace('space-003');
      expect(success).toBe(true);
    });

    it('Then returns false when the service throws', async () => {
      vi.mocked(spacesService.restore).mockRejectedValue(new Error('Restore failed'));
      const { result } = renderHook(() => useSpaces());
      await waitFor(() => expect(result.current.spaces.length).toBeGreaterThan(0));

      const success = await result.current.restoreSpace('space-003');
      expect(success).toBe(false);
    });
  });
});
