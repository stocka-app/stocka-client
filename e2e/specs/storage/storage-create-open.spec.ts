import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

// ─── Shared mock data ─────────────────────────────────────────────────────────

const ONE_WAREHOUSE = buildStoragesResponse([
  buildStorage({ name: 'Central Warehouse', type: 'WAREHOUSE', status: 'ACTIVE' }),
]);

// ═════════════════════════════════════════════════════════════════════════════
// CD-01 — CD-04: Entry points that open the drawer
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user has STORAGE_CREATE permission and storages exist', () => {
  test('CD-01: When the user clicks the "New storage" header button, Then Step 1 of the drawer opens', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ONE_WAREHOUSE });
    await new StoragesListPage(page).waitForCards();

    await drawer.openDrawer();

    await expect(drawer.drawer).toBeVisible();
    await expect(page.locator('p').getByText('STEP 1 OF 2')).toBeVisible();
  });

  test('CD-02: When the user clicks the empty-state CTA, Then Step 1 of the drawer opens', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([]),
    });

    await expect(storagesPage.emptyCreateButton()).toBeVisible();
    await storagesPage.emptyCreateButton().click();

    await expect(drawer.drawer).toBeVisible();
    await expect(page.locator('p').getByText('STEP 1 OF 2')).toBeVisible();
  });

  test('CD-03: When the user clicks the inline create card in the grid, Then Step 1 of the drawer opens', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ONE_WAREHOUSE });
    await storagesPage.waitForCards();

    await storagesPage.createInlineCard.click();

    await expect(drawer.drawer).toBeVisible();
    await expect(page.locator('p').getByText('STEP 1 OF 2')).toBeVisible();
  });

  test('CD-04: When the drawer is opened from any entry point, Then all 3 type cards are visible in Step 1', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ONE_WAREHOUSE });
    await storagesPage.waitForCards();

    await drawer.openDrawer();

    await expect(drawer.warehouseCard).toBeVisible();
    await expect(drawer.storeRoomCard).toBeVisible();
    await expect(drawer.customRoomCard).toBeVisible();
  });
});
