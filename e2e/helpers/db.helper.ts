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
  const result = await pool.query(
    `UPDATE credential_accounts
     SET status = 'active', email_verified_at = NOW()
     WHERE email = $1
     RETURNING id`,
    [email],
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new Error(`[db.helper] No credential_account found for email: ${email}`);
  }
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
    `SELECT id, status FROM credential_accounts WHERE email = $1`,
    [email],
  );
  return result.rows[0] ?? null;
}
