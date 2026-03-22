import { Pool } from 'pg';

const DB_URL =
  process.env.PW_DATABASE_URL ??
  'postgresql://stocka:stocka_dev_password@localhost:5434/stocka_playwright';

export default async function globalSetup(): Promise<void> {
  const pool = new Pool({ connectionString: DB_URL });

  try {
    await pool.query('SELECT 1');
    console.log('\n[PW] Connected to stocka_playwright ✓');
    await truncateAll(pool);
    console.log('[PW] Database truncated — ready for tests\n');
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : String(error);
    throw new Error(
      `[PW] Cannot connect to stocka_playwright: ${msg}\n` +
        'Make sure you have run the one-time setup:\n' +
        '  psql -h localhost -p 5434 -U stocka -c "CREATE DATABASE stocka_playwright;"\n' +
        '  cd ../stocka-server && DB_DATABASE=stocka_playwright npm run migration:run\n' +
        '  DB_DATABASE=stocka_playwright npm run start:dev',
    );
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
