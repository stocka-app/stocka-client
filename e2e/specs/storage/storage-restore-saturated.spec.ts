import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import { StoragesListPage } from '../../pages/storages-list.page';

// ═════════════════════════════════════════════════════════════════════════════
// PW-H06-8 — Restore at tier-limit saturation must NOT be blocked
//
// True end-to-end: no page.route() mocks. The browser hits the real BE on
// :3002 with the real Postgres backing it, exactly as a user would.
// Reproduces the bug reported on 2026-04-16:
//   tenant on STARTER (max=3 custom rooms), user creates 3, archives 1,
//   tries to restore → BE wrongly returns 403 CUSTOM_ROOM_LIMIT_REACHED.
// ═════════════════════════════════════════════════════════════════════════════

// Read the API URL lazily so the .env.e2e load that runs as a side effect of
// the api.helper import is guaranteed to have populated process.env first.
function getApiBase(): string {
  return process.env.PW_API_URL ?? 'http://localhost:3001/api';
}

interface CreateStorageResponse {
  data: { storageUUID: string };
}

async function apiCreateCustomRoom(accessToken: string, name: string): Promise<string> {
  const res = await fetch(`${getApiBase()}/storages/custom-rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name,
      roomType: 'Office',
      address: 'Local 1, CDMX',
      icon: 'meeting_room',
      color: '#0066FF',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`apiCreateCustomRoom(${name}) failed (${res.status}): ${body}`);
  }
  const body = (await res.json()) as CreateStorageResponse;
  return body.data.storageUUID;
}

async function apiArchiveCustomRoom(accessToken: string, uuid: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/storages/custom-rooms/${uuid}/archive`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`apiArchiveCustomRoom(${uuid}) failed (${res.status}): ${body}`);
  }
}

/**
 * Forces the tenant's tier_config to STARTER limits so the test runs against
 * a deterministic max=3 custom rooms ceiling. The default tier from
 * apiCompleteOnboarding is FREE (max=1) — pinning the row keeps the test
 * stable and lets us reach the saturation scenario.
 */
