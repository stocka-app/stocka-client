import { test, expect } from '../../fixtures/auth.fixture';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';
import {
  setupAndNavigate,
  buildStoragesResponse,
  mockCreatePost,
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
// CD-29 — CD-32: Server error handling
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user has filled the Step 2 form and submits', () => {
  test('CD-29: When the server returns 409 STORAGE_NAME_ALREADY_EXISTS, Then an inline name-taken error appears under the name field', async ({
    preAuthPage: page,
  }) => {
    await mockCreatePost(page, 'warehouse', {
      status: 409,
      errorCode: 'STORAGE_NAME_ALREADY_EXISTS',
    });
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });

    const drawer = new CreateStorageDrawerPage(page);

    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.continueButton.click();
    await drawer.fillStep2({ name: 'Duplicate Name', address: 'Av. Test 1' });
    await drawer.submit();

    await expect(drawer.nameTakenError).toBeVisible({ timeout: 5_000 });
    // Drawer stays open
    await expect(drawer.drawer).toBeVisible();
  });

  test('CD-30: When a name-taken error is shown and the user submits a different name that succeeds, Then the error is cleared', async ({
    preAuthPage: page,
  }) => {
    let callCount = 0;

    // First POST → 409, second POST → 201
    await page.route(
      (url) => url.pathname === '/api/storages/warehouses',
      async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        callCount++;
        if (callCount === 1) {
          await route.fulfill({
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'STORAGE_NAME_ALREADY_EXISTS' }),
          });
        } else {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: { storageUUID: 'mock-uuid' } }),
          });
        }
      },
    );

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });

    const drawer = new CreateStorageDrawerPage(page);

    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.continueButton.click();
    await drawer.fillStep2({ name: 'Duplicate Name', address: 'Av. Test 1' });
    await drawer.submit();

    // Name-taken error appears
    await expect(drawer.nameTakenError).toBeVisible({ timeout: 5_000 });

    // Change name and re-submit — the error is cleared on the next submit attempt
    await drawer.nameInput.fill('A Unique Name');
    await drawer.submit();

    // On the second (successful) submit, the error is cleared and drawer closes
    await expect(drawer.nameTakenError).not.toBeVisible({ timeout: 5_000 });
    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });
  });

  test('CD-31: When the server returns a 500 error, Then an error banner appears, the drawer stays open, and fields preserve their data', async ({
    preAuthPage: page,
  }) => {
    await mockCreatePost(page, 'warehouse', { status: 500 });
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });

    const drawer = new CreateStorageDrawerPage(page);

    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.continueButton.click();
    await drawer.fillStep2({ name: 'My Warehouse', address: 'Av. Industrial 500' });
    await drawer.submit();

    // Server error banner appears
    await expect(drawer.serverErrorBanner).toBeVisible({ timeout: 5_000 });

    // Drawer stays open
    await expect(drawer.drawer).toBeVisible();

    // Entered data is preserved
    await expect(drawer.nameInput).toHaveValue('My Warehouse');
    await expect(drawer.addressInput).toHaveValue('Av. Industrial 500');
  });

  test('CD-32: When the server returns 403, Then the drawer stays open and the submit button is re-enabled so the user can retry', async ({
    preAuthPage: page,
  }) => {
    await mockCreatePost(page, 'warehouse', { status: 403 });
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });

    const drawer = new CreateStorageDrawerPage(page);

    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.continueButton.click();
    await drawer.fillStep2({ name: 'Blocked Warehouse', address: 'Calle Bloqueada 1' });
    await drawer.submit();

    // 403 → resolves to 'tier_limit' error code; the drawer stays open and
    // the submit button becomes enabled again (isSubmitting reverts to false).
    // The server error banner does NOT appear for tier_limit errors — only for 'server_error'.
    await expect(drawer.drawer).toBeVisible({ timeout: 5_000 });
    await expect(drawer.submitButton).toBeEnabled({ timeout: 5_000 });
  });
});
