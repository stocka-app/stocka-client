import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import { ForgotPasswordPage } from '../../pages/forgot-password.page';

// ═════════════════════════════════════════════════════════════════════════════
// Forgot Password flow (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Forgot Password (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_forgot_${ts}@stocka.test`;
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();
    await apiSignUp({ email, username: `pw_forgot_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('FP-01: page shows title, email field, and submit button', async ({ page }) => {
    const fp = new ForgotPasswordPage(page);
    await fp.goto();
    await expect(fp.heading).toBeVisible();
    await expect(fp.emailInput).toBeVisible();
    await expect(fp.submitButton).toBeVisible();
  });

  test('FP-02: "Back to login" link navigates to sign-in', async ({ page }) => {
    const fp = new ForgotPasswordPage(page);
    await fp.goto();
    await expect(fp.heading).toBeVisible();
    await fp.backToSignInLink.click();
    await expect(page).toHaveURL(/\/authentication\/sign-in/);
  });

  test('FP-03: submitting a valid email shows the success screen', async ({ page }) => {
    test.setTimeout(30_000);
    const fp = new ForgotPasswordPage(page);
    await fp.goto();
    await fp.submitEmail(email);
    await expect(fp.successHeading).toBeVisible({ timeout: 10_000 });
    await expect(fp.resendButton).toBeVisible();
  });

  test('FP-04: submitting an empty email shows validation error', async ({ page }) => {
    const fp = new ForgotPasswordPage(page);
    await fp.goto();
    await fp.submitButton.click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('FP-05: email pre-fills from sign-in navigation state', async ({ page }) => {
    const fp = new ForgotPasswordPage(page);
    await page.goto('/authentication/sign-in');
    const emailInput = page.getByLabel('Enter your username or email address');
    await emailInput.fill(email);
    await page.getByRole('button', { name: 'Forgot Password?' }).click();
    await page.waitForURL('**/forgot-password');
    await expect(fp.emailInput).toHaveValue(email);
  });

  test('FP-06: submitting an unknown email still shows success (no email enumeration)', async ({ page }) => {
    test.setTimeout(30_000);
    const fp = new ForgotPasswordPage(page);
    await fp.goto();
    await fp.submitEmail('nonexistent_pw@stocka.test');
    await expect(fp.successHeading).toBeVisible({ timeout: 10_000 });
  });

  test('FP-07: success screen shows the submitted email address', async ({ page }) => {
    test.setTimeout(30_000);
    const fp = new ForgotPasswordPage(page);
    await fp.goto();
    await fp.submitEmail(email);
    await expect(fp.successHeading).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(email)).toBeVisible();
  });

  test('FP-08: resend button has cooldown after success', async ({ page }) => {
    test.setTimeout(30_000);
    const fp = new ForgotPasswordPage(page);
    await fp.goto();
    await fp.submitEmail(email);
    await expect(fp.successHeading).toBeVisible({ timeout: 10_000 });
    await expect(fp.resendButton).toBeDisabled();
  });
});
