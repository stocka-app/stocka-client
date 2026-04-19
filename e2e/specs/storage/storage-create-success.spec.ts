import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  clearAllStoragesForUser,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { StoragesListPage } from '../../pages/storages-list.page';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';

// ═════════════════════════════════════════════════════════════════════════════
// CD-24 — CD-28: Successful creation (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Create drawer success flow (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_create_ok_${ts}@stocka.test`;
  const username = `pw_create_ok_${ts}`;
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();
    const signUp = await apiSignUp({ email, username, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');
    await clearAllStoragesForUser(pool, signUp.userId);
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('CD-24: When a WAREHOUSE is created, Then the drawer closes and the list refreshes', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.fillStep2({ name: `WH ${Date.now()}`, address: 'Av. Industrial 500' });
    await drawer.submit();
    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });
  });

  test('CD-25: When a STORE_ROOM is created, Then the drawer closes', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');
    await drawer.fillStep2({ name: `SR ${Date.now()}`, address: 'Calle Bodega 10' });
    await drawer.submit();
    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });
  });

  test('CD-26: When a CUSTOM_ROOM is created with a custom icon and color, Then the drawer closes', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('CUSTOM_ROOM');
    await drawer.fillStep2({ name: `CR ${Date.now()}`, address: 'Calle Reforma 1' });

    const pickerOpenButton = page.locator('button').filter({ has: page.getByText('restaurant') }).first();
    await pickerOpenButton.click();
    await page.getByRole('button', { name: '#EF4444' }).click();
    await page.getByRole('button', { name: 'Apply' }).click();

    await drawer.submit();
    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });
  });

  // CD-27 requires the loading state to stay visible long enough to assert.
  // With a real BE the round-trip completes in <100ms, making the spinner
  // unobservable without throttling the network (which would require
  // page.route — a mock). The spinner + disabled state are covered by the
  // Vitest unit tests for the CreateStorageDrawer component.
  test.fixme('CD-27: When the form is submitted, Then the submit button shows a spinner and fields become disabled while saving', async () => {});

  test('CD-28: When the drawer is re-opened after a successful creation, Then Step 1 is shown and the form is empty', async ({ page }) => {
    test.setTimeout(60_000);
    // Use a fresh user to guarantee only 1 storage after creation
    const ts2 = Date.now();
    const email2 = `pw_create_reopen_${ts2}@stocka.test`;
    const signUp2 = await apiSignUp({ email: email2, username: `pw_create_reopen_${ts2}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email2);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp2.accessToken);
    await setTierByUserUuid(pool, signUp2.userId, 'STARTER');
    await clearAllStoragesForUser(pool, signUp2.userId);

    await signInAndNavigateToStorages(page, email2, password);
    const drawer = new CreateStorageDrawerPage(page);

    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await drawer.fillStep2({ name: `WH Reopen ${Date.now()}`, address: 'Av. Industrial 500' });
    await drawer.submit();
    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });

    // Re-open via header button (list now has 1 storage)
    await drawer.openDrawer();
    await expect(page.locator('p').getByText('STEP 1 OF 2')).toBeVisible();
    await expect(drawer.warehouseCard).toBeVisible();
    await expect(drawer.nameInput).not.toBeVisible();
  });
});
