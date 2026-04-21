import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateWarehouse,
  apiCreateStoreRoom,
  apiCreateCustomRoom,
  clearAllStoragesForUser,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { StoragesListPage } from '../../pages/storages-list.page';

// ═════════════════════════════════════════════════════════════════════════════
// Pagination (real BE, no mocks)
//
// Dataset: 55 storages → 2 pages (50 per page)
// Uses ENTERPRISE tier (unlimited) to allow 55+ storages.
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 15: Pagination (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_page_${ts}@stocka.test`;
  const password = 'TestPass1!';
  const TOTAL = 55;

  const smallEmail = `pw_page_small_${ts}@stocka.test`;
  const SMALL_TOTAL = 5;

  test.beforeAll(async () => {
    pool = createDbPool();

    // Large dataset user (55 storages)
    const signUp = await apiSignUp({ email, username: `pw_page_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'ENTERPRISE');
    await clearAllStoragesForUser(pool, signUp.userId);

    const { accessToken } = await apiSignIn(email, password);

    const creates: Promise<unknown>[] = [];
    for (let i = 1; i <= 20; i++) {
      creates.push(apiCreateWarehouse(accessToken, `WH ${String(i).padStart(2, '0')}`, `Calle ${i}`));
    }
    for (let i = 1; i <= 20; i++) {
      creates.push(apiCreateStoreRoom(accessToken, `SR ${String(i).padStart(2, '0')}`, `Bodega ${i}`));
    }
    for (let i = 1; i <= 15; i++) {
      creates.push(apiCreateCustomRoom(accessToken, `CR ${String(i).padStart(2, '0')}`));
    }
    await Promise.all(creates);

    // Small dataset user (5 storages — no pagination)
    const smallSignUp = await apiSignUp({
      email: smallEmail,
      username: `pw_page_small_${ts}`,
      password,
    });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, smallEmail);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(smallSignUp.accessToken);
    await setTierByUserUuid(pool, smallSignUp.userId, 'STARTER');
    await clearAllStoragesForUser(pool, smallSignUp.userId);

    const smallToken = (await apiSignIn(smallEmail, password)).accessToken;
    await apiCreateWarehouse(smallToken, 'Small WH 1', 'Calle 1');
    await apiCreateWarehouse(smallToken, 'Small WH 2', 'Calle 2');
    await apiCreateStoreRoom(smallToken, 'Small SR 1', 'Bodega 1');
    await apiCreateStoreRoom(smallToken, 'Small SR 2', 'Bodega 2');
    await apiCreateCustomRoom(smallToken, 'Small CR 1');
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('P-01: pagination controls visible with more than 50 storages', async ({ page }) => {
    test.setTimeout(90_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.prevButton).toBeVisible();
    await expect(sp.nextButton).toBeVisible();
    await expect(sp.pageIndicator).toBeVisible();
    await expect(sp.pageIndicator).toContainText('Page 1 of 2');
  });

  test('P-02: "Previous" button disabled on first page', async ({ page }) => {
    test.setTimeout(90_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.prevButton).toBeDisabled();
    await expect(sp.nextButton).toBeEnabled();
  });

  test('P-03: "Next" button disabled on last page', async ({ page }) => {
    test.setTimeout(90_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await sp.nextButton.click();
    await expect(sp.pageIndicator).toContainText('Page 2 of 2');

    await expect(sp.nextButton).toBeDisabled();
    await expect(sp.prevButton).toBeEnabled();
  });

  test('P-04: clicking "Next" loads the next page with remaining items', async ({ page }) => {
    test.setTimeout(90_000);
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.pageIndicator).toContainText('Page 1 of 2');

    await sp.nextButton.click();
    await expect(sp.pageIndicator).toContainText('Page 2 of 2');

    const names = await sp.getCardNames();
    expect(names.length).toBe(TOTAL - 50);
  });

  test('P-05: no pagination controls with fewer than 50 storages', async ({ page }) => {
    test.setTimeout(90_000);
    await signInAndNavigateToStorages(page, smallEmail, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.prevButton).not.toBeVisible();
    await expect(sp.nextButton).not.toBeVisible();
  });
});
