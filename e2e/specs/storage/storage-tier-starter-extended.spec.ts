import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateWarehouse,
  apiCreateStoreRoom,
  apiCreateCustomRoom,
  clearAllStoragesForUser,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';

// ═════════════════════════════════════════════════════════════════════════════
// STARTER per-type limits (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('STARTER tier per-type limits (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('CD-44: When Custom area limit is reached (3/3), Then clicking Custom area opens the upgrade modal', async ({ page }) => {
    test.setTimeout(90_000);
    const email = `pw_se44_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_se44_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');

    const { accessToken } = await apiSignIn(email, password);
    // Onboarding creates 1 CR. Create 2 more → 3/3.
    await apiCreateCustomRoom(accessToken, 'Custom 2');
    await apiCreateCustomRoom(accessToken, 'Custom 3');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.customRoomCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
  });

  test('CD-45: When Store Room limit is reached (3/3), Then clicking Store Room opens the upgrade modal', async ({ page }) => {
    test.setTimeout(90_000);
    const email = `pw_se45_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_se45_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateStoreRoom(accessToken, 'Store 1', 'Calle 1');
    await apiCreateStoreRoom(accessToken, 'Store 2', 'Calle 2');
    await apiCreateStoreRoom(accessToken, 'Store 3', 'Calle 3');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.storeRoomCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
  });

  test('CD-46: When all 9 STARTER slots are consumed, Then every type shows the upgrade modal', async ({ page }) => {
    test.setTimeout(90_000);
    const email = `pw_se46_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_se46_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');
    await clearAllStoragesForUser(pool, signUp.userId);

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateWarehouse(accessToken, 'WH 1', 'Av 1');
    await apiCreateWarehouse(accessToken, 'WH 2', 'Av 2');
    await apiCreateWarehouse(accessToken, 'WH 3', 'Av 3');
    await apiCreateCustomRoom(accessToken, 'CR 1');
    await apiCreateCustomRoom(accessToken, 'CR 2');
    await apiCreateCustomRoom(accessToken, 'CR 3');
    await apiCreateStoreRoom(accessToken, 'SR 1', 'C 1');
    await apiCreateStoreRoom(accessToken, 'SR 2', 'C 2');
    await apiCreateStoreRoom(accessToken, 'SR 3', 'C 3');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();

    const dismissUpgradeModal = async (): Promise<void> => {
      const modal = page.getByRole('dialog', { name: /upgrade|plan/i });
      await modal.getByRole('button', { name: /Cancel|Close/i }).first().click();
      await expect(drawer.upgradeModal).not.toBeVisible({ timeout: 5_000 });
    };

    await drawer.warehouseCard.click();
    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
    await dismissUpgradeModal();

    await drawer.customRoomCard.click();
    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
    await dismissUpgradeModal();

    await drawer.storeRoomCard.click();
    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
  });
});
