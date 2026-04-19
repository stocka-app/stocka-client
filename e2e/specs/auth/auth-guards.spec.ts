import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import { LoginPage } from '../../pages/login.page';

// ═════════════════════════════════════════════════════════════════════════════
// Auth route guards (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Auth route guards (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const verifiedEmail = `pw_guard_${ts}@stocka.test`;
  const unverifiedEmail = `pw_guard_unver_${ts}@stocka.test`;
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();

    // Verified user with completed onboarding (has tenant)
    const verified = await apiSignUp({
      email: verifiedEmail,
      username: `pw_guard_${ts}`,
      password,
    });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, verifiedEmail);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(verified.accessToken);

    // Unverified user (pending_verification)
    await apiSignUp({
      email: unverifiedEmail,
      username: `pw_guard_unver_${ts}`,
      password,
    });
  });

  test.afterAll(async () => {
    await pool.end();
  });

  // ── ProtectedRoute ─────────────────────────────────────────────────────────

  test('G-01: unauthenticated user accessing /dashboard is redirected to sign-in', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/sign-in', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('G-02: unauthenticated user accessing /storages is redirected to sign-in', async ({ page }) => {
    await page.goto('/storages');
    await page.waitForURL('**/sign-in', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  // ── PublicRoute ────────────────────────────────────────────────────────────

  test('G-03: authenticated user accessing sign-in is redirected to dashboard', async ({ page }) => {
    test.setTimeout(30_000);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn(verifiedEmail, password);
    await page.waitForURL('**/dashboard', { timeout: 15_000 });

    await page.goto('/authentication/sign-in');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('G-04: authenticated user accessing sign-up is redirected to dashboard', async ({ page }) => {
    test.setTimeout(30_000);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn(verifiedEmail, password);
    await page.waitForURL('**/dashboard', { timeout: 15_000 });

    await page.goto('/authentication/sign-up');
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ── RequiresTenantRoute ────────────────────────────────────────────────────

  test('G-05: user without tenant accessing /dashboard is redirected to onboarding', async ({ page }) => {
    test.setTimeout(30_000);
    const noTenantEmail = `pw_gnt_${ts}@stocka.test`;
    await apiSignUp({
      email: noTenantEmail,
      username: `pw_gnt_${ts}`,
      password,
    });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, noTenantEmail);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn(noTenantEmail, password);
    await page.waitForURL('**/onboarding', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/onboarding/);
  });

  // ── VerificationRoute ──────────────────────────────────────────────────────

  test('G-06: accessing verify-email without pending verification redirects to sign-in', async ({ page }) => {
    await page.goto('/authentication/verify-email');
    await page.waitForURL('**/sign-in', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  // ── General navigation ─────────────────────────────────────────────────────

  test('G-07: accessing root "/" redirects to sign-in', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('**/sign-in', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('G-08: accessing /settings without auth redirects to sign-in', async ({ page }) => {
    await page.goto('/settings/organization');
    await page.waitForURL('**/sign-in', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
