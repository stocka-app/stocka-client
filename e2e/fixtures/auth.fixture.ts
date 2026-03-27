import { test as base, type Page } from '@playwright/test';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding } from '../helpers/api.helper';
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

interface AuthTestFixtures {
  /** A page already authenticated as verifiedUser (storageState pre-loaded at /dashboard). */
  authenticatedPage: Page;
}

interface AuthWorkerFixtures {
  /**
   * A pre-created, email-verified user with a tenant. Ready for sign-in to /dashboard.
   * Worker-scoped: created once per worker process, shared across all tests in the file.
   * This prevents rate-limit exhaustion from creating a new user for every test.
   */
  verifiedUser: TestUser;
}

/**
 * Extended test fixture that provides a verified user and an authenticated page.
 *
 * The verifiedUser fixture (worker-scoped):
 *   1. Calls POST /authentication/sign-up to create the user
 *   2. Directly updates the DB to mark the email as verified
 *   3. Creates a tenant + membership so the JWT includes a tenantId
 *   This avoids needing a real email inbox during testing and ensures sign-in
 *   redirects to /dashboard (not /onboarding).
 *   Being worker-scoped means only 1 sign-up call per spec file, not 1 per test —
 *   which prevents hitting the backend's medium-window sign-up rate limit.
 *
 * The authenticatedPage fixture (test-scoped) navigates to /authentication/sign-in
 * and completes the sign-in flow so the page has a valid session (cookies + localStorage state).
 */
export const test = base.extend<AuthTestFixtures, AuthWorkerFixtures>({
  verifiedUser: [
    async ({}, use) => {
      const pool = new Pool({ connectionString: DB_URL });
      const timestamp = Date.now();
      const user: TestUser = {
        email: `pw_test_${timestamp}@stocka.test`,
        username: `pw_user_${timestamp}`,
        password: 'TestPass1!',
        userId: '',
      };

      let accessToken = '';

      try {
        const result = await apiSignUp({
          email: user.email,
          username: user.username,
          password: user.password,
        });
        user.userId = result.userId;
        accessToken = result.accessToken;

        // Small delay to ensure the backend has fully committed the sign-up transaction
        await new Promise((r) => setTimeout(r, 500));
        await verifyUserEmail(pool, user.email);
      } finally {
        await pool.end();
      }

      // Brief pause to avoid hitting the backend's per-second throttle
      // (the sign-up request already consumed 1 of 3 allowed requests per second).
      await new Promise((r) => setTimeout(r, 1000));

      // Complete onboarding via the API to create a tenant.
      // This uses the sign-up access token (the user is verified now).
      await apiCompleteOnboarding(accessToken);

      await use(user);
    },
    { scope: 'worker' },
  ],

  authenticatedPage: async ({ page, verifiedUser }, use) => {
    // verifiedUser fixture already created a tenant for this user
    await page.goto('/authentication/sign-in');

    await page.getByLabel('Enter your username or email address').fill(verifiedUser.email);
    await page.getByLabel('Enter your Password').fill(verifiedUser.password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await page.waitForURL('**/dashboard');

    await use(page);
  },
});

export { expect } from '@playwright/test';
