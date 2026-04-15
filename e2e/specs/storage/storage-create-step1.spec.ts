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
// CD-05 — CD-09: Type selection behavior
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the drawer is open at Step 1', () => {
  test('CD-05: When Step 1 is displayed, Then exactly 3 type cards are shown (Warehouse, Store Room, Custom area)', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();

    await expect(drawer.warehouseCard).toBeVisible();
    await expect(drawer.storeRoomCard).toBeVisible();
    await expect(drawer.customRoomCard).toBeVisible();

    // Exactly 3 type cards
    const allCards = page.locator('[data-testid^="type-card-"]');
    await expect(allCards).toHaveCount(3);
  });

  test('CD-06: When the user selects Warehouse, Then Step 2 shows an address field', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();

    await drawer.selectType('WAREHOUSE');

    await expect(page.locator('p').getByText('STEP 2 OF 2')).toBeVisible();
    await expect(drawer.addressInput).toBeVisible();
  });

  test('CD-07: When the user selects Store Room, Then Step 2 shows an address field', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();

    await drawer.selectType('STORE_ROOM');

    await expect(page.locator('p').getByText('STEP 2 OF 2')).toBeVisible();
    await expect(drawer.addressInput).toBeVisible();
  });

  test('CD-08: When the user selects Custom area, Then Step 2 shows the icon/color section', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);

    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();

    await drawer.selectType('CUSTOM_ROOM');

    await expect(page.locator('p').getByText('STEP 2 OF 2')).toBeVisible();
    await expect(drawer.iconColorSection).toBeVisible();
  });

  test('CD-09: When each type is selected and the user advances to Step 2, Then the name placeholder reflects the chosen type', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);
    const storagesPage = new StoragesListPage(page);

    // WAREHOUSE placeholder
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE, capabilities: STARTER_CAPS });
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await expect(drawer.nameInput).toHaveAttribute(
      'placeholder',
      'E.g. Central Warehouse, North Distribution Warehouse',
    );

    // Re-open for STORE_ROOM
    await drawer.closeButton.click();
    await storagesPage.emptyCreateButton().click();
    await drawer.selectType('STORE_ROOM');
    await expect(drawer.nameInput).toHaveAttribute(
      'placeholder',
      'E.g. Back store room, Emergency stock',
    );

    // Re-open for CUSTOM_ROOM
    await drawer.closeButton.click();
    await storagesPage.emptyCreateButton().click();
    await drawer.selectType('CUSTOM_ROOM');
    await expect(drawer.nameInput).toHaveAttribute(
      'placeholder',
      'E.g. Downtown Store, Polanco Branch, Counter',
    );
  });
});
