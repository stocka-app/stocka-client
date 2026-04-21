import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  clearAllStoragesForUser,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';

// ═════════════════════════════════════════════════════════════════════════════
// FREE tier happy paths — allowed types (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('FREE tier allowed types (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('CD-39: FREE with 0 storages — Custom area opens Step 2 with no tier banner', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_fa39_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_fa39_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'FREE');
    await clearAllStoragesForUser(pool, signUp.userId);

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('CUSTOM_ROOM');

    await expect(drawer.nameInput).toBeVisible({ timeout: 5_000 });
    await expect(drawer.tierLimitBanner).not.toBeVisible();
  });

  test('CD-40: FREE with 0 storages — Store Room opens Step 2 with no tier banner', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_fa40_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_fa40_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'FREE');
    await clearAllStoragesForUser(pool, signUp.userId);

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');

    await expect(drawer.nameInput).toBeVisible({ timeout: 5_000 });
    await expect(drawer.tierLimitBanner).not.toBeVisible();
  });

  test('CD-41: FREE with 1 Custom area used — Store Room still opens Step 2 (independent quota)', async ({ page }) => {
    test.setTimeout(60_000);
    // Onboarding creates 1 custom room by default → 1/1 used for CR, but SR is 0/1
    const email = `pw_fa41_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_fa41_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'FREE');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');

    await expect(drawer.nameInput).toBeVisible({ timeout: 5_000 });
    await expect(drawer.tierLimitBanner).not.toBeVisible();
  });
});
