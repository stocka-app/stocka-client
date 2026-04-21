import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateWarehouse,
  apiCreateStoreRoom,
  apiFreezeStorage,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { StoragesListPage } from '../../pages/storages-list.page';

// ═════════════════════════════════════════════════════════════════════════════
// Archive flow — PW-H06-1, PW-H06-2, PW-H06-3, PW-H06-6
//
// Real E2E: no page.route() mocks.
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Archive storage flow (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_archive_${ts}@stocka.test`;
  const username = `pw_archive_${ts}`;
  const password = 'TestPass1!';

  let warehouseName: string;
  let storeRoomName: string;
  let frozenWarehouseName: string;
  let frozenWarehouseUUID: string;

  test.beforeAll(async () => {
    pool = createDbPool();

    const signUp = await apiSignUp({ email, username, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);

    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);

    await setTierByUserUuid(pool, signUp.userId, 'STARTER');

    const { accessToken } = await apiSignIn(email, password);

    const wh = await apiCreateWarehouse(accessToken, 'Almacén A Archivar', 'Av. Archivar 100');
    warehouseName = wh.name;

    const sr = await apiCreateStoreRoom(accessToken, 'Bodega Dos', 'Calle 2, 222');
    storeRoomName = sr.name;

    const frozenWh = await apiCreateWarehouse(accessToken, 'Almacén Congelado', 'Av. Frio 300');
    frozenWarehouseName = frozenWh.name;
    frozenWarehouseUUID = frozenWh.storageUUID;
    await apiFreezeStorage(accessToken, 'WAREHOUSE', frozenWarehouseUUID);
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('PW-H06-1: When the user clicks Archive and confirms, Then the undo toast appears', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(warehouseName);
    await list.menuItems.archive.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(warehouseName);

    await dialog.getByRole('button', { name: /^Archive$/i }).click();

    await expect(
      page.getByText(new RegExp(`"${warehouseName}" was archived`, 'i')),
    ).toBeVisible({ timeout: 5_000 });

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });

  test('PW-H06-2: When the user tries to archive the only active storage, Then the dialog shows a warning', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    // After PW-H06-1 archived warehouseName, we need a user with only 1 active storage.
    // Create a fresh user with exactly 1 active storage (the onboarding default).
    const ts2 = Date.now();
    const email2 = `pw_archive_last_${ts2}@stocka.test`;
    const username2 = `pw_archive_last_${ts2}`;

    const signUp2 = await apiSignUp({ email: email2, username: username2, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email2);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp2.accessToken);
    await setTierByUserUuid(pool, signUp2.userId, 'FREE');

    await signInAndNavigateToStorages(page, email2, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    // The onboarding creates a default storage — it's the only active one
    const cards = await list.getCardNames();
    const onlyStorageName = cards[0];

    await list.openCardMenu(onlyStorageName);
    await list.menuItems.archive.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(/last operational storage/i);
    await expect(
      dialog.getByRole('button', { name: /Archive anyway/i }),
    ).toBeVisible();
  });

  test('PW-H06-3: When the user archives a FROZEN storage, Then the dialog shows the frozen info and archive succeeds', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(frozenWarehouseName);
    await list.menuItems.archive.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(/frozen/i);

    await dialog.getByRole('button', { name: /^Archive$/i }).click();

    await expect(
      page.getByText(new RegExp(`"${frozenWarehouseName}" was archived`, 'i')),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('PW-H06-6: When the user clicks Undo after archiving, Then the storage is restored', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    // Ensure storeRoomName is still ACTIVE (not archived by a previous test)
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(storeRoomName);
    await list.menuItems.archive.click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^Archive$/i }).click();

    const undoButton = page.getByRole('button', { name: /Undo/i });
    await expect(undoButton).toBeVisible({ timeout: 6_000 });
    await undoButton.click();

    await expect(
      page.getByText(new RegExp(`"${storeRoomName}" was restored`, 'i')),
    ).toBeVisible({ timeout: 5_000 });
  });
});
