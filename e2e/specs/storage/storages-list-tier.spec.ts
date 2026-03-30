import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

// ─── Mock data: FREE tier with 1 active WAREHOUSE (at limit) ─────────────────

const AT_LIMIT_WAREHOUSE = buildStorage({
  name: 'My Only Warehouse',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: 'Calle 1',
});

const AVAILABLE_ROOM = buildStorage({
  name: 'A Custom Room',
  type: 'CUSTOM_ROOM',
  status: 'ACTIVE',
  address: null,
});

// For STARTER tier: warehouse limit = 1 (has 0 active → not at limit)
const STARTER_RBAC = { ...RBAC_OWNER, tier: 'STARTER' };

// ═════════════════════════════════════════════════════════════════════════════
// Section 11: Tier limit / Upgrade
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 11: Tier limit / Upgrade', () => {
  // TL-01: FREE plan at warehouse quota with type filter active → upgrade card
  test('TL-01: upgrade card shown when type filter is active and at limit', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([AT_LIMIT_WAREHOUSE]),
      capabilities: { tier: 'FREE', maxCustomRooms: 1, maxStoreRooms: 1, maxWarehouses: 1 },
    });

    await storagesPage.waitForCards();

    // Click Warehouses tab to activate the type filter
    await storagesPage.tabWarehouses.click();

    // Upgrade card should appear
    await expect(storagesPage.upgradeCard).toBeVisible();
  });

  // TL-02: Upgrade card shows correct texts
  test('TL-02: upgrade card shows "Plan limit reached" and "See plans"', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([AT_LIMIT_WAREHOUSE]),
      capabilities: { tier: 'FREE', maxCustomRooms: 1, maxStoreRooms: 1, maxWarehouses: 1 },
    });

    await storagesPage.waitForCards();
    await storagesPage.tabWarehouses.click();

    await expect(page.getByText('Plan limit reached')).toBeVisible();
    await expect(page.getByText('Upgrade to create more storages of this type.')).toBeVisible();
    await expect(page.getByText('See plans')).toBeVisible();
  });

  // TL-04: Without type filter → normal create card at end of grid
  test('TL-04: without type filter active, normal create card is shown', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([AT_LIMIT_WAREHOUSE]),
      capabilities: { tier: 'FREE', maxCustomRooms: 1, maxStoreRooms: 1, maxWarehouses: 1 },
    });

    await storagesPage.waitForCards();

    // No type filter → should show inline create card
    await expect(storagesPage.createInlineCard).toBeVisible();
    await expect(storagesPage.upgradeCard).not.toBeVisible();
  });

  // TL-05: Plan with available quota → create card visible
  test('TL-05: plan with available quota shows create card, no upgrade card', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([AVAILABLE_ROOM]),
      capabilities: { tier: 'STARTER', maxCustomRooms: 3, maxStoreRooms: 3, maxWarehouses: 1 },
    });

    await storagesPage.waitForCards();
    await storagesPage.tabCustomRooms.click();

    // Should show create card, not upgrade card (1 of 3 used)
    await expect(storagesPage.createInlineCard).toBeVisible();
    await expect(storagesPage.upgradeCard).not.toBeVisible();
  });
});
