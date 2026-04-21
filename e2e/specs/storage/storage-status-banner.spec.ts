import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateStoreRoom,
  apiCreateWarehouse,
  apiFreezeStorage,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';

// ═════════════════════════════════════════════════════════════════════════════
// StorageStatusBanner — PW-12, PW-13, PW-14 (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('StorageStatusBanner (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_banner_${ts}@stocka.test`;
  const username = `pw_banner_${ts}`;
  const password = 'TestPass1!';

  let frozenStoreName: string;

  test.beforeAll(async () => {
    pool = createDbPool();
    const signUp = await apiSignUp({ email, username, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateWarehouse(accessToken, 'Almacén Central', 'Av. Industrial 500');
    const sr = await apiCreateStoreRoom(accessToken, 'Bodega Norte', 'Calle Norte 100');
    frozenStoreName = sr.name;
    await apiFreezeStorage(accessToken, 'STORE_ROOM', sr.storageUUID);
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('PW-12: When the active storage is FROZEN, the banner shows with Reactivate CTA and X close', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });

    await trigger.click();
    const listbox = page.getByRole('listbox', { name: /Select storage/i });
    await expect(listbox).toBeVisible();
    await listbox.getByText(frozenStoreName).click();
    await expect(listbox).toHaveCount(0);

    const banner = page.getByRole('status').filter({ hasText: /frozen|congelada/i });
    await expect(banner).toBeVisible({ timeout: 5_000 });

    const reactivateCta = page.getByRole('button', { name: /Reactivate/i });
    await expect(reactivateCta).toBeVisible();

    const closeBtn = page.getByRole('button', { name: /Close notice/i });
    await expect(closeBtn).toBeVisible();
  });

  test('PW-13: Click X close makes the banner disappear; reload brings it back', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    await trigger.click();
    await page.getByRole('listbox', { name: /Select storage/i }).getByText(frozenStoreName).click();

    const banner = page.getByRole('status').filter({ hasText: /frozen|congelada/i });
    await expect(banner).toBeVisible();

    await page.getByRole('button', { name: /Close notice/i }).click();
    await expect(banner).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('status').filter({ hasText: /frozen|congelada/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('PW-14: Clicking Reactivate calls the API and hides the banner', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    await trigger.click();
    await page.getByRole('listbox', { name: /Select storage/i }).getByText(frozenStoreName).click();

    const banner = page.getByRole('status').filter({ hasText: /frozen|congelada/i });
    await expect(banner).toBeVisible();

    await page.getByRole('button', { name: /Reactivate/i }).click();

    await expect(banner).toHaveCount(0, { timeout: 5_000 });
  });
});
