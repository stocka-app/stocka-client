import { test, expect } from '../../fixtures/auth.fixture';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

// ─── Mock data helpers ────────────────────────────────────────────────────────

/** FREE tier: WAREHOUSE limit = 0 (blocked by tier), STORE_ROOM limit = 1, CUSTOM_ROOM limit = 1 */
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
// CD-33 — CD-40: Tier limit enforcement in the drawer
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user is on a tier with storage limits', () => {
  // ── Step 1 tier-block: FREE plan, WAREHOUSE locked ──────────────────────────

  test('CD-33: When FREE plan has WAREHOUSE tier-locked and the user clicks the Warehouse card, Then the upgrade modal opens and the drawer stays on step 1', async ({
    preAuthPage: page,
  }) => {
    const storeRoom = buildStorage({ name: 'My Store Room', type: 'STORE_ROOM', status: 'ACTIVE', address: 'Calle A' });
    const customRoom = buildStorage({ name: 'My Custom Room', type: 'CUSTOM_ROOM', status: 'ACTIVE', address: null });

    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: buildStoragesResponse([storeRoom, customRoom]),
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.warehouseCard.click();

    // Upgrade modal opens — user is blocked in step 1
    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
    // Create installation button is NOT visible (still in step 1 / upgrade modal open)
    await expect(drawer.submitButton).not.toBeVisible();
  });

  // ── Step 1 lock badge ───────────────────────────────────────────────────────

  test('CD-39: When FREE plan has WAREHOUSE tier-locked, Then the Warehouse card shows a STARTER+ lock badge', async ({
    preAuthPage: page,
  }) => {
    const customRoom = buildStorage({ name: 'My Custom Room', type: 'CUSTOM_ROOM', status: 'ACTIVE', address: null });

    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: buildStoragesResponse([customRoom]),
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();

    await expect(drawer.warehouseLockedBadge).toBeVisible({ timeout: 5_000 });
  });

  test('CD-40: When STARTER plan has WAREHOUSE allowed, Then the Warehouse card shows no lock badge', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'STARTER' },
      storagesResponse: STARTER_EMPTY,
      capabilities: STARTER_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();

    await expect(drawer.warehouseLockedBadge).not.toBeVisible({ timeout: 5_000 });
  });

  // ── Step 2 quota limits ─────────────────────────────────────────────────────

  test('CD-34: When FREE plan is at the Store Room limit (1/1) and the user clicks Store Room, Then the upgrade modal opens', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: buildStoragesResponse([ONE_ACTIVE_STORE_ROOM]),
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.storeRoomCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
  });

  test('CD-35: When FREE plan is at the Custom Room limit (1/1) and the user clicks Custom area, Then the upgrade modal opens', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: buildStoragesResponse([ONE_ACTIVE_CUSTOM_ROOM]),
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.customRoomCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
  });

  test('CD-36: When STARTER plan is at the Warehouse limit (1/1) and the user clicks Warehouse, Then the upgrade modal opens', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'STARTER' },
      storagesResponse: STARTER_WAREHOUSES_AT_LIMIT,
      capabilities: STARTER_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.warehouseCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
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
    await expect(drawer.nameInput).toBeVisible({ timeout: 5_000 }); // wait for step 2
    await expect(drawer.tierLimitBanner).not.toBeVisible();

    // Back to step 1 for next type
    await drawer.changeTypeButton.click();
    await drawer.selectType('STORE_ROOM');
    await expect(drawer.nameInput).toBeVisible({ timeout: 5_000 });
    await expect(drawer.tierLimitBanner).not.toBeVisible();

    // Back again for CUSTOM_ROOM
    await drawer.changeTypeButton.click();
    await drawer.selectType('CUSTOM_ROOM');
    await expect(drawer.nameInput).toBeVisible({ timeout: 5_000 });
    await expect(drawer.tierLimitBanner).not.toBeVisible();
  });

  test('CD-38: When a quota-blocked type card is clicked, Then the upgrade modal contains the "See plans" CTA button', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: { ...RBAC_OWNER, tier: 'FREE' },
      storagesResponse: buildStoragesResponse([ONE_ACTIVE_STORE_ROOM]),
      capabilities: FREE_CAPS,
    });

    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.storeRoomCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: 'Learn about plans' })).toBeVisible();
  });
});
