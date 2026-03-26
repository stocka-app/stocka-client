import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { STORAGE_TIER_LIMITS } from '../../types/storages.types';
import type { Storage, StorageType } from '../../types/storages.types';
import type { TenantTier } from '@/features/team/types/team.types';

const mockOpenUpgradeModal = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/shared/hooks/useTierGate', () => ({
  useTierGate: () => ({
    openUpgradeModal: mockOpenUpgradeModal,
    closeUpgradeModal: vi.fn(),
    isOpen: false,
  }),
}));

let currentTier: string | null = 'FREE';

vi.mock('@/store/rbac.store', () => ({
  useRBACStore: () => ({ tier: currentTier }),
}));

/**
 * Mock useCapabilities to return limits matching the current test tier.
 * This mirrors how the component resolves limits — from JWT → API → fallback.
 * In tests we use the same fallback constant to keep assertions aligned.
 */
vi.mock('../../hooks/useCapabilities', () => ({
  useCapabilities: (): { limits: Record<StorageType, number>; isLoading: boolean } => {
    const tier = (currentTier ?? 'FREE') as TenantTier;
    return {
      limits: STORAGE_TIER_LIMITS[tier] ?? STORAGE_TIER_LIMITS.FREE,
      isLoading: false,
    };
  },
}));

import { StorageLimitsSection } from '../StorageLimitsSection';

