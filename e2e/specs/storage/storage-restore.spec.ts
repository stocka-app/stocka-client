import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateWarehouse,
  apiArchiveStorage,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { StoragesListPage } from '../../pages/storages-list.page';

// ═════════════════════════════════════════════════════════════════════════════
// Restore flow — PW-H06-4, PW-H06-5, PW-H06-7
//
// Real E2E: no page.route() mocks. The browser hits the real BE on :3002
// with Postgres backing it.
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Restore storage flow (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_restore_${ts}@stocka.test`;
  const username = `pw_restore_${ts}`;
  const password = 'TestPass1!';

  let archivedWarehouseName: string;

  test.beforeAll(async () => {
    pool = createDbPool();

    const signUp = await apiSignUp({ email, username, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);

    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);

    await setTierByUserUuid(pool, signUp.userId, 'STARTER');

    const { accessToken } = await apiSignIn(email, password);

    const wh = await apiCreateWarehouse(accessToken, 'Almacén Para Restaurar', 'Av. Vieja 100');
    archivedWarehouseName = wh.name;
    await apiCreateWarehouse(accessToken, 'Almacén Activo', 'Av. Nueva 200');
    await apiArchiveStorage(accessToken, 'WAREHOUSE', wh.storageUUID);
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('PW-H06-4: When the user clicks Restore on an archived storage, Then it transitions to ACTIVE with a success toast', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await page
      .getByRole('tablist', { name: /Filter by status|Filtrar por estado/i })
      .getByRole('tab', { name: /Archived|Archivadas/i })
      .click();

    await expect(list.card(archivedWarehouseName)).toBeVisible({ timeout: 10_000 });
    await list.openCardMenu(archivedWarehouseName);
    await list.menuItems.restore.click();

    await expect(
      page.getByText(new RegExp(`${archivedWarehouseName} restored`, 'i')),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('PW-H06-5: The StorageDetailPanel shows the Restore CTA when viewing an archived storage', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    // Re-archive the warehouse (PW-H06-4 restored it)
    const { accessToken } = await apiSignIn(email, password);
    const storagesRes = await fetch(
      `${process.env.PW_API_URL ?? 'http://localhost:3001/api'}/storages?search=${encodeURIComponent(archivedWarehouseName)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const storagesBody = (await storagesRes.json()) as {
      data: { items: { uuid: string; type: string; status: string }[] };
    };
    const wh = storagesBody.data.items.find(
      (i) => i.type === 'WAREHOUSE' && i.status === 'ACTIVE',
    );
    if (wh) {
      await apiArchiveStorage(accessToken, 'WAREHOUSE', wh.uuid);
    }

    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await page
      .getByRole('tablist', { name: /Filter by status|Filtrar por estado/i })
      .getByRole('tab', { name: /Archived|Archivadas/i })
      .click();

    await expect(list.card(archivedWarehouseName)).toBeVisible({ timeout: 10_000 });

    // Open the card menu and click View to open the detail panel
    await list.openCardMenu(archivedWarehouseName);
    await list.menuItems.view.click();

    // The detail panel shows a Restore CTA for archived storages
    await expect(
      page.getByRole('button', { name: /Restore|Restaurar/i }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('PW-H06-7: When the browser is offline, the Restore menu item is disabled', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    // Ensure warehouse is archived
    const { accessToken } = await apiSignIn(email, password);
    const storagesRes = await fetch(
      `${process.env.PW_API_URL ?? 'http://localhost:3001/api'}/storages?search=${encodeURIComponent(archivedWarehouseName)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const storagesBody = (await storagesRes.json()) as {
      data: { items: { uuid: string; type: string; status: string }[] };
    };
    const activeWh = storagesBody.data.items.find(
      (i) => i.type === 'WAREHOUSE' && i.status === 'ACTIVE' && i.uuid !== undefined,
    );
    // If it was restored by a previous test, re-archive
    if (activeWh) {
      const isTarget =
        (activeWh as unknown as { name: string }).name === archivedWarehouseName;
      if (isTarget) {
        await apiArchiveStorage(accessToken, 'WAREHOUSE', activeWh.uuid);
      }
    }

    await signInAndNavigateToStorages(page, email, password);

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await page
      .getByRole('tablist', { name: /Filter by status|Filtrar por estado/i })
      .getByRole('tab', { name: /Archived|Archivadas/i })
      .click();

    await expect(list.card(archivedWarehouseName)).toBeVisible({ timeout: 10_000 });

    // Simulate offline
    await page.evaluate(() => {
      Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        get: () => false,
      });
      window.dispatchEvent(new Event('offline'));
    });

    await list.openCardMenu(archivedWarehouseName);
    const restoreItem = list.menuItems.restore;
    await expect(restoreItem).toBeVisible();
    await expect(restoreItem).toHaveAttribute('aria-disabled', 'true');
  });
});
