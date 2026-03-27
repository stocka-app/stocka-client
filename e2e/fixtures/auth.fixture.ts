import { test as base, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AUTH_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../.auth');

/** Path to the credentials file written by globalSetup. */
export const USERS_FILE = resolve(AUTH_DIR, 'users.json');

/**
 * Path to the storageState file (localStorage + cookies) for the verifiedUser.
 * Written by globalSetup after sign-in; rolled forward after each authenticated test
 * so the refresh token stays current (the backend rotates it on every /refresh-session).
 */
export const STORAGE_STATE_FILE = resolve(AUTH_DIR, 'user.json');

export interface TestUser {
  email: string;
  username: string;
  password: string;
  userId: string;
}

interface AuthTestFixtures {
  /**
   * A page authenticated as verifiedUser, already at /dashboard.
   * Restores storageState from file — no UI sign-in needed.
   */
  authenticatedPage: Page;

  /**
   * A page authenticated as verifiedUser with storageState pre-loaded,
   * but WITHOUT initial navigation. Use when the test must register route
   * mocks before the first navigation (e.g. storage-rbac tests).
   */
  preAuthPage: Page;
}

interface AuthWorkerFixtures {
  /**
   * Pre-created, email-verified user with a tenant.
   * Loaded from the credentials file written by globalSetup — zero API calls.
   * Worker-scoped: shared across all tests in the spec file.
   */
  verifiedUser: TestUser;
}

export const test = base.extend<AuthTestFixtures, AuthWorkerFixtures>({
  verifiedUser: [
    async ({}, use) => {
      const { verifiedUser } = JSON.parse(readFileSync(USERS_FILE, 'utf-8')) as {
        verifiedUser: TestUser;
      };
      await use(verifiedUser);
    },
    { scope: 'worker' },
  ],

  authenticatedPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: STORAGE_STATE_FILE });
    const page = await ctx.newPage();

    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    // Wait for hydrateAuth() (executeRefresh + getMe + loadPermissions) to complete
    // before handing the page to the test. Without this, the test might navigate away
    // while executeRefresh is still in-flight, causing the backend to rotate the token
    // but the browser to discard the Set-Cookie response — invalidating the session.
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await use(page);

    // Roll the storageState forward so the next test has a valid refresh token.
    await ctx.storageState({ path: STORAGE_STATE_FILE });
    await ctx.close();
  },

  preAuthPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({ storageState: STORAGE_STATE_FILE });
    const page = await ctx.newPage();

    await use(page);

    // Roll the storageState forward.
    await ctx.storageState({ path: STORAGE_STATE_FILE });
    await ctx.close();
  },
});

export { expect } from '@playwright/test';
