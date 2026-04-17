import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateStoreRoom,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';

// ═════════════════════════════════════════════════════════════════════════════
// FREE tier fully saturated — all types blocked (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('FREE tier saturated (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('CD-42: When all FREE slots are consumed and user clicks Custom area, Then the upgrade modal opens', async ({ page }) => {
    test.setTimeout(60_000);
    // Onboarding creates 1 custom room → 1/1. Create 1 store room → 1/1.
    const email = `pw_fs42_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_fs42_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'FREE');

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateStoreRoom(accessToken, 'Mi Bodeguita', 'Calle 1');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.customRoomCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
  });

  test('CD-43: When all FREE slots are consumed and user clicks Store Room, Then the upgrade modal opens', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_fs43_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_fs43_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'FREE');

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateStoreRoom(accessToken, 'Mi Bodeguita', 'Calle 1');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.storeRoomCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
  });
});
