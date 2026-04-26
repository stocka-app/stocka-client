/**
 * Real storage helper — NO page.route() mocks.
 *
 * Every function either hits the real backend API on :3002 or mutates the
 * real Postgres database via the Pool exported by db.helper. Playwright
 * specs use this helper to create state before navigating, and the browser
 * interacts with the real server end-to-end.
 *
 * Pattern established in storage-restore-saturated.spec.ts (2026-04-16).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool } from 'pg';
import type { Page } from '@playwright/test';

// ─── .env.e2e loader (same as api.helper.ts) ────────────────────────────────

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
  // .env.e2e not found — fall back to defaults
}

function getApiBase(): string {
  return process.env.PW_API_URL ?? 'http://localhost:3001/api';
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type StorageType = 'WAREHOUSE' | 'STORE_ROOM' | 'CUSTOM_ROOM';

export interface CreatedStorage {
  storageUUID: string;
  name: string;
}

type TypeSlug = 'warehouses' | 'store-rooms' | 'custom-rooms';

const TYPE_SLUG: Record<StorageType, TypeSlug> = {
  WAREHOUSE: 'warehouses',
  STORE_ROOM: 'store-rooms',
  CUSTOM_ROOM: 'custom-rooms',
};

// ─── API: Create storages ───────────────────────────────────────────────────

export async function apiCreateWarehouse(
  token: string,
  name: string,
  address = 'Av. Industrial 1000, CDMX',
): Promise<CreatedStorage> {
  const res = await fetch(`${getApiBase()}/storages/warehouses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, address }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`apiCreateWarehouse(${name}) failed (${res.status}): ${body}`);
  }
  const body = (await res.json()) as { data: { storageUUID: string } };
  return { storageUUID: body.data.storageUUID, name };
}

export async function apiCreateStoreRoom(
  token: string,
  name: string,
  address = 'Calle 22, CDMX',
): Promise<CreatedStorage> {
  const res = await fetch(`${getApiBase()}/storages/store-rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, address }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`apiCreateStoreRoom(${name}) failed (${res.status}): ${body}`);
  }
  const body = (await res.json()) as { data: { storageUUID: string } };
  return { storageUUID: body.data.storageUUID, name };
}

export async function apiCreateCustomRoom(
  token: string,
  name: string,
  roomType = 'Office',
  address = 'Local 1, CDMX',
): Promise<CreatedStorage> {
  const res = await fetch(`${getApiBase()}/storages/custom-rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, roomType, address, icon: 'meeting_room', color: '#0066FF' }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`apiCreateCustomRoom(${name}) failed (${res.status}): ${body}`);
  }
  const body = (await res.json()) as { data: { storageUUID: string } };
  return { storageUUID: body.data.storageUUID, name };
}

// ─── API: State transitions ─────────────────────────────────────────────────

export async function apiArchiveStorage(
  token: string,
  type: StorageType,
  uuid: string,
): Promise<void> {
  const res = await fetch(`${getApiBase()}/storages/${TYPE_SLUG[type]}/${uuid}/archive`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`apiArchiveStorage(${uuid}) failed (${res.status}): ${body}`);
  }
}

export async function apiRestoreStorage(
  token: string,
  type: StorageType,
  uuid: string,
): Promise<void> {
  const res = await fetch(`${getApiBase()}/storages/${TYPE_SLUG[type]}/${uuid}/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`apiRestoreStorage(${uuid}) failed (${res.status}): ${body}`);
  }
}

export async function apiFreezeStorage(
  token: string,
  type: StorageType,
  uuid: string,
): Promise<void> {
  const res = await fetch(`${getApiBase()}/storages/${TYPE_SLUG[type]}/${uuid}/freeze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`apiFreezeStorage(${uuid}) failed (${res.status}): ${body}`);
  }
}

export async function apiUnfreezeStorage(
  token: string,
  type: StorageType,
  uuid: string,
): Promise<void> {
  const res = await fetch(`${getApiBase()}/storages/${TYPE_SLUG[type]}/${uuid}/unfreeze`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`apiUnfreezeStorage(${uuid}) failed (${res.status}): ${body}`);
  }
}

/**
 * Permanently deletes an archived storage by hitting the per-type DELETE
 * endpoint. Returns 204 on success; throws otherwise. Used by E2E specs
 * to simulate concurrency (e.g. a parallel deletion by another actor)
 * before the UI fires its own request.
 */
