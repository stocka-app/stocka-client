import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateWarehouse,
  clearAllStoragesForUser,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';

// ═════════════════════════════════════════════════════════════════════════════
// CD-29 — CD-32: Server error handling (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Create drawer error handling (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('CD-29: When the server returns STORAGE_NAME_ALREADY_EXISTS, Then an inline name-taken error appears', async ({ page }) => {
    test.setTimeout(60_000);

    const email = `pw_err29_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_err29_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateWarehouse(accessToken, 'Duplicate Name', 'Av. Test 1');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.fillStep2({ name: 'Duplicate Name', address: 'Av. Test 2' });
    await drawer.submit();

    await expect(drawer.nameTakenError).toBeVisible({ timeout: 5_000 });
    await expect(drawer.drawer).toBeVisible();
  });

  test('CD-30: When a name-taken error is shown and the user retries with a different name, Then the error clears and the drawer closes', async ({ page }) => {
    test.setTimeout(60_000);

    const email = `pw_err30_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_err30_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateWarehouse(accessToken, 'Taken Name', 'Av. Test 1');

    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.fillStep2({ name: 'Taken Name', address: 'Av. Test 2' });
    await drawer.submit();

    await expect(drawer.nameTakenError).toBeVisible({ timeout: 5_000 });

    await drawer.nameInput.fill('A Unique Name');
    await drawer.submit();

    await expect(drawer.nameTakenError).not.toBeVisible({ timeout: 5_000 });
    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });
  });

  // CD-31 requires the BE to return a 500 Internal Server Error for a valid
  // create request, which cannot happen without mocking or corrupting state.
  // The error banner + data preservation are covered by Vitest unit tests.
  test.fixme('CD-31: When the server returns a 500 error, Then an error banner appears and fields preserve their data', async () => {});

  test('CD-32: When the warehouse tier limit is reached and the user clicks Warehouse, Then the upgrade modal opens instead of Step 2', async ({ page }) => {
    test.setTimeout(60_000);

    const email = `pw_err32_${ts}@stocka.test`;
    const signUp = await apiSignUp({ email, username: `pw_err32_${ts}`, password });
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

    // Click Warehouse card — FE detects tier limit at Step 1 and opens upgrade modal
    await drawer.warehouseCard.click();

    // Upgrade modal opens (not Step 2)
    await expect(page.getByText(/Learn about plans/i)).toBeVisible({ timeout: 5_000 });
  });
});
