import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { createDbPool, insertVerificationCode } from '../../helpers/db.helper';
import { RegisterPage } from '../../pages/register.page';
import { VerifyEmailPage } from '../../pages/verify-email.page';

// ═════════════════════════════════════════════════════════════════════════════
// Email verification flow (real BE, no mocks)
//
// Strategy: register via UI → lands on verify-email page → insert known code
// in DB → submit code → verify success.
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Email verification (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('VE-01: after registration, the verify-email page shows the registered email', async ({ page }) => {
    test.setTimeout(30_000);
    const email = `pw_ve01_${ts}@stocka.test`;
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.signUp({
      fullName: `Test VE01 ${ts}`,
      email,
      username: `pw_ve01_${ts}`,
      password,
    });
    await page.waitForURL('**/verify-email', { timeout: 10_000 });
    const verifyPage = new VerifyEmailPage(page);
    await expect(verifyPage.title).toBeVisible();
    await expect(verifyPage.emailDisplay).toContainText(email);
  });

  test('VE-02: the verify-email page shows the code input field', async ({ page }) => {
    test.setTimeout(30_000);
    const email = `pw_ve02_${ts}@stocka.test`;
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.signUp({
      fullName: `Test VE02 ${ts}`,
      email,
      username: `pw_ve02_${ts}`,
      password,
    });
    await page.waitForURL('**/verify-email', { timeout: 10_000 });
    const verifyPage = new VerifyEmailPage(page);
    await expect(verifyPage.digitInputs.first()).toBeVisible();
    await expect(verifyPage.verifyButton).toBeVisible();
  });

  test('VE-03: the resend button is visible with initial cooldown', async ({ page }) => {
    test.setTimeout(30_000);
    const email = `pw_ve03_${ts}@stocka.test`;
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.signUp({
      fullName: `Test VE03 ${ts}`,
      email,
      username: `pw_ve03_${ts}`,
      password,
    });
    await page.waitForURL('**/verify-email', { timeout: 10_000 });
    const verifyPage = new VerifyEmailPage(page);
    await expect(verifyPage.resendButton).toBeVisible();
  });

  test('VE-04: submitting an invalid code shows an error message', async ({ page }) => {
    test.setTimeout(30_000);
    const email = `pw_ve04_${ts}@stocka.test`;
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.signUp({
      fullName: `Test VE04 ${ts}`,
      email,
      username: `pw_ve04_${ts}`,
      password,
    });
    await page.waitForURL('**/verify-email', { timeout: 10_000 });
    const verifyPage = new VerifyEmailPage(page);
    await verifyPage.submitCode('WRONG1');
    await expect(page.getByText(/Invalid code|incorrect/i)).toBeVisible({ timeout: 10_000 });
  });

  test('VE-05: submitting the correct code verifies the email and redirects', async ({ page }) => {
    test.setTimeout(30_000);
    const email = `pw_ve05_${ts}@stocka.test`;
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.signUp({
      fullName: `Test VE05 ${ts}`,
      email,
      username: `pw_ve05_${ts}`,
      password,
    });
    await page.waitForURL('**/verify-email', { timeout: 10_000 });

    // Insert a known verification code in the DB
    const code = await insertVerificationCode(pool, email, 'VER123');
    const verifyPage = new VerifyEmailPage(page);
    await verifyPage.submitCode(code);

    // After successful verification, user should be redirected to onboarding
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 15_000 });
  });

  test('VE-06: the "check spam" note is visible', async ({ page }) => {
    test.setTimeout(30_000);
    const email = `pw_ve06_${ts}@stocka.test`;
    const registerPage = new RegisterPage(page);
    await registerPage.goto();
    await registerPage.signUp({
      fullName: `Test VE06 ${ts}`,
      email,
      username: `pw_ve06_${ts}`,
      password,
    });
    await page.waitForURL('**/verify-email', { timeout: 10_000 });
    await expect(page.getByText(/check your spam/i)).toBeVisible();
  });

  test('VE-07: navigating to verify-email directly without registration redirects to sign-in', async ({ page }) => {
    await page.goto('/authentication/verify-email');
    await page.waitForURL('**/sign-in', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
