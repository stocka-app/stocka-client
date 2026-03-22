import { test as base, type Page } from '@playwright/test';
import { Pool } from 'pg';
import { apiSignUp } from '../helpers/api.helper';
import { verifyUserEmail } from '../helpers/db.helper';
import { LoginPage } from '../pages/login.page';

const DB_URL =
  process.env.PW_DATABASE_URL ??
  'postgresql://stocka:stocka_dev_password@localhost:5434/stocka_playwright';

export interface TestUser {
  email: string;
  username: string;
  password: string;
  userId: string;
}

interface OnboardingFixtures {
  /**
   * A pre-created, email-verified user WITHOUT a tenant.
   * Sign-in will redirect to /onboarding (because tenantId is null in the JWT).
   */
  verifiedUser: TestUser;

  /**
   * A page authenticated as a verified user who has NOT completed onboarding.
   * After sign-in, the app redirects to /onboarding (because tenantId is null).
   */
  onboardingPage: Page;
}

/**
 * Extended fixture for onboarding E2E tests.
 *
 * Unlike auth.fixture, this fixture creates a verified user WITHOUT a tenant,
 * so sign-in redirects to /onboarding instead of /dashboard.
 */
export const test = base.extend<OnboardingFixtures>({
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
      // NOTE: No tenant is created — user will be redirected to /onboarding
    } finally {
      await pool.end();
    }

    await use(user);
  },

  onboardingPage: async ({ page, verifiedUser }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn(verifiedUser.email, verifiedUser.password);

    // New users without a tenant get redirected to /onboarding
    await page.waitForURL('**/onboarding', { timeout: 15_000 });

    await use(page);
  },
});

export { expect } from '@playwright/test';
export type { TestUser };
