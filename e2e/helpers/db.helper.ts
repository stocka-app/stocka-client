import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

// Load .env.e2e into process.env — same reason as api.helper.ts:
// Playwright worker processes do not inherit process.env changes from the main process.
// ESM: use import.meta.url instead of __dirname.
try {
  const dir = fileURLToPath(new URL('.', import.meta.url));
  const envContent = readFileSync(resolve(dir, '../../.env.e2e'), 'utf8');
  for (const line of envContent.split('\n')) {
    const match = /^([^#=\s][^=]*)=(.*)$/.exec(line.trim());
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
} catch {
  // .env.e2e not found — fall back to defaults below
}

const DB_URL =
  process.env.PW_DATABASE_URL ??
  'postgresql://stocka:stocka_dev_password@localhost:5434/stocka_playwright';

export function createDbPool(): Pool {
  return new Pool({ connectionString: DB_URL });
}

/**
 * Bypasses email verification by directly setting the credential_account status
 * to 'active' and recording the verified-at timestamp.
 *
 * Use this in test setup to create a signed-in-ready user without needing to
 * intercept an actual email.
 */
export async function verifyUserEmail(pool: Pool, email: string): Promise<void> {
  // The backend uses a saga with a UnitOfWork transaction. The API returns 201
  // after the saga completes, but under load the PostgreSQL commit may not be
  // visible to a separate connection pool immediately. Retry for up to 15 seconds.
  const maxAttempts = 30;
  const delayMs = 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const result = await pool.query(
      `UPDATE accounts.credential_accounts
       SET status = 'active', email_verified_at = NOW()
       WHERE email = $1
       RETURNING id`,
      [email],
    );

    if ((result.rowCount ?? 0) > 0) {
      return;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error(`[db.helper] No credential_account found for email: ${email} (after ${maxAttempts} attempts)`);
}

/**
 * Creates a tenant and links the user as the owner + active member so the
 * sign-in JWT includes a non-null tenantId, allowing access to the dashboard.
 *
 * Must be called AFTER the user has been created via apiSignUp.
 */
export async function createTenantForUser(
  pool: Pool,
  userUuid: string,
): Promise<{ tenantUuid: string }> {
  // Resolve the internal integer id for the user
  const userResult = await pool.query<{ id: number }>(
    `SELECT id FROM identity.users WHERE uuid = $1`,
    [userUuid],
  );
  if (userResult.rows.length === 0) {
    throw new Error(`[db.helper] No user found with uuid: ${userUuid}`);
  }
  const userId = userResult.rows[0].id;

  // Create a tenant (cast owner_user_id to integer explicitly)
  const tenantResult = await pool.query<{ id: number; uuid: string }>(
    `INSERT INTO tenants.tenants (uuid, name, slug, business_type, country, timezone, status, owner_user_id, created_at, updated_at)
     VALUES (gen_random_uuid(), 'PW Test Business', $1, 'retail', 'MX', 'America/Mexico_City', 'active', $2::integer, NOW(), NOW())
     RETURNING id, uuid`,
    [`pw-test-${userId}`, userId],
  );
  const tenantId = tenantResult.rows[0].id;
  const tenantUuid = tenantResult.rows[0].uuid;

  // Add user as an active member with 'owner' role
  await pool.query(
    `INSERT INTO tenants.tenant_members (uuid, tenant_id, user_id, user_uuid, role, status, joined_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, 'OWNER', 'active', NOW(), NOW(), NOW())`,
    [tenantId, userId, userUuid],
  );

  // Create tenant_config (required for the app to function)
  await pool.query(
    `INSERT INTO tenants.tenant_config (uuid, tenant_id, tier, max_warehouses, max_custom_rooms, max_store_rooms, max_users, max_products, notifications_enabled, product_count, storage_count, member_count, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, 'free', 3, 5, 5, 3, 100, true, 0, 0, 1, NOW(), NOW())`,
    [tenantId],
  );

  return { tenantUuid };
}

/**
 * Truncates specific tables in the test database.
 * Useful for per-test cleanup when full suite truncation is too broad.
 */
export async function truncateTables(pool: Pool, tables: string[]): Promise<void> {
  if (tables.length === 0) return;
  await pool.query(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
}

/**
 * Adds an existing user as a member of an existing tenant with the given role.
 * Use this to set up role-based E2E scenarios without going through full onboarding.
 */
export async function addMemberToTenant(
  pool: Pool,
  tenantUuid: string,
  userUuid: string,
  role: string,
): Promise<void> {
  const tenantResult = await pool.query<{ id: number }>(
    `SELECT id FROM tenants.tenants WHERE uuid = $1`,
    [tenantUuid],
  );
  if (tenantResult.rows.length === 0) {
    throw new Error(`[db.helper] No tenant found with uuid: ${tenantUuid}`);
  }
  const tenantId = tenantResult.rows[0].id;

  const userResult = await pool.query<{ id: number }>(
    `SELECT id FROM identity.users WHERE uuid = $1`,
    [userUuid],
  );
  if (userResult.rows.length === 0) {
    throw new Error(`[db.helper] No user found with uuid: ${userUuid}`);
  }
  const userId = userResult.rows[0].id;

  await pool.query(
    `INSERT INTO tenants.tenant_members (uuid, tenant_id, user_id, user_uuid, role, status, joined_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, 'active', NOW(), NOW(), NOW())`,
    [tenantId, userId, userUuid, role],
  );
}

/**
 * Returns the tenant UUID owned by the given user, or null if not found.
 */
export async function findTenantByUserUuid(pool: Pool, userUuid: string): Promise<string | null> {
  const result = await pool.query<{ uuid: string }>(
    `SELECT t.uuid FROM tenants.tenants t
     WHERE t.owner_user_id = (SELECT id FROM identity.users WHERE uuid = $1)
     LIMIT 1`,
    [userUuid],
  );
  return result.rows[0]?.uuid ?? null;
}

/**
 * Inserts a password-reset token for the given email so E2E tests can
 * navigate to /reset-password?token=<plainToken> without intercepting emails.
 *
 * The backend hashes tokens with SHA-256 before storing, so we do the same.
 * Returns the plain token to use in the URL.
 */
export async function insertPasswordResetToken(
  pool: Pool,
  email: string,
  expiresInMinutes = 30,
): Promise<string> {
  const { createHash, randomBytes } = await import('node:crypto');
  const plainToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(plainToken).digest('hex');

  const accountResult = await pool.query<{ id: number }>(
    `SELECT id FROM accounts.credential_accounts WHERE email = $1`,
    [email],
  );
  if (accountResult.rows.length === 0) {
    throw new Error(`[db.helper] No credential_account for email: ${email}`);
  }

  await pool.query(
    `INSERT INTO authn.password_reset_tokens (uuid, credential_account_id, token_hash, expires_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '${expiresInMinutes} minutes', NOW(), NOW())`,
    [accountResult.rows[0].id, tokenHash],
  );

  return plainToken;
}

/**
 * Inserts an expired password-reset token for testing the "token expired" flow.
 */
export async function insertExpiredPasswordResetToken(
  pool: Pool,
  email: string,
): Promise<string> {
  const { createHash, randomBytes } = await import('node:crypto');
  const plainToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(plainToken).digest('hex');

  const accountResult = await pool.query<{ id: number }>(
    `SELECT id FROM accounts.credential_accounts WHERE email = $1`,
    [email],
  );
  if (accountResult.rows.length === 0) {
    throw new Error(`[db.helper] No credential_account for email: ${email}`);
  }

  await pool.query(
    `INSERT INTO authn.password_reset_tokens (uuid, credential_account_id, token_hash, expires_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, NOW() - INTERVAL '1 hour', NOW(), NOW())`,
    [accountResult.rows[0].id, tokenHash],
  );

  return plainToken;
}

/**
 * Inserts a known email verification code for the given email so E2E tests can
 * submit the code without intercepting the actual email.
 *
 * Returns the plain 6-character code to enter in the form.
 */
export async function insertVerificationCode(
  pool: Pool,
  email: string,
  code = 'ABC123',
  expiresInMinutes = 10,
): Promise<string> {
  const { createHash } = await import('node:crypto');
  const codeHash = createHash('sha256').update(code).digest('hex');

  const accountResult = await pool.query<{ id: number }>(
    `SELECT id FROM accounts.credential_accounts WHERE email = $1`,
    [email],
  );
  if (accountResult.rows.length === 0) {
    throw new Error(`[db.helper] No credential_account for email: ${email}`);
  }

  // Remove any existing verification tokens for this account
  await pool.query(
    `DELETE FROM authn.email_verification_tokens WHERE credential_account_id = $1`,
    [accountResult.rows[0].id],
  );

  await pool.query(
    `INSERT INTO authn.email_verification_tokens (uuid, credential_account_id, code_hash, expires_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '${expiresInMinutes} minutes', NOW(), NOW())`,
    [accountResult.rows[0].id, codeHash],
  );

  return code;
}

/**
 * Returns the account id for the given email, or null if not found.
 * Useful for verifying that a sign-up actually created the user.
 */
export async function findAccountByEmail(
  pool: Pool,
  email: string,
): Promise<{ id: number; status: string } | null> {
  const result = await pool.query<{ id: number; status: string }>(
    `SELECT id, status FROM accounts.credential_accounts WHERE email = $1`,
    [email],
  );
  return result.rows[0] ?? null;
}
