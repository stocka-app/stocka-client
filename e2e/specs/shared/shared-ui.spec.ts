import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  setTierByUserUuid,
  clearAllStoragesForUser,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';

// ═════════════════════════════════════════════════════════════════════════════
// Shared UI: theme toggle, language switcher, sidebar, layout (real BE)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Shared UI components (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_shared_${ts}@stocka.test`;
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();
    const signUp = await apiSignUp({ email, username: `pw_shared_${ts}`, password });
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

  // ── Theme toggle ───────────────────────────────────────────────────────────

  test('TH-01: dark mode toggle switches the theme', async ({ page }) => {
    test.setTimeout(30_000);
    await signInAndNavigateToStorages(page, email, password);
    const toggleButton = page.getByRole('button', { name: /dark mode|light mode/i });
    await expect(toggleButton).toBeVisible();

    await toggleButton.click();
    const html = page.locator('html');
    const hasClass = await html.evaluate((el) => el.classList.contains('dark'));
    expect(hasClass).toBe(true);
  });

  test('TH-02: dark mode persists after page reload', async ({ page }) => {
    test.setTimeout(30_000);
    await signInAndNavigateToStorages(page, email, password);
    const toggleButton = page.getByRole('button', { name: /dark mode/i });
    await toggleButton.click();

    await page.reload();
    await page.waitForLoadState('networkidle');
    const html = page.locator('html');
    const hasClass = await html.evaluate((el) => el.classList.contains('dark'));
    expect(hasClass).toBe(true);

    // Toggle back to light for other tests
    const lightToggle = page.getByRole('button', { name: /light mode/i });
    await lightToggle.click();
  });

  // ── Language switcher ──────────────────────────────────────────────────────

  // LNG-01: LanguageSwitcher globe button renders off-screen in the sidebar's
  // utility row at certain viewport sizes. Covered by Vitest unit tests.
  test.fixme('LNG-01: language switcher opens and shows English/Español options', async () => {});

  // ── Sidebar / navigation ───────────────────────────────────────────────────

  test('NAV-01: sidebar shows navigation links', async ({ page }) => {
    test.setTimeout(30_000);
    await signInAndNavigateToStorages(page, email, password);
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Storages' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  });

  test('NAV-02: clicking Dashboard navigates to /dashboard', async ({ page }) => {
    test.setTimeout(30_000);
    await signInAndNavigateToStorages(page, email, password);
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('NAV-03: user info shows username and role in sidebar', async ({ page }) => {
    test.setTimeout(30_000);
    await signInAndNavigateToStorages(page, email, password);
    await expect(page.getByText(`pw_shared_${ts}`)).toBeVisible();
    await expect(page.getByText('Owner')).toBeVisible();
  });

  test('NAV-04: collapse sidebar button works', async ({ page }) => {
    test.setTimeout(30_000);
    await signInAndNavigateToStorages(page, email, password);
    const collapseButton = page.getByRole('button', { name: /Collapse sidebar/i });
    await expect(collapseButton).toBeVisible();
    await collapseButton.click();
    // After collapse, the full navigation text should be hidden
    await expect(page.getByText('Collapse sidebar')).not.toBeVisible();
  });

  test('NAV-05: notifications bell is visible', async ({ page }) => {
    test.setTimeout(30_000);
    await signInAndNavigateToStorages(page, email, password);
    await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible();
  });

  test('NAV-06: logout button is visible and works', async ({ page }) => {
    test.setTimeout(30_000);
    await signInAndNavigateToStorages(page, email, password);
    const logoutButton = page.getByRole('button', { name: 'Log out' });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();
    await page.waitForURL('**/sign-in', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  // ── Offline banner ─────────────────────────────────────────────────────────

  // OFF-01: context.setOffline(true) doesn't trigger useSyncExternalStore's
  // getSnapshot (navigator.onLine stays true in Playwright's Chromium).
  // The OfflineBanner component is fully covered by Vitest unit tests.
  test.fixme('OFF-01: offline banner appears when browser goes offline', async () => {});

  // ── Settings navigation ────────────────────────────────────────────────────

  test('SET-01: clicking Settings navigates to /settings/organization', async ({ page }) => {
    test.setTimeout(30_000);
    await signInAndNavigateToStorages(page, email, password);
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.waitForURL('**/settings/**', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/settings/);
  });
});
