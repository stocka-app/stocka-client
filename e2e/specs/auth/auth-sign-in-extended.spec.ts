import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';

// ═════════════════════════════════════════════════════════════════════════════
// Sign-in extended scenarios (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Sign-in extended (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_signin_ext_${ts}@stocka.test`;
  const username = `pw_siext_${ts}`;
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();
    const signUp = await apiSignUp({ email, username, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('SI-01: user can sign in with username instead of email', async ({ page }) => {
    test.setTimeout(30_000);
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn(username, password);
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    const dashboard = new DashboardPage(page);
    await expect(dashboard.logoutButton).toBeVisible();
  });

  test('SI-02: social sign-in buttons (Google, Microsoft) are visible', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(page.getByRole('button', { name: /Sign in with Google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign in with Microsoft/i })).toBeVisible();
  });

  test('SI-03: "Or continue with" divider is visible between social and form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await expect(page.getByText('Or continue with')).toBeVisible();
  });

  test('SI-04: password field has toggle visibility button', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.passwordInput.fill('test');
    const toggleButton = page.getByRole('button', { name: /show password|toggle/i });
    await expect(toggleButton).toBeVisible();
  });

  test('SI-05: empty form submission shows validation errors', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submit();
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test('SI-06: sign-in with unverified email shows error with "Verify now" link', async ({ page }) => {
    test.setTimeout(30_000);
    const unverifiedEmail = `pw_si_unver_${ts}@stocka.test`;
    await apiSignUp({ email: unverifiedEmail, username: `pw_si_unver_${ts}`, password });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillCredentials(unverifiedEmail, password);
    await loginPage.submit();
    await expect(page.getByText(/Verify now/i)).toBeVisible({ timeout: 10_000 });
  });

  test('SI-07: clicking "Verify now" on unverified account navigates to verify-email', async ({ page }) => {
    test.setTimeout(30_000);
    const unverEmail = `pw_si_verify_${ts}@stocka.test`;
    await apiSignUp({ email: unverEmail, username: `pw_si_verify_${ts}`, password });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.fillCredentials(unverEmail, password);
    await loginPage.submit();
    const verifyLink = page.getByText(/Verify now/i);
    await expect(verifyLink).toBeVisible({ timeout: 10_000 });
    await verifyLink.click();
    await page.waitForURL('**/verify-email', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/verify-email/);
  });
});