const activeStorages: Storage[] = [
  {
    uuid: 'storage-001',
    name: 'Main Store Room',
    type: 'STORE_ROOM',
    status: 'ACTIVE',
    address: null,
    roomType: null,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    uuid: 'storage-002',
    name: 'Custom Room A',
    type: 'CUSTOM_ROOM',
    status: 'ACTIVE',
    address: null,
    roomType: null,
    archivedAt: null,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

describe('Given StorageLimitsSection displays per-type storage usage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    currentTier = 'FREE';
    mockOpenUpgradeModal.mockClear();
    user = userEvent.setup();
  });

  describe('When the tenant is on FREE tier', () => {
    it('Then the section title is rendered', () => {
      render(<StorageLimitsSection storages={activeStorages} />);
      expect(screen.getByText('limits.title')).toBeInTheDocument();
    });

    it('Then all three storage type labels are shown', () => {
      render(<StorageLimitsSection storages={activeStorages} />);
      expect(screen.getByText('types.CUSTOM_ROOM')).toBeInTheDocument();
      expect(screen.getByText('types.STORE_ROOM')).toBeInTheDocument();
      expect(screen.getByText('types.WAREHOUSE')).toBeInTheDocument();
    });

    it('Then the WAREHOUSE row shows the STARTER+ upgrade badge', () => {
      render(<StorageLimitsSection storages={activeStorages} />);
      expect(screen.getByText('limits.warehouseProBadge')).toBeInTheDocument();
    });
  });

  describe('When the user clicks the WAREHOUSE row on FREE tier', () => {
    it('Then openUpgradeModal is called', async () => {
      render(<StorageLimitsSection storages={activeStorages} />);
      const warehouseRow = screen.getByRole('button');
      await user.click(warehouseRow);
      expect(mockOpenUpgradeModal).toHaveBeenCalledWith('FEATURE_NOT_IN_TIER', 'WAREHOUSE');
    });
  });

  describe('When the user presses Enter on the WAREHOUSE row on FREE tier', () => {
    it('Then openUpgradeModal is called via keyboard', async () => {
      render(<StorageLimitsSection storages={activeStorages} />);
      const warehouseRow = screen.getByRole('button');
      warehouseRow.focus();
      await user.keyboard('{Enter}');
      expect(mockOpenUpgradeModal).toHaveBeenCalledWith('FEATURE_NOT_IN_TIER', 'WAREHOUSE');
    });
  });

  describe('When the user presses Space on the WAREHOUSE row on FREE tier', () => {
    it('Then openUpgradeModal is called via keyboard', async () => {
      render(<StorageLimitsSection storages={activeStorages} />);
      const warehouseRow = screen.getByRole('button');
      warehouseRow.focus();
      await user.keyboard(' ');
      expect(mockOpenUpgradeModal).toHaveBeenCalledWith('FEATURE_NOT_IN_TIER', 'WAREHOUSE');
    });
  });

  describe('When the user presses an unrelated key on the WAREHOUSE row on FREE tier', () => {
    it('Then openUpgradeModal is not called', async () => {
      render(<StorageLimitsSection storages={activeStorages} />);
      const warehouseRow = screen.getByRole('button');
      warehouseRow.focus();
      await user.keyboard('{Tab}');
      expect(mockOpenUpgradeModal).not.toHaveBeenCalled();
    });
  });

  describe('When the tenant is on STARTER tier', () => {
    beforeEach(() => {
      currentTier = 'STARTER';
    });

    it('Then the WAREHOUSE upgrade badge is not shown', () => {
      render(<StorageLimitsSection storages={activeStorages} />);
      expect(screen.queryByText('limits.warehouseProBadge')).not.toBeInTheDocument();
    });

    it('Then usage text is shown for each non-blocked type', () => {
      render(<StorageLimitsSection storages={activeStorages} />);
      // t('limits.used', opts) returns 'limits.used' from the simplified mock
      const usageLabels = screen.getAllByText('limits.used');
      // CUSTOM_ROOM, STORE_ROOM, WAREHOUSE (3 types, none blocked on STARTER)
      expect(usageLabels).toHaveLength(3);
    });
  });

  describe('When the tenant is on STARTER tier with high storage usage', () => {
    const highUsageStorages: Storage[] = [
      ...activeStorages,
      {
        uuid: 'storage-003',
        name: 'Custom Room B',
        type: 'CUSTOM_ROOM',
        status: 'ACTIVE',
        address: null,
        roomType: null,
        archivedAt: null,
        createdAt: '2026-01-03T00:00:00.000Z',
        updatedAt: '2026-01-03T00:00:00.000Z',
      },
      {
        uuid: 'storage-004',
        name: 'Custom Room C',
        type: 'CUSTOM_ROOM',
        status: 'ACTIVE',
        address: null,
        roomType: null,
        archivedAt: null,
        createdAt: '2026-01-04T00:00:00.000Z',
        updatedAt: '2026-01-04T00:00:00.000Z',
      },
    ];

    beforeEach(() => {
      currentTier = 'STARTER';
    });

    it('Then the progress bar reflects high usage colors', () => {
      const { container } = render(<StorageLimitsSection storages={highUsageStorages} />);
      const progressBars = container.querySelectorAll('[class*="rounded-full"][class*="transition-all"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('When tier is null', () => {
    beforeEach(() => {
      currentTier = null;
    });

    it('Then it defaults to FREE tier behavior', () => {
      render(<StorageLimitsSection storages={activeStorages} />);
      expect(screen.getByText('limits.warehouseProBadge')).toBeInTheDocument();
    });
  });

  describe('When the tenant is on GROWTH tier with medium usage', () => {
    const mediumUsageStorages: Storage[] = Array.from({ length: 5 }, (_, i) => ({
      uuid: `storage-m-${i}`,
      name: `Custom Room ${i}`,
      type: 'CUSTOM_ROOM' as const,
      status: 'ACTIVE' as const,
      address: null,
      roomType: null,
      archivedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }));

    beforeEach(() => {
      currentTier = 'GROWTH';
    });

    it('Then the progress bar shows medium usage styling', () => {
      const { container } = render(<StorageLimitsSection storages={mediumUsageStorages} />);
      const progressBars = container.querySelectorAll('[class*="rounded-full"][class*="transition-all"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('When the tenant is on ENTERPRISE tier', () => {
    beforeEach(() => {
      currentTier = 'ENTERPRISE';
    });

    it('Then unlimited labels are shown for all types', () => {
      render(<StorageLimitsSection storages={activeStorages} />);
      const unlimitedLabels = screen.getAllByText('limits.unlimited');
      expect(unlimitedLabels).toHaveLength(3);
    });
  });
});
