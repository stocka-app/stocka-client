import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Storage } from '../../types/storages.types';

// ── Mocks ─────────────────────────────────────────────────────────────

// i18n — use `<Trans>` fallback that expands `{{name}}` placeholders
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) =>
      options?.name ? `${key}:${options.name}` : key,
  }),
  Trans: ({
    i18nKey,
    values,
  }: {
    i18nKey: string;
    values?: { name?: string };
    components?: unknown;
  }) => <span>{`${i18nKey}:${values?.name ?? ''}`}</span>,
}));

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

const { mockPermissions } = vi.hoisted(() => ({
  mockPermissions: { current: new Set<string>(['STORAGE_READ']) },
}));
vi.mock('@/store/rbac.store', () => ({
  useRBACStore: (selector: (state: { canDo: (action: string) => boolean }) => unknown) =>
    selector({ canDo: (action: string) => mockPermissions.current.has(action) }),
}));

// storagesService — used by the banner for unfreeze + refetch (FROZEN path)
// and restore (ARCHIVED path).
const { mockUnfreezeResult, mockRestoreResult, mockListResult } = vi.hoisted(() => ({
  mockUnfreezeResult: { current: null as Error | null },
  mockRestoreResult: { current: null as Storage | Error | null },
  mockListResult: { current: null as { items: Storage[] } | Error | null },
}));
vi.mock('../../api/storages.service', () => ({
  storagesService: {
    unfreeze: vi.fn(async () => {
      if (mockUnfreezeResult.current instanceof Error) throw mockUnfreezeResult.current;
    }),
    restore: vi.fn(async () => {
      if (mockRestoreResult.current instanceof Error) throw mockRestoreResult.current;
      if (mockRestoreResult.current === null) throw new Error('No restore mock set');
      return mockRestoreResult.current;
    }),
    list: vi.fn(async () => {
      if (mockListResult.current instanceof Error) throw mockListResult.current;
      if (mockListResult.current === null) throw new Error('No list mock set');
      return mockListResult.current;
    }),
  },
}));

// storages store — the banner reads storages + isLoading from here
const { mockStoreState } = vi.hoisted(() => ({
  mockStoreState: {
    activeStorageId: null as string | null,
    storages: [] as Storage[],
    isLoading: false,
    updateStorage: vi.fn<(storage: Storage) => void>(),
  },
}));
vi.mock('../../store/storages.store', () => ({
  useStoragesStore: (
    selector: (state: {
      activeStorageId: string | null;
      storages: Storage[];
      isLoading: boolean;
      updateStorage: (s: Storage) => void;
    }) => unknown,
  ) => selector(mockStoreState),
}));

// Import under test AFTER mocks
import { StorageStatusBanner } from '../StorageStatusBanner';

// ── Fixtures ──────────────────────────────────────────────────────────

