import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  buildMixedDataset,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';
import type { MockStorage, StorageStatus, StorageType } from '../../helpers/storages-list.helper';

// ─── Mock data ───────────────────────────────────────────────────────────────

const MIXED = buildMixedDataset();

/**
 * For filter tests we need the mock API to actually filter.
 * We build a smart route handler that reads query params.
 */
async function setupWithSmartFiltering(
  page: import('@playwright/test').Page,
  items: MockStorage[] = MIXED,
): Promise<void> {
  const rbacValue = JSON.stringify({
    state: { role: 'owner', tier: 'STARTER', tenantStatus: 'ACTIVE', permissions: RBAC_OWNER.actions, grants: [], loaded: true },
    version: 0,
  });

  await page.addInitScript((value: string) => {
    localStorage.setItem('rbac-storage', value);
  }, rbacValue);

  await page.route(/\/api\/rbac\/my-permissions(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { role: 'owner', tier: 'STARTER', actions: RBAC_OWNER.actions, grants: [] } }),
    });
  });

  await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    const url = new URL(route.request().url());
    const status = url.searchParams.get('status') as StorageStatus | null;
    const type = url.searchParams.get('type') as StorageType | null;
    const search = url.searchParams.get('search');
    const sortOrder = url.searchParams.get('sortOrder') ?? 'ASC';

    let filtered = [...items];

    if (status) {
      filtered = filtered.filter((s) => s.status === status);
    }
    if (type) {
      filtered = filtered.filter((s) => s.type === type);
    }
    if (search) {
      const lower = search.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(lower));
    }

    filtered.sort((a, b) =>
      sortOrder === 'ASC'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name),
    );

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildStoragesResponse(filtered)),
    });
  });

  await page.goto('/storages');
  await page.waitForURL('**/storages', { timeout: 15_000 });
}

