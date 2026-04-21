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
// Freeze / Unfreeze flow — real E2E, no mocks
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Freeze / Unfreeze storage flow (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_freeze_${ts}@stocka.test`;
  const username = `pw_freeze_${ts}`;
  const password = 'TestPass1!';

  let activeWarehouseName: string;
  let frozenWarehouseName: string;
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

    const wh1 = await apiCreateWarehouse(accessToken, 'Almacén Central', 'Av. Industrial 500');
    activeWarehouseName = wh1.name;

    const wh2 = await apiCreateWarehouse(accessToken, 'Almacén Norte', 'Calle Norte 100');
    frozenWarehouseName = wh2.name;
    await apiFreezeStorage(accessToken, 'WAREHOUSE', wh2.storageUUID);

    const sr = await apiCreateStoreRoom(accessToken, 'Bodega Sur', 'Calle Sur 200');
    storeRoomName = sr.name;
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('PW-1: When the user freezes an active storage, Then the undo toast appears', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(activeWarehouseName);
    await list.menuItems.freeze.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(/Freeze "/i);

    await dialog.getByRole('button', { name: /^Freeze$/i }).click();

    await expect(
      page.getByText(new RegExp(`"${activeWarehouseName}" was frozen`, 'i')),
    ).toBeVisible({ timeout: 5_000 });

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });

  test('PW-2: When the user reactivates a frozen storage, Then a success toast appears without a dialog', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(frozenWarehouseName);
    await list.menuItems.unfreeze.click();

    await expect(
      page.getByText(new RegExp(`"${frozenWarehouseName}" was reactivated`, 'i')),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('PW-H05-2: When the user tries to freeze the only active storage, Then the dialog shows a warning', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    // Create user with only 1 active storage (the onboarding default)
    const ts2 = Date.now();
    const email2 = `pw_freeze_last_${ts2}@stocka.test`;
    const signUp2 = await apiSignUp({ email: email2, username: `pw_freeze_last_${ts2}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email2);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp2.accessToken);
    await setTierByUserUuid(pool, signUp2.userId, 'FREE');

    await signInAndNavigateToStorages(page, email2, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    const cards = await list.getCardNames();
    const onlyStorageName = cards[0];

    await list.openCardMenu(onlyStorageName);
    await list.menuItems.freeze.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText(/last operational storage/i)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /freeze anyway/i })).toBeVisible();
  });

  test('PW-H05-5: When the user edits a frozen storage, Then the info banner about frozen state is shown', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    // Re-freeze frozenWarehouse if PW-2 reactivated it
    const { accessToken } = await apiSignIn(email, password);
    const storagesRes = await fetch(
      `${process.env.PW_API_URL ?? 'http://localhost:3001/api'}/storages?search=${encodeURIComponent(frozenWarehouseName)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const body = (await storagesRes.json()) as {
      data: { items: { uuid: string; type: string; status: string }[] };
    };
    const target = body.data.items.find((i) => i.status === 'ACTIVE');
    if (target) {
      await apiFreezeStorage(accessToken, 'WAREHOUSE', target.uuid);
    }

    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(frozenWarehouseName);
    await list.menuItems.edit.click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible({ timeout: 5_000 });
    await expect(drawer.getByText(/is frozen/i)).toBeVisible();
  });

  test('PW-H05-7: When a concurrent freeze makes the server reject, Then the dialog shows an error and the button is re-enabled', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    // Ensure storeRoom is ACTIVE
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(storeRoomName);
    await list.menuItems.freeze.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Simulate a concurrent freeze: freeze the storage via API WHILE the dialog
    // is open. When the user clicks Confirm, the BE returns 409 ALREADY_FROZEN.
    const { accessToken } = await apiSignIn(email, password);
    const storagesRes = await fetch(
      `${process.env.PW_API_URL ?? 'http://localhost:3001/api'}/storages?search=${encodeURIComponent(storeRoomName)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const body = (await storagesRes.json()) as {
      data: { items: { uuid: string; type: string; status: string }[] };
    };
    const sr = body.data.items.find((i) => i.status === 'ACTIVE');
    if (sr) {
      await apiFreezeStorage(accessToken, 'STORE_ROOM', sr.uuid);
    }

    // Now click Confirm — BE returns 409
    await dialog.getByRole('button', { name: /^Freeze$/i }).click();

    // Dialog stays open with error
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog.getByText(/couldn't freeze/i)).toBeVisible({ timeout: 5_000 });

    const confirmButton = dialog.getByRole('button', { name: /^Freeze$/i });
    await expect(confirmButton).toBeEnabled();
  });
});
