import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';
import {
  setupAndNavigate,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

// ─── Shared setup ─────────────────────────────────────────────────────────────

const EMPTY_RESPONSE = buildStoragesResponse([]);

/**
 * STARTER capabilities — enough quota for all types so tier limits never fire
 * (FREE plan blocks warehouses entirely).
 */
const STARTER_CAPS = { tier: 'STARTER', maxWarehouses: 1, maxStoreRooms: 3, maxCustomRooms: 3 };

// ═════════════════════════════════════════════════════════════════════════════
// CD-39 — CD-44: Cancel / dirty state behavior
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user has the Create Installation drawer open', () => {
  test('CD-39: When the form is clean and the user clicks the close button, Then the drawer closes without a confirmation dialog', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();

    // Advance to Step 2 without typing anything in the form
    await drawer.selectType('WAREHOUSE');

    // Click close — no data entered, no dialog expected
    await drawer.closeButton.click();

    await expect(drawer.cancelConfirmDialog).not.toBeVisible();
    await expect(drawer.drawer).not.toBeVisible();
  });

  test('CD-40: When the user has typed a name and clicks the close button, Then a cancel confirmation dialog appears', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');

    await drawer.fillStep2({ name: 'Some warehouse' });
    await drawer.closeButton.click();

    await expect(drawer.cancelConfirmDialog).toBeVisible();
  });

  test('CD-41: When the cancel confirm dialog is open and the user clicks "Keep editing", Then the drawer stays open with the typed data preserved', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.fillStep2({ name: 'Some warehouse' });

    // Trigger confirm dialog
    await drawer.closeButton.click();
    await expect(drawer.cancelConfirmDialog).toBeVisible();

    // Keep editing
    await drawer.keepEditingButton.click();

    // Drawer stays open
    await expect(drawer.cancelConfirmDialog).not.toBeVisible();
    await expect(drawer.drawer).toBeVisible();

    // Data is preserved
    await expect(drawer.nameInput).toHaveValue('Some warehouse');
  });

  test('CD-42: When the user clicks "Abandon" in the confirmation dialog, Then the drawer closes and data is discarded', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.fillStep2({ name: 'Some warehouse', address: 'Av. Test 1' });

    // Trigger confirm dialog
    await drawer.closeButton.click();
    await expect(drawer.cancelConfirmDialog).toBeVisible();

    // Abandon
    await drawer.abandonButton.click();

    await expect(drawer.drawer).not.toBeVisible();
  });

  test('CD-43: When the user has typed data and clicks the "Back" (footer cancel) button, Then the same confirmation dialog appears', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.fillStep2({ name: 'Warehouse with data' });

    // Footer "Back" button triggers dirty check
    await drawer.cancelButton.click();

    await expect(drawer.cancelConfirmDialog).toBeVisible();
  });

  test('CD-44: When the drawer is re-opened after abandoning, Then Step 1 is shown and no previous data is present', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });

    // First open — type some data
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.fillStep2({ name: 'Data that should be gone' });

    // Abandon
    await drawer.closeButton.click();
    await drawer.abandonButton.click();
    await expect(drawer.drawer).not.toBeVisible();

    // Re-open
    await storagesPage.emptyCreateButton().click();

    // Step 1 is shown (type-selection)
    await expect(page.locator('p').getByText('STEP 1 OF 2')).toBeVisible();

    // Drawer is back at Step 1 (not Step 2 with previous data)
    await expect(drawer.warehouseCard).toBeVisible();
    await expect(drawer.nameInput).not.toBeVisible();
  });
});