// ═════════════════════════════════════════════════════════════════════════════
// Section 5: Filter by type (tabs)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 5: Filter by type (tabs)', () => {
  // T-01
  test('T-01: "All" tab is active by default', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await expect(storagesPage.tabAll).toHaveAttribute('aria-selected', 'true');
    await expect(storagesPage.tabWarehouses).toHaveAttribute('aria-selected', 'false');
  });

  // T-02
  test('T-02: clicking "Warehouses" tab filters to only WAREHOUSE cards', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.tabWarehouses.click();

    // Wait for warehouse cards to appear
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();

    // Non-warehouse cards should be gone
    await expect(page.locator('main h3').filter({ hasText: 'Bodega Principal' }).first()).not.toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Area Exhibicion' }).first()).not.toBeVisible();
  });

  // T-03
  test('T-03: clicking "Store Rooms" tab filters to only STORE_ROOM cards', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.tabStoreRooms.click();

    await expect(page.locator('main h3').filter({ hasText: 'Bodega Principal' }).first()).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).not.toBeVisible();
  });

  // T-04
  test('T-04: clicking "Custom Rooms" tab filters to only CUSTOM_ROOM cards', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.tabCustomRooms.click();

    await expect(page.locator('main h3').filter({ hasText: 'Area Exhibicion' }).first()).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).not.toBeVisible();
  });

  // T-05
  test('T-05: each tab shows correct count', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    // All tab should show total count
    await expect(storagesPage.tabAll).toContainText(`(${MIXED.length})`);
  });

  // T-06
  test('T-06: clicking "All" after filtering resets and shows all storages', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    // Filter to warehouses first
    await storagesPage.tabWarehouses.click();
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();

    // Click All
    await storagesPage.tabAll.click();

    // All storages should be back
    const names = await storagesPage.getCardNames();
    expect(names.length).toBe(MIXED.length);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 6: Filter by status
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 6: Filter by status', () => {
  // S-01
  test('S-01: status dropdown shows all options', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    const options = storagesPage.statusDropdown.locator('option');
    await expect(options).toHaveCount(4); // All statuses + Active + Frozen + Archived
    await expect(options.nth(0)).toHaveText('All statuses');
    await expect(options.nth(1)).toHaveText('Active');
    await expect(options.nth(2)).toHaveText('Frozen');
    await expect(options.nth(3)).toHaveText('Archived');
  });

  // S-02
  test('S-02: selecting "Frozen" shows only frozen storages', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.selectStatus('FROZEN');

    // Should show frozen storages
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Norte' }).first()).toBeVisible();
    // Active/archived should be hidden
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).not.toBeVisible();
  });

  // S-03
  test('S-03: status filter chip appears when status is selected', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.selectStatus('FROZEN');

    await expect(storagesPage.filterChip('Frozen')).toBeVisible();
  });

  // S-04
  test('S-04: clicking X on status chip removes filter', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.selectStatus('FROZEN');
    await expect(storagesPage.filterChip('Frozen')).toBeVisible();

    // Click the chip to remove
    await storagesPage.filterChip('Frozen').click();

    // All storages should be back
    await expect(storagesPage.filterChip('Frozen')).not.toBeVisible();
    const names = await storagesPage.getCardNames();
    expect(names.length).toBe(MIXED.length);
  });

  // S-05
  test('S-05: no results with status filter shows empty message', async ({
    preAuthPage: page,
  }) => {
    // Create a dataset with no archived storages
    const noArchived = MIXED.filter((s) => s.status !== 'ARCHIVED');
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page, noArchived);
    await storagesPage.waitForCards();

    await storagesPage.selectStatus('ARCHIVED');

    await expect(storagesPage.noFilterResultsTitle()).toBeVisible();
  });

  // S-06
  test('S-06: selecting "All statuses" resets status filter', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.selectStatus('ACTIVE');
    await storagesPage.selectStatus('');

    // All storages back
    const names = await storagesPage.getCardNames();
    expect(names.length).toBe(MIXED.length);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 7: Search by name
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 7: Search by name', () => {
  // B-01
  test('B-01: typing in search filters cards by name', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.search('Central');

    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();
    // Others should be filtered out
    await expect(page.locator('main h3').filter({ hasText: 'Bodega Principal' }).first()).not.toBeVisible();
  });

  // B-02
  test('B-02: search with no matches shows no-results message', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.search('xyznonexistent');

    await expect(storagesPage.noResultsTitle()).toBeVisible();
  });

  // B-03
  test('B-03: search chip with quoted term appears', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.search('Central');

    // Chip should show the term in quotes
    await expect(storagesPage.filterChips().filter({ hasText: 'Central' })).toBeVisible();
  });

  // B-04
  test('B-04: clicking X on search chip clears search', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.search('Central');
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();

    // Click the search chip to remove
    await storagesPage.filterChips().filter({ hasText: 'Central' }).click();

    // All storages should be back
    const names = await storagesPage.getCardNames();
    expect(names.length).toBe(MIXED.length);
  });

  // B-05
  test('B-05: no "Create" button in no-results header', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.search('xyznonexistent');
    await expect(storagesPage.noResultsTitle()).toBeVisible();

    // Create button should not appear in header
    await expect(storagesPage.createButton).not.toBeVisible();
  });

  // B-06
  test('B-06: "Clear search" button in no-results resets filters', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.search('xyznonexistent');
    await expect(storagesPage.noResultsTitle()).toBeVisible();

    await storagesPage.clearSearchButton().click();

    // All storages return
    const names = await storagesPage.getCardNames();
    expect(names.length).toBe(MIXED.length);
  });

  // B-07
  test('B-07: "View all" button in no-results resets all filters', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.search('xyznonexistent');
    await expect(storagesPage.noResultsTitle()).toBeVisible();

    await storagesPage.viewAllButton().click();

    const names = await storagesPage.getCardNames();
    expect(names.length).toBe(MIXED.length);
  });

  // B-08
  test('B-08: 3 suggestion cards in no-results state', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.search('xyznonexistent');

    await expect(page.locator('main h3').filter({ hasText: 'Check spelling' }).first()).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Adjust filters' }).first()).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Create new' }).first()).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 8: Sorting
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 8: Sorting', () => {
  // O-01
  test('O-01: sort button shows "A → Z" by default', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await expect(storagesPage.sortButton).toContainText('A → Z');
  });

  // O-02
  test('O-02: clicking sort toggles to "Z → A"', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.toggleSort();

    await expect(storagesPage.sortButton).toContainText('Z → A');
  });

  // O-03
  test('O-03: cards reorder after sort change', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    const ascNames = await storagesPage.getCardNames();

    await storagesPage.toggleSort();

    // Wait for re-render
    await page.waitForTimeout(500);

    const descNames = await storagesPage.getCardNames();

    // The first and last items should be swapped
    expect(ascNames[0]).not.toBe(descNames[0]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 9: Combined filters
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 9: Combined filters', () => {
  // FC-01
  test('FC-01: status "Active" + search "Central" shows only active matching storages', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.selectStatus('ACTIVE');
    await storagesPage.search('Central');

    // Only Almacen Central (active warehouse) should match
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Norte' }).first()).not.toBeVisible(); // frozen
    await expect(page.locator('main h3').filter({ hasText: 'Bodega Principal' }).first()).not.toBeVisible(); // wrong name
  });

  // FC-02
  test('FC-02: type "Warehouses" + status "Frozen" shows only frozen warehouses', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.tabWarehouses.click();
    await storagesPage.selectStatus('FROZEN');

    await expect(page.locator('main h3').filter({ hasText: 'Almacen Norte' }).first()).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).not.toBeVisible(); // active
  });

  // FC-03
  test('FC-03: type + status + search applies all three with AND', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.tabWarehouses.click();
    await storagesPage.selectStatus('ACTIVE');
    await storagesPage.search('Central');

    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();
    const names = await storagesPage.getCardNames();
    expect(names.length).toBe(1);
  });

  // FC-04
  test('FC-04: multiple chips show simultaneously for status and search', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.selectStatus('ACTIVE');
    await storagesPage.search('Central');

    // Both chips should be visible
    await expect(storagesPage.filterChip('Active')).toBeVisible();
    await expect(storagesPage.filterChips().filter({ hasText: 'Central' })).toBeVisible();
  });

  // FC-05
  test('FC-05: removing one chip keeps the other filter active', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupWithSmartFiltering(page);
    await storagesPage.waitForCards();

    await storagesPage.selectStatus('ACTIVE');
    await storagesPage.search('Central');

    // Remove status chip
    await storagesPage.filterChip('Active').click();

    // Search should still be active
    await expect(storagesPage.filterChips().filter({ hasText: 'Central' })).toBeVisible();
    // Should show all "Central" storages regardless of status
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();
  });
});
