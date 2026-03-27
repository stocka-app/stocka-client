import { test as base, type Page } from '@playwright/test';
import type { TestInfo } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const AUTH_DIR = resolve(__dirname, '../.auth');

const USERS_FILE = resolve(AUTH_DIR, 'users.json');

const ONBOARDING_STATE_FILES = [
  resolve(AUTH_DIR, 'onboarding-a.json'),
  resolve(AUTH_DIR, 'onboarding-b.json'),
];

export interface TestUser {
  email: string;
  username: string;
  password: string;
  userId: string;
}

interface OnboardingTestFixtures {
  /**
   * A page authenticated as a verified user who has NOT completed onboarding.
   * Restores storageState from the pre-seeded onboarding user — no UI sign-in needed.
   * storageState is rolled forward after each test so the refresh token stays current.
   */
  onboardingPage: Page;
  /**
   * Pre-created, email-verified user WITHOUT a tenant.
   * Loaded from the credentials file written by globalSetup — zero API calls.
   * Slot is derived from the spec file name so each spec gets a distinct user
   * even when running in the same worker process (workers: 1).
   */
  verifiedUser: TestUser;
}

/**
 * Derive the onboarding user slot from the spec file name.
 * onboarding-create → slot 0 (onboardingUserA / onboarding-a.json)
 * onboarding-resume → slot 1 (onboardingUserB / onboarding-b.json)
 *
 * This avoids the counter-file race that occurred when workers: 1 reused the
 * same worker process for both spec files, keeping _slot at 0 for both.
 */
function slotForSpec(testInfo: TestInfo): number {
  const specName = basename(testInfo.file, '.spec.ts');
  return specName.includes('resume') ? 1 : 0;
}

/**
 * Extended fixture for onboarding E2E tests.
 *
 * Users are pre-seeded by globalSetup — no runtime API calls, no rate-limit risk.
 * Each onboardingPage test restores from storageState instead of doing a full UI sign-in,
 * saving ~5s per test (no form fill + waitForURL /onboarding roundtrip needed).
 */
export const test = base.extend<OnboardingTestFixtures>({
  verifiedUser: async ({}, use, testInfo) => {
    const slot = slotForSpec(testInfo);
    const { onboardingUsers } = JSON.parse(readFileSync(USERS_FILE, 'utf-8')) as {
      onboardingUsers: TestUser[];
    };
    await use(onboardingUsers[slot]);
  },

  onboardingPage: async ({ browser }, use, testInfo) => {
    const slot = slotForSpec(testInfo);
    const stateFile = ONBOARDING_STATE_FILES[slot];
    const ctx = await browser.newContext({ storageState: stateFile });
    const page = await ctx.newPage();

    // Navigate to /onboarding — the silent refresh in providers.tsx validates the session.
    // Since this user has no tenant (tenantId: null in JWT), the app stays on /onboarding.
    await page.goto('/onboarding');
    await page.waitForURL('**/onboarding', { timeout: 15_000 });
    // Wait for executeRefresh() + initializeOnboarding() to complete before the test
    // body runs — otherwise acceptTermsAndContinue() may exit early (2s isVisible
    // check fires before React has rendered the consent step).
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await use(page);

    // Ensure any fire-and-forget API calls (e.g. selectPath's saveProgress) complete
    // before saving state and closing the context, so the backend is in sync for the next test.
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});

    // Roll the storageState forward so the next test has a valid refresh token.
    await ctx.storageState({ path: stateFile });
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
