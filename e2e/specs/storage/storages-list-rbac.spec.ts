import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  RBAC_OWNER,
  RBAC_MANAGER,
  RBAC_WAREHOUSE_KEEPER,
  RBAC_VIEWER,
} from '../../helpers/storages-list.helper';

// ─── Mock data per status ────────────────────────────────────────────────────

const ACTIVE_STORAGE = buildStorage({
  name: 'Active Storage',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: 'Calle 1',
});

const FROZEN_STORAGE = buildStorage({
  name: 'Frozen Storage',
  type: 'WAREHOUSE',
  status: 'FROZEN',
  address: 'Calle 2',
});

const ARCHIVED_STORAGE = buildStorage({
  name: 'Archived Storage',
  type: 'CUSTOM_ROOM',
  status: 'ARCHIVED',
  address: null,
  archivedAt: '2026-03-01T00:00:00.000Z',
});

const ALL_ITEMS = [ACTIVE_STORAGE, FROZEN_STORAGE, ARCHIVED_STORAGE];
const ALL_RESPONSE = buildStoragesResponse(ALL_ITEMS);

// ═════════════════════════════════════════════════════════════════════════════
// Section 10: Actions by role and status
// ═════════════════════════════════════════════════════════════════════════════

// ── Active storage ───────────────────────────────────────────────────────────

test.describe('Section 10: Actions — Active storage', () => {
  // R-01: Owner/Partner on active storage
  test('R-01: Owner sees View, Edit, Archive on active storage', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Active Storage');

    const actions = storagesPage.cardActions('Active Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
    await expect(actions.archive).toBeVisible();
    await expect(actions.restore).not.toBeVisible();
    await expect(actions.delete).not.toBeVisible();
  });

  // R-02: Manager on active storage
  test('R-02: Manager sees View, Edit, Archive on active storage', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_MANAGER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Active Storage');

    const actions = storagesPage.cardActions('Active Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
    await expect(actions.archive).toBeVisible();
  });

  // R-03: Warehouse keeper on active storage
  test('R-03: Warehouse keeper sees View, Edit on active storage', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_WAREHOUSE_KEEPER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Active Storage');

    const actions = storagesPage.cardActions('Active Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
    await expect(actions.archive).not.toBeVisible();
    await expect(actions.delete).not.toBeVisible();
  });

  // R-04: Viewer on active storage
  test('R-04: Viewer sees only View on active storage', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_VIEWER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Active Storage');

    const actions = storagesPage.cardActions('Active Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).not.toBeVisible();
    await expect(actions.archive).not.toBeVisible();
    await expect(actions.delete).not.toBeVisible();
  });
});

// ── Frozen storage ───────────────────────────────────────────────────────────

test.describe('Section 10: Actions — Frozen storage', () => {
  // R-05: Owner on frozen storage
  test('R-05: Owner sees View, Edit on frozen storage', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Frozen Storage');

    const actions = storagesPage.cardActions('Frozen Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
    // Frozen storages cannot be archived
    await expect(actions.archive).not.toBeVisible();
  });

  // R-06: Manager on frozen storage
  test('R-06: Manager sees View, Edit on frozen storage', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_MANAGER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Frozen Storage');

    const actions = storagesPage.cardActions('Frozen Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
  });

  // R-07: Warehouse keeper on frozen storage
  test('R-07: Warehouse keeper sees View, Edit on frozen storage', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_WAREHOUSE_KEEPER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Frozen Storage');

    const actions = storagesPage.cardActions('Frozen Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
  });

  // R-08: Viewer on frozen storage
  test('R-08: Viewer sees only View on frozen storage', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_VIEWER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Frozen Storage');

    const actions = storagesPage.cardActions('Frozen Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).not.toBeVisible();
  });
});

// ── Archived storage ─────────────────────────────────────────────────────────

test.describe('Section 10: Actions — Archived storage', () => {
  // R-09: Owner on archived storage
  test('R-09: Owner sees View, Edit, Delete on archived storage', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Archived Storage');

    const actions = storagesPage.cardActions('Archived Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
    await expect(actions.delete).toBeVisible();
    // Owner has STORAGE_DELETE so no restore shown (restore is for non-delete roles)
    await expect(actions.archive).not.toBeVisible();
  });

  // R-10: Manager on archived storage (has STORAGE_DELETE → sees Delete, not Restore)
  test('R-10: Manager sees View, Edit, Delete on archived storage', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_MANAGER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Archived Storage');

    const actions = storagesPage.cardActions('Archived Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
    await expect(actions.delete).toBeVisible();
  });

  // R-11: Warehouse keeper on archived storage (STORAGE_UPDATE but no DELETE → sees Restore)
  test('R-11: Warehouse keeper sees View, Restore on archived storage', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_WAREHOUSE_KEEPER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Archived Storage');

    const actions = storagesPage.cardActions('Archived Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
    // Has STORAGE_UPDATE but not STORAGE_DELETE → shows Restore
    await expect(actions.restore).toBeVisible();
    await expect(actions.delete).not.toBeVisible();
  });

  // R-12: Viewer on archived storage
  test('R-12: Viewer sees only View on archived storage', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_VIEWER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Archived Storage');

    const actions = storagesPage.cardActions('Archived Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).not.toBeVisible();
    await expect(actions.restore).not.toBeVisible();
    await expect(actions.delete).not.toBeVisible();
  });
});
