import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOfflineStatus } from '@/shared/hooks/useOfflineStatus';

describe('useOfflineStatus', () => {
  let onLineSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    onLineSpy = vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    onLineSpy.mockRestore();
  });

  describe('Given the browser starts online', () => {
    describe('When the hook subscribes', () => {
      it('Then it reports isOnline true and isOffline false', () => {
        const { result } = renderHook(() => useOfflineStatus());
        expect(result.current.isOnline).toBe(true);
        expect(result.current.isOffline).toBe(false);
      });
    });

    describe('When the browser fires the offline event', () => {
      it('Then the hook flips to isOffline true', () => {
        const { result } = renderHook(() => useOfflineStatus());

        act(() => {
          onLineSpy.mockReturnValue(false);
          window.dispatchEvent(new Event('offline'));
        });

        expect(result.current.isOffline).toBe(true);
        expect(result.current.isOnline).toBe(false);
      });
    });
  });

  describe('Given the browser starts offline', () => {
    beforeEach(() => {
      onLineSpy.mockReturnValue(false);
    });

    describe('When the hook subscribes', () => {
      it('Then it reports isOffline true and isOnline false', () => {
        const { result } = renderHook(() => useOfflineStatus());
        expect(result.current.isOffline).toBe(true);
        expect(result.current.isOnline).toBe(false);
      });
    });

    describe('When the browser fires the online event', () => {
      it('Then the hook flips to isOnline true', () => {
        const { result } = renderHook(() => useOfflineStatus());

        act(() => {
          onLineSpy.mockReturnValue(true);
          window.dispatchEvent(new Event('online'));
        });

        expect(result.current.isOnline).toBe(true);
        expect(result.current.isOffline).toBe(false);
      });
    });
  });

  describe('Given the consumer unmounts', () => {
    describe('When the unmount runs', () => {
      it('Then the online and offline window listeners are removed', () => {
        const removeListenerSpy = vi.spyOn(window, 'removeEventListener');
        const { unmount } = renderHook(() => useOfflineStatus());

        unmount();

        const removedEvents = removeListenerSpy.mock.calls.map(([event]) => event);
        expect(removedEvents).toContain('online');
        expect(removedEvents).toContain('offline');

        removeListenerSpy.mockRestore();
      });
    });
  });
});