const activeStorage: Storage = {
  uuid: 's-active',
  name: 'Almacén Central',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: null,
  roomType: null,
  icon: 'warehouse',
  color: '#3b82f6',
  description: null,
  archivedAt: null,
  frozenAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const frozenStorage: Storage = {
  ...activeStorage,
  uuid: 's-frozen',
  name: 'Bodega Norte',
  status: 'FROZEN',
  frozenAt: '2026-03-01T00:00:00.000Z',
};

const archivedStorage: Storage = {
  ...activeStorage,
  uuid: 's-archived',
  name: 'Bodega Vieja',
  status: 'ARCHIVED',
  archivedAt: '2026-02-01T00:00:00.000Z',
};

// ═════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════

describe('StorageStatusBanner', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockPermissions.current = new Set<string>(['STORAGE_READ', 'STORAGE_UNFREEZE']);
    mockStoreState.activeStorageId = null;
    mockStoreState.storages = [activeStorage, frozenStorage, archivedStorage];
    mockStoreState.isLoading = false;
    mockStoreState.updateStorage = vi.fn();
    mockUnfreezeResult.current = null; // no error by default
    mockRestoreResult.current = null;
    mockListResult.current = { items: [frozenStorage] };
  });

  // ══════════════════════════════════════════════════════════════════
  // RBAC gate
  // ══════════════════════════════════════════════════════════════════

  describe('Given the user lacks STORAGE_READ permission', () => {
    beforeEach(() => {
      mockPermissions.current = new Set<string>();
    });

    it('Then the banner renders nothing (FE-BN0)', () => {
      const { container } = render(<StorageStatusBanner />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Loading state
  // ══════════════════════════════════════════════════════════════════

  describe('Given the store is in loading state', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-frozen';
      mockStoreState.isLoading = true;
    });

    it('Then the banner renders nothing while loading', () => {
      const { container } = render(<StorageStatusBanner />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('Given the initial fetch rejects with a network error', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      // Store has no storages (simulates fetch failure — store not populated)
      mockStoreState.storages = [];
      mockStoreState.activeStorageId = 's-frozen';
      mockStoreState.isLoading = false;
    });

    it('Then the banner does not crash and renders nothing (no tenant data to resolve)', () => {
      const { container } = render(<StorageStatusBanner />);
      // No matching storage in the store → banner returns null
      expect(container).toBeEmptyDOMElement();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Reactivate idempotency (disabled attribute)
  // ══════════════════════════════════════════════════════════════════

  describe('Given the user clicks Reactivate and the restore is in flight', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-frozen';
    });

    it('Then the button is disabled while the promise is pending', async () => {
      const controls: { resolve: (() => void) | null } = { resolve: null };
      const pending = new Promise<void>((r) => {
        controls.resolve = r;
      });
      const { storagesService } = await import('../../api/storages.service');
      vi.mocked(storagesService.unfreeze).mockImplementationOnce(() => pending);

      render(<StorageStatusBanner />);
      const cta = await screen.findByRole('button', { name: 'banners.reactivate' });
      await user.click(cta);
      await waitFor(() => {
        expect(cta).toBeDisabled();
      });
      controls.resolve?.();
      await pending;
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Status-based rendering (FE-BN1 → FE-BN3)
  // ══════════════════════════════════════════════════════════════════

  describe('Given the active storage is ACTIVE (FE-BN1)', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-active';
    });

    it('Then the banner does not render', () => {
      render(<StorageStatusBanner />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Given the active storage is null', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = null;
    });

    it('Then the banner does not render', () => {
      render(<StorageStatusBanner />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Given the active storage is FROZEN (FE-BN2)', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-frozen';
    });

    it('Then the banner is rendered with role=status', () => {
      render(<StorageStatusBanner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('Then the banner interpolates the storage name via `<Trans>`', () => {
      render(<StorageStatusBanner />);
      expect(screen.getByText('banners.frozen:Bodega Norte')).toBeInTheDocument();
    });

    it('Then the "Reactivar" CTA is shown (FE-BN5)', () => {
      render(<StorageStatusBanner />);
      expect(screen.getByRole('button', { name: 'banners.reactivate' })).toBeInTheDocument();
    });

    it('Then the X close button is shown with an aria-label (FE-BN6)', () => {
      render(<StorageStatusBanner />);
      expect(screen.getByRole('button', { name: 'banners.close' })).toBeInTheDocument();
    });
  });

  describe('Given the active storage is FROZEN but the user lacks STORAGE_UNFREEZE', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-frozen';
      mockPermissions.current = new Set<string>(['STORAGE_READ']);
    });

    it('Then the "Reactivar" CTA is NOT shown', () => {
      render(<StorageStatusBanner />);
      expect(screen.queryByRole('button', { name: 'banners.reactivate' })).not.toBeInTheDocument();
    });
  });

  describe('Given the active storage is ARCHIVED (FE-BN3)', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-archived';
    });

    it('Then the banner is rendered', () => {
      render(<StorageStatusBanner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('Then the banner interpolates the storage name via `<Trans>`', () => {
      render(<StorageStatusBanner />);
      expect(screen.getByText('banners.archived:Bodega Vieja')).toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Reactivate flow — FROZEN path (FE-BN4)
  // ══════════════════════════════════════════════════════════════════

  describe('Given the banner is visible for a FROZEN storage', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-frozen';
      // unfreeze succeeds (no error)
      mockUnfreezeResult.current = null;
      // list refetch returns the now-active storage
      mockListResult.current = {
        items: [{ ...frozenStorage, status: 'ACTIVE', frozenAt: null }],
      };
    });

    describe('When the user clicks "Reactivar"', () => {
      beforeEach(async () => {
        render(<StorageStatusBanner />);
        const cta = screen.getByRole('button', { name: 'banners.reactivate' });
        await user.click(cta);
      });

      it('Then the store updateStorage action is called with the restored storage', async () => {
        await waitFor(() => {
          expect(mockStoreState.updateStorage).toHaveBeenCalled();
        });
        const call = mockStoreState.updateStorage.mock.calls[0][0];
        expect(call.uuid).toBe('s-frozen');
        expect(call.status).toBe('ACTIVE');
      });

      it('Then a success toast is shown', async () => {
        await waitFor(() => {
          expect(mockToastSuccess).toHaveBeenCalled();
        });
      });
    });
  });

  describe('Given the banner is visible for a FROZEN storage and the refetch cannot find the item', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-frozen';
      mockUnfreezeResult.current = null;
      // Refetch succeeds but the updated item is not in the result (e.g. filtered out)
      mockListResult.current = { items: [] };
    });

    describe('When the user clicks "Reactivar"', () => {
      it('Then updateStorage is NOT called (no matching item found in refetch)', async () => {
        render(<StorageStatusBanner />);
        const cta = screen.getByRole('button', { name: 'banners.reactivate' });
        await user.click(cta);
        await waitFor(() => {
          expect(mockToastSuccess).toHaveBeenCalled();
        });
        expect(mockStoreState.updateStorage).not.toHaveBeenCalled();
      });
    });
  });

  describe('Given restoreStorage fails on the server (FROZEN path)', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-frozen';
      mockUnfreezeResult.current = new Error('server boom');
    });

    describe('When the user clicks "Reactivar"', () => {
      beforeEach(async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        render(<StorageStatusBanner />);
        const cta = screen.getByRole('button', { name: 'banners.reactivate' });
        await user.click(cta);
      });

      it('Then an error toast is shown', async () => {
        await waitFor(() => {
          expect(mockToastError).toHaveBeenCalled();
        });
      });

      it('Then the store is NOT updated', () => {
        expect(mockStoreState.updateStorage).not.toHaveBeenCalled();
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Reactivate flow — ARCHIVED path
  // ══════════════════════════════════════════════════════════════════

  describe('Given the banner is visible for an ARCHIVED storage', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-archived';
      mockRestoreResult.current = { ...archivedStorage, status: 'ACTIVE', archivedAt: null };
    });

    describe('When the user clicks "Reactivar"', () => {
      beforeEach(async () => {
        render(<StorageStatusBanner />);
        const cta = screen.getByRole('button', { name: 'banners.reactivate' });
        await user.click(cta);
      });

      it('Then the store updateStorage action is called with the restored storage', async () => {
        await waitFor(() => {
          expect(mockStoreState.updateStorage).toHaveBeenCalled();
        });
        const call = mockStoreState.updateStorage.mock.calls[0][0];
        expect(call.uuid).toBe('s-archived');
        expect(call.status).toBe('ACTIVE');
      });

      it('Then a success toast is shown', async () => {
        await waitFor(() => {
          expect(mockToastSuccess).toHaveBeenCalled();
        });
      });
    });
  });

  describe('Given restore fails for an ARCHIVED storage', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-archived';
      mockRestoreResult.current = new Error('restore boom');
    });

    describe('When the user clicks "Reactivar"', () => {
      beforeEach(async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        render(<StorageStatusBanner />);
        const cta = screen.getByRole('button', { name: 'banners.reactivate' });
        await user.click(cta);
      });

      it('Then an error toast is shown', async () => {
        await waitFor(() => {
          expect(mockToastError).toHaveBeenCalled();
        });
      });

      it('Then the store is NOT updated', () => {
        expect(mockStoreState.updateStorage).not.toHaveBeenCalled();
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Dismiss (FE-BN7 / FE-BN8)
  // ══════════════════════════════════════════════════════════════════

  describe('Given the banner is visible and the user dismisses it', () => {
    beforeEach(async () => {
      mockStoreState.activeStorageId = 's-frozen';
      render(<StorageStatusBanner />);
      const close = screen.getByRole('button', { name: 'banners.close' });
      await user.click(close);
    });

    it('Then the banner disappears (FE-BN7)', () => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Given the user dismissed the banner and then switches the active context', () => {
    beforeEach(async () => {
      mockStoreState.activeStorageId = 's-frozen';
      const { rerender } = render(<StorageStatusBanner />);
      const close = screen.getByRole('button', { name: 'banners.close' });
      await user.click(close);
      // Now the user switches context to another non-operational storage
      mockStoreState.activeStorageId = 's-archived';
      rerender(<StorageStatusBanner />);
    });

    it('Then the banner re-appears for the new context (dismissed flag resets)', async () => {
      expect(await screen.findByRole('status')).toBeInTheDocument();
    });
  });

  describe('Given the user dismissed and then the component is re-mounted (FE-BN8)', () => {
    it('Then the banner reappears on fresh mount — close does NOT persist', async () => {
      mockStoreState.activeStorageId = 's-frozen';
      const first = render(<StorageStatusBanner />);
      const close = screen.getByRole('button', { name: 'banners.close' });
      await user.click(close);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      // Simulate a full remount — unmount + mount
      first.unmount();
      cleanup();
      render(<StorageStatusBanner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
