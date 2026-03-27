import { chromium } from '@playwright/test';
import { Pool } from 'pg';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiSignUp, apiCompleteOnboarding } from './helpers/api.helper';
import { verifyUserEmail, addMemberToTenant } from './helpers/db.helper';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const AUTH_DIR = resolve(__dirname, '.auth');

export const USERS_FILE = resolve(AUTH_DIR, 'users.json');
export const STORAGE_STATE_FILE = resolve(AUTH_DIR, 'user.json');
/** storageState for the first onboarding spec (onboarding-create) */
export const ONBOARDING_A_STATE_FILE = resolve(AUTH_DIR, 'onboarding-a.json');
/** storageState for the second onboarding spec (onboarding-resume) */
export const ONBOARDING_B_STATE_FILE = resolve(AUTH_DIR, 'onboarding-b.json');
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
    const ts = Date.now();

    // ── 1. Create the shared verified user (auth + storage tests) ─────────────
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

    await new Promise<void>((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, verifiedUser.email);

    await new Promise<void>((r) => setTimeout(r, 500));
    const { tenantId } = await apiCompleteOnboarding(signUpResult.accessToken);

    // ── 2. Create onboarding users (no tenant — redirected to /onboarding) ────
    //   Two users: one per onboarding spec file (fixtures are worker-scoped and
    //   recycled between spec files, so each spec needs its own fresh user).
    const onboardingUserA = {
      email: `pw_onboard_a_${ts}@stocka.test`,
      username: `pw_onboard_a_${ts}`,
      password: 'TestPass1!',
      userId: '',
    };
    const onboardingUserB = {
      email: `pw_onboard_b_${ts}@stocka.test`,
      username: `pw_onboard_b_${ts}`,
      password: 'TestPass1!',
      userId: '',
    };

    await new Promise<void>((r) => setTimeout(r, 300));
    const signUpA = await apiSignUp({
      email: onboardingUserA.email,
      username: onboardingUserA.username,
      password: onboardingUserA.password,
    });
    onboardingUserA.userId = signUpA.userId;
    await verifyUserEmail(pool, onboardingUserA.email);

    await new Promise<void>((r) => setTimeout(r, 300));
    const signUpB = await apiSignUp({
      email: onboardingUserB.email,
      username: onboardingUserB.username,
      password: onboardingUserB.password,
    });
    onboardingUserB.userId = signUpB.userId;
    await verifyUserEmail(pool, onboardingUserB.email);

    // ── 3. Create viewer user for storage-rbac API 403 test ───────────────────
    const viewerUser = {
      email: `pw_viewer_${ts}@stocka.test`,
      username: `pw_viewer_${ts}`,
      password: 'TestPass1!',
      userId: '',
    };

    await new Promise<void>((r) => setTimeout(r, 300));
    const signUpViewer = await apiSignUp({
      email: viewerUser.email,
      username: viewerUser.username,
      password: viewerUser.password,
    });
    viewerUser.userId = signUpViewer.userId;
    await verifyUserEmail(pool, viewerUser.email);
    await addMemberToTenant(pool, tenantId, viewerUser.userId, 'VIEWER');

    // ── 4. Save credentials for fixtures to load (zero API calls at test time) ─
    writeFileSync(
      USERS_FILE,
      JSON.stringify(
        {
          verifiedUser,
          onboardingUsers: [onboardingUserA, onboardingUserB],
          viewerUser,
        },
        null,
        2,
      ),
    );
    console.log('[PW] Users pre-seeded: verifiedUser + 2×onboarding + viewer ✓');

    // ── 5. Save browser storageStates via UI sign-in ──────────────────────────
    //   Fixtures restore these states instead of doing a full UI sign-in per test.
    //   States are rolled forward after each test so refresh tokens stay current.
    const browser = await chromium.launch();
    try {
      const signInAndSave = async (
        email: string,
        password: string,
        expectedUrlPattern: string,
        stateFile: string,
        label: string,
      ): Promise<void> => {
        const ctx = await browser.newContext({ baseURL: BASE_URL });
        const page = await ctx.newPage();
        await page.goto('/authentication/sign-in');
        await page.getByLabel('Enter your username or email address').fill(email);
        await page.getByLabel('Enter your Password').fill(password);
        await page.getByRole('button', { name: 'Sign in', exact: true }).click();
        await page.waitForURL(expectedUrlPattern, { timeout: 30_000 });
        await ctx.storageState({ path: stateFile });
        await ctx.close();
        console.log(`[PW] ${label} storageState saved ✓`);
      };

      await signInAndSave(
        verifiedUser.email,
        verifiedUser.password,
        '**/dashboard',
        STORAGE_STATE_FILE,
        'verifiedUser',
      );
      await signInAndSave(
        onboardingUserA.email,
        onboardingUserA.password,
        '**/onboarding',
        ONBOARDING_A_STATE_FILE,
        'onboardingUserA',
      );
      await signInAndSave(
        onboardingUserB.email,
        onboardingUserB.password,
        '**/onboarding',
        ONBOARDING_B_STATE_FILE,
        'onboardingUserB',
      );
      console.log('');
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
