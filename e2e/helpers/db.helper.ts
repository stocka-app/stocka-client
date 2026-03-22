import { Pool } from 'pg';

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
     VALUES (gen_random_uuid(), $1, $2, $3, 'owner', 'active', NOW(), NOW(), NOW())`,
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
