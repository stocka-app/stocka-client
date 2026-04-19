import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateWarehouse,
  apiCreateStoreRoom,
  apiCreateCustomRoom,
  apiFreezeStorage,
  apiArchiveStorage,
  clearAllStoragesForUser,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { StoragesListPage } from '../../pages/storages-list.page';

// ═════════════════════════════════════════════════════════════════════════════
// Filters, search, sort (real BE, no mocks)
//
// Dataset: 9 storages = 3 types × 3 statuses (ACTIVE/FROZEN/ARCHIVED)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Storages list filters (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_filt_${ts}@stocka.test`;
  const username = `pw_filt_${ts}`;
  const password = 'TestPass1!';
  const TOTAL = 9;

  test.beforeAll(async () => {
    pool = createDbPool();
    const signUp = await apiSignUp({ email, username, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');
    await clearAllStoragesForUser(pool, signUp.userId);

    const { accessToken } = await apiSignIn(email, password);

    // Warehouses: Active, Frozen, Archived
    const whA = await apiCreateWarehouse(accessToken, 'Almacen Central', 'Av. Industrial 500');
    const whF = await apiCreateWarehouse(accessToken, 'Almacen Norte', 'Calle Norte 100');
    const whR = await apiCreateWarehouse(accessToken, 'Almacen Sur', 'Calle Sur 300');
    await apiFreezeStorage(accessToken, 'WAREHOUSE', whF.storageUUID);
    await apiArchiveStorage(accessToken, 'WAREHOUSE', whR.storageUUID);

    // Store Rooms: Active, Frozen, Archived
    const srA = await apiCreateStoreRoom(accessToken, 'Bodega Principal', 'Calle Bodega 10');
    const srF = await apiCreateStoreRoom(accessToken, 'Bodega Refri', 'Calle Frio 20');
    const srR = await apiCreateStoreRoom(accessToken, 'Bodega Vieja', 'Calle Vieja 30');
    await apiFreezeStorage(accessToken, 'STORE_ROOM', srF.storageUUID);
    await apiArchiveStorage(accessToken, 'STORE_ROOM', srR.storageUUID);

    // Custom Rooms: Active, Frozen, Archived
    const crA = await apiCreateCustomRoom(accessToken, 'Area Exhibicion');
    const crF = await apiCreateCustomRoom(accessToken, 'Area Temporal');
    const crR = await apiCreateCustomRoom(accessToken, 'Area Obsoleta');
    await apiFreezeStorage(accessToken, 'CUSTOM_ROOM', crF.storageUUID);
    await apiArchiveStorage(accessToken, 'CUSTOM_ROOM', crR.storageUUID);
  });

  test.afterAll(async () => {
    await pool.end();
  });

  // ── Type tabs ───────────────────────────────────────────────────────────────

  test('T-01: "All" tab is active by default', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await expect(sp.tabAll).toHaveAttribute('aria-selected', 'true');
  });

  test('T-02: Warehouses tab filters to only WAREHOUSE cards', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.tabWarehouses.click();

    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Bodega Principal' }).first()).not.toBeVisible();
  });

  test('T-03: Store Rooms tab filters to only STORE_ROOM cards', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.tabStoreRooms.click();

    await expect(page.locator('main h3').filter({ hasText: 'Bodega Principal' }).first()).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).not.toBeVisible();
  });

  test('T-04: Custom Rooms tab filters to only CUSTOM_ROOM cards', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.tabCustomRooms.click();

    await expect(page.locator('main h3').filter({ hasText: 'Area Exhibicion' }).first()).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).not.toBeVisible();
  });

  test('T-05: each tab shows correct total count', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await expect(sp.tabAll).toContainText(`(${TOTAL})`);
  });

  test('T-06: clicking "All" after filtering resets and shows all storages', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.tabWarehouses.click();
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();
    await sp.tabAll.click();
    await expect(page.locator('main h3').filter({ hasText: 'Bodega Principal' }).first()).toBeVisible();
    const names = await sp.getCardNames();
    expect(names.length).toBe(TOTAL);
  });

  // ── Status filter (pills) ─────────────────────────────────────────────────

  test('S-01: status filter shows 4 pills (All, Active, Frozen, Archived)', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    const tabs = sp.statusDropdown.getByRole('tab');
    await expect(tabs).toHaveCount(4);
  });

  test('S-02: selecting "Frozen" shows only frozen storages', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.selectStatus('FROZEN');

    await expect(page.locator('main h3').filter({ hasText: 'Almacen Norte' }).first()).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).not.toBeVisible();
  });

  test('S-03: status filter chip appears when status is selected', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.selectStatus('FROZEN');
    await expect(sp.filterChip('Frozen')).toBeVisible();
  });

  test('S-04: clicking X on status chip removes filter', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.selectStatus('FROZEN');
    await expect(sp.filterChip('Frozen')).toBeVisible();
    await sp.filterChip('Frozen').click();
    await expect(sp.filterChip('Frozen')).not.toBeVisible();
    await sp.waitForCards();
    const names = await sp.getCardNames();
    expect(names.length).toBe(TOTAL);
  });

  test('S-06: selecting "All" resets status filter', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.selectStatus('ACTIVE');
    await sp.selectStatus('');
    await sp.waitForCards();
    const names = await sp.getCardNames();
    expect(names.length).toBe(TOTAL);
  });

  // ── Search ─────────────────────────────────────────────────────────────────

  test('B-01: typing in search filters cards by name', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.search('Central');
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Bodega Principal' }).first()).not.toBeVisible();
  });

  test('B-02: search with no matches shows no-results message', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.search('xyznonexistent');
    await expect(sp.noResultsTitle()).toBeVisible();
  });

  test('B-03: search chip with quoted term appears', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.search('Central');
    await expect(sp.filterChips().filter({ hasText: 'Central' })).toBeVisible();
  });

  test('B-04: clicking X on search chip clears search', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.search('Central');
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();
    await sp.filterChips().filter({ hasText: 'Central' }).click();
    await expect(page.locator('main h3').filter({ hasText: 'Bodega Principal' }).first()).toBeVisible();
    const names = await sp.getCardNames();
    expect(names.length).toBe(TOTAL);
  });

  test('B-05: no "Create" button in no-results header', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.search('xyznonexistent');
    await expect(sp.noResultsTitle()).toBeVisible();
    await expect(sp.createButton).not.toBeVisible();
  });

  test('B-06: "Clear search" button resets filters', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.search('xyznonexistent');
    await expect(sp.noResultsTitle()).toBeVisible();
    await sp.clearSearchButton().click();
    await sp.waitForCards();
    const names = await sp.getCardNames();
    expect(names.length).toBe(TOTAL);
  });

  test('B-07: "View all" button resets all filters', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.search('xyznonexistent');
    await expect(sp.noResultsTitle()).toBeVisible();
    await sp.viewAllButton().click();
    await sp.waitForCards();
    const names = await sp.getCardNames();
    expect(names.length).toBe(TOTAL);
  });

  test('B-08: 3 suggestion cards in no-results state', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.search('xyznonexistent');
    await expect(page.getByText('Check spelling', { exact: true })).toBeVisible();
    await expect(page.getByText('Adjust filters', { exact: true })).toBeVisible();
    await expect(page.getByText('Create new', { exact: true })).toBeVisible();
  });

  // ── Sort ───────────────────────────────────────────────────────────────────

  test('O-01: sort button shows "A → Z" by default', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await expect(sp.sortButton).toContainText('A → Z');
  });

  test('O-02: clicking sort toggles to "Z → A"', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.toggleSort();
    await expect(sp.sortButton).toContainText('Z → A');
  });

  test('O-03: cards reorder after sort change', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    const ascNames = await sp.getCardNames();

    const descResponse = page.waitForResponse(
      (res) => res.url().includes('/api/storages') && res.url().includes('sortOrder=DESC'),
    );
    await sp.toggleSort();
    await descResponse;
    await expect(sp.sortButton).toContainText('Z → A');
    const descNames = await sp.getCardNames();
    expect(ascNames.slice(1)[0]).not.toBe(descNames.slice(1)[0]);
  });

  // ── Combined filters ───────────────────────────────────────────────────────

  test('FC-01: status "Active" + search "Central" shows only active matching storages', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.selectStatus('ACTIVE');
    await sp.search('Central');
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Norte' }).first()).not.toBeVisible();
  });

  test('FC-02: type "Warehouses" + status "Frozen" shows only frozen warehouses', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.tabWarehouses.click();
    await sp.selectStatus('FROZEN');
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Norte' }).first()).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).not.toBeVisible();
  });

  test('FC-03: type + status + search applies all three with AND', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.tabWarehouses.click();
    await expect(page.locator('main h3').filter({ hasText: 'Bodega Principal' }).first()).not.toBeVisible();
    await sp.selectStatus('ACTIVE');
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Norte' }).first()).not.toBeVisible();
    await sp.search('Central');
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();
    const names = await sp.getCardNames();
    expect(names.length).toBe(1);
  });

  test('FC-04: multiple chips show simultaneously for status and search', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.selectStatus('ACTIVE');
    await sp.search('Central');
    await expect(sp.filterChip('Active')).toBeVisible();
    await expect(sp.filterChips().filter({ hasText: 'Central' })).toBeVisible();
  });

  test('FC-05: removing one chip keeps the other filter active', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.selectStatus('ACTIVE');
    await sp.search('Central');
    await sp.filterChip('Active').click();
    await expect(sp.filterChips().filter({ hasText: 'Central' })).toBeVisible();
    await expect(page.locator('main h3').filter({ hasText: 'Almacen Central' }).first()).toBeVisible();
  });
});
