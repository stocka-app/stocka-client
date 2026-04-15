import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StoragesPage from '../StoragesPage';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

// react-router-dom — the page uses `useLocation`/`useNavigate` to auto-open
// the create drawer when navigated from the sidebar StorageSwitcher with
// router state `{ openCreateDrawer: true }`. Mock both so the component
// renders without a real Router wrapper. Individual tests can override
// `mockLocationState` to simulate the navigation intent.
const { mockLocationState, mockNavigate } = vi.hoisted(() => ({
  mockLocationState: { current: null as { openCreateDrawer?: boolean } | null },
  mockNavigate: vi.fn(),
}));
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/storages', state: mockLocationState.current }),
  useNavigate: () => mockNavigate,
}));

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));
vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}));

const { mockCanDo } = vi.hoisted(() => ({
  mockCanDo: vi.fn<(action: string) => boolean>(() => true),
}));

vi.mock('@/store/rbac.store', () => ({
  useRBACStore: () => ({
    canDo: mockCanDo,
    tier: 'STARTER',
  }),
}));

const { mockOpenUpgradeModal, mockIsAllowed } = vi.hoisted(() => ({
  mockOpenUpgradeModal: vi.fn(),
  mockIsAllowed: vi.fn<(feature: string) => boolean>(() => true),
}));

type MockStorage = { uuid: string; name: string; type: string; status: string };

const mocks = vi.hoisted(() => ({
  storages: [] as MockStorage[],
  sortedStorages: null as MockStorage[] | null,
  activeStorageId: null as string | null,
  activeStorages: [] as MockStorage[],
  frozenStorages: [] as MockStorage[],
  archivedStorages: [] as MockStorage[],
  summary: { active: 0, frozen: 0, archived: 0 },
  typeCounts: { WAREHOUSE: 0, STORE_ROOM: 0, CUSTOM_ROOM: 0, total: 0 },
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null as string | null,
  filterStatus: null as string | null,
  filterType: null as string | null,
  searchQuery: '',
  sortOrder: 'ASC' as string,
  canCreate: true,
  isGated: false,
}));

