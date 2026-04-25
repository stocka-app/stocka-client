import type { Storage, StorageStatus } from '../types/storages.types';

interface SelectFallbackOptions {
  priorityOrder: StorageStatus[];
  sortBy: keyof Storage;
  direction: 'asc' | 'desc';
}

/**
 * Picks the best replacement for an active storage that is no longer available
 * (e.g. the user deleted it). Walks `priorityOrder` and returns the first
 * candidate that matches a status in the order, sorted by `sortBy` in the
 * requested direction. Returns null only if the tenant has no storages left.
 *
 * Pure function — does not touch the store, the network, or any side effect.
 */
export function selectFallbackStorage(
  storages: Storage[],
  options: SelectFallbackOptions,
): Storage | null {
  for (const status of options.priorityOrder) {
    const candidates = storages.filter((s) => s.status === status);
    if (candidates.length === 0) continue;

    const sorted = [...candidates].sort((a, b) => {
      const valueA = a[options.sortBy];
      const valueB = b[options.sortBy];
      if (valueA === null && valueB === null) return 0;
      if (valueA === null) return 1;
      if (valueB === null) return -1;
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return options.direction === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return options.direction === 'asc' ? valueA - valueB : valueB - valueA;
      }
      return 0;
    });

    return sorted[0];
  }
  return null;
}
