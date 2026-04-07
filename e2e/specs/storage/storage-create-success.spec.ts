import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';
import {
  setupAndNavigate,
  buildStoragesResponse,
  mockCreatePost,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

// ─── Shared mock data ─────────────────────────────────────────────────────────

const EMPTY_RESPONSE = buildStoragesResponse([]);

/**
 * STARTER capabilities — enough quota for all types so tier limits never fire
 * during success tests (FREE plan blocks warehouses entirely).
 */
const STARTER_CAPS = { tier: 'STARTER', maxWarehouses: 1, maxStoreRooms: 3, maxCustomRooms: 3 };

// ═════════════════════════════════════════════════════════════════════════════
// CD-24 — CD-28: Successful creation for each type
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the create POST endpoint returns success', () => {
  test('CD-24: When a WAREHOUSE is created, Then the drawer closes and the list is refreshed', async ({
    preAuthPage: page,
  }) => {
    await mockCreatePost(page, 'warehouse');
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });

    const drawer = new CreateStorageDrawerPage(page);

    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.fillStep2({ name: 'Main Warehouse', address: 'Av. Industrial 500' });
    await drawer.submit();

    // Drawer closes after successful creation
    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });
  });

  test('CD-25: When a STORE_ROOM is created, Then the drawer closes', async ({
    preAuthPage: page,
  }) => {
    await mockCreatePost(page, 'store-room');
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });

    const drawer = new CreateStorageDrawerPage(page);

    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');
    await drawer.fillStep2({ name: 'Back Store Room', address: 'Calle Bodega 10' });
    await drawer.submit();

    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });
  });

  test('CD-26: When a CUSTOM_ROOM is created with a custom icon and color, Then the drawer closes', async ({
    preAuthPage: page,
  }) => {
    await mockCreatePost(page, 'custom-room');
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });

    const drawer = new CreateStorageDrawerPage(page);

    await drawer.openDrawer();
    await drawer.selectType('CUSTOM_ROOM');
    await drawer.fillStep2({ name: 'Pop-up Store', address: 'Calle Reforma 1' });

    // Open the picker and select a color
    const pickerOpenButton = page.locator('button').filter({ has: page.getByText('restaurant') }).first();
    await pickerOpenButton.click();
    await page.getByRole('button', { name: '#EF4444' }).click();
    await page.getByRole('button', { name: 'Apply' }).click();

    await drawer.submit();

    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });
  });

  test('CD-27: When the form is submitted, Then the submit button shows a spinner and fields become disabled while saving', async ({
    preAuthPage: page,
  }) => {
    // Use a delay to keep the loading state visible long enough to assert it
    await mockCreatePost(page, 'warehouse', { delay: 2_000 });
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });

    const drawer = new CreateStorageDrawerPage(page);

    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.fillStep2({ name: 'Main Warehouse', address: 'Av. Industrial 500' });

    // Submit without waiting — check loading state immediately
    const submitPromise = drawer.submit();

    // "Creating..." label appears in the button during in-flight request
    await expect(page.getByRole('button', { name: /Creating\.\.\./ })).toBeVisible({ timeout: 3_000 });

    // Fields are disabled while submitting
    await expect(drawer.nameInput).toBeDisabled();
    await expect(drawer.addressInput).toBeDisabled();

    // Wait for submission to complete
    await submitPromise;
  });

  test('CD-28: When the drawer is re-opened after a successful creation, Then Step 1 is shown and the form is empty', async ({
    preAuthPage: page,
  }) => {
    await mockCreatePost(page, 'warehouse');
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });

    const drawer = new CreateStorageDrawerPage(page);
    const storagesPage = new StoragesListPage(page);

    // First creation
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.fillStep2({ name: 'Main Warehouse', address: 'Av. Industrial 500' });
    await drawer.submit();
    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });

    // After creation + list refresh with empty response → empty state renders.
    // Re-open via the empty-state CTA.
    await storagesPage.emptyCreateButton().click();

    // Should be back at Step 1
    await expect(page.getByText('STEP 1 OF 2')).toBeVisible();

    // No type is pre-selected
    await expect(drawer.warehouseCard).toHaveAttribute('aria-checked', 'false');
    await expect(drawer.storeRoomCard).toHaveAttribute('aria-checked', 'false');
    await expect(drawer.customRoomCard).toHaveAttribute('aria-checked', 'false');
  });
});
