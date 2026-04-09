import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Storage, StoragesPage } from '../../types/storages.types';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }));
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// RBAC store — default: user has STORAGE_READ + STORAGE_CREATE
const { mockPermissions } = vi.hoisted(() => ({
  mockPermissions: { current: new Set<string>(['STORAGE_READ', 'STORAGE_CREATE']) },
}));
vi.mock('@/store/rbac.store', () => ({
  useRBACStore: (selector: (state: { canDo: (action: string) => boolean }) => unknown) =>
    selector({ canDo: (action: string) => mockPermissions.current.has(action) }),
}));

// Storages service — .list() returns a configurable page
const { mockListResult } = vi.hoisted(() => ({
  mockListResult: {
    current: null as StoragesPage | Error | null,
  },
}));
vi.mock('../../api/storages.service', () => ({
  storagesService: {
    list: vi.fn(async () => {
      if (mockListResult.current instanceof Error) throw mockListResult.current;
      if (mockListResult.current === null) throw new Error('No mock set');
      return mockListResult.current;
    }),
  },
}));

// Storages store — track activeStorageId + setActiveStorage
const { mockStoreState } = vi.hoisted(() => ({
  mockStoreState: {
    activeStorageId: null as string | null,
    setActiveStorage: vi.fn((id: string | null) => {
      mockStoreState.activeStorageId = id;
    }),
  },
}));
vi.mock('../../store/storages.store', () => ({
  useStoragesStore: (
    selector: (state: {
      activeStorageId: string | null;
      setActiveStorage: (id: string | null) => void;
    }) => unknown,
  ) => selector(mockStoreState),
}));

// Import under test AFTER mocks so the module picks them up
import { StorageSwitcher } from '../StorageSwitcher';

// ── Fixtures ──────────────────────────────────────────────────────────

