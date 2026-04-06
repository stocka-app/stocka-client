import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

let mockTier: string | null = 'FREE';
vi.mock('@/store/rbac.store', () => ({
  useRBACStore: (selector: (s: { tier: string | null }) => unknown) =>
    selector({ tier: mockTier }),
}));

let mockTierLimits: { maxWarehouses: number; maxStoreRooms: number; maxCustomRooms: number } | null = null;
vi.mock('@/features/authentication/store/authentication.store', () => ({
  useAuthenticationStore: (selector: (s: { user: { tierLimits: typeof mockTierLimits } | null }) => unknown) =>
    selector({ user: mockTierLimits ? { tierLimits: mockTierLimits } : null }),
}));

const mockOpenModal = vi.fn();
vi.mock('@/store/upgrade-modal.store', () => ({
  useUpgradeModalStore: (selector: (s: { open: typeof mockOpenModal }) => unknown) =>
    selector({ open: mockOpenModal }),
}));

import { useTierCapabilities } from '../useTierCapabilities';

// ─────────────────────────────────────────────────────────────────────────────
// useTierCapabilities
// ─────────────────────────────────────────────────────────────────────────────

describe('Given a FREE tier tenant with no JWT tierLimits', () => {
  beforeEach(() => {
    mockTier = 'FREE';
    mockTierLimits = null;
  });

  it('Then warehouses are not allowed', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.isAllowed('warehouses')).toBe(false);
  });

  it('Then store rooms are allowed', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.isAllowed('storeRooms')).toBe(true);
  });

  it('Then custom rooms are allowed', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.isAllowed('customRooms')).toBe(true);
  });

  it('Then invitations are not allowed', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.isAllowed('invitations')).toBe(false);
  });

  it('Then storageLimits reflects FREE static map values', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.storageLimits).toEqual({ WAREHOUSE: 0, STORE_ROOM: 1, CUSTOM_ROOM: 1 });
  });

  it('Then tier is FREE', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.tier).toBe('FREE');
  });
});

describe('Given a FREE tier tenant with JWT tierLimits present', () => {
  beforeEach(() => {
    mockTier = 'FREE';
    mockTierLimits = { maxWarehouses: 0, maxStoreRooms: 1, maxCustomRooms: 1 };
  });

  it('Then JWT values override the static map for storage limits', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.storageLimits).toEqual({ WAREHOUSE: 0, STORE_ROOM: 1, CUSTOM_ROOM: 1 });
  });

  it('Then warehouses are still not allowed (limit 0)', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.isAllowed('warehouses')).toBe(false);
  });
});

describe('Given a STARTER tier tenant with JWT tierLimits', () => {
  beforeEach(() => {
    mockTier = 'STARTER';
    mockTierLimits = { maxWarehouses: 1, maxStoreRooms: 3, maxCustomRooms: 3 };
  });

  it('Then warehouses are allowed', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.isAllowed('warehouses')).toBe(true);
  });

  it('Then storageLimits reflects JWT values', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.storageLimits).toEqual({ WAREHOUSE: 1, STORE_ROOM: 3, CUSTOM_ROOM: 3 });
  });

  it('Then invitations are allowed', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.isAllowed('invitations')).toBe(true);
  });
});

describe('Given an ENTERPRISE tier tenant', () => {
  beforeEach(() => {
    mockTier = 'ENTERPRISE';
    mockTierLimits = { maxWarehouses: -1, maxStoreRooms: -1, maxCustomRooms: -1 };
  });

  it('Then all storage types are allowed', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.isAllowed('warehouses')).toBe(true);
    expect(result.current.isAllowed('storeRooms')).toBe(true);
    expect(result.current.isAllowed('customRooms')).toBe(true);
  });

  it('Then isAtLimit always returns false for unlimited features', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.isAtLimit('warehouses', 999)).toBe(false);
  });
});

describe('Given a tenant with unknown tier (null)', () => {
  beforeEach(() => {
    mockTier = null;
    mockTierLimits = null;
  });

  it('Then capabilities fall back to FREE', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.isAllowed('warehouses')).toBe(false);
    expect(result.current.storageLimits.WAREHOUSE).toBe(0);
  });
});

describe('Given any tier tenant', () => {
  beforeEach(() => {
    mockTier = 'STARTER';
    mockTierLimits = { maxWarehouses: 1, maxStoreRooms: 3, maxCustomRooms: 3 };
  });

  it('Then isAtLimit returns true when count equals the limit', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.isAtLimit('warehouses', 1)).toBe(true);
  });

  it('Then isAtLimit returns false when count is below the limit', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.isAtLimit('warehouses', 0)).toBe(false);
  });

  it('Then getLimit returns the JWT value for warehouses', () => {
    const { result } = renderHook(() => useTierCapabilities());
    expect(result.current.getLimit('warehouses')).toBe(1);
  });

  it('Then openUpgradeModal delegates to the upgrade modal store', () => {
    const { result } = renderHook(() => useTierCapabilities());
    result.current.openUpgradeModal('FEATURE_NOT_IN_TIER', 'WAREHOUSE');
    expect(mockOpenModal).toHaveBeenCalledWith('FEATURE_NOT_IN_TIER', 'WAREHOUSE');
  });
});