export async function apiDeletePermanentStorage(
  token: string,
  type: StorageType,
  uuid: string,
): Promise<void> {
  const res = await fetch(`${getApiBase()}/storages/${TYPE_SLUG[type]}/${uuid}/permanent`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`apiDeletePermanentStorage(${uuid}) failed (${res.status}): ${body}`);
  }
}

// ─── DB: Tier config mutations ──────────────────────────────────────────────

export async function setTierByUserUuid(
  pool: Pool,
  userUuid: string,
  tier: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE',
  limits?: Partial<{
    maxWarehouses: number;
    maxCustomRooms: number;
    maxStoreRooms: number;
    maxUsers: number;
  }>,
): Promise<void> {
  const defaults: Record<string, { maxWarehouses: number; maxCustomRooms: number; maxStoreRooms: number; maxUsers: number }> = {
    FREE: { maxWarehouses: 0, maxCustomRooms: 1, maxStoreRooms: 1, maxUsers: 1 },
    STARTER: { maxWarehouses: 3, maxCustomRooms: 3, maxStoreRooms: 3, maxUsers: 5 },
    GROWTH: { maxWarehouses: 10, maxCustomRooms: 10, maxStoreRooms: 10, maxUsers: 25 },
    ENTERPRISE: { maxWarehouses: -1, maxCustomRooms: -1, maxStoreRooms: -1, maxUsers: -1 },
  };
  const d = { ...defaults[tier], ...limits };

  for (let attempt = 1; attempt <= 30; attempt++) {
    const check = await pool.query(
      `SELECT 1 FROM tenants.tenant_config tc
       JOIN tenants.tenant_members tm ON tm.tenant_id = tc.tenant_id
       JOIN identity.users u ON u.id = tm.user_id
       WHERE u.uuid = $1`,
      [userUuid],
    );
    if ((check.rowCount ?? 0) > 0) break;
    if (attempt === 30) {
      throw new Error(`setTierByUserUuid: tenant_config not found for user ${userUuid}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  const result = await pool.query(
    `UPDATE tenants.tenant_config tc
     SET tier = $2,
         max_warehouses = $3,
         max_custom_rooms = $4,
         max_store_rooms = $5,
         max_users = $6
     FROM tenants.tenant_members tm
     JOIN identity.users u ON u.id = tm.user_id
     WHERE u.uuid = $1 AND tm.tenant_id = tc.tenant_id`,
    [userUuid, tier, d.maxWarehouses, d.maxCustomRooms, d.maxStoreRooms, d.maxUsers],
  );
  if ((result.rowCount ?? 0) === 0) {
    throw new Error(`setTierByUserUuid: no rows updated for user ${userUuid}`);
  }
}

/**
 * Deletes all storages for a tenant so the empty state renders.
 */
export async function clearAllStoragesForUser(pool: Pool, userUuid: string): Promise<void> {
  const tenantUuidQuery = `
    SELECT t.uuid FROM tenants.tenants t
    JOIN tenants.tenant_members tm ON tm.tenant_id = t.id
    JOIN identity.users u ON u.id = tm.user_id
    WHERE u.uuid = $1
  `;
  for (const table of ['custom_rooms', 'store_rooms', 'warehouses']) {
    await pool.query(
      `DELETE FROM storage.${table} WHERE tenant_uuid IN (${tenantUuidQuery})`,
      [userUuid],
    );
  }
}

// ─── Navigation (real, no mocks) ────────────────────────────────────────────

/**
 * Signs in via UI and navigates to /storages. Use this when the spec creates
 * its own user (not the global-setup verifiedUser).
 */
export async function signInAndNavigateToStorages(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
  });
  await page.goto('/authentication/sign-in');
  await page.getByLabel('Enter your username or email address').fill(email);
  await page.getByLabel('Enter your Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
  await page.goto('/storages');
  await page.waitForURL('**/storages', { timeout: 15_000 });
}

/**
 * Navigates to /storages using the preAuthPage fixture (global-setup
 * verifiedUser with storageState already loaded). No login needed.
 */
export async function navigateToStorages(page: Page): Promise<void> {
  await page.goto('/storages');
  await page.waitForURL('**/storages', { timeout: 15_000 });
}
