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
    // Restore + Delete only render for archived storages
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
    // Warehouse keeper has no STORAGE_ARCHIVE → archive disabled
    await expect(actions.archive).toBeDisabled();
    // Delete only renders for archived storages
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
    await expect(actions.edit).toBeDisabled();
    await expect(actions.archive).toBeDisabled();
    // Delete only renders for archived storages
    await expect(actions.delete).not.toBeVisible();
  });
});

// ── Frozen storage ───────────────────────────────────────────────────────────

// Card menu rules for FROZEN (from StorageCard.tsx):
//   - View always renders
//   - Edit renders (!isArchived), enabled = canEdit
//   - Archive renders (!isArchived), enabled = canArchive (no status-aware disable;
//     the backend enforces the "can't archive frozen" rule, UI lets the user try)
//   - Restore / Delete never render for non-archived storages
test.describe('Section 10: Actions — Frozen storage', () => {
  // R-05: Owner on frozen storage
  test('R-05: Owner sees View, Edit, Archive on frozen storage', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Frozen Storage');

    const actions = storagesPage.cardActions('Frozen Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
    await expect(actions.archive).toBeVisible();
    await expect(actions.restore).not.toBeVisible();
    await expect(actions.delete).not.toBeVisible();
  });

  // R-06: Manager on frozen storage
  test('R-06: Manager sees View, Edit, Archive on frozen storage', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_MANAGER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Frozen Storage');

    const actions = storagesPage.cardActions('Frozen Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
    await expect(actions.archive).toBeVisible();
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
    // No STORAGE_ARCHIVE permission → archive item renders disabled
    await expect(actions.archive).toBeDisabled();
  });

  // R-08: Viewer on frozen storage
  test('R-08: Viewer sees only View on frozen storage', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_VIEWER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Frozen Storage');

    const actions = storagesPage.cardActions('Frozen Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeDisabled();
    await expect(actions.archive).toBeDisabled();
  });
});

// ── Archived storage ─────────────────────────────────────────────────────────

// Card menu rules for ARCHIVED (from StorageCard.tsx, post H-07 UX #E5.2):
//   - View always renders
//   - Edit renders (metadata is editable in ARCHIVED; only type-change is
//     locked inside the drawer)
//   - Archive is replaced by Restore (enabled = canRestore)
//   - Delete renders, enabled = canDelete
test.describe('Section 10: Actions — Archived storage', () => {
  // R-09: Owner on archived storage
  test('R-09: Owner sees View, Edit, Restore and Delete on archived storage', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Archived Storage');

    const actions = storagesPage.cardActions('Archived Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
    await expect(actions.restore).toBeVisible();
    await expect(actions.delete).toBeVisible();
  });

  // R-10: Manager on archived storage
  test('R-10: Manager sees View, Edit, Restore and Delete on archived storage', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_MANAGER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Archived Storage');

    const actions = storagesPage.cardActions('Archived Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
    await expect(actions.restore).toBeVisible();
    await expect(actions.delete).toBeVisible();
  });

  // R-11: Warehouse keeper on archived storage (no STORAGE_RESTORE, no STORAGE_DELETE)
  test('R-11: Warehouse keeper sees View, Edit, and disabled Restore and Delete', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_WAREHOUSE_KEEPER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Archived Storage');

    const actions = storagesPage.cardActions('Archived Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.edit).toBeVisible();
    await expect(actions.restore).toBeDisabled();
    await expect(actions.delete).toBeDisabled();
  });

  // R-12: Viewer on archived storage
  test('R-12: Viewer sees View with Restore and Delete disabled on archived storage', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_VIEWER, storagesResponse: ALL_RESPONSE });
    await storagesPage.waitForCards();
    await storagesPage.openCardMenu('Archived Storage');

    const actions = storagesPage.cardActions('Archived Storage');
    await expect(actions.view).toBeVisible();
    await expect(actions.restore).toBeDisabled();
    await expect(actions.delete).toBeDisabled();
  });
});
