import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';
import type { Page } from '@playwright/test';
import type { MockStorage } from '../../helpers/storages-list.helper';

// ═════════════════════════════════════════════════════════════════════════════
// H-07 · Archivar instalación — PW-H07-1, PW-H07-2, PW-H07-3
// ═════════════════════════════════════════════════════════════════════════════

const ACTIVE_WAREHOUSE = buildStorage({
  uuid: '12345678-0000-4000-8000-000000000201',
  name: 'Almacén A Archivar',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: 'Av. Archivar 100',
});

const SECOND_ACTIVE = buildStorage({
  uuid: '12345678-0000-4000-8000-000000000202',
  name: 'Bodega Dos',
  type: 'STORE_ROOM',
  status: 'ACTIVE',
  address: 'Calle 2, 222',
});

const FROZEN_WAREHOUSE = buildStorage({
  uuid: '12345678-0000-4000-8000-000000000203',
  name: 'Almacén Congelado',
  type: 'WAREHOUSE',
  status: 'FROZEN',
  frozenAt: '2026-04-01T00:00:00.000Z',
  address: 'Av. Frio 300',
});

async function mockArchiveSuccess(
  page: Page,
  typeSlug: string,
  uuid: string,
  updated: MockStorage,
): Promise<void> {
  await page.route(
    (url) => url.pathname === `/api/storages/${typeSlug}/${uuid}/archive`,
    async (route) => {
      if (route.request().method() !== 'DELETE') {
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

// ─── PW-H07-1 — Archive happy path ─────────────────────────────────────────

test.describe('Given an Owner opens the actions menu on an active warehouse', () => {
  test('PW-H07-1: When they click Archivar and confirm, Then a success toast appears and the card shows ARCHIVED', async ({
    preAuthPage: page,
  }) => {
    const archivedResult = {
      ...ACTIVE_WAREHOUSE,
      status: 'ARCHIVED' as const,
      archivedAt: '2026-04-14T12:00:00.000Z',
    };

    await mockArchiveSuccess(page, 'warehouses', ACTIVE_WAREHOUSE.uuid, archivedResult);

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([ACTIVE_WAREHOUSE, SECOND_ACTIVE]),
    });

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(ACTIVE_WAREHOUSE.name);
    await list.menuItems.archive.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(ACTIVE_WAREHOUSE.name);

    await dialog.getByRole('button', { name: /^Archivar$/i }).click();

    await expect(page.getByText(new RegExp(`"${ACTIVE_WAREHOUSE.name}" fue archivada`))).toBeVisible({
      timeout: 5_000,
    });

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });
});

// ─── PW-H07-2 — Archive last-active warning + "Archivar de todos modos" ───

test.describe('Given an Owner tries to archive the only active storage', () => {
  test('PW-H07-2: Then the dialog shows an amber warning and the primary button label is "Archivar de todos modos"', async ({
    preAuthPage: page,
  }) => {
    const archivedResult = {
      ...ACTIVE_WAREHOUSE,
      status: 'ARCHIVED' as const,
      archivedAt: '2026-04-14T12:00:00.000Z',
    };

    await mockArchiveSuccess(page, 'warehouses', ACTIVE_WAREHOUSE.uuid, archivedResult);

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([ACTIVE_WAREHOUSE]),
    });

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(ACTIVE_WAREHOUSE.name);
    await list.menuItems.archive.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(/última instalación operativa/i);
    await expect(dialog.getByRole('button', { name: /Archivar de todos modos/i })).toBeVisible();
  });
});

// ─── PW-H07-3 — Archive from FROZEN (info block azul) ─────────────────────

test.describe('Given an Owner archives a FROZEN storage', () => {
  test('PW-H07-3: Then the dialog shows the blue info block about FROZEN and archive succeeds', async ({
    preAuthPage: page,
  }) => {
    const archivedResult = {
      ...FROZEN_WAREHOUSE,
      status: 'ARCHIVED' as const,
      archivedAt: '2026-04-14T12:00:00.000Z',
      frozenAt: null,
    };

    await mockArchiveSuccess(page, 'warehouses', FROZEN_WAREHOUSE.uuid, archivedResult);

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([FROZEN_WAREHOUSE, SECOND_ACTIVE]),
    });

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(FROZEN_WAREHOUSE.name);
    await list.menuItems.archive.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText(/congelada/i);

    await dialog.getByRole('button', { name: /^Archivar$/i }).click();

    await expect(page.getByText(new RegExp(`"${FROZEN_WAREHOUSE.name}" fue archivada`))).toBeVisible({
      timeout: 5_000,
    });
  });
});
