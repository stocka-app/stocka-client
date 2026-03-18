import { Pool } from 'pg';

const DB_URL =
  process.env.PW_DATABASE_URL ??
  'postgresql://stocka:stocka_dev_password@localhost:5434/stocka_playwright';

export default async function globalTeardown(): Promise<void> {
  const pool = new Pool({ connectionString: DB_URL });

  try {
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
    console.log('\n[PW] Database cleaned up ✓\n');
  } catch {
    // Non-fatal — log but don't fail the test run
    console.warn('[PW] Teardown: could not truncate database (non-fatal)');
  } finally {
    await pool.end();
  }
}
