import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { RegisterPage } from '../../pages/register.page';
import { VerifyEmailPage } from '../../pages/verify-email.page';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';
import { verifyUserEmail, findAccountByEmail, createDbPool } from '../../helpers/db.helper';

const unique = (): string => String(Date.now());

test.describe('Given a new user on the Sign Up page', () => {
  let registerPage: RegisterPage;
  let verifyEmailPage: VerifyEmailPage;
  let pool: Pool;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    verifyEmailPage = new VerifyEmailPage(page);
    pool = createDbPool();
    await registerPage.goto();
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

    test('Then the user record is created in the database with pending_verification status', async () => {
      const ts = unique();
      const email = `test_${ts}@stocka.test`;

      await registerPage.signUp({
        fullName: `Test User ${ts}`,
        email,
        username: `testuser_${ts}`,
        password: 'TestPass1',
      });

      const account = await findAccountByEmail(pool, email);
      expect(account).not.toBeNull();
      expect(account!.status).toBe('pending_verification');
    });
  });

  test.describe('When the user completes sign-up and verifies their email via DB', () => {
    test('Then they can sign in and reach the dashboard', async ({ page }) => {
      const ts = unique();
      const email = `test_${ts}@stocka.test`;
      const password = 'TestPass1';
      const username = `testuser_${ts}`;

      // Step 1: Register
      await registerPage.signUp({
        fullName: `Test User ${ts}`,
        email,
        username,
        password,
      });
      await page.waitForURL('**/verify-email');

      // Step 2: Bypass email verification directly in DB
      await verifyUserEmail(pool, email);

      // Step 3: Navigate to login and sign in
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);

      await loginPage.goto();
      await loginPage.signIn(email, password);

      await page.waitForURL('**/dashboard');
      await expect(dashboardPage.logoutButton).toBeVisible();
      await expect(dashboardPage.userEmailText).toContainText(email);
    });
  });

  test.describe('When the user submits an email that is already registered', () => {
    test('Then an error message is shown on the register page', async ({ page }) => {
      const ts = unique();
      const email = `test_${ts}@stocka.test`;
      const data = {
        fullName: `Test User ${ts}`,
        email,
        username: `testuser_${ts}`,
        password: 'TestPass1',
      };

      // First registration
      await registerPage.signUp(data);
      await page.waitForURL('**/verify-email');

      // Second registration attempt with same email
      await registerPage.goto();
      await registerPage.signUp({ ...data, username: `testuser2_${ts}` });

      await expect(registerPage.errorAlert).toBeVisible();
      await expect(page).toHaveURL(/\/authentication\/register/);
    });
  });

  test.describe('When the user clicks "Sign in"', () => {
    test('Then they are navigated to the Login page', async ({ page }) => {
      await registerPage.signInLink.click();
      await expect(page).toHaveURL(/\/authentication\/login/);
    });
  });
});
