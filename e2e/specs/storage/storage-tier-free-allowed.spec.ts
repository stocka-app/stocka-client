import { test, expect } from '../../fixtures/auth.fixture';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

// ─── FREE tier caps: 0 warehouses, 1 custom area, 1 store room ───────────────
const FREE_CAPS = { tier: 'FREE', maxWarehouses: 0, maxStoreRooms: 1, maxCustomRooms: 1 };

// ═════════════════════════════════════════════════════════════════════════════
// CD-39 — CD-41: FREE tier happy paths — storage types that are allowed
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user is on FREE tier with storage quota available', () => {
  test('CD-39: When 0 storages exist and the user selects Custom area, Then Step 2 appears with no tier limit banner', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: buildStoragesResponse([]),
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('CUSTOM_ROOM');

    await expect(drawer.nameInput).toBeVisible({ timeout: 5_000 });
    await expect(drawer.tierLimitBanner).not.toBeVisible();
  });

  test('CD-40: When 0 storages exist and the user selects Store Room, Then Step 2 appears with no tier limit banner', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: buildStoragesResponse([]),
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');

    await expect(drawer.nameInput).toBeVisible({ timeout: 5_000 });
    await expect(drawer.tierLimitBanner).not.toBeVisible();
  });

  test('CD-41: When 1 Custom area exists (1/1 used) and the user selects Store Room, Then Step 2 appears with no tier limit banner (store room quota is independent)', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: buildStoragesResponse([
        buildStorage({ type: 'CUSTOM_ROOM', status: 'ACTIVE', name: 'Mi Área Personalizada' }),
      ]),
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');

    await expect(drawer.nameInput).toBeVisible({ timeout: 5_000 });
    await expect(drawer.tierLimitBanner).not.toBeVisible();
  });
});
