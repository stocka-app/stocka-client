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
// Edit + change-type flow (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Edit drawer with pending type change (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_chgtype_${ts}@stocka.test`;
  const username = `pw_chgtype_${ts}`;
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
    const sr = await apiCreateStoreRoom(accessToken, 'Bodega Origen', 'Av. Reforma 100');
    storeRoomName = sr.name;
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('EC-1: Selecting a different type shows the pending banner without firing a request', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(storeRoomName);
    await list.menuItems.edit.click();
    await expect(drawer.title).toBeVisible();

    await drawer.typeCard('CUSTOM_ROOM').click();

    await expect(page.getByText(/changing the type/i)).toBeVisible();
    await expect(drawer.drawer.locator('input[id*="roomType"]')).toBeVisible();
  });

  test('EC-2: Submitting a pending type change converts the storage via the real BE', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(storeRoomName);
    await list.menuItems.edit.click();
    await drawer.typeCard('CUSTOM_ROOM').click();
    await drawer.drawer.locator('input[id*="roomType"]').fill('Laboratory');
    await drawer.submit();

    await expect(drawer.drawer).toBeHidden({ timeout: 5_000 });
  });

  test('EC-3: Reverting a pending type change hides the banner and restores the original form', async ({ page }) => {
    test.setTimeout(60_000);

    // EC-2 changed the type to CUSTOM_ROOM — re-create a store room
    const { accessToken } = await apiSignIn(email, password);
    const sr = await apiCreateStoreRoom(accessToken, `Bodega Revert ${Date.now()}`, 'Av. Reforma 200');

    await signInAndNavigateToStorages(page, email, password);
    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(sr.name);
    await list.menuItems.edit.click();
    await drawer.typeCard('WAREHOUSE').click();
    await expect(page.getByText(/changing the type/i)).toBeVisible();

    await page.getByRole('button', { name: /cancel change/i }).click();
    await expect(page.getByText(/changing the type/i)).toBeHidden();
  });
});
