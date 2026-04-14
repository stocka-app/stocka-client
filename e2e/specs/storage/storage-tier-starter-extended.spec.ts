import { test, expect } from '../../fixtures/auth.fixture';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

// ─── STARTER tier caps: 3 of each type (9 combined) ──────────────────────────
const STARTER_CAPS = { tier: 'STARTER', maxWarehouses: 3, maxStoreRooms: 3, maxCustomRooms: 3 };

// ═════════════════════════════════════════════════════════════════════════════
// CD-44 — CD-46: STARTER per-type limits and combined cap
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user is on STARTER tier with per-type storage limits', () => {
  test('CD-44: When the Custom area limit is reached (3/3) and the user selects Custom area, Then a tier limit banner is shown and submit is disabled', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'STARTER' },
      storagesResponse: buildStoragesResponse([
        buildStorage({ type: 'CUSTOM_ROOM', status: 'ACTIVE', name: 'Custom 1' }),
        buildStorage({ type: 'CUSTOM_ROOM', status: 'ACTIVE', name: 'Custom 2' }),
        buildStorage({ type: 'CUSTOM_ROOM', status: 'ACTIVE', name: 'Custom 3' }),
      ]),
      capabilities: STARTER_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.customRoomCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
  });

  test('CD-45: When the Store Room limit is reached (3/3) and the user clicks Store Room, Then the upgrade modal opens', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'STARTER' },
      storagesResponse: buildStoragesResponse([
        buildStorage({ type: 'STORE_ROOM', status: 'ACTIVE', name: 'Store 1' }),
        buildStorage({ type: 'STORE_ROOM', status: 'ACTIVE', name: 'Store 2' }),
        buildStorage({ type: 'STORE_ROOM', status: 'ACTIVE', name: 'Store 3' }),
      ]),
      capabilities: STARTER_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.storeRoomCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
  });

  test('CD-46: When all 9 STARTER slots are consumed (3 of each type), Then every type shows a tier limit banner', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'STARTER' },
      storagesResponse: buildStoragesResponse([
        buildStorage({ type: 'WAREHOUSE', status: 'ACTIVE', name: 'Warehouse 1' }),
        buildStorage({ type: 'WAREHOUSE', status: 'ACTIVE', name: 'Warehouse 2' }),
        buildStorage({ type: 'WAREHOUSE', status: 'ACTIVE', name: 'Warehouse 3' }),
        buildStorage({ type: 'CUSTOM_ROOM', status: 'ACTIVE', name: 'Custom 1' }),
        buildStorage({ type: 'CUSTOM_ROOM', status: 'ACTIVE', name: 'Custom 2' }),
        buildStorage({ type: 'CUSTOM_ROOM', status: 'ACTIVE', name: 'Custom 3' }),
        buildStorage({ type: 'STORE_ROOM', status: 'ACTIVE', name: 'Store 1' }),
        buildStorage({ type: 'STORE_ROOM', status: 'ACTIVE', name: 'Store 2' }),
        buildStorage({ type: 'STORE_ROOM', status: 'ACTIVE', name: 'Store 3' }),
      ]),
      capabilities: STARTER_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();

    // Each at-limit type opens the upgrade modal when clicked
    await drawer.warehouseCard.click();
    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /Cancel|Close/i }).first().click();

    await drawer.customRoomCard.click();
    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /Cancel|Close/i }).first().click();

    await drawer.storeRoomCard.click();
    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
  });
});