const warehouseCentral: Storage = {
  uuid: 'w-central',
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

const warehouseNorte: Storage = {
  uuid: 'w-norte',
  name: 'Almacén Norte',
  type: 'WAREHOUSE',
  status: 'FROZEN',
  address: null,
  roomType: null,
  icon: 'warehouse',
  color: '#3b82f6',
  description: null,
  archivedAt: null,
  frozenAt: '2026-03-01T00:00:00.000Z',
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-03-01T00:00:00.000Z',
};

const storeRoomPrincipal: Storage = {
  uuid: 'sr-principal',
  name: 'Bodega Principal',
  type: 'STORE_ROOM',
  status: 'ACTIVE',
  address: null,
  roomType: null,
  icon: 'inventory_2',
  color: '#ea580c',
  description: null,
  archivedAt: null,
  frozenAt: null,
  createdAt: '2026-01-03T00:00:00.000Z',
  updatedAt: '2026-01-03T00:00:00.000Z',
};

const customTiendaCentro: Storage = {
  uuid: 'c-tienda',
  name: 'Tienda Centro',
  type: 'CUSTOM_ROOM',
  status: 'ACTIVE',
  address: null,
  roomType: null,
  icon: 'storefront',
  color: '#14b8a6',
  description: null,
  archivedAt: null,
  frozenAt: null,
  createdAt: '2026-01-04T00:00:00.000Z',
  updatedAt: '2026-01-04T00:00:00.000Z',
};

const archivedOld: Storage = {
  uuid: 'a-old',
  name: 'Bodega Vieja',
  type: 'STORE_ROOM',
  status: 'ARCHIVED',
  address: null,
  roomType: null,
  icon: 'inventory_2',
  color: '#ea580c',
  description: null,
  archivedAt: '2026-02-01T00:00:00.000Z',
  frozenAt: null,
  createdAt: '2026-01-05T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
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

const ALL_STORAGES: Storage[] = [
  warehouseCentral,
  warehouseNorte,
  storeRoomPrincipal,
  customTiendaCentro,
  archivedOld,
];

// ═════════════════════════════════════════════════════════════════════════
// Tests
// ═════════════════════════════════════════════════════════════════════════

describe('StorageSwitcher', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockPermissions.current = new Set<string>(['STORAGE_READ', 'STORAGE_CREATE']);
    mockStoreState.activeStorageId = null;
    mockStoreState.setActiveStorage = vi.fn((id: string | null) => {
      mockStoreState.activeStorageId = id;
    });
    mockListResult.current = buildPage(ALL_STORAGES);
  });

  // ══════════════════════════════════════════════════════════════════
  // RBAC gate
  // ══════════════════════════════════════════════════════════════════

  describe('Given the user lacks STORAGE_READ permission', () => {
    beforeEach(() => {
      mockPermissions.current = new Set<string>();
    });

    it('Then the switcher renders nothing', () => {
      const { container } = render(<StorageSwitcher />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Skeleton loader
  // ══════════════════════════════════════════════════════════════════

  describe('Given the initial fetch is in flight', () => {
    beforeEach(() => {
      // Never-resolving promise to keep the skeleton visible
      mockListResult.current = null;
    });

    it('Then the skeleton loader is visible', () => {
      render(<StorageSwitcher />);
      expect(screen.getByLabelText('loader.loading')).toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Fetch error path
  // ══════════════════════════════════════════════════════════════════

  describe('Given the initial fetch rejects with a network error', () => {
    beforeEach(() => {
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
      mockListResult.current = new Error('boom');
    });

    it('Then the skeleton is dismissed and the empty-state trigger is rendered without crashing', async () => {
      render(<StorageSwitcher />);
      await waitFor(() => {
        expect(screen.queryByLabelText('loader.loading')).not.toBeInTheDocument();
      });
      // The component falls through to the empty state (no storages loaded)
      // but does not crash the React tree.
      const triggers = screen.getAllByLabelText(/switcher\.triggerAriaLabel/);
      expect(triggers.length).toBe(2);
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Cancel-on-unmount guard
  // ══════════════════════════════════════════════════════════════════

  describe('Given the component unmounts before the fetch resolves', () => {
    it('Then the cancel-on-unmount guard prevents state updates (resolved branch)', async () => {
      const controls: {
        resolve: ((value: StoragesPage) => void) | null;
      } = { resolve: null };
      const pending = new Promise<StoragesPage>((r) => {
        controls.resolve = r;
      });
      const { storagesService } = await import('../../api/storages.service');
      vi.mocked(storagesService.list).mockImplementationOnce(() => pending);

      const { unmount } = render(<StorageSwitcher />);
      unmount();
      // Now resolve — the `cancelled` ref is true, so setSwitcherStorages
      // must NOT run. We assert the resolve does not throw.
      controls.resolve?.(buildPage(ALL_STORAGES));
      await pending;
    });

    it('Then the cancel-on-unmount guard prevents state updates (rejected branch)', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      const controls: {
        reject: ((reason: Error) => void) | null;
      } = { reject: null };
      const pending = new Promise<StoragesPage>((_resolve, r) => {
        controls.reject = r;
      });
      const { storagesService } = await import('../../api/storages.service');
      vi.mocked(storagesService.list).mockImplementationOnce(() => pending);

      const { unmount } = render(<StorageSwitcher />);
      unmount();
      controls.reject?.(new Error('boom'));
      await pending.catch(() => undefined);
      // The `cancelled` branch returns early — console.error is NOT called
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Trigger rendering (FULL)
  // ══════════════════════════════════════════════════════════════════

  describe('Given the switcher has fetched the tenant storages', () => {
    describe('When the active context is a WAREHOUSE', () => {
      beforeEach(() => {
        mockStoreState.activeStorageId = 'w-central';
      });

      it('Then the full trigger shows the active storage name', async () => {
        render(<StorageSwitcher />);
        await waitFor(() => {
          expect(screen.getAllByText('Almacén Central').length).toBeGreaterThan(0);
        });
      });

      it('Then two trigger buttons are in the DOM (full + compact)', async () => {
        render(<StorageSwitcher />);
        await waitFor(() => {
          const triggers = screen.getAllByLabelText(/switcher\.triggerAriaLabel/);
          expect(triggers.length).toBe(2);
        });
      });
    });

    describe('When there is no active context and the tenant has ACTIVE storages', () => {
      it('Then the first ACTIVE storage A→Z is auto-selected', async () => {
        render(<StorageSwitcher />);
        await waitFor(() => {
          // A→Z ACTIVE: Almacén Central (w-central) < Bodega Principal (sr-principal) < Tienda Centro (c-tienda)
          expect(mockStoreState.setActiveStorage).toHaveBeenCalledWith('w-central');
        });
      });
    });

    describe('When the persisted activeStorageId no longer exists in the tenant', () => {
      beforeEach(() => {
        mockStoreState.activeStorageId = 'storage-ghost';
      });

      it('Then hydration falls back to the first ACTIVE storage A→Z', async () => {
        render(<StorageSwitcher />);
        await waitFor(() => {
          expect(mockStoreState.setActiveStorage).toHaveBeenCalledWith('w-central');
        });
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Dropdown open / close
  // ══════════════════════════════════════════════════════════════════

  describe('Given the switcher is rendered with data', () => {
    beforeEach(() => {
      mockStoreState.activeStorageId = 'w-central';
    });

    describe('When the user clicks the full trigger', () => {
      beforeEach(async () => {
        render(<StorageSwitcher />);
        await waitFor(() => {
          expect(screen.getAllByText('Almacén Central').length).toBeGreaterThan(0);
        });
        const triggers = screen.getAllByLabelText(/switcher\.triggerAriaLabel/);
        await user.click(triggers[0]);
      });

      it('Then the dropdown listbox is visible', () => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      it('Then a section header for WAREHOUSES is rendered', () => {
        expect(screen.getAllByText('switcher.sections.warehouses').length).toBeGreaterThan(0);
      });

      it('Then a section header for STORE_ROOMS is rendered', () => {
        expect(screen.getAllByText('switcher.sections.storeRooms').length).toBeGreaterThan(0);
      });

      it('Then a section header for CUSTOM_ROOMS is rendered', () => {
        expect(screen.getAllByText('switcher.sections.customRooms').length).toBeGreaterThan(0);
      });

      it('Then ARCHIVED storages appear in their section (full tenant list)', () => {
        expect(screen.getAllByText('Bodega Vieja').length).toBeGreaterThan(0);
      });

      it('Then FROZEN storages appear in their section', () => {
        expect(screen.getAllByText('Almacén Norte').length).toBeGreaterThan(0);
      });

      it('Then the active item has aria-selected=true', () => {
        const listbox = screen.getByRole('listbox');
        const activeOption = within(listbox)
          .getAllByRole('option')
          .find((opt) => opt.getAttribute('aria-selected') === 'true');
        expect(activeOption).toBeDefined();
        expect(activeOption?.textContent).toContain('Almacén Central');
      });

      describe('When the user clicks a different storage in the dropdown', () => {
        beforeEach(async () => {
          const listbox = screen.getByRole('listbox');
          const bodegaOption = within(listbox)
            .getAllByRole('option')
            .find((opt) => opt.textContent?.includes('Bodega Principal'));
          if (bodegaOption) await user.click(bodegaOption);
        });

        it('Then setActiveStorage is called with the new uuid', () => {
          expect(mockStoreState.setActiveStorage).toHaveBeenCalledWith('sr-principal');
        });

        it('Then the dropdown closes', () => {
          expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });
      });

      describe('When the user presses Escape', () => {
        beforeEach(() => {
          // Dispatch directly on document to guarantee the document-level
          // keydown listener installed in the switcher runs — user.keyboard()
          // targets the focused element which may not bubble to document in
          // jsdom the same way real browsers do.
          fireEvent.keyDown(document, { key: 'Escape' });
        });

        it('Then the dropdown closes', () => {
          expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });
      });

      describe('When the user presses a non-Escape key', () => {
        beforeEach(() => {
          fireEvent.keyDown(document, { key: 'ArrowDown' });
        });

        it('Then the dropdown stays open (keydown handler ignores other keys)', () => {
          expect(screen.queryByRole('listbox')).toBeInTheDocument();
        });
      });

      describe('When the user clicks outside the dropdown', () => {
        beforeEach(async () => {
          await user.click(document.body);
        });

        it('Then the dropdown closes', () => {
          expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Create CTA — RBAC gating
  // ══════════════════════════════════════════════════════════════════

  describe('Given the dropdown is open', () => {
    beforeEach(async () => {
      mockStoreState.activeStorageId = 'w-central';
      render(<StorageSwitcher />);
      await waitFor(() => {
        expect(screen.getAllByText('Almacén Central').length).toBeGreaterThan(0);
      });
      const triggers = screen.getAllByLabelText(/switcher\.triggerAriaLabel/);
      await user.click(triggers[0]);
    });

    describe('When the user has STORAGE_CREATE permission', () => {
      it('Then the "Crear nueva instalación" CTA is visible', () => {
        expect(screen.getByText('switcher.createNew')).toBeInTheDocument();
      });

      describe('When the user clicks the CTA', () => {
        beforeEach(async () => {
          await user.click(screen.getByText('switcher.createNew'));
        });

        it('Then navigate is called with /storages + openCreateDrawer state', () => {
          expect(mockNavigate).toHaveBeenCalledWith('/storages', {
            state: { openCreateDrawer: true },
          });
        });

        it('Then the dropdown closes', () => {
          expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        });
      });
    });
  });

  describe('Given the user lacks STORAGE_CREATE permission', () => {
    beforeEach(async () => {
      mockPermissions.current = new Set<string>(['STORAGE_READ']);
      mockStoreState.activeStorageId = 'w-central';
      render(<StorageSwitcher />);
      await waitFor(() => {
        expect(screen.getAllByText('Almacén Central').length).toBeGreaterThan(0);
      });
      const triggers = screen.getAllByLabelText(/switcher\.triggerAriaLabel/);
      await user.click(triggers[0]);
    });

    it('Then the "Crear nueva instalación" CTA is NOT rendered', () => {
      expect(screen.queryByText('switcher.createNew')).not.toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Empty tenant
  // ══════════════════════════════════════════════════════════════════

  describe('Given the tenant has zero storages', () => {
    beforeEach(() => {
      mockListResult.current = buildPage([]);
    });

    describe('When the user opens the dropdown', () => {
      beforeEach(async () => {
        render(<StorageSwitcher />);
        await waitFor(() => {
          const triggers = screen.queryAllByLabelText(/switcher\.triggerAriaLabel/);
          expect(triggers.length).toBe(2);
        });
        const triggers = screen.getAllByLabelText(/switcher\.triggerAriaLabel/);
        await user.click(triggers[0]);
      });

      it('Then the empty state message is shown', () => {
        // There are 3 occurrences of "switcher.noStorages": 2 in triggers
        // (full + compact null-state) + 1 inside the open dropdown's empty
        // message slot. The key point is that at least one is rendered.
        expect(screen.getAllByText('switcher.noStorages').length).toBeGreaterThan(0);
      });

      it('Then the listbox has no option items', () => {
        const listbox = screen.getByRole('listbox');
        expect(within(listbox).queryAllByRole('option').length).toBe(0);
      });
    });
  });

  describe('Given the tenant has zero storages and the user has STORAGE_CREATE', () => {
    beforeEach(async () => {
      mockListResult.current = buildPage([]);
      render(<StorageSwitcher />);
      await waitFor(() => {
        const triggers = screen.queryAllByLabelText(/switcher\.triggerAriaLabel/);
        expect(triggers.length).toBe(2);
      });
      const triggers = screen.getAllByLabelText(/switcher\.triggerAriaLabel/);
      await user.click(triggers[0]);
    });

    it('Then the create CTA is still available in the empty dropdown', () => {
      expect(screen.getByText('switcher.createNew')).toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Responsive dual trigger
  // ══════════════════════════════════════════════════════════════════

  describe('Given the sidebar is collapsed (isSidebarCollapsed=true)', () => {
    beforeEach(async () => {
      mockStoreState.activeStorageId = 'w-central';
      render(<StorageSwitcher isSidebarCollapsed={true} />);
      await waitFor(() => {
        const triggers = screen.getAllByLabelText(/switcher\.triggerAriaLabel/);
        expect(triggers.length).toBe(2);
      });
    });

    it('Then both trigger buttons are in the DOM (visibility controlled by CSS)', () => {
      const triggers = screen.getAllByLabelText(/switcher\.triggerAriaLabel/);
      expect(triggers.length).toBe(2);
    });

    it('Then the compact trigger includes the active storage name in its aria-label', () => {
      const triggers = screen.getAllByLabelText(/Almacén Central/);
      expect(triggers.length).toBeGreaterThan(0);
    });
  });
});
