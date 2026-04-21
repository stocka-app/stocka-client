import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateStoreRoom,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { StoragesListPage } from '../../pages/storages-list.page';
import { EditStorageDrawerPage } from '../../pages/edit-storage-drawer.page';

// ═════════════════════════════════════════════════════════════════════════════
// Edit Storage Drawer (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Edit storage drawer (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_edit_${ts}@stocka.test`;
  const username = `pw_edit_${ts}`;
  const password = 'TestPass1!';
  let storeRoomName: string;

  test.beforeAll(async () => {
    pool = createDbPool();
    const signUp = await apiSignUp({ email, username, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');

    const { accessToken } = await apiSignIn(email, password);
    const sr = await apiCreateStoreRoom(accessToken, 'Bodega Central', 'Av. Reforma 100');
    storeRoomName = sr.name;
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('ED-1: When the edit drawer opens, Then it shows pre-loaded values', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(storeRoomName);
    await list.menuItems.edit.click();

    await expect(drawer.drawer).toBeVisible({ timeout: 5_000 });
    await expect(drawer.nameInput).toHaveValue(storeRoomName);
    await expect(drawer.addressInput).toHaveValue('Av. Reforma 100');
  });

  test('ED-2: When the name is changed and saved, Then the drawer closes', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(storeRoomName);
    await list.menuItems.edit.click();
    await expect(drawer.drawer).toBeVisible({ timeout: 5_000 });

    const newName = `Bodega Norte ${Date.now()}`;
    await drawer.fillName(newName);
    await drawer.submit();

    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });
    storeRoomName = newName;
  });

  test('ED-3: When the user modifies the name and cancels, Then the unsaved dialog appears', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(storeRoomName);
    await list.menuItems.edit.click();
    await expect(drawer.drawer).toBeVisible({ timeout: 5_000 });

    await drawer.fillName('Modified Name');
    await drawer.cancel();

    await expect(drawer.keepEditingButton).toBeVisible({ timeout: 3_000 });
  });

  test('ED-4: When Keep Editing is clicked, Then the drawer stays open with the modified value', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(storeRoomName);
    await list.menuItems.edit.click();
    await expect(drawer.drawer).toBeVisible({ timeout: 5_000 });

    await drawer.fillName('Modified Name');
    await drawer.cancel();
    await expect(drawer.keepEditingButton).toBeVisible({ timeout: 3_000 });
    await drawer.keepEditingButton.click();

    await expect(drawer.nameInput).toHaveValue('Modified Name');
  });

  test('ED-5: When the server returns a name conflict, Then an inline error is shown', async ({ page }) => {
    test.setTimeout(60_000);
    // Create a second store room to have a name to conflict with
    const { accessToken } = await apiSignIn(email, password);
    await apiCreateStoreRoom(accessToken, 'Conflicting Name', 'Calle 2');

    await signInAndNavigateToStorages(page, email, password);
    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(storeRoomName);
    await list.menuItems.edit.click();
    await expect(drawer.drawer).toBeVisible({ timeout: 5_000 });

    await drawer.fillName('Conflicting Name');
    await drawer.submit();

    await expect(drawer.drawer.getByRole('alert')).toBeVisible({ timeout: 5_000 });
  });

  test('ED-6: When no changes were made, Then the save button is disabled', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(storeRoomName);
    await list.menuItems.edit.click();
    await expect(drawer.drawer).toBeVisible({ timeout: 5_000 });

    await expect(drawer.submitButton).toBeDisabled();
  });
});
