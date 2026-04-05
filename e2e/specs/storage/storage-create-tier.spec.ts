import { test, expect } from '../../fixtures/auth.fixture';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

// ─── Mock data helpers ────────────────────────────────────────────────────────

/** FREE tier: WAREHOUSE limit = 0, STORE_ROOM limit = 1, CUSTOM_ROOM limit = 1 */
const FREE_CAPS = { tier: 'FREE', maxWarehouses: 0, maxStoreRooms: 1, maxCustomRooms: 1 };

/** STARTER tier: WAREHOUSE limit = 1, STORE_ROOM limit = 3, CUSTOM_ROOM limit = 3 */
const STARTER_CAPS = { tier: 'STARTER', maxWarehouses: 1, maxStoreRooms: 3, maxCustomRooms: 3 };

// ─── Storages already at their limits ────────────────────────────────────────

const ONE_ACTIVE_STORE_ROOM = buildStorage({
  name: 'Active Store Room',
  type: 'STORE_ROOM',
  status: 'ACTIVE',
  address: 'Calle 1',
});

const ONE_ACTIVE_CUSTOM_ROOM = buildStorage({
  name: 'Active Custom Room',
  type: 'CUSTOM_ROOM',
  status: 'ACTIVE',
  address: null,
});

const ONE_ACTIVE_WAREHOUSE = buildStorage({
  name: 'Active Warehouse',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: 'Av. Industrial 1',
});

// For STARTER at warehouse limit: 1 active warehouse (limit = 1)
const STARTER_WAREHOUSES_AT_LIMIT = buildStoragesResponse([ONE_ACTIVE_WAREHOUSE]);

// For STARTER with available quota: 0 of each type used
const STARTER_EMPTY = buildStoragesResponse([]);

// ═════════════════════════════════════════════════════════════════════════════
// CD-33 — CD-38: Tier limit enforcement inside the drawer
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user is on a tier with storage limits', () => {
  test('CD-33: When FREE plan has 0 Warehouses allowed and the user selects Warehouse type, Then a tier limit banner is shown and the submit button is disabled', async ({
    preAuthPage: page,
  }) => {
    // FREE plan: maxWarehouses = 0 → always at limit regardless of existing count
    const storeRoom = buildStorage({
      name: 'My Store Room',
      type: 'STORE_ROOM',
      status: 'ACTIVE',
      address: 'Calle A',
    });
    const customRoom = buildStorage({
      name: 'My Custom Room',
      type: 'CUSTOM_ROOM',
      status: 'ACTIVE',
      address: null,
    });

    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: buildStoragesResponse([storeRoom, customRoom]),
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.continueButton.click();

    await expect(drawer.tierLimitBanner).toBeVisible({ timeout: 5_000 });
    await expect(drawer.submitButton).toBeDisabled();
  });

  test('CD-34: When FREE plan is at the Store Room limit (1/1) and the user selects Store Room, Then a tier limit banner is shown', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: buildStoragesResponse([ONE_ACTIVE_STORE_ROOM]),
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');
    await drawer.continueButton.click();

    await expect(drawer.tierLimitBanner).toBeVisible({ timeout: 5_000 });
    await expect(drawer.submitButton).toBeDisabled();
  });

  test('CD-35: When FREE plan is at the Custom Room limit (1/1) and the user selects Custom area, Then a tier limit banner is shown', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: buildStoragesResponse([ONE_ACTIVE_CUSTOM_ROOM]),
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('CUSTOM_ROOM');
    await drawer.continueButton.click();

    await expect(drawer.tierLimitBanner).toBeVisible({ timeout: 5_000 });
    await expect(drawer.submitButton).toBeDisabled();
  });

  test('CD-36: When STARTER plan is at the Warehouse limit (1/1) and the user selects Warehouse, Then a tier limit banner is shown', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'STARTER' },
      storagesResponse: STARTER_WAREHOUSES_AT_LIMIT,
      capabilities: STARTER_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.continueButton.click();

    await expect(drawer.tierLimitBanner).toBeVisible({ timeout: 5_000 });
    await expect(drawer.submitButton).toBeDisabled();
  });

  test('CD-37: When STARTER plan has available quota for all types, Then no tier limit banner appears on any type selection', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'STARTER' },
      storagesResponse: STARTER_EMPTY,
      capabilities: STARTER_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);

    // WAREHOUSE — no banner
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.continueButton.click();
    await expect(drawer.tierLimitBanner).not.toBeVisible();

    // Back to step 1 for next type
    await drawer.changeTypeButton.click();
    await drawer.selectType('STORE_ROOM');
    await drawer.continueButton.click();
    await expect(drawer.tierLimitBanner).not.toBeVisible();

    // Back again for CUSTOM_ROOM
    await drawer.changeTypeButton.click();
    await drawer.selectType('CUSTOM_ROOM');
    await drawer.continueButton.click();
    await expect(drawer.tierLimitBanner).not.toBeVisible();
  });

  test('CD-38: When a tier limit banner is shown, Then it contains the "See plans" CTA button', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: buildStoragesResponse([ONE_ACTIVE_STORE_ROOM]),
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');
    await drawer.continueButton.click();

    await expect(drawer.tierLimitBanner).toBeVisible({ timeout: 5_000 });
    await expect(drawer.tierLimitCta).toBeVisible();
  });
});
