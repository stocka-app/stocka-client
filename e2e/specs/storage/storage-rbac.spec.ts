import { test, expect } from '../../fixtures/coverage.fixture';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import {
  createDbPool,
  verifyUserEmail,
  addMemberToTenant,
  findTenantByUserUuid,
} from '../../helpers/db.helper';
import {
  apiCreateWarehouse,
  apiCreateCustomRoom,
  apiArchiveStorage,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { StoragesListPage } from '../../pages/storages-list.page';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const USERS_FILE = resolve(__dirname, '../../.auth/users.json');

// ═════════════════════════════════════════════════════════════════════════════
// RBAC storage permissions (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('RBAC storage permissions (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const password = 'TestPass1!';

  const ownerEmail = `pw_rbac_owner_${ts}@stocka.test`;
  const viewerEmail = `pw_rbac_viewer_${ts}@stocka.test`;

  let warehouseName: string;
  let archivedRoomName: string;

  test.beforeAll(async () => {
    pool = createDbPool();

    // Owner: create tenant + storages
    const ownerSignUp = await apiSignUp({ email: ownerEmail, username: `pw_rbac_owner_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, ownerEmail);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(ownerSignUp.accessToken);
    await setTierByUserUuid(pool, ownerSignUp.userId, 'STARTER');

    const { accessToken } = await apiSignIn(ownerEmail, password);
    const wh = await apiCreateWarehouse(accessToken, 'E2E Active Warehouse', 'Calle Test 1');
    warehouseName = wh.name;
    const cr = await apiCreateCustomRoom(accessToken, 'E2E Archived Room');
    archivedRoomName = cr.name;
    await apiArchiveStorage(accessToken, 'CUSTOM_ROOM', cr.storageUUID);

    // Viewer: create user, add as VIEWER to owner's tenant
    const viewerSignUp = await apiSignUp({ email: viewerEmail, username: `pw_rbac_viewer_${ts}`, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, viewerEmail);

    const tenantUuid = await findTenantByUserUuid(pool, ownerSignUp.userId);
    if (!tenantUuid) throw new Error('Owner tenant not found');
    await addMemberToTenant(pool, tenantUuid, viewerSignUp.userId, 'VIEWER');
  });

  test.afterAll(async () => {
    await pool.end();
  });

  // ── Viewer UI restrictions ──────────────────────────────────────────────────

  test('Viewer: only View action is available in the card menu — Edit and Archive are disabled', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, viewerEmail, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(warehouseName);

    await expect(list.menuItems.view).toBeVisible();
    await expect(list.menuItems.edit).toHaveAttribute('aria-disabled', 'true');
    await expect(list.menuItems.archive).toHaveAttribute('aria-disabled', 'true');
  });

  test('Viewer: the "New storage" button is not visible', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, viewerEmail, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await expect(page.getByRole('button', { name: /New storage/i })).not.toBeVisible();
  });

  // ── Owner UI access ─────────────────────────────────────────────────────────

  test('Owner: the "New storage" button is visible', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await expect(page.getByRole('button', { name: /New storage/i })).toBeVisible();
  });

  test('Owner: Edit, Archive, and View are all shown for an active storage', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(warehouseName);

    await expect(list.menuItems.view).toBeVisible();
    await expect(list.menuItems.edit).toBeVisible();
    await expect(list.menuItems.archive).toBeVisible();
  });

  test('Owner: Restore and Delete are shown for an archived storage', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await page
      .getByRole('tablist', { name: /Filter by status|Filtrar por estado/i })
      .getByRole('tab', { name: /Archived|Archivadas/i })
      .click();

    await expect(list.card(archivedRoomName)).toBeVisible({ timeout: 10_000 });
    await list.openCardMenu(archivedRoomName);

    await expect(list.menuItems.restore).toBeVisible();
    await expect(list.menuItems.delete).toBeVisible();
  });

  // ── API-level RBAC enforcement ────────────────────────────────────────────

  test('Viewer API: DELETE /storages/warehouses/:uuid/archive returns 403', async () => {
    const { viewerUser } = JSON.parse(readFileSync(USERS_FILE, 'utf-8')) as {
      viewerUser: { email: string; password: string };
    };

    const { accessToken } = await apiSignIn(viewerUser.email, viewerUser.password);

    const response = await fetch(
      `${process.env.PW_API_URL ?? 'http://localhost:3002/api'}/storages/warehouses/00000000-0000-0000-0000-000000000000/archive`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    expect(response.status).toBe(403);
  });
});
