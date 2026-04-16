import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void): () => void {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot(): boolean {
  return window.navigator.onLine;
}

function getServerSnapshot(): boolean {
  return true;
}

/**
 * Reports whether the browser has network connectivity. Backed by
 * `navigator.onLine` plus the `online` / `offline` window events via
 * `useSyncExternalStore`, so every consumer stays in sync across the tree.
 *
 * SSR-safe fallback: assumes online on the server (`getServerSnapshot`
 * returns `true`) to avoid false "offline" flashes during hydration.
 */
export function useOfflineStatus(): { isOnline: boolean; isOffline: boolean } {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { isOnline, isOffline: !isOnline };
}
