import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { RegisterPage } from '../../pages/register.page';
import { VerifyEmailPage } from '../../pages/verify-email.page';
import { verifyUserEmail, findAccountByEmail, createDbPool } from '../../helpers/db.helper';
import { apiSignUp, apiSignIn } from '../../helpers/api.helper';

const unique = (): string => String(Date.now());

test.describe('Given a new user on the Sign Up page', () => {
  let registerPage: RegisterPage;
  let verifyEmailPage: VerifyEmailPage;
  let pool: Pool;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    verifyEmailPage = new VerifyEmailPage(page);
    pool = createDbPool();

    // Clear persisted auth state from previous tests to avoid cross-test contamination
    await page.goto('/authentication/sign-up');
    await page.evaluate(() => localStorage.removeItem('authentication-storage'));
    await page.reload();
  });

  test.afterEach(async () => {
    await pool.end();
  });

  test.describe('When the user fills in valid data and submits', () => {
    test('Then they are redirected to the Verify Email page', async ({ page }) => {
      const ts = unique();
      await registerPage.signUp({
        fullName: `Test User ${ts}`,
        email: `test_${ts}@stocka.test`,
        username: `testuser_${ts}`,
        password: 'TestPass1',
      });

      await page.waitForURL('**/verify-email');
      await expect(verifyEmailPage.title).toBeVisible();
    });

    test('Then the Verify Email page shows the registered email address', async ({ page }) => {
      const ts = unique();
      const email = `test_${ts}@stocka.test`;

      await registerPage.signUp({
        fullName: `Test User ${ts}`,
        email,
        username: `testuser_${ts}`,
        password: 'TestPass1',
      });

      await page.waitForURL('**/verify-email');
      await expect(verifyEmailPage.emailDisplay).toContainText(email);
    });

    test('Then the user record is created in the database with pending_verification status', async ({ page }) => {
      const ts = unique();
      const email = `test_${ts}@stocka.test`;

      await registerPage.signUp({
        fullName: `Test User ${ts}`,
        email,
        username: `testuser_${ts}`,
        password: 'TestPass1',
      });

      await page.waitForURL('**/verify-email');

      // Poll for the DB record — the write may lag behind the API response
      let account: { id: number; status: string } | null = null;
      for (let i = 0; i < 20; i++) {
        account = await findAccountByEmail(pool, email);
        if (account) break;
        await new Promise((r) => setTimeout(r, 500));
      }

      expect(account).not.toBeNull();
      expect(account!.status).toBe('pending_verification');
    });
  });

  test.describe('When the user completes sign-up and verifies their email via DB', () => {
    test('Then the verified user can authenticate successfully', async () => {
      test.setTimeout(60_000);
      const ts = unique();
      const email = `test_${ts}@stocka.test`;
      const password = 'TestPass1';
      const username = `testuser_${ts}`;

      // Register via API to avoid rate-limit accumulation from UI sign-ups
      await apiSignUp({ email, username, password });

      // Bypass email verification directly in DB
      await verifyUserEmail(pool, email);

      // Verify the user can sign in via API (avoids UI rate-limiting from
      // previous tests — the sign-in UI itself is tested in sign-in.spec.ts)
      const { accessToken } = await apiSignIn(email, password);
      expect(accessToken).toBeTruthy();
    });
  });

  test.describe('When the user submits an email that is already registered', () => {
    test('Then an error message is shown on the register page', async ({ page }) => {
      const ts = unique();
      const email = `test_${ts}@stocka.test`;

      // First registration via API to avoid rate-limit accumulation
      await apiSignUp({ email, username: `testuser_${ts}`, password: 'TestPass1' });

      // Second registration attempt with same email via UI
      await registerPage.signUp({
        fullName: `Test User ${ts}`,
        email,
        username: `testuser2_${ts}`,
        password: 'TestPass1',
      });

      await expect(registerPage.errorAlert).toBeVisible();
      await expect(page).toHaveURL(/\/authentication\/sign-up/);
    });
  });

  test.describe('When the user clicks "Sign in"', () => {
    test('Then they are navigated to the Login page', async ({ page }) => {
      await registerPage.signInLink.click();
      await expect(page).toHaveURL(/\/authentication\/sign-in/);
    });
  });
});
