import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import {
  createDbPool,
  verifyUserEmail,
  addMemberToTenant,
  findTenantByUserUuid,
} from '../../helpers/db.helper';
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
// Storages list: first load, card anatomy, loader state (real BE, no mocks)
//
// Dataset: 5 storages — 3 WH (active/frozen/archived) + 1 SR + 1 CR
// Also creates a VIEWER user for RBAC tests.
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Storages list load & card anatomy (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const ownerEmail = `pw_load_${ts}@stocka.test`;
  const viewerEmail = `pw_load_viewer_${ts}@stocka.test`;
  const password = 'TestPass1!';
  const TOTAL = 5;

  test.beforeAll(async () => {
    pool = createDbPool();

    const ownerSignUp = await apiSignUp({
      email: ownerEmail,
      username: `pw_load_${ts}`,
      password,
    });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, ownerEmail);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(ownerSignUp.accessToken);
    await setTierByUserUuid(pool, ownerSignUp.userId, 'STARTER');
    await clearAllStoragesForUser(pool, ownerSignUp.userId);

    const { accessToken } = await apiSignIn(ownerEmail, password);

    // Warehouses: Active, Frozen, Archived (3/3 — full)
    const whA = await apiCreateWarehouse(accessToken, 'Almacen Central', 'Av. Industrial 500');
    const whF = await apiCreateWarehouse(accessToken, 'Almacen Norte', 'Calle Norte 100');
    const whR = await apiCreateWarehouse(accessToken, 'Almacen Sur', 'Calle Sur 300');
    await apiFreezeStorage(accessToken, 'WAREHOUSE', whF.storageUUID);
    await apiArchiveStorage(accessToken, 'WAREHOUSE', whR.storageUUID);

    // Store Room: Active (1/3)
    await apiCreateStoreRoom(accessToken, 'Bodega Principal', 'Calle Bodega 10');

    // Custom Room: Active (1/3)
    await apiCreateCustomRoom(accessToken, 'Area Exhibicion');

    // Viewer: sign up + add to owner's tenant
    const viewerSignUp = await apiSignUp({
      email: viewerEmail,
      username: `pw_load_viewer_${ts}`,
      password,
    });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, viewerEmail);

    const tenantUuid = await findTenantByUserUuid(pool, ownerSignUp.userId);
    if (!tenantUuid) throw new Error('Owner tenant not found');
    await addMemberToTenant(pool, tenantUuid, viewerSignUp.userId, 'VIEWER');
  });

  test.afterAll(async () => {
    await pool.end();
  });

  // ── Section 1: First load ──────────────────────────────────────────────────

  test('L-01: navigating to /storages shows cards after load', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await expect(sp.heading).toBeVisible();
  });

  test.fixme(
    'L-02: skeleton shows placeholder cards while loading',
    async () => {},
  );
  test.fixme(
    'L-03: skeleton does not block screen with overlay',
    async () => {},
  );

  test('L-04: header shows title and subtitle', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await expect(sp.heading).toBeVisible();
    await expect(sp.subtitle).toBeVisible();
  });

  test('L-04b: "New storage" button visible for owner', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await expect(sp.createButton).toBeVisible();
  });

  test('L-05: 4 tabs with counts, "All" selected by default', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.tabAll).toBeVisible();
    await expect(sp.tabWarehouses).toBeVisible();
    await expect(sp.tabStoreRooms).toBeVisible();
    await expect(sp.tabCustomRooms).toBeVisible();
    await expect(sp.tabAll).toHaveAttribute('aria-selected', 'true');
  });

  test('L-06: stats bar shows Active, Frozen, and Archived counters', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.statsBar).toBeVisible();
    await expect(page.getByText('Active').first()).toBeVisible();
    await expect(page.getByText('Frozen').first()).toBeVisible();
    await expect(page.getByText('Archived').first()).toBeVisible();
  });

  test('L-07: search input, status filter, and sort button are visible', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.searchInput).toBeVisible();
    await expect(sp.statusDropdown).toBeVisible();
    await expect(sp.sortButton).toBeVisible();
  });

  test('L-08: grid shows all storage cards', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    const names = await sp.getCardNames();
    expect(names.length).toBe(TOTAL);
  });

  test('L-09: inline create card shown for owners with available slots', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.createInlineCard).toBeVisible();
  });

  test('L-09b: inline create card NOT shown for viewers', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, viewerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.createInlineCard).not.toBeVisible();
  });

  // ── Section 2: Card anatomy ────────────────────────────────────────────────

  test('C-01: WAREHOUSE card shows "Warehouse" badge', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.cardTypeBadge('Almacen Central')).toHaveText('Warehouse');
  });

  test('C-02: STORE_ROOM card shows "Store Room" badge', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.cardTypeBadge('Bodega Principal')).toHaveText('Store Room');
  });

  test('C-03: CUSTOM_ROOM card shows "Custom Room" badge', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.cardTypeBadge('Area Exhibicion')).toHaveText('Custom Room');
  });

  test('C-04: ACTIVE card shows "Active" status indicator', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.cardStatusLabel('Almacen Central')).toHaveAccessibleName('Active');
  });

  test('C-05: FROZEN card shows "Frozen" status indicator', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.cardStatusLabel('Almacen Norte')).toHaveAccessibleName('Frozen');
  });

  test('C-06: ARCHIVED card shows "Archived" status indicator with faded content', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.cardStatusLabel('Almacen Sur')).toHaveAccessibleName('Archived');
    const fadedContent = sp.card('Almacen Sur').locator('.opacity-60').first();
    await expect(fadedContent).toBeVisible();
  });

  test('C-07: card with address shows the address', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(page.getByText('Av. Industrial 500')).toBeVisible();
  });

  test('C-09: card shows product count placeholder', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(page.getByText('— products').first()).toBeVisible();
  });

  test('C-10: all card names are visible', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    const names = await sp.getCardNames();
    expect(names.length).toBe(TOTAL);
    for (const name of names) {
      await expect(
        page.locator('main h3').filter({ hasText: name }).first(),
      ).toBeVisible();
    }
  });

  // ── Section 12: Loader state ───────────────────────────────────────────────

  test.fixme(
    'LS-01: filtering with existing data shows opacity overlay + spinner',
    async () => {},
  );
  test.fixme(
    'LS-03: loader shows "Loading storages..." label',
    async () => {},
  );

  test('LS-05: after load completes, cards are at full opacity', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    const gridWithOpacity = page.locator('.grid.opacity-30');
    await expect(gridWithOpacity).not.toBeVisible();
  });
});
