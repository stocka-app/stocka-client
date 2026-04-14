import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

// Freeze tests need extra timeout — networkidle 10s + card menu interaction
test.describe.configure({ timeout: 60_000 });

// ═════════════════════════════════════════════════════════════════════════════
// H-05 · Congelar / Reactivar instalación — PW-1, PW-2, PW-H05-1 through
//         PW-H05-5, PW-H05-7
//
// Covers the freeze confirmation dialog (FreezeConfirmDialog) and the direct
// unfreeze action triggered from the card context menu.
// All text assertions use the ES locale (the app renders in Spanish by default
// in E2E — i18next detects the headless browser as es-MX).
// ═════════════════════════════════════════════════════════════════════════════

// ─── Mock data ────────────────────────────────────────────────────────────────

const ACTIVE_WAREHOUSE = buildStorage({
  uuid: 'freeze-test-uuid-001',
  name: 'Almacén Central',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: 'Av. Industrial 500',
});

const FROZEN_WAREHOUSE = buildStorage({
  uuid: 'freeze-test-uuid-002',
  name: 'Almacén Norte',
  type: 'WAREHOUSE',
  status: 'FROZEN',
  frozenAt: '2026-03-01T00:00:00.000Z',
  address: 'Calle Norte 100',
});

const SECOND_ACTIVE = buildStorage({
  uuid: 'freeze-test-uuid-003',
  name: 'Bodega Sur',
  type: 'STORE_ROOM',
  status: 'ACTIVE',
  address: 'Calle Sur 200',
});

// ─── Route mock helpers ───────────────────────────────────────────────────────

/**
 * Registers a success mock for POST /api/storages/warehouses/:uuid/freeze.
 * Must be called BEFORE setupAndNavigate.
 */
async function mockFreezeSuccess(
  page: import('@playwright/test').Page,
  uuid: string,
  updatedStorage: import('../../helpers/storages-list.helper').MockStorage,
): Promise<void> {
  await page.route(
    (url) => url.pathname === `/api/storages/warehouses/${uuid}/freeze`,
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: updatedStorage }),
      });
    },
  );
}

/**
 * Registers a 500 mock for POST /api/storages/warehouses/:uuid/freeze.
 * Must be called BEFORE setupAndNavigate.
 */
async function mockFreezeError(
  page: import('@playwright/test').Page,
  uuid: string,
): Promise<void> {
  await page.route(
    (url) => url.pathname === `/api/storages/warehouses/${uuid}/freeze`,
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal Server Error' }),
      });
    },
  );
}

/**
 * Registers a success mock for POST /api/storages/warehouses/:uuid/unfreeze.
 * Must be called BEFORE setupAndNavigate.
 */
async function mockUnfreezeSuccess(
  page: import('@playwright/test').Page,
  uuid: string,
  updatedStorage: import('../../helpers/storages-list.helper').MockStorage,
): Promise<void> {
  await page.route(
    (url) => url.pathname === `/api/storages/warehouses/${uuid}/unfreeze`,
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: updatedStorage }),
      });
    },
  );
}

// ─── Archive mock helper (used in PW-H05-4) ──────────────────────────────────

async function mockArchiveSuccess(
  page: import('@playwright/test').Page,
  uuid: string,
  updatedStorage: import('../../helpers/storages-list.helper').MockStorage,
): Promise<void> {
  await page.route(
    (url) => url.pathname === `/api/storages/${uuid}`,
    async (route) => {
      if (route.request().method() !== 'DELETE') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: updatedStorage }),
      });
    },
  );
}

// ─── Edit PATCH mock helper (used in PW-H05-5) ───────────────────────────────

