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
// CD-39 — CD-44: Cancel / dirty state behavior (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Create drawer cancel behavior (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_cancel_${ts}@stocka.test`;
  const username = `pw_cancel_${ts}`;
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

  test('CD-39: When the form is clean and the user clicks close, Then the drawer closes without a confirmation dialog', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');
    await drawer.closeButton.click();
    await expect(drawer.cancelConfirmDialog).not.toBeVisible();
    await expect(drawer.drawer).not.toBeVisible();
  });

  test('CD-40: When the user has typed a name and clicks close, Then a cancel confirmation dialog appears', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');
    await drawer.fillStep2({ name: 'Some warehouse' });
    await drawer.closeButton.click();
    await expect(drawer.cancelConfirmDialog).toBeVisible();
  });

  test('CD-41: When the user clicks "Keep editing", Then the drawer stays open with typed data preserved', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');
    await drawer.fillStep2({ name: 'Some warehouse' });
    await drawer.closeButton.click();
    await expect(drawer.cancelConfirmDialog).toBeVisible();
    await drawer.keepEditingButton.click();
    await expect(drawer.cancelConfirmDialog).not.toBeVisible();
    await expect(drawer.drawer).toBeVisible();
    await expect(drawer.nameInput).toHaveValue('Some warehouse');
  });

  test('CD-42: When the user clicks "Abandon", Then the drawer closes and data is discarded', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');
    await drawer.fillStep2({ name: 'Some warehouse', address: 'Av. Test 1' });
    await drawer.closeButton.click();
    await expect(drawer.cancelConfirmDialog).toBeVisible();
    await drawer.abandonButton.click();
    await expect(drawer.drawer).not.toBeVisible();
  });

  test('CD-43: When the user clicks the "Back" button with dirty data, Then the confirmation dialog appears', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');
    await drawer.fillStep2({ name: 'Warehouse with data' });
    await drawer.cancelButton.click();
    await expect(drawer.cancelConfirmDialog).toBeVisible();
  });

  test('CD-44: When the drawer is re-opened after abandoning, Then Step 1 is shown with no previous data', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const storagesPage = new StoragesListPage(page);
    const drawer = new CreateStorageDrawerPage(page);

    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');
    await drawer.fillStep2({ name: 'Data that should be gone' });
    await drawer.closeButton.click();
    await drawer.abandonButton.click();
    await expect(drawer.drawer).not.toBeVisible();

    await storagesPage.emptyCreateButton().click();
    await expect(page.locator('p').getByText('STEP 1 OF 2')).toBeVisible();
    await expect(drawer.warehouseCard).toBeVisible();
    await expect(drawer.nameInput).not.toBeVisible();
  });
});
