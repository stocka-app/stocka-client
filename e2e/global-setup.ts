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
      verification_attempts,
      email_verification_tokens,
      password_reset_tokens,
      credential_sessions,
      social_sessions,
      sessions,
      social_accounts,
      credential_accounts,
      accounts,
      personal_profiles,
      commercial_profiles,
      social_profiles,
      profiles,
      tenant_members,
      tenant_config,
      tenant_profiles,
      tenants,
      process_state,
      users
    RESTART IDENTITY CASCADE
  `);
}
