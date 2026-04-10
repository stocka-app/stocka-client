import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import { EditStorageDrawerPage } from '../../pages/edit-storage-drawer.page';
import {
  setupAndNavigate,
  buildStoragesResponse,
  buildStorage,
  mockEditPatch,
  RBAC_OWNER,
  RBAC_VIEWER,
} from '../../helpers/storages-list.helper';

// ─── Shared mock data ─────────────────────────────────────────────────────────

const STORAGE = buildStorage({
  uuid: 'edit-test-uuid-001',
  name: 'Bodega Central',
  type: 'STORE_ROOM',
  status: 'ACTIVE',
  address: 'Av. Reforma 100',
  icon: 'inventory_2',
  color: '#d97706',
});

const STORAGES_RESPONSE = buildStoragesResponse([STORAGE]);

const STARTER_CAPS = { tier: 'STARTER', maxWarehouses: 1, maxStoreRooms: 3, maxCustomRooms: 3 };

// ═════════════════════════════════════════════════════════════════════════════
// E2E: Edit Storage Drawer
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user opens the edit drawer from a storage card', () => {
  test('ED-1: Then the drawer shows pre-loaded values', async ({ preAuthPage: page }) => {
    await mockEditPatch(page, 'store-rooms', STORAGE.uuid);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: STORAGES_RESPONSE, capabilities: STARTER_CAPS });

    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(STORAGE.name);
    await list.menuItems.edit.click();

    await expect(drawer.drawer).toBeVisible({ timeout: 5_000 });
    await expect(drawer.nameInput).toHaveValue(STORAGE.name);
    await expect(drawer.addressInput).toHaveValue(STORAGE.address!);
  });

  test('ED-2: When the name is changed and saved, Then the drawer closes', async ({ preAuthPage: page }) => {
    await mockEditPatch(page, 'store-rooms', STORAGE.uuid);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: STORAGES_RESPONSE, capabilities: STARTER_CAPS });

    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(STORAGE.name);
    await list.menuItems.edit.click();
    await expect(drawer.drawer).toBeVisible({ timeout: 5_000 });

    await drawer.fillName('Bodega Norte');
    await drawer.submit();

    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });
  });

  test('ED-3: When the user modifies the name and cancels, Then the unsaved dialog appears', async ({ preAuthPage: page }) => {
    await mockEditPatch(page, 'store-rooms', STORAGE.uuid);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: STORAGES_RESPONSE, capabilities: STARTER_CAPS });

    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(STORAGE.name);
    await list.menuItems.edit.click();
    await expect(drawer.drawer).toBeVisible({ timeout: 5_000 });

    await drawer.fillName('Modified Name');
    await drawer.cancel();

    await expect(drawer.keepEditingButton).toBeVisible({ timeout: 3_000 });
  });

  test('ED-4: When Keep Editing is clicked on the unsaved dialog, Then the drawer stays open', async ({ preAuthPage: page }) => {
    await mockEditPatch(page, 'store-rooms', STORAGE.uuid);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: STORAGES_RESPONSE, capabilities: STARTER_CAPS });

    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(STORAGE.name);
    await list.menuItems.edit.click();
    await expect(drawer.drawer).toBeVisible({ timeout: 5_000 });

    await drawer.fillName('Modified Name');
    await drawer.cancel();
    await expect(drawer.keepEditingButton).toBeVisible({ timeout: 3_000 });
    await drawer.keepEditingButton.click();

    await expect(drawer.nameInput).toHaveValue('Modified Name');
  });

  test('ED-5: When the server returns a name conflict, Then an inline error is shown', async ({ preAuthPage: page }) => {
    await mockEditPatch(page, 'store-rooms', STORAGE.uuid, {
      status: 409,
      errorCode: 'STORAGE_NAME_ALREADY_EXISTS',
    });
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: STORAGES_RESPONSE, capabilities: STARTER_CAPS });

    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(STORAGE.name);
    await list.menuItems.edit.click();
    await expect(drawer.drawer).toBeVisible({ timeout: 5_000 });

    await drawer.fillName('Duplicate Name');
    await drawer.submit();

    await expect(drawer.drawer.getByRole('alert')).toBeVisible({ timeout: 5_000 });
  });

  test('ED-6: When save button is disabled because no changes were made, Then submit is not possible', async ({ preAuthPage: page }) => {
    await mockEditPatch(page, 'store-rooms', STORAGE.uuid);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: STORAGES_RESPONSE, capabilities: STARTER_CAPS });

    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(STORAGE.name);
    await list.menuItems.edit.click();
    await expect(drawer.drawer).toBeVisible({ timeout: 5_000 });

    await expect(drawer.submitButton).toBeDisabled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// RBAC: Viewer cannot edit
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given a Viewer user opens the card menu', () => {
  test('ED-7: Then the Edit option is disabled', async ({ preAuthPage: page }) => {
    await setupAndNavigate(page, { rbac: RBAC_VIEWER, storagesResponse: STORAGES_RESPONSE, capabilities: STARTER_CAPS });

    const list = new StoragesListPage(page);
    await list.openCardMenu(STORAGE.name);

    const editItem = list.menuItems.edit;
    await expect(editItem).toBeVisible();
    await expect(editItem).toHaveAttribute('data-disabled', 'true');
  });
});
