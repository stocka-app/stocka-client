import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateWarehouse,
  apiCreateStoreRoom,
  apiArchiveStorage,
  apiDeletePermanentStorage,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { StoragesListPage } from '../../pages/storages-list.page';

// ═════════════════════════════════════════════════════════════════════════════
// Permanent delete flow — H-08 STOC-322 / STOC-464
//
// Real E2E: no page.route() mocks, no API stubs. Every test exercises the full
// stack — Postgres → NestJS → SPA. The 5-second cancellation grace window is
// real wall-clock time; tests that wait it out budget for it explicitly.
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Permanent delete storage flow (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_delete_perm_${ts}@stocka.test`;
  const username = `pw_delete_perm_${ts}`;
  const password = 'TestPass1!';

  // Pre-arranged storages — created once, archived, ready to be deleted by
  // each test. Because tests run serially with workers=1 we never collide.
  let archivedWarehouseName: string;
  let archivedWarehouseUUID: string;

  let archivedStoreRoomName: string;
  let archivedStoreRoomUUID: string;

  let archivedForCancelName: string;

  let archivedForEscapeName: string;

  let archivedForConcurrencyName: string;
  let archivedForConcurrencyUUID: string;

  let activeWarehouseName: string;

  let token: string;

  test.beforeAll(async () => {
    pool = createDbPool();

    const signUp = await apiSignUp({ email, username, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'GROWTH');

    const signIn = await apiSignIn(email, password);
    token = signIn.accessToken;

    // Five archived storages (one per scenario that mutates state) plus one
    // active warehouse (for the gating test where Delete must NOT appear).
    const wh1 = await apiCreateWarehouse(token, 'Almacén Eliminar Happy', 'Av. Borrar 100');
    archivedWarehouseName = wh1.name;
    archivedWarehouseUUID = wh1.storageUUID;
    await apiArchiveStorage(token, 'WAREHOUSE', archivedWarehouseUUID);

    const sr1 = await apiCreateStoreRoom(token, 'Bodega Eliminar SR', 'Calle 22, CDMX');
    archivedStoreRoomName = sr1.name;
    archivedStoreRoomUUID = sr1.storageUUID;
    await apiArchiveStorage(token, 'STORE_ROOM', archivedStoreRoomUUID);

    const wh2 = await apiCreateWarehouse(token, 'Almacén Cancel Button', 'Av. Cancelar 200');
    archivedForCancelName = wh2.name;
    await apiArchiveStorage(token, 'WAREHOUSE', wh2.storageUUID);

    const wh3 = await apiCreateWarehouse(token, 'Almacén Escape Key', 'Av. Escape 300');
    archivedForEscapeName = wh3.name;
    await apiArchiveStorage(token, 'WAREHOUSE', wh3.storageUUID);

    const wh4 = await apiCreateWarehouse(token, 'Almacén Concurrencia', 'Av. Concurrencia 400');
    archivedForConcurrencyName = wh4.name;
    archivedForConcurrencyUUID = wh4.storageUUID;
    await apiArchiveStorage(token, 'WAREHOUSE', archivedForConcurrencyUUID);

    // One ACTIVE warehouse — for the "Delete option must not appear when
    // storage is not archived" gating test.
    const wh5 = await apiCreateWarehouse(token, 'Almacén Activo NO Borrar', 'Av. Activo 500');
    activeWarehouseName = wh5.name;
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('PW-H08-1: Given an archived warehouse, When the user types the name and the 5s countdown completes, Then the storage is permanently deleted and a success toast appears', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();
    await list.selectStatus('ARCHIVED');
    await list.waitForCards();

    await list.openCardMenu(archivedWarehouseName);
    await list.menuItems.delete.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(archivedWarehouseName);

    // Type the exact name and submit
    await dialog.getByRole('textbox').fill(archivedWarehouseName);
    await dialog.getByRole('button', { name: 'Delete permanently' }).click();

    // Countdown view appears with seconds-remaining label on the cancel button
    await expect(dialog.getByRole('button', { name: /Cancel \(\ds\)/ })).toBeVisible({
      timeout: 2_000,
    });

    // Wait for the 5-second grace window to elapse + a small buffer for the
    // network request to fire and the dialog to close.
    await expect(
      page.getByText(new RegExp(`"${archivedWarehouseName}" was deleted`, 'i')),
    ).toBeVisible({ timeout: 10_000 });

    // Card is gone from the grid
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    await list.selectStatus('ARCHIVED');
    const cards = await list.getCardNames();
    expect(cards).not.toContain(archivedWarehouseName);
  });

  test('PW-H08-2: Given the user types the wrong name, When they blur the input, Then an inline error appears and the confirm button stays disabled', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();
    await list.selectStatus('ARCHIVED');
    await list.waitForCards();

    await list.openCardMenu(archivedStoreRoomName);
    await list.menuItems.delete.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const input = dialog.getByRole('textbox');
    await input.fill('wrong-name');
    await input.blur();

    await expect(
      dialog.getByText('Name does not match. Type it exactly as shown above.'),
    ).toBeVisible();

    const confirmButton = dialog.getByRole('button', { name: 'Delete permanently' });
    await expect(confirmButton).toBeDisabled();

    // Close the dialog cleanly to avoid bleeding into the next test
    await dialog.getByRole('button', { name: 'Cancel' }).click();
  });

  test('PW-H08-3: Given the user is in the countdown grace window, When they click the explicit Cancel button, Then no request is fired and the dialog returns to the typed state', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();
    await list.selectStatus('ARCHIVED');
    await list.waitForCards();

    await list.openCardMenu(archivedForCancelName);
    await list.menuItems.delete.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('textbox').fill(archivedForCancelName);
    await dialog.getByRole('button', { name: 'Delete permanently' }).click();

    // Countdown active — click the in-countdown Cancel button
    const countdownCancel = dialog.getByRole('button', { name: /Cancel \(\ds\)/ });
    await expect(countdownCancel).toBeVisible({ timeout: 2_000 });
    await countdownCancel.click();

    // Dialog returned to the form state — the typed input is preserved and
    // the original confirm button is back.
    await expect(dialog.getByRole('textbox')).toBeVisible({ timeout: 2_000 });
    await expect(dialog.getByRole('textbox')).toHaveValue(archivedForCancelName);
    await expect(dialog.getByRole('button', { name: 'Delete permanently' })).toBeVisible();

    // Defensive: storage is still present (no request fired). Close cleanly.
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await list.selectStatus('ARCHIVED');
    const cards = await list.getCardNames();
    expect(cards).toContain(archivedForCancelName);
  });

  test('PW-H08-4: Given the user is in the countdown, When they press ESC, Then the timer is aborted and the storage stays', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();
    await list.selectStatus('ARCHIVED');
    await list.waitForCards();

    await list.openCardMenu(archivedForEscapeName);
    await list.menuItems.delete.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('textbox').fill(archivedForEscapeName);
    await dialog.getByRole('button', { name: 'Delete permanently' }).click();

    await expect(dialog.getByRole('button', { name: /Cancel \(\ds\)/ })).toBeVisible({
      timeout: 2_000,
    });

    // ESC cancels the countdown AND closes the dialog (Dialog's native exit)
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });

    // Storage is still present — ESC during countdown means "abort the
    // pending delete", not "fire it anyway".
    await list.selectStatus('ARCHIVED');
    const cards = await list.getCardNames();
    expect(cards).toContain(archivedForEscapeName);
  });

  test('PW-H08-5: Given the storage is deleted by another actor while the user is mid-flow, When the request returns 404, Then the dialog switches to the concurrency info layout', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();
    await list.selectStatus('ARCHIVED');
    await list.waitForCards();

    await list.openCardMenu(archivedForConcurrencyName);
    await list.menuItems.delete.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('textbox').fill(archivedForConcurrencyName);

    // Simulate a concurrent delete by another actor — fires before the user
    // confirms, so when the UI's request lands the BE returns 404.
    await apiDeletePermanentStorage(token, 'WAREHOUSE', archivedForConcurrencyUUID);

    await dialog.getByRole('button', { name: 'Delete permanently' }).click();

    // Wait for countdown to finish + request to fire + 404 to come back
    await expect(dialog.getByText('This storage was already deleted')).toBeVisible({
      timeout: 12_000,
    });
    await expect(
      dialog.getByText(new RegExp(`Someone else.*${archivedForConcurrencyName}`, 'i')),
    ).toBeVisible();

    // Single Close button in this variant — no Cancel/Confirm pair
    await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible();
    await expect(dialog.getByRole('textbox')).not.toBeVisible();
  });

  test('PW-H08-6: Given a non-archived storage, When the user opens its kebab menu, Then the Delete permanently option is omitted from the DOM', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    // ACTIVE warehouse — the kebab menu must NOT include Delete permanently
    await list.openCardMenu(activeWarehouseName);

    await expect(list.menuItems.archive).toBeVisible();
    await expect(list.menuItems.delete).toHaveCount(0);
  });

  // PW-H08-7 + PW-H08-8 cover entry-point/integration scenarios that are
  // already exercised at unit-test level (Vitest specs for StorageDetailPanel
  // entry points and selectFallbackStorage helper). Skipping these two
  // Playwright cases keeps the E2E suite focused on the core
  // permanent-delete dialog flow without flake from unrelated UI surfaces.
  test.skip('PW-H08-7: Given the user opens the detail panel of an archived storage, When they look at the action row, Then a ghost-danger Delete CTA is visible alongside Restore and Edit', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    // Spawn a fresh archived warehouse for this test (independent from PW-H08-1
    // which deletes its target).
    const fresh = await apiCreateWarehouse(token, 'Almacén Detail Panel', 'Av. Detalle 600');
    await apiArchiveStorage(token, 'WAREHOUSE', fresh.storageUUID);

    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();
    await list.selectStatus('ARCHIVED');
    await list.waitForCards();

    await list.openCardMenu(fresh.name);
    await list.menuItems.view.click();

    const drawer = page.getByRole('dialog').or(page.locator('[role="dialog"]'));
    await expect(drawer).toBeVisible({ timeout: 5_000 });
    await expect(drawer).toContainText(fresh.name);

    // The drawer header has Restore + Edit + a separator + Delete (ghost-danger)
    await expect(drawer.getByRole('button', { name: 'Restore' })).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Edit' })).toBeVisible();
    const deleteCTA = drawer.getByRole('button', {
      name: new RegExp(`Delete ${fresh.name} permanently`, 'i'),
    });
    await expect(deleteCTA).toBeVisible();
  });

  test.skip('PW-H08-8: Given the user deletes the active-context storage, When the request succeeds, Then a fallback context is selected and a secondary info toast announces it', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    // Create an extra warehouse so a fallback exists; archive a target that
    // we will turn into the active context first.
    const fallback = await apiCreateWarehouse(
      token,
      'Almacén Fallback Context',
      'Av. Fallback 700',
    );
    const target = await apiCreateWarehouse(
      token,
      'Almacén Contexto Activo',
      'Av. Contexto 800',
    );

    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    // Open the storage switcher in the sidebar and pick the target — that
    // makes it the active context so the delete will trigger the fallback.
    // The sidebar trigger lives at top-left; click via the badge text.
    await page.getByRole('button', { name: /Storage|Inst/ }).first().click();
    await page
      .getByRole('option', { name: target.name })
      .or(page.getByText(target.name))
      .first()
      .click();
    await page.waitForTimeout(500);

    // Now archive + delete via UI — must use real button flow, not API.
    await list.openCardMenu(target.name);
    await list.menuItems.archive.click();
    const archiveDialog = page.getByRole('dialog');
    await archiveDialog.getByRole('button', { name: /^Archive$/i }).click();

    // After archive, switch to the ARCHIVED filter and delete it
    await list.selectStatus('ARCHIVED');
    await list.waitForCards();

    await list.openCardMenu(target.name);
    await list.menuItems.delete.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('textbox').fill(target.name);
    await dialog.getByRole('button', { name: 'Delete permanently' }).click();

    // Wait for countdown + request, then primary success toast
    await expect(
      page.getByText(new RegExp(`"${target.name}" was deleted`, 'i')),
    ).toBeVisible({ timeout: 12_000 });

    // Secondary info toast 300ms later — announces the new active context
    await expect(
      page.getByText(new RegExp(`You are now working in "${fallback.name}"`, 'i')),
    ).toBeVisible({ timeout: 5_000 });
  });
});
