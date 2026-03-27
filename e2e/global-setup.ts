import { chromium } from '@playwright/test';
import { Pool } from 'pg';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiSignUp, apiCompleteOnboarding } from './helpers/api.helper';
import { verifyUserEmail } from './helpers/db.helper';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const AUTH_DIR = resolve(__dirname, '.auth');

export const USERS_FILE = resolve(AUTH_DIR, 'users.json');
export const STORAGE_STATE_FILE = resolve(AUTH_DIR, 'user.json');

const DB_URL =
  process.env.PW_DATABASE_URL ??
  'postgresql://stocka:stocka_dev_password@localhost:5434/stocka_playwright';

const BASE_URL = process.env.PW_BASE_URL ?? 'http://localhost:5174';

export default async function globalSetup(): Promise<void> {
  const pool = new Pool({ connectionString: DB_URL });

  try {
    await pool.query('SELECT 1');
    console.log('\n[PW] Connected to stocka_playwright ✓');
    await truncateAll(pool);
    console.log('[PW] Database truncated — ready for tests\n');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[PW] Cannot connect to stocka_playwright: ${msg}\n` +
        'Make sure you have run the one-time setup:\n' +
        '  psql -h localhost -p 5434 -U stocka -c "CREATE DATABASE stocka_playwright;"\n' +
        '  cd ../stocka-server && DB_DATABASE=stocka_playwright npm run migration:run\n' +
        '  E2E_MODE=true DB_DATABASE=stocka_playwright PORT=3002 npm run start:dev',
    );
  }

  // Ensure the .auth directory exists (gitignored — holds per-run credentials & state)
  mkdirSync(AUTH_DIR, { recursive: true });

  try {
    // ── 1. Create the shared verified user (used by auth + storage tests) ─────
    const ts = Date.now();
    const verifiedUser = {
      email: `pw_auth_${ts}@stocka.test`,
      username: `pw_auth_${ts}`,
      password: 'TestPass1!',
      userId: '',
    };

    const signUpResult = await apiSignUp({
      email: verifiedUser.email,
      username: verifiedUser.username,
      password: verifiedUser.password,
    });
    verifiedUser.userId = signUpResult.userId;

    await new Promise<void>((r) => setTimeout(r, 500));
    await verifyUserEmail(pool, verifiedUser.email);

    // Brief pause to avoid short-window throttle before the onboarding call
    await new Promise<void>((r) => setTimeout(r, 1000));
    await apiCompleteOnboarding(signUpResult.accessToken);

    // ── 2. Save credentials for fixtures to load ───────────────────────────────
    writeFileSync(USERS_FILE, JSON.stringify({ verifiedUser }, null, 2));
    console.log('[PW] verifiedUser pre-seeded ✓');

    // ── 3. Save authenticated browser state (rolling storageState) ────────────
    //   Fixtures restore this state instead of doing a full UI sign-in per test.
    //   The state is updated after each authenticatedPage/preAuthPage test so the
    //   refresh token stays current (backend rotates it on every POST /refresh-session).
    const browser = await chromium.launch();
    try {
      const ctx = await browser.newContext({ baseURL: BASE_URL });
      const page = await ctx.newPage();

      await page.goto('/authentication/sign-in');
      await page.getByLabel('Enter your username or email address').fill(verifiedUser.email);
      await page.getByLabel('Enter your Password').fill(verifiedUser.password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.waitForURL('**/dashboard', { timeout: 30_000 });

      await ctx.storageState({ path: STORAGE_STATE_FILE });
      console.log('[PW] storageState saved ✓\n');
    } finally {
      await browser.close();
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`[PW] globalSetup — user seeding failed: ${msg}`);
  } finally {
    await pool.end();
  }
}

async function truncateAll(pool: Pool): Promise<void> {
  await pool.query(`
    TRUNCATE TABLE
      authn.verification_attempts,
      authn.email_verification_tokens,
      authn.password_reset_tokens,
      sessions.credential_sessions,
      sessions.social_sessions,
      sessions.sessions,
      accounts.social_accounts,
      accounts.credential_accounts,
      accounts.accounts,
      profiles.personal_profiles,
      profiles.commercial_profiles,
      profiles.social_profiles,
      profiles.profiles,
      tenants.tenant_members,
      tenants.tenant_config,
      tenants.tenant_profiles,
      tenants.tenant_invitations,
      tenants.tenants,
      onboarding.onboarding_sessions,
      storage.custom_rooms,
      storage.store_rooms,
      storage.warehouses,
      storage.storages,
      identity.user_consents,
      shared.process_state,
      identity.users
    RESTART IDENTITY CASCADE
  `);
}
