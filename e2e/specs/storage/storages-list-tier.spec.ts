import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateWarehouse,
  apiCreateCustomRoom,
  clearAllStoragesForUser,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { StoragesListPage } from '../../pages/storages-list.page';

// ═════════════════════════════════════════════════════════════════════════════
// Section 11: Tier limit / Upgrade (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Tier limit / Upgrade in storages list (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('TL-01: When the type filter is active and at limit, Then the upgrade card is shown', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_tl01_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_tl01_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'FREE', { maxWarehouses: 1, maxCustomRooms: 1, maxStoreRooms: 1 });

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateWarehouse(accessToken, 'My Only Warehouse', 'Calle 1');

    await signInAndNavigateToStorages(page, email, password);
    const storagesPage = new StoragesListPage(page);
    await storagesPage.waitForCards();

    await storagesPage.tabWarehouses.click();
    await expect(storagesPage.upgradeCard).toBeVisible();
  });

  test('TL-02: The upgrade card shows "Plan limit reached" and "See plans"', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_tl02_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_tl02_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'FREE', { maxWarehouses: 1, maxCustomRooms: 1, maxStoreRooms: 1 });

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateWarehouse(accessToken, 'Limit WH', 'Calle 1');

    await signInAndNavigateToStorages(page, email, password);
    const storagesPage = new StoragesListPage(page);
    await storagesPage.waitForCards();
    await storagesPage.tabWarehouses.click();

    await expect(page.getByText('Plan limit reached')).toBeVisible();
    await expect(page.getByText('Upgrade to create more storages of this type.')).toBeVisible();
    await expect(page.getByText('See plans')).toBeVisible();
  });

  test('TL-04: Without type filter active, the normal create card is shown instead of upgrade', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_tl04_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_tl04_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');

    await signInAndNavigateToStorages(page, email, password);
    const storagesPage = new StoragesListPage(page);
    await storagesPage.waitForCards();

    await expect(storagesPage.createInlineCard).toBeVisible();
    await expect(storagesPage.upgradeCard).not.toBeVisible();
  });

  test('TL-05: When the plan has available quota, Then the create card is shown (no upgrade)', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_tl05_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_tl05_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');

    await signInAndNavigateToStorages(page, email, password);
    const storagesPage = new StoragesListPage(page);
    await storagesPage.waitForCards();
    await storagesPage.tabCustomRooms.click();

    await expect(storagesPage.createInlineCard).toBeVisible();
    await expect(storagesPage.upgradeCard).not.toBeVisible();
  });

  test('TL-06: When FREE plan has WAREHOUSE tier-locked, Then the Warehouses tab shows a lock icon', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_tl06_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_tl06_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'FREE');

    await signInAndNavigateToStorages(page, email, password);
    const storagesPage = new StoragesListPage(page);
    await storagesPage.waitForCards();

    await expect(storagesPage.warehousesTabLockIcon).toBeVisible({ timeout: 5_000 });
    await expect(
      storagesPage.tabStoreRooms.locator('.material-symbols-outlined', { hasText: 'lock' }),
    ).not.toBeVisible();
    await expect(
      storagesPage.tabCustomRooms.locator('.material-symbols-outlined', { hasText: 'lock' }),
    ).not.toBeVisible();
  });
});
