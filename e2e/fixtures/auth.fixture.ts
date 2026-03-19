import { test as base, type Page } from '@playwright/test';
import { Pool } from 'pg';
import { apiSignUp } from '../helpers/api.helper';
import { verifyUserEmail } from '../helpers/db.helper';

const DB_URL =
  process.env.PW_DATABASE_URL ??
  'postgresql://stocka:stocka_dev_password@localhost:5434/stocka_playwright';

export interface TestUser {
  email: string;
  username: string;
  password: string;
  userId: string;
}

interface AuthFixtures {
  /** A pre-created, email-verified user. Use for authenticated-session tests. */
  verifiedUser: TestUser;
  /** A page already authenticated as verifiedUser (storageState pre-loaded). */
  authenticatedPage: Page;
}

/**
 * Extended test fixture that provides a verified user and an authenticated page.
 *
 * The verifiedUser fixture:
 *   1. Calls POST /authentication/sign-up to create the user
 *   2. Directly updates the DB to mark the email as verified
 *   This avoids needing a real email inbox during testing.
 *
 * The authenticatedPage fixture navigates to /authentication/login and completes
 * the sign-in flow so the page has a valid session (cookies + localStorage state).
 */
export const test = base.extend<AuthFixtures>({
  verifiedUser: async ({}, use) => {
    const pool = new Pool({ connectionString: DB_URL });
    const timestamp = Date.now();
    const user: TestUser = {
      email: `pw_test_${timestamp}@stocka.test`,
      username: `pw_user_${timestamp}`,
      password: 'TestPass1',
      userId: '',
    };

    try {
      const result = await apiSignUp({
        email: user.email,
        username: user.username,
        password: user.password,
      });
      user.userId = result.userId;

      await verifyUserEmail(pool, user.email);
    } finally {
      await pool.end();
    }

    await use(user);
  },

  authenticatedPage: async ({ page, verifiedUser }, use) => {
    await page.goto('/authentication/login');

    await page.getByLabel('Enter your username or email address').fill(verifiedUser.email);
    await page.getByLabel('Enter your Password').fill(verifiedUser.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await page.waitForURL('**/dashboard');

    await use(page);
  },
});

export { expect } from '@playwright/test';
