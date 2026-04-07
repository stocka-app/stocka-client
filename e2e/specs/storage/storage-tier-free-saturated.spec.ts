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

/** Both FREE storage slots consumed: 1 custom area + 1 store room (combined 2/2) */
const FREE_SATURATED = buildStoragesResponse([
  buildStorage({ type: 'CUSTOM_ROOM', status: 'ACTIVE', name: 'Mi Área Personalizada' }),
  buildStorage({ type: 'STORE_ROOM', status: 'ACTIVE', name: 'Mi Bodeguita' }),
]);

// ═════════════════════════════════════════════════════════════════════════════
// CD-42 — CD-43: FREE tier fully saturated — all types blocked
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user is on FREE tier with all storage slots consumed', () => {
  test('CD-42: When 1 custom area and 1 store room exist (2/2 combined) and the user selects Custom area, Then a tier limit banner is shown and submit is disabled', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: FREE_SATURATED,
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('CUSTOM_ROOM');
    await drawer.continueButton.click();

    await expect(drawer.tierLimitBanner).toBeVisible({ timeout: 5_000 });
    await expect(drawer.submitButton).toBeDisabled();
  });

  test('CD-43: When 1 custom area and 1 store room exist (2/2 combined) and the user selects Store Room, Then a tier limit banner is shown and submit is disabled', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: FREE_SATURATED,
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');
    await drawer.continueButton.click();

    await expect(drawer.tierLimitBanner).toBeVisible({ timeout: 5_000 });
    await expect(drawer.submitButton).toBeDisabled();
  });
});
