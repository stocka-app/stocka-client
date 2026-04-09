import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Storage, StoragesPage } from '../../types/storages.types';

// ── Mocks ─────────────────────────────────────────────────────────────

// i18n — use `<Trans>` fallback that expands `{{name}}` placeholders
// from the `values` prop and renders the given `components` inline.
// This is enough for the banner which uses `<Trans>` with `values`
// and a `<strong>` component slot.
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

const { mockListResult, mockRestoreResult } = vi.hoisted(() => ({
  mockListResult: { current: null as StoragesPage | Error | null },
  mockRestoreResult: { current: null as Storage | Error | null },
}));
vi.mock('../../api/storages.service', () => ({
  storagesService: {
    list: vi.fn(async () => {
      if (mockListResult.current instanceof Error) throw mockListResult.current;
      if (mockListResult.current === null) throw new Error('No mock set');
      return mockListResult.current;
    }),
    restore: vi.fn(async () => {
      if (mockRestoreResult.current instanceof Error) throw mockRestoreResult.current;
      if (mockRestoreResult.current === null) throw new Error('No mock set');
      return mockRestoreResult.current;
    }),
  },
}));

const { mockStoreState } = vi.hoisted(() => ({
  mockStoreState: {
    activeStorageId: null as string | null,
    updateStorage: vi.fn((_: Storage): void => undefined),
  },
}));
vi.mock('../../store/storages.store', () => ({
  useStoragesStore: (
    selector: (state: {
      activeStorageId: string | null;
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

function buildPage(items: Storage[]): StoragesPage {
  const summary = items.reduce(
    (acc, s) => ({
      active: acc.active + (s.status === 'ACTIVE' ? 1 : 0),
      frozen: acc.frozen + (s.status === 'FROZEN' ? 1 : 0),
      archived: acc.archived + (s.status === 'ARCHIVED' ? 1 : 0),
    }),
    { active: 0, frozen: 0, archived: 0 },
  );
  return {
    items,
    total: items.length,
    page: 1,
    limit: 100,
    totalPages: 1,
    summary,
    typeSummary: {
      WAREHOUSE: { active: 0, frozen: 0, archived: 0 },
      STORE_ROOM: { active: 0, frozen: 0, archived: 0 },
      CUSTOM_ROOM: { active: 0, frozen: 0, archived: 0 },
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════

describe('StorageStatusBanner', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockPermissions.current = new Set<string>(['STORAGE_READ']);
    mockStoreState.activeStorageId = null;
    mockStoreState.updateStorage = vi.fn();
    mockListResult.current = buildPage([activeStorage, frozenStorage, archivedStorage]);
    mockRestoreResult.current = null;
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
  // Fetch error path
  // ══════════════════════════════════════════════════════════════════

  describe('Given the initial fetch rejects with a network error', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockListResult.current = new Error('boom');
      mockStoreState.activeStorageId = 's-frozen';
    });

    it('Then the banner does not crash and renders nothing (no tenant data to resolve)', async () => {
      const { container } = render(<StorageStatusBanner />);
      await waitFor(() => {
        // The banner's isLoading flips to false on error and the component
        // returns null because `activeStorage` cannot be resolved from an
        // empty tenantStorages array.
        expect(container).toBeEmptyDOMElement();
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Cancel-on-unmount guard
  // ══════════════════════════════════════════════════════════════════

  describe('Given the component unmounts before the fetch resolves', () => {
    it('Then the cancel-on-unmount guard prevents state updates (resolved branch)', async () => {
      let resolveFetch: ((value: StoragesPage) => void) | null = null;
      const pending = new Promise<StoragesPage>((r) => {
        resolveFetch = r;
      });
      const { storagesService } = await import('../../api/storages.service');
      vi.mocked(storagesService.list).mockImplementationOnce(() => pending);

      const { unmount } = render(<StorageStatusBanner />);
      unmount();
      resolveFetch?.(buildPage([frozenStorage]));
      await pending;
    });

    it('Then the cancel-on-unmount guard prevents state updates (rejected branch)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let rejectFetch: ((reason: Error) => void) | null = null;
      const pending = new Promise<StoragesPage>((_, reject) => {
        rejectFetch = reject;
      });
      const { storagesService } = await import('../../api/storages.service');
      vi.mocked(storagesService.list).mockImplementationOnce(() => pending);

      const { unmount } = render(<StorageStatusBanner />);
      unmount();
      rejectFetch?.(new Error('boom'));
      await pending.catch(() => {});
      expect(consoleSpy).not.toHaveBeenCalled();
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
      let resolveRestore: ((value: Storage) => void) | null = null;
      const pending = new Promise<Storage>((r) => {
        resolveRestore = r;
      });
      const { storagesService } = await import('../../api/storages.service');
      vi.mocked(storagesService.restore).mockImplementationOnce(() => pending);

      render(<StorageStatusBanner />);
      const cta = await screen.findByRole('button', { name: 'banners.reactivate' });
      await user.click(cta);
      // Button is disabled → a second click cannot trigger the handler
      await waitFor(() => {
        expect(cta).toBeDisabled();
      });
      resolveRestore?.({ ...frozenStorage, status: 'ACTIVE', frozenAt: null });
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

    it('Then the banner does not render', async () => {
      render(<StorageStatusBanner />);
      // Let the fetch settle before asserting absence
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Given the active storage is null', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = null;
    });

    it('Then the banner does not render', async () => {
      render(<StorageStatusBanner />);
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Given the active storage is FROZEN (FE-BN2)', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-frozen';
    });

    it('Then the banner is rendered with role=status', async () => {
      render(<StorageStatusBanner />);
      expect(await screen.findByRole('status')).toBeInTheDocument();
    });

    it('Then the banner interpolates the storage name via `<Trans>`', async () => {
      render(<StorageStatusBanner />);
      expect(await screen.findByText('banners.frozen:Bodega Norte')).toBeInTheDocument();
    });

    it('Then the "Reactivar" CTA is shown (FE-BN5)', async () => {
      render(<StorageStatusBanner />);
      expect(await screen.findByRole('button', { name: 'banners.reactivate' })).toBeInTheDocument();
    });

    it('Then the X close button is shown with an aria-label (FE-BN6)', async () => {
      render(<StorageStatusBanner />);
      expect(await screen.findByRole('button', { name: 'banners.close' })).toBeInTheDocument();
    });
  });

  describe('Given the active storage is ARCHIVED (FE-BN3)', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-archived';
    });

    it('Then the banner is rendered', async () => {
      render(<StorageStatusBanner />);
      expect(await screen.findByRole('status')).toBeInTheDocument();
    });

    it('Then the banner interpolates the storage name via `<Trans>`', async () => {
      render(<StorageStatusBanner />);
      expect(await screen.findByText('banners.archived:Bodega Vieja')).toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Reactivate flow (FE-BN4)
  // ══════════════════════════════════════════════════════════════════

  describe('Given the banner is visible for a FROZEN storage', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-frozen';
      mockRestoreResult.current = {
        ...frozenStorage,
        status: 'ACTIVE',
        frozenAt: null,
      };
    });

    describe('When the user clicks "Reactivar"', () => {
      beforeEach(async () => {
        render(<StorageStatusBanner />);
        const cta = await screen.findByRole('button', { name: 'banners.reactivate' });
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

  describe('Given restoreStorage fails on the server', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 's-frozen';
      mockRestoreResult.current = new Error('server boom');
    });

    describe('When the user clicks "Reactivar"', () => {
      beforeEach(async () => {
        render(<StorageStatusBanner />);
        const cta = await screen.findByRole('button', { name: 'banners.reactivate' });
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
      const close = await screen.findByRole('button', { name: 'banners.close' });
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
      const close = await screen.findByRole('button', { name: 'banners.close' });
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
      const close = await screen.findByRole('button', { name: 'banners.close' });
      await user.click(close);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      // Simulate a full remount — unmount + mount
      first.unmount();
      cleanup();
      render(<StorageStatusBanner />);
      expect(await screen.findByRole('status')).toBeInTheDocument();
    });
  });
});
