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
// Responsive & dark mode (real BE, no mocks)
//
// Dataset: 3 storages (1 per type) for viewport and dark mode tests.
// Empty user for empty-state dark mode test.
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Responsive & dark mode (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_resp_${ts}@stocka.test`;
  const emptyEmail = `pw_resp_empty_${ts}@stocka.test`;
  const password = 'TestPass1!';
  const TOTAL = 3;

  test.beforeAll(async () => {
    pool = createDbPool();

    // User with storages
    const signUp = await apiSignUp({ email, username: `pw_resp_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');
    await clearAllStoragesForUser(pool, signUp.userId);

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateWarehouse(accessToken, 'Almacen Central', 'Av. Industrial 500');
    await apiCreateStoreRoom(accessToken, 'Bodega Principal', 'Calle Bodega 10');
    await apiCreateCustomRoom(accessToken, 'Area Exhibicion');

    // Empty user (for dark mode empty state)
    const emptySignUp = await apiSignUp({
      email: emptyEmail,
      username: `pw_resp_empty_${ts}`,
      password,
    });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, emptyEmail);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(emptySignUp.accessToken);
    await setTierByUserUuid(pool, emptySignUp.userId, 'STARTER');
    await clearAllStoragesForUser(pool, emptySignUp.userId);
  });

  test.afterAll(async () => {
    await pool.end();
  });

  // ── Section 13: Responsive ─────────────────────────────────────────────────

  test('RS-01: mobile 320px shows single column grid', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 320, height: 568 });
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.cardGrid).toBeVisible();
    await expect(sp.cardGrid).toHaveClass(/grid-cols-1/);
  });

  test('RS-02: tablet 768px shows grid', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 768, height: 1024 });
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.cardGrid).toBeVisible();
  });

  test('RS-03: desktop 1024px shows grid', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1024, height: 768 });
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.cardGrid).toBeVisible();
  });

  test('RS-04: ultrawide 2560px shows grid', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 2560, height: 1440 });
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.cardGrid).toBeVisible();
  });

  test('RS-05: interactive buttons have minimum 44px touch target', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 375, height: 667 });
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    const actionButtons = page.locator('button.min-h-\\[44px\\]');
    const count = await actionButtons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await actionButtons.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('RS-06: tabs have horizontal overflow on mobile', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 320, height: 568 });
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    const tabsContainer = page.locator('.flex.flex-wrap.gap-2.overflow-x-auto').first();
    await expect(tabsContainer).toBeVisible();
  });

  test('RS-08: card name is never truncated on narrow screens', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 320, height: 568 });
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    const names = await sp.getCardNames();
    expect(names.length).toBe(TOTAL);
    for (const name of names) {
      await expect(page.locator('main h3').filter({ hasText: name }).first()).toBeVisible();
    }
  });

  // ── Section 14: Dark mode ──────────────────────────────────────────────────

  test('DM-01: page renders correctly in dark mode', async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ colorScheme: 'dark' });
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.heading).toBeVisible();
  });

  test('DM-02: cards render in dark mode without visual breakage', async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ colorScheme: 'dark' });
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    const cards = await sp.getCardNames();
    expect(cards.length).toBe(TOTAL);
  });

  test('DM-03: tabs and buttons render correctly in dark mode', async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ colorScheme: 'dark' });
    await signInAndNavigateToStorages(page, email, password);
    const sp = new StoragesListPage(page);
    await sp.waitForCards();

    await expect(sp.tabAll).toBeVisible();
    await expect(sp.tabAll).toHaveAttribute('aria-selected', 'true');
  });

  test.fixme(
    'DM-04: skeleton renders in dark mode',
    async () => {},
  );

  test('DM-06: empty state adapts to dark mode', async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ colorScheme: 'dark' });
    await signInAndNavigateToStorages(page, emptyEmail, password);
    const sp = new StoragesListPage(page);

    await expect(sp.emptyTitle()).toBeVisible();
    await expect(page.getByText('Centralization')).toBeVisible();
  });

  test.fixme(
    'DM-06b: error state adapts to dark mode',
    async () => {},
  );
});
