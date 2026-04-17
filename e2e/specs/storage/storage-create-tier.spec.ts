import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateWarehouse,
  apiCreateStoreRoom,
  clearAllStoragesForUser,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';

// ═════════════════════════════════════════════════════════════════════════════
// CD-33 — CD-40: Tier limit enforcement in the drawer (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Tier limit enforcement in create drawer (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('CD-33: When FREE plan has WAREHOUSE tier-locked, Then clicking Warehouse opens the upgrade modal', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_tier33_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_tier33_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'FREE');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.warehouseCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
    await expect(drawer.submitButton).not.toBeVisible();
  });

  test('CD-39: When FREE plan has WAREHOUSE tier-locked, Then the Warehouse card shows a STARTER+ lock badge', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_tier39_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_tier39_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'FREE');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();

    await expect(drawer.warehouseLockedBadge).toBeVisible({ timeout: 5_000 });
  });

  test('CD-40: When STARTER plan has WAREHOUSE allowed, Then the Warehouse card shows no lock badge', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_tier40_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_tier40_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');
    await clearAllStoragesForUser(pool, signUp.userId);

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();

    await expect(drawer.warehouseLockedBadge).not.toBeVisible({ timeout: 5_000 });
  });

  test('CD-34: When FREE plan is at the Store Room limit (1/1), Then clicking Store Room opens the upgrade modal', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_tier34_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_tier34_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'FREE');

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateStoreRoom(accessToken, 'Saturated SR', 'Calle 1');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.storeRoomCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
  });

  test('CD-35: When FREE plan is at the Custom Room limit (1/1), Then clicking Custom area opens the upgrade modal', async ({ page }) => {
    test.setTimeout(60_000);
    // Onboarding already creates 1 custom room → 1/1 on FREE
    const email = `pw_tier35_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_tier35_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'FREE');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.customRoomCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
  });

  test('CD-36: When STARTER is at the Warehouse limit (1/1), Then clicking Warehouse opens the upgrade modal', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_tier36_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_tier36_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER', { maxWarehouses: 1 });

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateWarehouse(accessToken, 'Saturated WH', 'Av. Test 1');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.warehouseCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
  });

  test('CD-37: When STARTER has available quota for all types, Then no tier limit banner appears on any type selection', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_tier37_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_tier37_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');
    await clearAllStoragesForUser(pool, signUp.userId);

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);

    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await expect(drawer.nameInput).toBeVisible({ timeout: 5_000 });
    await expect(drawer.tierLimitBanner).not.toBeVisible();

    await drawer.changeTypeButton.click();
    await drawer.selectType('STORE_ROOM');
    await expect(drawer.nameInput).toBeVisible({ timeout: 5_000 });
    await expect(drawer.tierLimitBanner).not.toBeVisible();

    await drawer.changeTypeButton.click();
    await drawer.selectType('CUSTOM_ROOM');
    await expect(drawer.nameInput).toBeVisible({ timeout: 5_000 });
    await expect(drawer.tierLimitBanner).not.toBeVisible();
  });

  test('CD-38: When a quota-blocked type card is clicked, Then the upgrade modal contains the "See plans" CTA', async ({ page }) => {
    test.setTimeout(60_000);
    const email = `pw_tier38_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_tier38_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'FREE');

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateStoreRoom(accessToken, 'SR Block', 'Calle 1');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.storeRoomCard.click();

    await expect(drawer.upgradeModal).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: 'Learn about plans' })).toBeVisible();
  });
});
