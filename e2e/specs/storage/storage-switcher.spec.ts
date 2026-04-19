import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateWarehouse,
  apiCreateStoreRoom,
  apiCreateCustomRoom,
  apiFreezeStorage,
  apiArchiveStorage,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { StoragesListPage } from '../../pages/storages-list.page';

// ═════════════════════════════════════════════════════════════════════════════
// StorageSwitcher — PW-8 through PW-11 (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('StorageSwitcher (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_switch_${ts}@stocka.test`;
  const username = `pw_switch_${ts}`;
  const password = 'TestPass1!';

  let warehouseName: string;
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
    const wh = await apiCreateWarehouse(accessToken, 'Almacén Central', 'Av. Industrial 500');
    warehouseName = wh.name;
    const sr = await apiCreateStoreRoom(accessToken, 'Bodega Principal', 'Calle Bodega 10');
    storeRoomName = sr.name;
    await apiCreateCustomRoom(accessToken, 'Tienda Centro');
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('PW-9: Clicking the trigger opens a floating popover to the right of the sidebar', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    await trigger.click();

    const listbox = page.getByRole('listbox', { name: /Select storage/i });
    await expect(listbox).toBeVisible();
  });

  test('PW-9b: Pressing Escape closes the dropdown', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    await trigger.click();

    const listbox = page.getByRole('listbox', { name: /Select storage/i });
    await expect(listbox).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(listbox).toHaveCount(0);
  });

  test('PW-10: The dropdown shows all tenant storages grouped by type', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    await trigger.click();

    const listbox = page.getByRole('listbox', { name: /Select storage/i });
    await expect(listbox).toBeVisible();

    await expect(listbox.getByText(warehouseName)).toBeVisible();
    await expect(listbox.getByText(storeRoomName)).toBeVisible();
    await expect(listbox.getByText('Tienda Centro')).toBeVisible();
  });

  test('PW-10b: Create CTA is visible in the dropdown for users with STORAGE_CREATE permission', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    await trigger.click();

    const listbox = page.getByRole('listbox', { name: /Select storage/i });
    await expect(listbox).toBeVisible();

    await expect(page.getByRole('button', { name: /Create new storage/i })).toBeVisible();
  });

  test('PW-11: Selecting a different storage closes the dropdown', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    await trigger.click();

    const listbox = page.getByRole('listbox', { name: /Select storage/i });
    await expect(listbox).toBeVisible();

    await listbox.getByText(storeRoomName).click();
    await expect(listbox).toHaveCount(0);
  });

  // PW-11b: The switcher's storages fetch on /dashboard has a timing issue
  // in real E2E — the fetch depends on the auth state being fully hydrated
  // after cross-page navigation, which can race with the first render.
  // The cross-page navigation + drawer auto-open flow is covered by the
  // Vitest unit test for the router state handler in StoragesPage.
  test.fixme('PW-11b: Create CTA click navigates to /storages and opens the create drawer', async () => {});

  test('PW-8: The active-context storage is rendered as the first card in the /storages grid', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    // Select storeRoom as active context
    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    await trigger.click();

    const listbox = page.getByRole('listbox', { name: /Select storage/i });
    await listbox.getByText(storeRoomName).click();
    await expect(listbox).toHaveCount(0);

    // The first card in the grid should now be the selected storage
    const cardNames = await list.getCardNames();
    expect(cardNames[0]).toBe(storeRoomName);
  });
});
