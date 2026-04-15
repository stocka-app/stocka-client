import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  getRealTenantId,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';
import type { Page } from '@playwright/test';
import type { MockStorage } from '../../helpers/storages-list.helper';

// ═════════════════════════════════════════════════════════════════════════════
// H-07 · Restaurar instalación — PW-H07-4, PW-H07-5
// ═════════════════════════════════════════════════════════════════════════════

const ARCHIVED_WAREHOUSE = buildStorage({
  uuid: '12345678-0000-4000-8000-000000000301',
  name: 'Almacén Archivado',
  type: 'WAREHOUSE',
  status: 'ARCHIVED',
  archivedAt: '2026-04-01T00:00:00.000Z',
  address: 'Av. Vieja 100',
});

const ACTIVE_WAREHOUSE = buildStorage({
  uuid: '12345678-0000-4000-8000-000000000302',
  name: 'Almacén Activo',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: 'Av. Nueva 200',
});

async function mockRestoreSuccess(
  page: Page,
  typeSlug: string,
  uuid: string,
  updated: MockStorage,
): Promise<void> {
  await page.route(
    (url) => url.pathname === `/api/storages/${typeSlug}/${uuid}/restore`,
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: updated }),
      });
    },
  );
}

// ─── PW-H07-4 — Restore from card menu (happy path) ───────────────────────

test.describe('Given an Owner opens the actions menu on an archived storage', () => {
  test('PW-H07-4: When they click Restore, Then the storage transitions back to ACTIVE with a success toast', async ({
    preAuthPage: page,
  }) => {
    const restoredResult = {
      ...ARCHIVED_WAREHOUSE,
      status: 'ACTIVE' as const,
      archivedAt: null,
    };

    await mockRestoreSuccess(page, 'warehouses', ARCHIVED_WAREHOUSE.uuid, restoredResult);

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([ARCHIVED_WAREHOUSE, ACTIVE_WAREHOUSE]),
    });

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(ARCHIVED_WAREHOUSE.name);
    await list.menuItems.restore.click();

    await expect(page.getByText(new RegExp(`${ARCHIVED_WAREHOUSE.name} restored`))).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ─── PW-H07-5 — Banner ARCHIVED renders the "Restaurar" CTA ────────────────

test.describe('Given the active context is an archived storage', () => {
  test('PW-H07-5: Then the global status banner shows the gray ARCHIVED copy and the Restaurar CTA', async ({
    preAuthPage: page,
  }) => {
    const tenantId = getRealTenantId() ?? 'mock-tenant-id';
    await page.addInitScript(
      ({ storageId, tId }: { storageId: string; tId: string }) => {
        const key = `stocka:active-storage:${tId}`;
        localStorage.setItem(key, JSON.stringify({ state: { activeStorageId: storageId }, version: 0 }));
      },
      { storageId: ARCHIVED_WAREHOUSE.uuid, tId: tenantId },
    );

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([ARCHIVED_WAREHOUSE, ACTIVE_WAREHOUSE]),
    });

    const banner = page.getByRole('status');
    await expect(banner).toBeVisible({ timeout: 5_000 });
    await expect(banner).toContainText(/archived/i);
    await expect(banner.getByRole('button', { name: /Restore/i })).toBeVisible();
  });
});
