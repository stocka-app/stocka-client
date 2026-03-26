import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCapabilities, getFallbackLimits } from '../useCapabilities';
import type { UserTierLimits } from '@/features/authentication/types/authentication.types';

// ─── Mocks ──────────────────────────────────────────────────────────────────

let mockUser: { role?: string; tierLimits: UserTierLimits | null } | null = null;

vi.mock('@/features/authentication/store/authentication.store', () => ({
  useAuthenticationStore: (selector: (state: { user: typeof mockUser }) => unknown) =>
    selector({ user: mockUser }),
}));

const mockFetchCapabilities: Mock = vi.fn();

vi.mock('@/features/storages/api/storages.service', () => ({
  storagesService: {
    fetchCapabilities: (...args: unknown[]) => mockFetchCapabilities(...args),
  },
}));

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('Given the user has tierLimits in JWT claims', () => {
  beforeEach(() => {
    mockUser = {
      tierLimits: {
        tier: 'STARTER',
        maxCustomRooms: 3,
        maxStoreRooms: 3,
        maxWarehouses: 1,
      },
    };
    mockFetchCapabilities.mockClear();
  });

  describe('When useCapabilities is called', () => {
    it('Then it returns limits from JWT without making an API call', () => {
      const { result } = renderHook(() => useCapabilities());

      expect(result.current.limits).toEqual({
        CUSTOM_ROOM: 3,
        STORE_ROOM: 3,
        WAREHOUSE: 1,
      });
      expect(result.current.isLoading).toBe(false);
      expect(mockFetchCapabilities).not.toHaveBeenCalled();
    });
  });
});

describe('Given the user has no tierLimits in JWT claims', () => {
  beforeEach(() => {
    mockUser = { tierLimits: null };
    mockFetchCapabilities.mockClear();
  });

  describe('When the capabilities API responds successfully', () => {
    beforeEach(() => {
      mockFetchCapabilities.mockResolvedValue({
        tier: 'GROWTH',
        maxCustomRooms: 10,
        maxStoreRooms: 10,
        maxWarehouses: 10,
      });
    });

    it('Then it calls the API and returns limits from the response', async () => {
      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockFetchCapabilities).toHaveBeenCalledTimes(1);
      expect(result.current.limits).toEqual({
        CUSTOM_ROOM: 10,
        STORE_ROOM: 10,
        WAREHOUSE: 10,
      });
    });
  });

  describe('When the capabilities API fails', () => {
    beforeEach(() => {
      mockFetchCapabilities.mockRejectedValue(new Error('Network error'));
    });

    it('Then it returns fallback defaults from the hardcoded constant', async () => {
      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Fallback to FREE tier limits (since user has no tierLimits)
      expect(result.current.limits).toEqual({
        CUSTOM_ROOM: 1,
        STORE_ROOM: 1,
        WAREHOUSE: 0,
      });
    });
  });
});

describe('Given the user is null', () => {
  beforeEach(() => {
    mockUser = null;
    mockFetchCapabilities.mockClear();
    mockFetchCapabilities.mockRejectedValue(new Error('No user'));
  });

  describe('When useCapabilities is called', () => {
    it('Then it returns FREE tier fallback defaults', async () => {
      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.limits).toEqual({
        CUSTOM_ROOM: 1,
        STORE_ROOM: 1,
        WAREHOUSE: 0,
      });
    });
  });
});

describe('Given the user has a role but no tierLimits and the API fails', () => {
  beforeEach(() => {
    mockUser = { role: 'OWNER', tierLimits: null };
    mockFetchCapabilities.mockClear();
    mockFetchCapabilities.mockRejectedValue(new Error('Network error'));
  });

  describe('When the capabilities API is unavailable', () => {
    it('Then it uses the user role path and falls back to FREE tier limits', async () => {
      const { result } = renderHook(() => useCapabilities());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // user.tierLimits is null so tier is null → getFallbackLimits(null) → FREE
      expect(result.current.limits).toEqual({
        CUSTOM_ROOM: 1,
        STORE_ROOM: 1,
        WAREHOUSE: 0,
      });
    });
  });
});

describe('Given getFallbackLimits is called with an unrecognized tier string', () => {
  describe('When the tier is a value not in STORAGE_TIER_LIMITS', () => {
    it('Then it falls back to FREE tier limits', () => {
      const limits = getFallbackLimits('UNKNOWN_TIER');

      expect(limits).toEqual({
        CUSTOM_ROOM: 1,
        STORE_ROOM: 1,
        WAREHOUSE: 0,
      });
    });
  });

  describe('When the tier is a valid known tier string', () => {
    it('Then it returns the limits for that tier without using the fallback', () => {
      const limits = getFallbackLimits('GROWTH');

      expect(limits).toEqual({
        CUSTOM_ROOM: 10,
        STORE_ROOM: 10,
        WAREHOUSE: 10,
      });
    });
  });
});

describe('Given the user has ENTERPRISE tierLimits in JWT claims', () => {
  beforeEach(() => {
    mockUser = {
      tierLimits: {
        tier: 'ENTERPRISE',
        maxCustomRooms: -1,
        maxStoreRooms: -1,
        maxWarehouses: -1,
      },
    };
    mockFetchCapabilities.mockClear();
  });

  describe('When useCapabilities is called', () => {
    it('Then it returns unlimited (-1) for all storage types', () => {
      const { result } = renderHook(() => useCapabilities());

      expect(result.current.limits).toEqual({
        CUSTOM_ROOM: -1,
        STORE_ROOM: -1,
        WAREHOUSE: -1,
      });
      expect(result.current.isLoading).toBe(false);
    });
  });
});