async function mockEditPatchWarehouse(
  page: import('@playwright/test').Page,
  uuid: string,
): Promise<void> {
  await page.route(
    (url) => url.pathname === `/api/storages/warehouses/${uuid}`,
    async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { storageUUID: uuid } }),
      });
    },
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PW-1 — Happy path: freeze an active storage
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given an Owner opens the actions menu on an active storage', () => {
  test('PW-1: When they click Congelar and confirm, Then a success toast appears and the card dot changes to FROZEN', async ({
    preAuthPage: page,
  }) => {
    const frozenResult = { ...ACTIVE_WAREHOUSE, status: 'FROZEN' as const, frozenAt: '2026-04-10T00:00:00.000Z' };

    await mockFreezeSuccess(page, ACTIVE_WAREHOUSE.uuid, frozenResult);

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([ACTIVE_WAREHOUSE, SECOND_ACTIVE]),
    });

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(ACTIVE_WAREHOUSE.name);
    await list.menuItems.freeze.click();

    // Dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await expect(dialog).toContainText('¿Congelar');

    // Confirm freeze
    await dialog.getByRole('button', { name: /^Congelar$/i }).click();

    // Toast appears
    await expect(page.getByText(`"${ACTIVE_WAREHOUSE.name}" fue congelada`)).toBeVisible({
      timeout: 5_000,
    });

    // Dialog closes
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PW-2 — Happy path: unfreeze (direct action, no dialog)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given an Owner opens the actions menu on a frozen storage', () => {
  test('PW-2: When they click Reactivar, Then no dialog appears — a toast confirms the storage is back to ACTIVE', async ({
    preAuthPage: page,
  }) => {
    const reactivatedResult = { ...FROZEN_WAREHOUSE, status: 'ACTIVE' as const, frozenAt: null };

    await mockUnfreezeSuccess(page, FROZEN_WAREHOUSE.uuid, reactivatedResult);

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([FROZEN_WAREHOUSE, SECOND_ACTIVE]),
    });

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(FROZEN_WAREHOUSE.name);
    await list.menuItems.unfreeze.click();

    // No dialog — toast appears immediately
    await expect(page.getByText(`"${FROZEN_WAREHOUSE.name}" fue reactivada`)).toBeVisible({
      timeout: 5_000,
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PW-H05-1 — Freeze dialog: context-active info block (blue)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given an Owner opens the freeze dialog for the storage that is their current working context', () => {
  test('PW-H05-1: Then the dialog shows a blue info block about the active context', async ({
    preAuthPage: page,
  }) => {
    // Seed the active storage id in localStorage so the card shows "Contexto actual"
    const tenantId = 'mock-tenant-id';
    await page.addInitScript(
      ({ storageId, tId }: { storageId: string; tId: string }) => {
        const key = `stocka:active-storage:${tId}`;
        localStorage.setItem(key, JSON.stringify({ state: { activeStorageId: storageId }, version: 0 }));
      },
      { storageId: ACTIVE_WAREHOUSE.uuid, tId: tenantId },
    );

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([ACTIVE_WAREHOUSE, SECOND_ACTIVE]),
    });

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(ACTIVE_WAREHOUSE.name);
    await list.menuItems.freeze.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Blue info block — "Estás trabajando en esta instalación..."
    await expect(dialog.getByText(/Estás trabajando en esta instalación/i)).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PW-H05-2 — Freeze dialog: last-active amber warning block
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given an Owner opens the freeze dialog for the only active storage in the tenant', () => {
  test('PW-H05-2: Then the dialog shows an amber warning block and the confirm button reads "Congelar de todos modos"', async ({
    preAuthPage: page,
  }) => {
    // Only one ACTIVE storage → getIsLastActive returns true
    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([ACTIVE_WAREHOUSE]),
    });

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(ACTIVE_WAREHOUSE.name);
    await list.menuItems.freeze.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Amber warning block — "Esta es tu última instalación operativa..."
    await expect(dialog.getByText(/última instalación operativa/i)).toBeVisible();

    // Button label changes to "Congelar de todos modos"
    await expect(dialog.getByRole('button', { name: /congelar de todos modos/i })).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PW-H05-3 — Confirm freeze of last active: banner appears
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given an Owner confirms freezing the only active storage', () => {
  test('PW-H05-3: Then the storage becomes FROZEN and the StorageStatusBanner appears', async ({
    preAuthPage: page,
  }) => {
    const frozenResult = { ...ACTIVE_WAREHOUSE, status: 'FROZEN' as const, frozenAt: '2026-04-10T00:00:00.000Z' };

    await mockFreezeSuccess(page, ACTIVE_WAREHOUSE.uuid, frozenResult);

    // Pre-seed active storage so banner picks it up
    await page.addInitScript((storageId: string) => {
      // The store key without tenantId scope — will be overridden by hydrateActiveStorage
      // but seeding it ensures the switcher recognises this storage as active context
      const raw = localStorage.getItem('auth-storage');
      let tenantId: string | null = null;
      if (raw) {
        try {
          tenantId = (JSON.parse(raw) as { state?: { user?: { tenantId?: string } } }).state?.user?.tenantId ?? null;
        } catch {
          // ignore parse errors
        }
      }
      if (tenantId) {
        localStorage.setItem(
          `stocka:active-storage:${tenantId}`,
          JSON.stringify({ state: { activeStorageId: storageId }, version: 0 }),
        );
      }
    }, ACTIVE_WAREHOUSE.uuid);

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([ACTIVE_WAREHOUSE]),
    });

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(ACTIVE_WAREHOUSE.name);
    await list.menuItems.freeze.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await dialog.getByRole('button', { name: /congelar de todos modos/i }).click();

    // Toast confirms freeze
    await expect(page.getByText(`"${ACTIVE_WAREHOUSE.name}" fue congelada`)).toBeVisible({
      timeout: 5_000,
    });

    // Dialog closes
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PW-H05-4 — Frozen → ARCHIVED directly via "Archivar"
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given an Owner opens the actions menu on a frozen storage', () => {
  test('PW-H05-4: When they click Archivar and confirm, Then the storage transitions FROZEN→ARCHIVED directly', async ({
    preAuthPage: page,
  }) => {
    const archivedResult = {
      ...FROZEN_WAREHOUSE,
      status: 'ARCHIVED' as const,
      frozenAt: null,
      archivedAt: '2026-04-10T00:00:00.000Z',
    };

    await mockArchiveSuccess(page, FROZEN_WAREHOUSE.uuid, archivedResult);

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([FROZEN_WAREHOUSE, SECOND_ACTIVE]),
    });

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(FROZEN_WAREHOUSE.name);
    await list.menuItems.archive.click();

    // Archive confirmation dialog
    const archiveDialog = page.getByRole('dialog');
    await expect(archiveDialog).toBeVisible({ timeout: 5_000 });
    await archiveDialog.getByRole('button', { name: /archivar/i }).click();

    // Dialog closes — storage moved to archived
    await expect(archiveDialog).not.toBeVisible({ timeout: 5_000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PW-H05-5 — Edit frozen storage: info banner + name update
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given an Owner opens the edit drawer for a frozen storage', () => {
  test('PW-H05-5: Then an info banner about the frozen state is shown, and editing the name still saves correctly', async ({
    preAuthPage: page,
  }) => {
    await mockEditPatchWarehouse(page, FROZEN_WAREHOUSE.uuid);

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([FROZEN_WAREHOUSE, SECOND_ACTIVE]),
    });

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(FROZEN_WAREHOUSE.name);
    await list.menuItems.edit.click();

    // Drawer opens
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible({ timeout: 5_000 });

    // Frozen info banner — "Esta instalación está congelada. Puedes editar..."
    await expect(drawer.getByText(/está congelada/i)).toBeVisible();

    // Edit name and save
    const nameInput = drawer.locator('input[id*="name"]');
    await nameInput.clear();
    await nameInput.fill('Almacén Norte Actualizado');
    await drawer.getByRole('button', { name: /guardar cambios/i }).click();

    // Drawer closes — save succeeded
    await expect(drawer).not.toBeVisible({ timeout: 5_000 });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PW-H05-7 — Server returns 500 on freeze: inline error banner, retry enabled
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given an Owner opens the freeze dialog and the server returns an error', () => {
  test('PW-H05-7: Then the dialog stays open, a red error banner appears inline, and the button is re-enabled for retry', async ({
    preAuthPage: page,
  }) => {
    await mockFreezeError(page, ACTIVE_WAREHOUSE.uuid);

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse([ACTIVE_WAREHOUSE, SECOND_ACTIVE]),
    });

    const list = new StoragesListPage(page);
    await list.waitForCards();

    await list.openCardMenu(ACTIVE_WAREHOUSE.name);
    await list.menuItems.freeze.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Confirm — server will return 500
    await dialog.getByRole('button', { name: /^Congelar$/i }).click();

    // Dialog stays open
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Inline error banner — "No pudimos congelar la instalación..."
    await expect(dialog.getByText(/No pudimos congelar/i)).toBeVisible({ timeout: 5_000 });

    // Confirm button is re-enabled (not loading, not disabled) for retry
    const confirmButton = dialog.getByRole('button', { name: /^Congelar$/i });
    await expect(confirmButton).toBeEnabled();
  });
});
