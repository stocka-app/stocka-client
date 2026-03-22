import { Pool } from 'pg';

const DB_URL =
  process.env.PW_DATABASE_URL ??
  'postgresql://stocka:stocka_dev_password@localhost:5434/stocka_playwright';

export default async function globalTeardown(): Promise<void> {
  const pool = new Pool({ connectionString: DB_URL });

  try {
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
    console.log('\n[PW] Database cleaned up ✓\n');
  } catch {
    // Non-fatal — log but don't fail the test run
    console.warn('[PW] Teardown: could not truncate database (non-fatal)');
  } finally {
    await pool.end();
  }
}
