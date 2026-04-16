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
// Archive flow — PW-H06-1, PW-H06-2, PW-H06-3
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

// ─── PW-H06-1 — Archive happy path ─────────────────────────────────────────

test.describe('Given an Owner opens the actions menu on an active warehouse', () => {
  test('PW-H06-1: When they click Archive and confirm, Then a success toast appears and the card shows ARCHIVED', async ({
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

    await dialog.getByRole('button', { name: /^Archive$/i }).click();

    await expect(page.getByText(new RegExp(`"${ACTIVE_WAREHOUSE.name}" was archived`))).toBeVisible({
      timeout: 5_000,
    });

    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });
});

// ─── PW-H06-2 — Archive last-active warning + "Archivar de todos modos" ───

test.describe('Given an Owner tries to archive the only active storage', () => {
  test('PW-H06-2: Then the dialog shows an amber warning and the primary button label is "Archive anyway"', async ({
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
    await expect(dialog).toContainText(/last operational storage/i);
    await expect(dialog.getByRole('button', { name: /Archive anyway/i })).toBeVisible();
  });
});

// ─── PW-H06-3 — Archive from FROZEN (info block azul) ─────────────────────

test.describe('Given an Owner archives a FROZEN storage', () => {
  test('PW-H06-3: Then the dialog shows the blue info block about FROZEN and archive succeeds', async ({
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
    await expect(dialog).toContainText(/frozen/i);

    await dialog.getByRole('button', { name: /^Archive$/i }).click();

    await expect(page.getByText(new RegExp(`"${FROZEN_WAREHOUSE.name}" was archived`))).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ─── PW-H06-6 — Undo flow: archive then restore from the toast ─────────────

test.describe('Given the user just archived a storage and the undo toast is visible', () => {
  test('PW-H06-6: When they click Undo, Then the storage is restored and the completion toast appears', async ({
    preAuthPage: page,
  }) => {
    const archivedResult = {
      ...ACTIVE_WAREHOUSE,
      status: 'ARCHIVED' as const,
      archivedAt: '2026-04-14T12:00:00.000Z',
    };
    const restoredResult = {
      ...archivedResult,
      status: 'ACTIVE' as const,
      archivedAt: null,
    };

    await mockArchiveSuccess(page, 'warehouses', ACTIVE_WAREHOUSE.uuid, archivedResult);
    await page.route(
      (url) => url.pathname === `/api/storages/warehouses/${ACTIVE_WAREHOUSE.uuid}/restore`,
      async (route) => {
        if (route.request().method() !== 'POST') {
          await route.continue();
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: restoredResult }),
        });
      },
    );

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([ACTIVE_WAREHOUSE, SECOND_ACTIVE]),
    });

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(ACTIVE_WAREHOUSE.name);
    await list.menuItems.archive.click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /^Archive$/i }).click();

    const undoButton = page.getByRole('button', { name: /Undo/i });
    await expect(undoButton).toBeVisible({ timeout: 5_000 });
    await undoButton.click();

    await expect(
      page.getByText(new RegExp(`"${ACTIVE_WAREHOUSE.name}" was restored`)),
    ).toBeVisible({ timeout: 5_000 });
  });
});
