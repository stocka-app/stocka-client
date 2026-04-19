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
  apiCreateCustomRoom,
  apiArchiveStorage,
  apiFreezeStorage,
  clearAllStoragesForUser,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { StoragesListPage } from '../../pages/storages-list.page';

// ═════════════════════════════════════════════════════════════════════════════
// Actions by role and status (real BE, no mocks)
//
// Dataset: 3 storages — active WH, frozen WH, archived CR
// Users: owner, manager, warehouse_keeper, viewer in same tenant
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 10: Actions by role and status (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const password = 'TestPass1!';

  const ownerEmail = `pw_rlo_${ts}@stocka.test`;
  const managerEmail = `pw_rlm_${ts}@stocka.test`;
  const keeperEmail = `pw_rlk_${ts}@stocka.test`;
  const viewerEmail = `pw_rlv_${ts}@stocka.test`;

  test.beforeAll(async () => {
    pool = createDbPool();

    // Owner: tenant + storages
    const ownerSignUp = await apiSignUp({
      email: ownerEmail,
      username: `pw_rlo_${ts}`,
      password,
    });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, ownerEmail);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(ownerSignUp.accessToken);
    await setTierByUserUuid(pool, ownerSignUp.userId, 'STARTER');
    await clearAllStoragesForUser(pool, ownerSignUp.userId);

    const { accessToken } = await apiSignIn(ownerEmail, password);
    const whA = await apiCreateWarehouse(accessToken, 'Active Storage', 'Calle 1');
    const whF = await apiCreateWarehouse(accessToken, 'Frozen Storage', 'Calle 2');
    const cr = await apiCreateCustomRoom(accessToken, 'Archived Storage');
    await apiFreezeStorage(accessToken, 'WAREHOUSE', whF.storageUUID);
    await apiArchiveStorage(accessToken, 'CUSTOM_ROOM', cr.storageUUID);

    const tenantUuid = await findTenantByUserUuid(pool, ownerSignUp.userId);
    if (!tenantUuid) throw new Error('Owner tenant not found');

    // Manager
    const mgrSignUp = await apiSignUp({
      email: managerEmail,
      username: `pw_rlm_${ts}`,
      password,
    });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, managerEmail);
    await addMemberToTenant(pool, tenantUuid, mgrSignUp.userId, 'MANAGER');

    // Warehouse Keeper
    const keeperSignUp = await apiSignUp({
      email: keeperEmail,
      username: `pw_rlk_${ts}`,
      password,
    });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, keeperEmail);
    await addMemberToTenant(pool, tenantUuid, keeperSignUp.userId, 'WAREHOUSE_KEEPER');

    // Viewer
    const viewerSignUp = await apiSignUp({
      email: viewerEmail,
      username: `pw_rlv_${ts}`,
      password,
    });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, viewerEmail);
    await addMemberToTenant(pool, tenantUuid, viewerSignUp.userId, 'VIEWER');
  });

  test.afterAll(async () => {
    await pool.end();
  });

  // ── Active storage ─────────────────────────────────────────────────────────

  test('R-01: Owner sees View, Edit, Archive on active storage', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.openCardMenu('Active Storage');

    await expect(sp.menuItems.view).toBeVisible();
    await expect(sp.menuItems.edit).toBeVisible();
    await expect(sp.menuItems.archive).toBeVisible();
    await expect(sp.menuItems.restore).not.toBeVisible();
    await expect(sp.menuItems.delete).not.toBeVisible();
  });

  test('R-02: Manager sees View, Edit, Archive on active storage', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, managerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.openCardMenu('Active Storage');

    await expect(sp.menuItems.view).toBeVisible();
    await expect(sp.menuItems.edit).toBeVisible();
    await expect(sp.menuItems.archive).toBeVisible();
  });

  test('R-03: Warehouse keeper sees View, Edit on active storage (Archive disabled)', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, keeperEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.openCardMenu('Active Storage');

    await expect(sp.menuItems.view).toBeVisible();
    await expect(sp.menuItems.edit).toBeVisible();
    await expect(sp.menuItems.archive).toBeDisabled();
  });

  test('R-04: Viewer sees only View on active storage', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, viewerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.openCardMenu('Active Storage');

    await expect(sp.menuItems.view).toBeVisible();
    await expect(sp.menuItems.edit).toBeDisabled();
    await expect(sp.menuItems.archive).toBeDisabled();
  });

  // ── Frozen storage ─────────────────────────────────────────────────────────

  test('R-05: Owner sees View, Edit, Archive on frozen storage', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.openCardMenu('Frozen Storage');

    await expect(sp.menuItems.view).toBeVisible();
    await expect(sp.menuItems.edit).toBeVisible();
    await expect(sp.menuItems.archive).toBeVisible();
    await expect(sp.menuItems.restore).not.toBeVisible();
    await expect(sp.menuItems.delete).not.toBeVisible();
  });

  test('R-06: Manager sees View, Edit, Archive on frozen storage', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, managerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.openCardMenu('Frozen Storage');

    await expect(sp.menuItems.view).toBeVisible();
    await expect(sp.menuItems.edit).toBeVisible();
    await expect(sp.menuItems.archive).toBeVisible();
  });

  test('R-07: Warehouse keeper sees View, Edit on frozen storage (Archive disabled)', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, keeperEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.openCardMenu('Frozen Storage');

    await expect(sp.menuItems.view).toBeVisible();
    await expect(sp.menuItems.edit).toBeVisible();
    await expect(sp.menuItems.archive).toBeDisabled();
  });

  test('R-08: Viewer sees only View on frozen storage', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, viewerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.openCardMenu('Frozen Storage');

    await expect(sp.menuItems.view).toBeVisible();
    await expect(sp.menuItems.edit).toBeDisabled();
    await expect(sp.menuItems.archive).toBeDisabled();
  });

  // ── Archived storage ───────────────────────────────────────────────────────

  test('R-09: Owner sees View, Edit, Restore and Delete on archived storage', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.openCardMenu('Archived Storage');

    await expect(sp.menuItems.view).toBeVisible();
    await expect(sp.menuItems.edit).toBeVisible();
    await expect(sp.menuItems.restore).toBeVisible();
    await expect(sp.menuItems.delete).toBeVisible();
  });

  test('R-10: Manager sees View, Edit, Restore and Delete on archived storage', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, managerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.openCardMenu('Archived Storage');

    await expect(sp.menuItems.view).toBeVisible();
    await expect(sp.menuItems.edit).toBeVisible();
    await expect(sp.menuItems.restore).toBeVisible();
    await expect(sp.menuItems.delete).toBeVisible();
  });

  test('R-11: Warehouse keeper sees View, Edit, disabled Restore and Delete', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, keeperEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.openCardMenu('Archived Storage');

    await expect(sp.menuItems.view).toBeVisible();
    await expect(sp.menuItems.edit).toBeVisible();
    await expect(sp.menuItems.restore).toBeDisabled();
    await expect(sp.menuItems.delete).toBeDisabled();
  });

  test('R-12: Viewer sees View with Restore and Delete disabled on archived storage', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, viewerEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();
    await sp.openCardMenu('Archived Storage');

    await expect(sp.menuItems.view).toBeVisible();
    await expect(sp.menuItems.restore).toBeDisabled();
    await expect(sp.menuItems.delete).toBeDisabled();
  });
});