const {
  mockFetchStorages,
  mockSetFilterType,
  mockSetSearchQuery,
  mockSetFilterStatus,
  mockSetSortOrder,
  mockSetPage,
  mockCreateStorage,
  mockCreateWarehouse,
  mockCreateStoreRoom,
  mockCreateCustomRoom,
  mockEditStorage,
  mockArchiveStorage,
  mockRestoreStorage,
  mockFreezeStorage,
  mockUnfreezeStorage,
  mockGetIsLastActive,
  mockChangeStorageType,
} = vi.hoisted(() => ({
  mockFetchStorages: vi.fn(),
  mockSetFilterType: vi.fn(),
  mockSetSearchQuery: vi.fn(),
  mockSetFilterStatus: vi.fn(),
  mockSetSortOrder: vi.fn(),
  mockSetPage: vi.fn(),
  mockCreateStorage: vi.fn().mockResolvedValue(true),
  mockCreateWarehouse: vi.fn().mockResolvedValue({ error: null }),
  mockCreateStoreRoom: vi.fn().mockResolvedValue({ error: null }),
  mockCreateCustomRoom: vi.fn().mockResolvedValue({ error: null }),
  mockEditStorage: vi.fn().mockResolvedValue(true),
  mockArchiveStorage: vi.fn().mockResolvedValue(true),
  mockRestoreStorage: vi.fn().mockResolvedValue(true),
  mockFreezeStorage: vi.fn().mockResolvedValue(true),
  mockUnfreezeStorage: vi.fn().mockResolvedValue(true),
  mockGetIsLastActive: vi.fn().mockReturnValue(false),
  mockChangeStorageType: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock('../../hooks/useStorages', () => ({
  useStorages: () => ({
    storages: mocks.storages,
    sortedStorages: mocks.sortedStorages ?? mocks.storages,
    activeStorageId: mocks.activeStorageId,
    activeStorage:
      mocks.activeStorageId !== null
        ? mocks.storages.find((s) => s.uuid === mocks.activeStorageId) ?? null
        : null,
    setActiveStorage: vi.fn(),
    hydrateActiveStorage: vi.fn(),
    activeStorages: mocks.activeStorages,
    frozenStorages: mocks.frozenStorages,
    archivedStorages: mocks.archivedStorages,
    summary: mocks.summary,
    typeCounts: mocks.typeCounts,
    total: mocks.total,
    page: mocks.page,
    totalPages: mocks.totalPages,
    isLoading: mocks.isLoading,
    error: mocks.error,
    filterStatus: mocks.filterStatus,
    filterType: mocks.filterType,
    searchQuery: mocks.searchQuery,
    sortOrder: mocks.sortOrder,
    setFilterStatus: mockSetFilterStatus,
    setFilterType: mockSetFilterType,
    setSearchQuery: mockSetSearchQuery,
    setSortOrder: mockSetSortOrder,
    setPage: mockSetPage,
    canCreate: mocks.canCreate,
    isGated: mocks.isGated,
    canFreeze: true,
    canUnfreeze: true,
    fetchStorages: mockFetchStorages,
    createStorage: mockCreateStorage,
    createWarehouse: mockCreateWarehouse,
    createStoreRoom: mockCreateStoreRoom,
    createCustomRoom: mockCreateCustomRoom,
    editStorage: mockEditStorage,
    archiveStorage: mockArchiveStorage,
    restoreStorage: mockRestoreStorage,
    freezeStorage: mockFreezeStorage,
    unfreezeStorage: mockUnfreezeStorage,
    getIsLastActive: mockGetIsLastActive,
    changeStorageType: mockChangeStorageType,
  }),
}));

vi.mock('../../components/CreateStorageDrawer', () => ({
  CreateStorageDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-storage-drawer" /> : null,
}));

vi.mock('@/shared/hooks/useTierCapabilities', () => ({
  useTierCapabilities: () => ({
    storageLimits: { WAREHOUSE: 2, STORE_ROOM: 3, CUSTOM_ROOM: -1 },
    isAllowed: mockIsAllowed,
    openUpgradeModal: mockOpenUpgradeModal,
  }),
  STORAGE_TYPE_TO_FEATURE: {
    WAREHOUSE: 'warehouses',
    STORE_ROOM: 'storeRooms',
    CUSTOM_ROOM: 'customRooms',
  },
}));

vi.mock('@/shared/components/TierUpgradeState', () => ({
  TierUpgradeState: ({ feature, onBack }: { feature: string; onBack?: () => void }) => (
    <div data-testid="tier-upgrade-state">
      <span>{feature}</span>
      {onBack && <button onClick={onBack}>back</button>}
    </div>
  ),
}));

const { mockDestroy } = vi.hoisted(() => ({
  mockDestroy: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../api/storages.service', () => ({
  storagesService: { destroy: mockDestroy },
}));

/** Stub child components — capture props for integration testing */
let storageCardInstances: Array<{ storage: Record<string, unknown>; canEdit?: boolean; canArchive?: boolean; canFreeze?: boolean; canUnfreeze?: boolean; canRestore?: boolean; canDelete?: boolean; onEdit?: (s: unknown) => void; onArchive?: (s: unknown) => void; onRestore?: (s: unknown) => Promise<void>; onDelete?: (s: unknown) => Promise<void> }> = [];
vi.mock('../../components/StorageCard', () => ({
  StorageCard: (props: Record<string, unknown>) => {
    storageCardInstances.push(props as typeof storageCardInstances[number]);
    return <div data-testid={`storage-card-${(props.storage as { uuid: string }).uuid}`}>{(props.storage as { name: string }).name}</div>;
  },
}));

let createEditModalProps: Record<string, unknown> = {};
vi.mock('../../components/CreateEditStorageModal', () => ({
  CreateEditStorageModal: (props: Record<string, unknown>) => {
    createEditModalProps = props;
    return props.open ? <div data-testid="create-edit-modal">Modal</div> : null;
  },
}));

vi.mock('../../components/EditStorageDrawer', () => ({
  EditStorageDrawer: (props: Record<string, unknown>) => {
    createEditModalProps = props;
    return props.open ? <div data-testid="create-edit-modal">Modal</div> : null;
  },
}));

let archiveModalProps: Record<string, unknown> = {};
vi.mock('../../components/ArchiveConfirmDialog', () => ({
  ArchiveConfirmDialog: (props: Record<string, unknown>) => {
    archiveModalProps = props;
    return props.open ? <div data-testid="archive-modal">ArchiveConfirmDialog</div> : null;
  },
}));

vi.mock('../../components/FreezeConfirmDialog', () => ({
  FreezeConfirmDialog: () => <div data-testid="freeze-confirm-dialog" />,
}));

vi.mock('@/shared/components/StateComposition', () => ({
  StateComposition: ({ title, actions }: { title: string; description?: string; icon?: string; variant?: string; actions?: React.ReactNode; cards?: unknown[] }) => (
    <div data-testid="state-composition">
      <span>{title}</span>
      {actions}
    </div>
  ),
}));

vi.mock('@/shared/components/DoubleRingSpinner', () => ({
  DoubleRingSpinner: () => <div data-testid="spinner">Loading...</div>,
}));

vi.mock('@/shared/components/ProgressBar', () => ({
  ProgressBar: () => <div data-testid="progress-bar" />,
}));

vi.mock('@/shared/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; variant?: string; size?: string }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────

function setSuccessState(overrides: Partial<typeof mocks> = {}) {
  mocks.storages = overrides.storages ?? [
    { uuid: '1', name: 'Bodega Central', type: 'WAREHOUSE', status: 'ACTIVE' },
    { uuid: '2', name: 'Almacen Norte', type: 'STORE_ROOM', status: 'ACTIVE' },
    { uuid: '3', name: 'Sala Fria', type: 'CUSTOM_ROOM', status: 'FROZEN' },
  ];
  mocks.activeStorages = overrides.activeStorages ?? mocks.storages.filter(s => s.status === 'ACTIVE');
  mocks.frozenStorages = overrides.frozenStorages ?? mocks.storages.filter(s => s.status === 'FROZEN');
  mocks.archivedStorages = overrides.archivedStorages ?? mocks.storages.filter(s => s.status === 'ARCHIVED');
  mocks.summary = overrides.summary ?? {
    active: mocks.activeStorages.length,
    frozen: mocks.frozenStorages.length,
    archived: mocks.archivedStorages.length,
  };
  const countByType = (type: string) => mocks.storages.filter(s => s.type === type).length;
  mocks.typeCounts = overrides.typeCounts ?? {
    WAREHOUSE: countByType('WAREHOUSE'),
    STORE_ROOM: countByType('STORE_ROOM'),
    CUSTOM_ROOM: countByType('CUSTOM_ROOM'),
    total: mocks.storages.length,
  };
  mocks.total = overrides.total ?? mocks.storages.length;
  Object.assign(mocks, overrides);
}

describe('StoragesPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mockCanDo.mockReturnValue(true);
    mocks.storages = [];
    mocks.sortedStorages = null;
    mocks.activeStorageId = null;
    mocks.activeStorages = [];
    mocks.frozenStorages = [];
    mocks.archivedStorages = [];
    mocks.summary = { active: 0, frozen: 0, archived: 0 };
    mocks.typeCounts = { WAREHOUSE: 0, STORE_ROOM: 0, CUSTOM_ROOM: 0, total: 0 };
    mocks.total = 0;
    mocks.page = 1;
    mocks.totalPages = 1;
    mocks.isLoading = false;
    mocks.error = null;
    mocks.filterStatus = null;
    mocks.filterType = null;
    mocks.searchQuery = '';
    mocks.sortOrder = 'ASC';
    mocks.canCreate = true;
    mockIsAllowed.mockReturnValue(true);
    storageCardInstances = [];
    createEditModalProps = {};
    archiveModalProps = {};
  });

  // ══════════════════════════════════════════════════════════════════
  // STATE 1: SKELETON (first load)
  // ══════════════════════════════════════════════════════════════════

  describe('Given the page is loading for the first time', () => {
    beforeEach(() => {
      mocks.isLoading = true;
      render(<StoragesPage />);
    });

    it('should show the progress bar', () => {
      expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    });

    it('should show skeleton placeholders', () => {
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not show storage cards', () => {
      expect(screen.queryByTestId(/^storage-card-/)).not.toBeInTheDocument();
    });

    it('should not show the error state', () => {
      expect(screen.queryByTestId('state-composition')).not.toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // STATE 2: LOADER OVERLAY (subsequent loads with existing data)
  // ══════════════════════════════════════════════════════════════════

  describe('Given the page is loading with existing data (overlay spinner)', () => {
    beforeEach(() => {
      // First render with data — sets everHadDataRef.current = true inside the component
      setSuccessState();
      const { rerender } = render(<StoragesPage />);

      // Second render on same instance: loading again with same data.
      // rerender preserves the component's useRef so hadData stays true.
      mocks.isLoading = true;
      setSuccessState();
      rerender(<StoragesPage />);
    });

    it('should show the spinner overlay', () => {
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('should still show storage cards (dimmed behind overlay)', () => {
      expect(screen.getByTestId('storage-card-1')).toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // STATE 3: ERROR
  // ══════════════════════════════════════════════════════════════════

  describe('Given there is an error', () => {
    beforeEach(() => {
      mocks.error = 'Network error';
      render(<StoragesPage />);
    });

    it('should show the page title', () => {
      expect(screen.getByText('page.title')).toBeInTheDocument();
    });

    it('should show the page subtitle', () => {
      expect(screen.getByText('page.subtitle')).toBeInTheDocument();
    });

    it('should show the error state composition', () => {
      expect(screen.getByTestId('state-composition')).toHaveTextContent('error.title');
    });

    it('should show a retry button', () => {
      expect(screen.getByRole('button', { name: /error\.retry/ })).toBeInTheDocument();
    });

    it('should show a get help button', () => {
      expect(screen.getByRole('button', { name: /error\.getHelp/ })).toBeInTheDocument();
    });

    it('should show the type tabs in disabled state', () => {
      expect(screen.getByText('tabs.all')).toBeInTheDocument();
      expect(screen.getByText('tabs.warehouses')).toBeInTheDocument();
    });

    it('should call fetchStorages when retry is clicked', async () => {
      await user.click(screen.getByRole('button', { name: /error\.retry/ }));
      expect(mockFetchStorages).toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // STATE 4: EMPTY (no storages ever)
  // ══════════════════════════════════════════════════════════════════

  describe('Given there are no storages and no filters', () => {
    beforeEach(() => {
      mocks.total = 0;
      render(<StoragesPage />);
    });

    it('should show the empty state', () => {
      expect(screen.getByTestId('state-composition')).toHaveTextContent('empty.title');
    });

    it('should show the create first button when canCreate is true', () => {
      expect(screen.getByRole('button', { name: /empty\.createFirst/ })).toBeInTheDocument();
    });

    it('should show the what is storage link', () => {
      expect(screen.getByText('empty.whatIsStorage')).toBeInTheDocument();
    });
  });

  describe('Given there are no storages and user cannot create', () => {
    beforeEach(() => {
      mocks.total = 0;
      mocks.canCreate = false;
      render(<StoragesPage />);
    });

    it('should not show the create first button', () => {
      expect(screen.queryByText('empty.createFirst')).not.toBeInTheDocument();
    });
  });

  // ── Empty state: create first click opens drawer ─────────────────

  describe('Given the user clicks create first in empty state', () => {
    beforeEach(async () => {
      mocks.total = 0;
      render(<StoragesPage />);
      await user.click(screen.getByRole('button', { name: /empty\.createFirst/ }));
    });

    it('Then the create storage drawer opens', () => {
      expect(screen.getByTestId('create-storage-drawer')).toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // STATE 5: NO RESULTS (filtered empty)
  // ══════════════════════════════════════════════════════════════════

  describe('Given filters produce no results with search query', () => {
    beforeEach(() => {
      mocks.searchQuery = 'xyz';
      mocks.total = 5; // total > 0 means storages exist, but filtered is empty
      render(<StoragesPage />);
    });

    it('should show the no results state', () => {
      expect(screen.getByTestId('state-composition')).toHaveTextContent('empty.noResults');
    });

    it('should show the clear search button', () => {
      expect(screen.getByRole('button', { name: /empty\.clearSearch/ })).toBeInTheDocument();
    });

    it('should show the view all button', () => {
      expect(screen.getByRole('button', { name: /empty\.viewAll/ })).toBeInTheDocument();
    });

    it('should call clear filters when clear search is clicked', async () => {
      await user.click(screen.getByRole('button', { name: /empty\.clearSearch/ }));
      expect(mockSetFilterStatus).toHaveBeenCalledWith(null);
      expect(mockSetFilterType).toHaveBeenCalledWith(null);
      expect(mockSetSearchQuery).toHaveBeenCalledWith('');
    });
  });

  describe('Given a filter type is active but no search query, producing no results', () => {
    beforeEach(() => {
      mocks.filterType = 'WAREHOUSE';
      mocks.total = 5;
      render(<StoragesPage />);
    });

    it('should show the no type results message', () => {
      expect(screen.getByTestId('state-composition')).toHaveTextContent('empty.noTypeResults');
    });
  });

  // ── No results: type tab clicks in this state ─────────────────────

  describe('Given the no-results state shows type tabs', () => {
    beforeEach(async () => {
      mocks.searchQuery = 'xyz';
      mocks.total = 5;
      render(<StoragesPage />);
      // Click a type tab in the no-results view
      const tabs = screen.getAllByRole('button');
      const warehouseTab = tabs.find(b => b.textContent?.includes('tabs.warehouses'));
      if (warehouseTab) await user.click(warehouseTab);
    });

    it('should call setFilterType', () => {
      expect(mockSetFilterType).toHaveBeenCalledWith('WAREHOUSE');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // STATE 6: SUCCESS with storages
  // ══════════════════════════════════════════════════════════════════

  describe('Given storages are loaded', () => {
    beforeEach(() => {
      setSuccessState();
      render(<StoragesPage />);
    });

    it('should show the page title', () => {
      expect(screen.getByText('page.title')).toBeInTheDocument();
    });

    it('should show the page subtitle', () => {
      expect(screen.getByText('page.subtitle')).toBeInTheDocument();
    });

    it('should render all storage cards', () => {
      expect(screen.getByTestId('storage-card-1')).toHaveTextContent('Bodega Central');
      expect(screen.getByTestId('storage-card-2')).toHaveTextContent('Almacen Norte');
      expect(screen.getByTestId('storage-card-3')).toHaveTextContent('Sala Fria');
    });

    it('should show the create button in the header', () => {
      expect(screen.getByText('actions.create')).toBeInTheDocument();
    });

    it('should show the inline create card', () => {
      expect(screen.getByText('actions.createInline')).toBeInTheDocument();
    });

    it('should show the type tab pills', () => {
      expect(screen.getByText(/tabs\.all/)).toBeInTheDocument();
      expect(screen.getByText(/tabs\.warehouses/)).toBeInTheDocument();
      expect(screen.getByText(/tabs\.storeRooms/)).toBeInTheDocument();
      expect(screen.getByText(/tabs\.customRooms/)).toBeInTheDocument();
    });

    it('should show the search bar', () => {
      expect(screen.getByPlaceholderText('controls.search')).toBeInTheDocument();
    });

    it('should show the status filter dropdown', () => {
      expect(screen.getByText('controls.allStatuses')).toBeInTheDocument();
    });

    it('should show the sort toggle with A to Z', () => {
      expect(screen.getByText(/A → Z/)).toBeInTheDocument();
    });

    it('should show the stats bar with active count', () => {
      expect(screen.getByText('stats.active')).toBeInTheDocument();
    });

    it('should show the stats bar with frozen count', () => {
      expect(screen.getByText('stats.frozen')).toBeInTheDocument();
    });
  });

  // ── Header create button ──────────────────────────────────────────

  describe('Given the user clicks the header create button', () => {
    beforeEach(async () => {
      setSuccessState();
      render(<StoragesPage />);
      await user.click(screen.getByText('actions.create'));
    });

    it('Then the create storage drawer opens', () => {
      expect(screen.getByTestId('create-storage-drawer')).toBeInTheDocument();
    });
  });

  // ── Inline create card ────────────────────────────────────────────

  describe('Given the user clicks the inline create card', () => {
    beforeEach(async () => {
      setSuccessState();
      render(<StoragesPage />);
      await user.click(screen.getByText('actions.createInline'));
    });

    it('Then the create storage drawer opens', () => {
      expect(screen.getByTestId('create-storage-drawer')).toBeInTheDocument();
    });
  });

  // ── Create button hidden when canCreate is false ──────────────────

  describe('Given user has no create permission', () => {
    beforeEach(() => {
      setSuccessState();
      mocks.canCreate = false;
      render(<StoragesPage />);
    });

    it('should not show the header create button', () => {
      expect(screen.queryByText('actions.create')).not.toBeInTheDocument();
    });

    it('should not show the inline create card', () => {
      expect(screen.queryByText('actions.createInline')).not.toBeInTheDocument();
    });
  });

  // ── Tab filtering ─────────────────────────────────────────────────

  describe('Given the user clicks a type tab', () => {
    beforeEach(async () => {
      setSuccessState();
      render(<StoragesPage />);
      const warehouseTab = screen.getByRole('tab', { name: /tabs\.warehouses/ });
      await user.click(warehouseTab);
    });

    it('should call setFilterType with the type', () => {
      expect(mockSetFilterType).toHaveBeenCalledWith('WAREHOUSE');
    });
  });

  describe('Given the user clicks the All tab', () => {
    beforeEach(async () => {
      setSuccessState();
      mocks.filterType = 'WAREHOUSE';
      render(<StoragesPage />);
      const allTab = screen.getByRole('tab', { name: /tabs\.all/ });
      await user.click(allTab);
    });

    it('should call setFilterType with null', () => {
      expect(mockSetFilterType).toHaveBeenCalledWith(null);
    });
  });

  // ── Search bar interaction ────────────────────────────────────────

  describe('Given the user types in the search bar', () => {
    beforeEach(async () => {
      setSuccessState();
      render(<StoragesPage />);
      await user.type(screen.getByPlaceholderText('controls.search'), 'bodega');
    });

    it('should call setSearchQuery for each character', () => {
      expect(mockSetSearchQuery).toHaveBeenCalled();
    });
  });

  // ── Sort toggle ───────────────────────────────────────────────────

  describe('Given the user clicks the sort toggle when ASC', () => {
    beforeEach(async () => {
      setSuccessState();
      mocks.sortOrder = 'ASC';
      render(<StoragesPage />);
      await user.click(screen.getByText(/A → Z/));
    });

    it('should call setSortOrder with DESC', () => {
      expect(mockSetSortOrder).toHaveBeenCalledWith('DESC');
    });
  });

  describe('Given the user clicks the sort toggle when DESC', () => {
    beforeEach(async () => {
      setSuccessState();
      mocks.sortOrder = 'DESC';
      render(<StoragesPage />);
      await user.click(screen.getByText(/Z → A/));
    });

    it('should call setSortOrder with ASC', () => {
      expect(mockSetSortOrder).toHaveBeenCalledWith('ASC');
    });
  });

  // ── Status filter dropdown ────────────────────────────────────────

  describe('Given the user selects a status filter', () => {
    beforeEach(async () => {
      setSuccessState();
      render(<StoragesPage />);
      await user.selectOptions(
        screen.getByDisplayValue('controls.allStatuses'),
        'ACTIVE',
      );
    });

    it('should call setFilterStatus with ACTIVE', () => {
      expect(mockSetFilterStatus).toHaveBeenCalledWith('ACTIVE');
    });
  });

  describe('Given the user clears the status filter', () => {
    beforeEach(async () => {
      setSuccessState();
      mocks.filterStatus = 'ACTIVE';
      render(<StoragesPage />);
      await user.selectOptions(
        screen.getByDisplayValue('statuses.ACTIVE'),
        '',
      );
    });

    it('should call setFilterStatus with null', () => {
      expect(mockSetFilterStatus).toHaveBeenCalledWith(null);
    });
  });

  // ── Active filter chips ───────────────────────────────────────────

  describe('Given there is an active status filter chip', () => {
    beforeEach(async () => {
      setSuccessState();
      mocks.filterStatus = 'ACTIVE';
      render(<StoragesPage />);
    });

    it('should show the status filter chip', () => {
      expect(screen.getByRole('button', { name: /statuses\.ACTIVE/ })).toBeInTheDocument();
    });

    it('should call setFilterStatus null when chip is dismissed', async () => {
      await user.click(screen.getByRole('button', { name: /statuses\.ACTIVE/ }));
      expect(mockSetFilterStatus).toHaveBeenCalledWith(null);
    });
  });

  describe('Given there is an active search chip', () => {
    beforeEach(() => {
      setSuccessState();
      mocks.searchQuery = 'bodega';
      render(<StoragesPage />);
    });

    it('should show the search chip with the query', () => {
      expect(screen.getByText(/bodega/)).toBeInTheDocument();
    });

    it('should call setSearchQuery empty when dismissed', async () => {
      // Find the chip button containing the search query
      const chips = screen.getAllByRole('button');
      const searchChip = chips.find(b => b.textContent?.includes('bodega'));
      if (searchChip) await user.click(searchChip);
      expect(mockSetSearchQuery).toHaveBeenCalledWith('');
    });
  });

  // ── Pagination ────────────────────────────────────────────────────

  describe('Given there are multiple pages', () => {
    beforeEach(() => {
      setSuccessState({ totalPages: 3, page: 2 });
      render(<StoragesPage />);
    });

    it('should show pagination controls', () => {
      expect(screen.getByText('pagination.prev')).toBeInTheDocument();
      expect(screen.getByText('pagination.next')).toBeInTheDocument();
    });

    it('should show page info', () => {
      expect(screen.getByText('pagination.pageOf')).toBeInTheDocument();
    });

    it('should enable both prev and next when in the middle', () => {
      expect(screen.getByText('pagination.prev').closest('button')).not.toBeDisabled();
      expect(screen.getByText('pagination.next').closest('button')).not.toBeDisabled();
    });
  });

  describe('Given the user is on page 1 of 3', () => {
    beforeEach(() => {
      setSuccessState({ totalPages: 3, page: 1 });
      render(<StoragesPage />);
    });

    it('should disable the prev button', () => {
      expect(screen.getByText('pagination.prev').closest('button')).toBeDisabled();
    });

    it('should enable the next button', () => {
      expect(screen.getByText('pagination.next').closest('button')).not.toBeDisabled();
    });

    it('should call setPage with 2 when next is clicked', async () => {
      await user.click(screen.getByText('pagination.next'));
      expect(mockSetPage).toHaveBeenCalledWith(2);
    });
  });

  describe('Given the user is on the last page', () => {
    beforeEach(() => {
      setSuccessState({ totalPages: 3, page: 3 });
      render(<StoragesPage />);
    });

    it('should disable the next button', () => {
      expect(screen.getByText('pagination.next').closest('button')).toBeDisabled();
    });

    it('should enable the prev button', () => {
      expect(screen.getByText('pagination.prev').closest('button')).not.toBeDisabled();
    });

    it('should call setPage with 2 when prev is clicked', async () => {
      await user.click(screen.getByText('pagination.prev'));
      expect(mockSetPage).toHaveBeenCalledWith(2);
    });
  });

  describe('Given there is only 1 page', () => {
    beforeEach(() => {
      setSuccessState({ totalPages: 1 });
      render(<StoragesPage />);
    });

    it('should not show pagination controls', () => {
      expect(screen.queryByText('pagination.prev')).not.toBeInTheDocument();
    });
  });

  // ── Modal: save in edit mode via onEdit ─────────────────────────────

  describe('Given the edit modal is open and user saves changes', () => {
    beforeEach(async () => {
      setSuccessState();
      render(<StoragesPage />);
      const firstCard = storageCardInstances.find(c => (c.storage as { uuid: string }).uuid === '1');
      await act(async () => { firstCard?.onEdit?.(firstCard.storage); });
      await act(async () => {
        await (createEditModalProps.onEdit as (id: string, type: string, data: { name: string }) => Promise<{ error: null }>)('1', 'WAREHOUSE', { name: 'Updated' });
      });
    });

    it('Then editStorage is called with the selected storage uuid', () => {
      expect(mockEditStorage).toHaveBeenCalledWith('1', 'WAREHOUSE', { name: 'Updated' }, undefined);
    });
  });

  // ── Modal: save in edit mode ───────────────────────────────────────

  describe('Given a storage card edit triggers the modal', () => {
    beforeEach(async () => {
      setSuccessState();
      render(<StoragesPage />);
      const firstCard = storageCardInstances.find(c => (c.storage as { uuid: string }).uuid === '1');
      await act(async () => { firstCard?.onEdit?.(firstCard.storage); });
    });

    it('should open the modal in edit mode', () => {
      expect(screen.getByTestId('create-edit-modal')).toBeInTheDocument();
    });

    it('should pass the selected storage', () => {
      expect((createEditModalProps.storage as { uuid: string })?.uuid).toBe('1');
    });
  });

  // ── Edit modal: close ─────────────────────────────────────────────

  describe('Given the edit modal is open and user closes it', () => {
    beforeEach(async () => {
      setSuccessState();
      render(<StoragesPage />);
      const firstCard = storageCardInstances.find(c => (c.storage as { uuid: string }).uuid === '1');
      await act(async () => { firstCard?.onEdit?.(firstCard.storage); });
      await act(async () => { (createEditModalProps.onClose as () => void)(); });
    });

    it('Then the edit modal closes', () => {
      expect(screen.queryByTestId('create-edit-modal')).not.toBeInTheDocument();
    });
  });

  // ── Archive modal flow ─────────────────────────────────────────────

  describe('Given a storage card archive triggers the modal', () => {
    beforeEach(async () => {
      setSuccessState();
      render(<StoragesPage />);
      const activeCard = storageCardInstances.find(
        c => (c.storage as { status: string }).status === 'ACTIVE',
      );
      await act(async () => { activeCard?.onArchive?.(activeCard.storage); });
    });

    it('should open the archive modal', () => {
      expect(screen.getByTestId('archive-modal')).toBeInTheDocument();
    });

    it('should pass sourceStatus ACTIVE and the selected storage to the dialog', () => {
      expect(archiveModalProps.sourceStatus).toBe('ACTIVE');
      expect((archiveModalProps.storage as { uuid: string }).uuid).toBe('1');
    });
  });

  describe('Given the user confirms archive', () => {
    beforeEach(async () => {
      setSuccessState();
      render(<StoragesPage />);
      const activeCard = storageCardInstances.find(
        c => (c.storage as { status: string }).status === 'ACTIVE',
      );
      await act(async () => { activeCard?.onArchive?.(activeCard.storage); });
      await act(async () => { await (archiveModalProps.onConfirm as () => Promise<void>)(); });
    });

    it('should call archiveStorage with the storage UUID', () => {
      expect(mockArchiveStorage).toHaveBeenCalledWith('1');
    });
  });

  describe('Given the user closes the archive modal', () => {
    beforeEach(() => {
      setSuccessState();
      render(<StoragesPage />);
      const activeCard = storageCardInstances.find(
        c => (c.storage as { status: string }).status === 'ACTIVE',
      );
      activeCard?.onArchive?.(activeCard.storage);
      (archiveModalProps.onClose as () => void)();
    });

    it('should close the archive modal', () => {
      expect(screen.queryByTestId('archive-modal')).not.toBeInTheDocument();
    });
  });

  // ── Restore flow ──────────────────────────────────────────────────

  describe('Given the user restores a storage successfully', () => {
    beforeEach(async () => {
      setSuccessState({
        storages: [
          { uuid: '1', name: 'Archived One', type: 'WAREHOUSE', status: 'ARCHIVED' },
        ],
        activeStorages: [],
        frozenStorages: [],
      });
      render(<StoragesPage />);
      const archivedCard = storageCardInstances.find(
        c => (c.storage as { status: string }).status === 'ARCHIVED',
      );
      await archivedCard?.onRestore?.(archivedCard.storage);
    });

    it('should call restoreStorage', () => {
      expect(mockRestoreStorage).toHaveBeenCalledWith('1');
    });

    it('should show success toast', () => {
      expect(mockToastSuccess).toHaveBeenCalled();
    });
  });

  describe('Given restore fails', () => {
    beforeEach(async () => {
      mockRestoreStorage.mockResolvedValueOnce(false);
      setSuccessState({
        storages: [
          { uuid: '1', name: 'Archived One', type: 'WAREHOUSE', status: 'ARCHIVED' },
        ],
        activeStorages: [],
        frozenStorages: [],
      });
      render(<StoragesPage />);
      const archivedCard = storageCardInstances.find(
        c => (c.storage as { status: string }).status === 'ARCHIVED',
      );
      await archivedCard?.onRestore?.(archivedCard.storage);
    });

    it('should show error toast', () => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  // ── Delete flow ───────────────────────────────────────────────────

  // H-07: handleDeleteClick now opens DeleteStorageDialog and confirms via the
  // hook's deleteStoragePermanent stub (501). The legacy service-direct flow
  // tested below no longer exists; these suites are parked until the
  // dedicated permanent-delete story lands (DT-H07-9).
  describe.skip('Given the user deletes a storage successfully', () => {
    beforeEach(async () => {
      setSuccessState({
        storages: [
          { uuid: '1', name: 'Archived One', type: 'WAREHOUSE', status: 'ARCHIVED' },
        ],
        activeStorages: [],
        frozenStorages: [],
      });
      render(<StoragesPage />);
      const archivedCard = storageCardInstances.find(
        c => (c.storage as { uuid: string }).uuid === '1',
      );
      await archivedCard?.onDelete?.(archivedCard!.storage);
    });

    it('should call storagesService.destroy', () => {
      expect(mockDestroy).toHaveBeenCalledWith('1');
    });

    it('should show success toast', () => {
      expect(mockToastSuccess).toHaveBeenCalled();
    });

    it('should call fetchStorages to refresh', () => {
      expect(mockFetchStorages).toHaveBeenCalled();
    });
  });

  describe.skip('Given delete fails', () => {
    beforeEach(async () => {
      mockDestroy.mockRejectedValueOnce(new Error('fail'));
      setSuccessState({
        storages: [
          { uuid: '1', name: 'Archived One', type: 'WAREHOUSE', status: 'ARCHIVED' },
        ],
        activeStorages: [],
        frozenStorages: [],
      });
      render(<StoragesPage />);
      const archivedCard = storageCardInstances.find(
        c => (c.storage as { uuid: string }).uuid === '1',
      );
      await archivedCard?.onDelete?.(archivedCard!.storage);
    });

    it('should show error toast', () => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  // ── Tier limit card ───────────────────────────────────────────────

  describe('Given the WAREHOUSE type is at its tier limit', () => {
    beforeEach(() => {
      // limits.WAREHOUSE = 2, so 2 active warehouses => at limit
      setSuccessState({
        storages: [
          { uuid: '1', name: 'W1', type: 'WAREHOUSE', status: 'ACTIVE' },
          { uuid: '2', name: 'W2', type: 'WAREHOUSE', status: 'ACTIVE' },
        ],
        activeStorages: [
          { uuid: '1', name: 'W1', type: 'WAREHOUSE', status: 'ACTIVE' },
          { uuid: '2', name: 'W2', type: 'WAREHOUSE', status: 'ACTIVE' },
        ],
      });
      mocks.filterType = 'WAREHOUSE';
      render(<StoragesPage />);
    });

    it('should show the tier limit upgrade card', () => {
      expect(screen.getByText('upgrade.tierLimit.title')).toBeInTheDocument();
    });

    it('should not show the inline create card', () => {
      expect(screen.queryByText('actions.createInline')).not.toBeInTheDocument();
    });

    it('should call openUpgradeModal when upgrade card is clicked', async () => {
      await user.click(screen.getByText('upgrade.tierLimit.title'));
      expect(mockOpenUpgradeModal).toHaveBeenCalledWith('FEATURE_NOT_IN_TIER', 'WAREHOUSE');
    });
  });

  // ── Inline create card visibility with unlimited tier ─────────────

  describe('Given CUSTOM_ROOM has unlimited tier (-1)', () => {
    beforeEach(() => {
      setSuccessState({
        storages: [
          { uuid: '1', name: 'CR1', type: 'CUSTOM_ROOM', status: 'ACTIVE' },
        ],
        activeStorages: [
          { uuid: '1', name: 'CR1', type: 'CUSTOM_ROOM', status: 'ACTIVE' },
        ],
      });
      mocks.filterType = 'CUSTOM_ROOM';
      render(<StoragesPage />);
    });

    it('should show the inline create card (no tier limit)', () => {
      expect(screen.getByText('actions.createInline')).toBeInTheDocument();
    });

    it('should not show the tier limit card', () => {
      expect(screen.queryByText('upgrade.tierLimit.title')).not.toBeInTheDocument();
    });
  });

  // ── Edit save calls editStorage ────────────────────────────────────

  describe('Given the modal is in edit mode and user saves', () => {
    beforeEach(async () => {
      setSuccessState();
      render(<StoragesPage />);
      const firstCard = storageCardInstances.find(c => (c.storage as { uuid: string }).uuid === '1');
      await act(async () => { firstCard?.onEdit?.(firstCard.storage); });
      await act(async () => { await (createEditModalProps.onEdit as (id: string, type: string, data: { name: string }) => Promise<{ error: null }>)('1', 'WAREHOUSE', { name: 'Updated' }); });
    });

    it('should call editStorage with the UUID and data', () => {
      expect(mockEditStorage).toHaveBeenCalledWith('1', 'WAREHOUSE', { name: 'Updated' }, undefined);
    });
  });

  // ── Archive confirm with no selected storage ─────────────────────

  describe('Given archive confirm is triggered before a storage is selected', () => {
    beforeEach(async () => {
      setSuccessState();
      render(<StoragesPage />);
      // Call onConfirm on archive modal while selectedStorage is still null
      await act(async () => { await (archiveModalProps.onConfirm as () => Promise<void>)(); });
    });

    it('should not call archiveStorage', () => {
      expect(mockArchiveStorage).not.toHaveBeenCalled();
    });
  });

  // ── onEdit is undefined when canDo returns false ──────────────────

  describe('Given the user does not have STORAGE_UPDATE permission', () => {
    beforeEach(() => {
      mockCanDo.mockImplementation((action: string) => action !== 'STORAGE_UPDATE');
      setSuccessState();
      render(<StoragesPage />);
    });

    it('should pass canEdit=false to all storage cards', () => {
      const allDisabled = storageCardInstances.every(c => c.canEdit === false);
      expect(allDisabled).toBe(true);
    });
  });

  describe('Given the active filter type is locked on the current tier', () => {
    beforeEach(() => {
      mocks.isGated = true;
      mocks.filterType = 'WAREHOUSE';
      mocks.storages = [];
      mocks.total = 0;
      mocks.isLoading = false;
      mocks.error = null;
    });

    afterEach(() => {
      mocks.isGated = false;
      mocks.filterType = null;
    });

    describe('When the page renders with no stale storages', () => {
      beforeEach(() => {
        render(<StoragesPage />);
      });

      it('Then the TierUpgradeState component is shown', () => {
        expect(screen.getByTestId('tier-upgrade-state')).toBeInTheDocument();
      });

      it('Then the filter tabs are still visible for context', () => {
        expect(screen.getByRole('button', { name: /WAREHOUSE/i })).toBeInTheDocument();
      });

      it('Then the page title is still visible', () => {
        expect(screen.getByRole('heading')).toBeInTheDocument();
      });

      it('Then the search bar is visible but disabled', () => {
        expect(screen.getByRole('searchbox')).toBeDisabled();
      });
    });

    describe('When the page renders with stale storages from a previous tab', () => {
      beforeEach(() => {
        mocks.storages = [{ uuid: 'sr-1', name: 'Store Room 1', type: 'STORE_ROOM', status: 'ACTIVE' }];
        mocks.total = 1;
        render(<StoragesPage />);
      });

      it('Then the TierUpgradeState component is shown instead of the stale cards', () => {
        expect(screen.getByTestId('tier-upgrade-state')).toBeInTheDocument();
      });

      it('Then the stale storage cards are not rendered', () => {
        expect(screen.queryByText('Store Room 1')).not.toBeInTheDocument();
      });

      it('Then the header create button is not shown', () => {
        expect(screen.queryByRole('button', { name: /actions\.create$/i })).not.toBeInTheDocument();
      });

      it('Then the filter tabs remain visible with their counts', () => {
        expect(screen.getByRole('tab', { name: /tabs\.warehouses/ })).toBeInTheDocument();
      });

      it('Then the search bar is visible but disabled', () => {
        expect(screen.getByRole('searchbox')).toBeDisabled();
      });
    });
  });

  // ── "All" tab consistency: no create card when all types are blocked ──

  describe('Given the user is on the All tab and every storage type is blocked by the current tier', () => {
    beforeEach(() => {
      mockIsAllowed.mockReturnValue(false);
      setSuccessState({
        storages: [
          { uuid: '1', name: 'SR1', type: 'STORE_ROOM', status: 'ACTIVE' },
        ],
        activeStorages: [
          { uuid: '1', name: 'SR1', type: 'STORE_ROOM', status: 'ACTIVE' },
        ],
      });
      mocks.filterType = null;
      render(<StoragesPage />);
    });

    it('Then the tier limit upgrade card is shown', () => {
      expect(screen.getByText('upgrade.tierLimit.title')).toBeInTheDocument();
    });

    it('Then the inline create card is not shown', () => {
      expect(screen.queryByText('actions.createInline')).not.toBeInTheDocument();
    });
  });

  describe('Given the user is on the All tab and at least one storage type has remaining quota', () => {
    beforeEach(() => {
      mockIsAllowed.mockReturnValue(true);
      setSuccessState({
        storages: [
          { uuid: '1', name: 'SR1', type: 'STORE_ROOM', status: 'ACTIVE' },
        ],
        activeStorages: [
          { uuid: '1', name: 'SR1', type: 'STORE_ROOM', status: 'ACTIVE' },
        ],
      });
      mocks.filterType = null;
      render(<StoragesPage />);
    });

    it('Then the inline create card is shown', () => {
      expect(screen.getByText('actions.createInline')).toBeInTheDocument();
    });

    it('Then the tier limit card is not shown', () => {
      expect(screen.queryByText('upgrade.tierLimit.title')).not.toBeInTheDocument();
    });
  });

  // ── Tab lock icon for tier-blocked types ─────────────────────────────────

  describe('Given the WAREHOUSE type is tier-blocked (isAllowed returns false for warehouses)', () => {
    beforeEach(() => {
      mockIsAllowed.mockImplementation((feature: string) => feature !== 'warehouses');
      setSuccessState({
        storages: [
          { uuid: '1', name: 'SR1', type: 'STORE_ROOM', status: 'ACTIVE' },
        ],
        activeStorages: [
          { uuid: '1', name: 'SR1', type: 'STORE_ROOM', status: 'ACTIVE' },
        ],
      });
      render(<StoragesPage />);
    });

    it('Then the Warehouses tab renders a lock icon', () => {
      const warehousesTab = screen.getByRole('tab', { name: /tabs\.warehouses/ });
      expect(warehousesTab.querySelector('.material-symbols-outlined')).toHaveTextContent('lock');
    });

    it('Then the Store Rooms tab does NOT render a lock icon', () => {
      const storeRoomsTab = screen.getByRole('tab', { name: /tabs\.storeRooms/ });
      expect(storeRoomsTab.querySelector('.material-symbols-outlined')).toBeNull();
    });
  });

  // ── onEdit and onChangeType handlers forwarded to EditStorageDrawer ──────────────

  describe('Given the edit modal is opened for a storage', () => {
    beforeEach(async () => {
      setSuccessState();
      render(<StoragesPage />);
      const firstCard = storageCardInstances.find(c => (c.storage as { uuid: string }).uuid === '1');
      await act(async () => { firstCard?.onEdit?.(firstCard.storage); });
    });

    it('Then onEdit is passed as a function to EditStorageDrawer', () => {
      expect(typeof createEditModalProps.onEdit).toBe('function');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Active-context ordering (H-03 / STOC-432) — FE-SP1 to FE-SP3
  // ══════════════════════════════════════════════════════════════════

  describe('Given the page renders the grid using `sortedStorages`', () => {
    // ── FE-SP1 ──────────────────────────────────────────────────────────
    describe('Given the active storage is the third alphabetically', () => {
      beforeEach(() => {
        setSuccessState({
          storages: [
            { uuid: 'a', name: 'Almacén A', type: 'WAREHOUSE', status: 'ACTIVE' },
            { uuid: 'b', name: 'Bodega B', type: 'STORE_ROOM', status: 'ACTIVE' },
            { uuid: 'c', name: 'Custom C', type: 'CUSTOM_ROOM', status: 'ACTIVE' },
          ],
        });
        mocks.activeStorageId = 'c';
        // Simulate the hook's active-first sorting
        mocks.sortedStorages = [
          { uuid: 'c', name: 'Custom C', type: 'CUSTOM_ROOM', status: 'ACTIVE' },
          { uuid: 'a', name: 'Almacén A', type: 'WAREHOUSE', status: 'ACTIVE' },
          { uuid: 'b', name: 'Bodega B', type: 'STORE_ROOM', status: 'ACTIVE' },
        ];
        render(<StoragesPage />);
      });

      it('Then the first rendered card is the active-context storage', () => {
        expect(storageCardInstances[0].storage).toMatchObject({ uuid: 'c' });
      });

      it('Then the active card receives `isActiveContext={true}`', () => {
        const active = storageCardInstances.find((c) => (c.storage as { uuid: string }).uuid === 'c') as { storage: { uuid: string }; isActiveContext?: boolean };
        expect(active?.isActiveContext).toBe(true);
      });

      it('Then the other cards receive `isActiveContext={false}`', () => {
        const others = storageCardInstances.filter(
          (c) => (c.storage as { uuid: string }).uuid !== 'c',
        ) as Array<{ storage: { uuid: string }; isActiveContext?: boolean }>;
        expect(others.every((c) => c.isActiveContext === false)).toBe(true);
      });
    });

    // ── FE-SP2 ──────────────────────────────────────────────────────────
    describe('Given the active storage is already the first alphabetically', () => {
      beforeEach(() => {
        setSuccessState({
          storages: [
            { uuid: 'a', name: 'Almacén A', type: 'WAREHOUSE', status: 'ACTIVE' },
            { uuid: 'b', name: 'Bodega B', type: 'STORE_ROOM', status: 'ACTIVE' },
          ],
        });
        mocks.activeStorageId = 'a';
        mocks.sortedStorages = [
          { uuid: 'a', name: 'Almacén A', type: 'WAREHOUSE', status: 'ACTIVE' },
          { uuid: 'b', name: 'Bodega B', type: 'STORE_ROOM', status: 'ACTIVE' },
        ];
        render(<StoragesPage />);
      });

      it('Then the grid order matches the plain A→Z sequence', () => {
        // StrictMode double-renders every component — dedupe by uuid while
        // preserving the first occurrence of each to get the natural order.
        const uniqueOrder = Array.from(
          new Map(
            storageCardInstances.map((c) => [
              (c.storage as { uuid: string }).uuid,
              (c.storage as { uuid: string }).uuid,
            ]),
          ).values(),
        );
        expect(uniqueOrder).toEqual(['a', 'b']);
      });

      it('Then the first card still gets `isActiveContext={true}`', () => {
        expect(
          (storageCardInstances[0] as { isActiveContext?: boolean }).isActiveContext,
        ).toBe(true);
      });
    });

    // ── FE-SP3 ──────────────────────────────────────────────────────────
    describe('Given there is no active storage (activeStorageId === null)', () => {
      beforeEach(() => {
        setSuccessState({
          storages: [
            { uuid: 'b', name: 'Bodega B', type: 'STORE_ROOM', status: 'ACTIVE' },
            { uuid: 'a', name: 'Almacén A', type: 'WAREHOUSE', status: 'ACTIVE' },
          ],
        });
        mocks.activeStorageId = null;
        mocks.sortedStorages = null; // Fall back to plain `mocks.storages` in the hook mock
        render(<StoragesPage />);
      });

      it('Then the grid renders in the plain server order (no active-first reordering)', () => {
        const uniqueOrder = Array.from(
          new Map(
            storageCardInstances.map((c) => [
              (c.storage as { uuid: string }).uuid,
              (c.storage as { uuid: string }).uuid,
            ]),
          ).values(),
        );
        expect(uniqueOrder).toEqual(['b', 'a']);
      });

      it('Then no card receives `isActiveContext={true}`', () => {
        expect(
          storageCardInstances.every(
            (c) => (c as { isActiveContext?: boolean }).isActiveContext !== true,
          ),
        ).toBe(true);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Create drawer auto-open via router state (H-03 / STOC-346)
  // ══════════════════════════════════════════════════════════════════

  describe('Given the page was navigated from the sidebar switcher CTA', () => {
    describe('When location.state has openCreateDrawer=true and the user has STORAGE_CREATE', () => {
      beforeEach(() => {
        mockLocationState.current = { openCreateDrawer: true };
        mockCanDo.mockReturnValue(true);
        setSuccessState();
        render(<StoragesPage />);
      });

      it('Then the create drawer is opened automatically', () => {
        expect(screen.getByTestId('create-storage-drawer')).toBeInTheDocument();
      });

      it('Then navigate is called to clear the router state (replace:true)', () => {
        expect(mockNavigate).toHaveBeenCalledWith(
          '/storages',
          expect.objectContaining({ replace: true, state: null }),
        );
      });

      afterAll(() => {
        mockLocationState.current = null;
      });
    });

    describe('When location.state has openCreateDrawer=true but the user lacks STORAGE_CREATE', () => {
      beforeEach(() => {
        mockLocationState.current = { openCreateDrawer: true };
        mockCanDo.mockImplementation((action: string) => action !== 'STORAGE_CREATE');
        setSuccessState();
        render(<StoragesPage />);
      });

      afterAll(() => {
        mockLocationState.current = null;
      });

      it('Then the drawer is NOT opened', () => {
        expect(screen.queryByTestId('create-storage-drawer')).not.toBeInTheDocument();
      });
    });
  });
});
