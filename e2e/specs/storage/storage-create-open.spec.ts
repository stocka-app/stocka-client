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
import { StoragesListPage } from '../../pages/storages-list.page';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';

// ═════════════════════════════════════════════════════════════════════════════
// CD-01 — CD-04: Entry points that open the create drawer (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Create drawer entry points (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_create_open_${ts}@stocka.test`;
  const username = `pw_create_open_${ts}`;
  const password = 'TestPass1!';
  let userId: string;

  test.beforeAll(async () => {
    pool = createDbPool();

    const signUp = await apiSignUp({ email, username, password });
    userId = signUp.userId;
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, userId, 'STARTER');

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateWarehouse(accessToken, 'Central Warehouse', 'Av. Industrial 500');
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('CD-01: When the user clicks the "New storage" header button, Then Step 1 of the drawer opens', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const drawer = new CreateStorageDrawerPage(page);
    await new StoragesListPage(page).waitForCards();

    await drawer.openDrawer();

    await expect(drawer.drawer).toBeVisible();
    await expect(page.locator('p').getByText('STEP 1 OF 2')).toBeVisible();
  });

  test('CD-02: When the user clicks the empty-state CTA, Then Step 1 of the drawer opens', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    // Create a user with zero storages (delete all after onboarding)
    const ts2 = Date.now();
    const email2 = `pw_create_empty_${ts2}@stocka.test`;
    const signUp2 = await apiSignUp({ email: email2, username: `pw_create_empty_${ts2}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email2);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp2.accessToken);
    await setTierByUserUuid(pool, signUp2.userId, 'STARTER');
    await clearAllStoragesForUser(pool, signUp2.userId);

    await signInAndNavigateToStorages(page, email2, password);

    const storagesPage = new StoragesListPage(page);
    const drawer = new CreateStorageDrawerPage(page);

    await expect(storagesPage.emptyCreateButton()).toBeVisible({ timeout: 10_000 });
    await storagesPage.emptyCreateButton().click();

    await expect(drawer.drawer).toBeVisible();
    await expect(page.locator('p').getByText('STEP 1 OF 2')).toBeVisible();
  });

  test('CD-03: When the user clicks the inline create card in the grid, Then Step 1 of the drawer opens', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const storagesPage = new StoragesListPage(page);
    const drawer = new CreateStorageDrawerPage(page);
    await storagesPage.waitForCards();

    await storagesPage.createInlineCard.click();

    await expect(drawer.drawer).toBeVisible();
    await expect(page.locator('p').getByText('STEP 1 OF 2')).toBeVisible();
  });

  test('CD-04: When the drawer is opened, Then all 3 type cards are visible in Step 1', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const storagesPage = new StoragesListPage(page);
    const drawer = new CreateStorageDrawerPage(page);
    await storagesPage.waitForCards();

    await drawer.openDrawer();

    await expect(drawer.warehouseCard).toBeVisible();
    await expect(drawer.storeRoomCard).toBeVisible();
    await expect(drawer.customRoomCard).toBeVisible();
  });
});
