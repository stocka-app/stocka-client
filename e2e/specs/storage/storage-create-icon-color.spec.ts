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
// CD-19 — CD-23: Icon/color picker behavior
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user is on Step 2 of the Create Installation drawer', () => {
  test('CD-19: When WAREHOUSE is selected, Then the icon/color section shows the "Fixed icon and color" label', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');

    await expect(page.getByText('Fixed icon and color')).toBeVisible();
    await expect(page.getByText('Warehouse type does not allow customization.')).toBeVisible();
  });

  test('CD-20: When STORE_ROOM is selected, Then the icon/color section shows the "Fixed icon and color" label', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');

    await expect(page.getByText('Fixed icon and color')).toBeVisible();
    await expect(page.getByText('Store Room type does not allow customization.')).toBeVisible();
  });

  test('CD-21: When CUSTOM_ROOM is selected, Then the icon/color section shows the "Icon and color" label and a picker button', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();
    await drawer.selectType('CUSTOM_ROOM');

    // "Icon and color" label — not "Fixed icon and color"
    await expect(page.getByText('Icon and color')).toBeVisible();

    // The picker is a button (clickable to open the picker panel)
    // It shows the current icon name and color value
    await expect(page.getByText('restaurant').first()).toBeVisible(); // default icon name
  });

  test('CD-22: When the user opens the picker and selects a color swatch, Then the selected color is visually applied', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();
    await drawer.selectType('CUSTOM_ROOM');

    // Open the picker by clicking the icon/color button
    // The button wraps the current icon + color display
    const pickerOpenButton = page.getByRole('button', { name: /restaurant.*#0D9488|#0D9488.*restaurant/ }).or(
      // fallback: the clickable row that shows current icon/color
      page.locator('button').filter({ has: page.getByText('restaurant') }).first(),
    );
    await pickerOpenButton.click();

    // Picker dialog opens
    const pickerDialog = page.getByRole('dialog', { name: /Customize icon and color/i });
    await expect(pickerDialog).toBeVisible();

    // Click the red swatch (#EF4444)
    await page.getByRole('button', { name: '#EF4444' }).click();

    // Apply the selection
    await page.getByRole('button', { name: 'Apply' }).click();

    // The picker closes and the color value updates
    await expect(pickerDialog).not.toBeVisible();
    // The selected color is now shown in the icon/color row
    await expect(page.getByText('#EF4444')).toBeVisible();
  });

  test('CD-23: When CUSTOM_ROOM is created without picking a custom icon/color, Then the form submits successfully with default values', async ({
    preAuthPage: page,
  }) => {
    await mockCreatePost(page, 'custom-room');
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });

    const drawer = new CreateStorageDrawerPage(page);

    await drawer.openDrawer();
    await drawer.selectType('CUSTOM_ROOM');

    // Fill only name and address — no icon/color interaction
    await drawer.fillStep2({ name: 'Pop-up Store', address: 'Calle 5 de Mayo 10' });

    await drawer.submit();

    // Drawer closes on success
    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });
  });
});