async function setTenantConfigToStarterByUserUuid(pool: Pool, userUuid: string): Promise<void> {
  // Wait until tenant_config exists for this user (the onboarding saga commits
  // asynchronously — same pattern as verifyUserEmail). Without this the UPDATE
  // can run BEFORE the row materializes and silently affect 0 rows.
  for (let attempt = 1; attempt <= 30; attempt++) {
    const check = await pool.query<{ max_custom_rooms: number }>(
      `SELECT tc.max_custom_rooms
       FROM tenants.tenant_config tc
       JOIN tenants.tenant_members tm ON tm.tenant_id = tc.tenant_id
       JOIN identity.users u ON u.id = tm.user_id
       WHERE u.uuid = $1`,
      [userUuid],
    );
    if ((check.rowCount ?? 0) > 0) break;
    if (attempt === 30) {
      throw new Error(
        `setTenantConfigToStarterByUserUuid: tenant_config never appeared for user uuid ${userUuid}`,
      );
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  const result = await pool.query<{ max_custom_rooms: number }>(
    `UPDATE tenants.tenant_config tc
     SET tier = 'STARTER',
         max_warehouses = 3,
         max_custom_rooms = 3,
         max_store_rooms = 3,
         max_users = 5
     FROM tenants.tenant_members tm
     JOIN identity.users u ON u.id = tm.user_id
     WHERE u.uuid = $1 AND tm.tenant_id = tc.tenant_id
     RETURNING tc.tenant_id, tc.max_custom_rooms`,
    [userUuid],
  );
  if ((result.rowCount ?? 0) === 0) {
    throw new Error(
      `setTenantConfigToStarterByUserUuid: no tenant_config row updated for user uuid ${userUuid}`,
    );
  }
  const row = result.rows[0];
  console.log(
    `[PW-H06-8] tenant_config updated: max_custom_rooms=${row.max_custom_rooms} for user ${userUuid}`,
  );
}

test.describe('Given a STARTER tenant has 3/3 custom rooms with one archived (real BE, no mocks)', () => {
  let pool: Pool;
  let archivedUUID: string;
  const ts = Date.now();
  const userEmail = `pw_h06_8_${ts}@stocka.test`;
  const username = `pw_h06_8_${ts}`;
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();

    // 1. Create user via real API + verify email via DB
    const signUp = await apiSignUp({ email: userEmail, username, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, userEmail);

    // 2. Complete onboarding via real API → creates tenant
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);

    // 3. Pin tier to STARTER so max_custom_rooms = 3 deterministically.
    // Joining via tenant_members keeps the lookup independent of how the
    // onboarding response shapes the tenant identifier.
    await setTenantConfigToStarterByUserUuid(pool, signUp.userId);

    // 4. Re-sign in to refresh JWT with the (possibly updated) tenant claims
    const { accessToken } = await apiSignIn(userEmail, password);

    // 5. Saturate the custom-room quota: 3 created (max), then archive one.
    console.log(`[PW-H06-8] API_BASE resolved to: ${getApiBase()}`);

    const debugConfig = async (label: string): Promise<void> => {
      const cfg = await pool.query(
        `SELECT tc.tier, tc.max_custom_rooms, tc.tenant_id
         FROM tenants.tenant_config tc
         JOIN tenants.tenant_members tm ON tm.tenant_id = tc.tenant_id
         JOIN identity.users u ON u.id = tm.user_id
         WHERE u.uuid = $1`,
        [signUp.userId],
      );
      const rooms = await pool.query(
        `SELECT cr.tenant_uuid, cr.name, cr.archived_at
         FROM storage.custom_rooms cr
         WHERE cr.tenant_uuid IN (
           SELECT t.uuid FROM tenants.tenants t
           JOIN tenants.tenant_members tm ON tm.tenant_id = t.id
           JOIN identity.users u ON u.id = tm.user_id
           WHERE u.uuid = $1
         )`,
        [signUp.userId],
      );
      console.log(
        `[PW-H06-8] [${label}] cfg rows=`,
        JSON.stringify(cfg.rows),
        ' rooms=',
        JSON.stringify(rooms.rows),
      );
    };

    // Onboarding already seeds one custom room ("Tienda Principal"). With
    // STARTER's max_custom_rooms = 3 we only need TWO more creates to reach
    // saturation, then archive one to set up the bug scenario.
    archivedUUID = await apiCreateCustomRoom(accessToken, 'Saturated CR Alpha');
    await apiCreateCustomRoom(accessToken, 'Saturated CR Beta');
    await apiArchiveCustomRoom(accessToken, archivedUUID);

  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('PW-H06-8: When the user clicks Restore on the archived custom room, Then the success toast appears (today the user sees the tier-limit error toast — that is the bug)', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    // Sign in via UI inline so the auth session is fresh and tied to the
    // tenant we just saturated. We avoid storageState because the file is
    // produced at runtime (post-saturation) and Playwright resolves
    // test.use({ storageState }) at module-import time.
    await page.addInitScript(() => {
      localStorage.setItem('i18nextLng', 'en');
    });
    await page.goto('/authentication/sign-in');
    await page.getByLabel('Enter your username or email address').fill(userEmail);
    await page.getByLabel('Enter your Password').fill(password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await page.goto('/storages');

    const list = new StoragesListPage(page);
    await list.waitForCards();

    // Default filter excludes ARCHIVED. Switch to the "Archived" status pill
    // so the archived card is rendered. The accessible name of the pill
    // includes the counter (e.g. "Archived 1"), so match by leading word.
    await page
      .getByRole('tablist', { name: /Filter by status|Filtrar por estado/i })
      .getByRole('tab', { name: /Archived|Archivadas/i })
      .click();

    await expect(list.card('Saturated CR Alpha')).toBeVisible({ timeout: 10_000 });
    await list.openCardMenu('Saturated CR Alpha');
    await list.menuItems.restore.click();

    // The success toast must appear. Today this assertion fails: the BE
    // returns 403 CUSTOM_ROOM_LIMIT_REACHED and the FE shows the tier-limit
    // toast instead. After the policy fix this turns GREEN.
    await expect(page.getByText(/Saturated CR Alpha restored/i)).toBeVisible({
      timeout: 10_000,
    });

    // Defensive negative assertion: the tier-limit toast must NOT be shown.
    await expect(
      page.getByText(/your current plan does not support more storages/i),
    ).not.toBeVisible();
  });
});
