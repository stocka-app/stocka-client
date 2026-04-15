import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import { EditStorageDrawerPage } from '../../pages/edit-storage-drawer.page';
import {
  setupAndNavigate,
  buildStoragesResponse,
  buildStorage,
  mockConvertToPatch,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

const STORAGE = buildStorage({
  uuid: '12345678-0000-4000-8000-000000000077',
  name: 'Bodega Origen',
  type: 'STORE_ROOM',
  status: 'ACTIVE',
  address: 'Av. Reforma 100',
  icon: 'inventory_2',
  color: '#d97706',
});

const STORAGES_RESPONSE = buildStoragesResponse([STORAGE]);
const STARTER_CAPS = { tier: 'STARTER', maxWarehouses: 1, maxStoreRooms: 3, maxCustomRooms: 3 };

// ═════════════════════════════════════════════════════════════════════════════
// E2E: unified edit + change-type flow
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user stages a pending type change in the edit drawer', () => {
  test.describe.configure({ timeout: 60_000 });

  test('EC-1: selecting a different type shows the pending banner without firing a request', async ({
    preAuthPage: page,
  }) => {
    const captured: { body: unknown } = { body: null };
    await mockConvertToPatch(page, 'store-rooms', STORAGE.uuid, 'custom-room', { captured });
    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: STORAGES_RESPONSE,
      capabilities: STARTER_CAPS,
    });

    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(STORAGE.name);
    await list.menuItems.edit.click();
    await expect(drawer.title).toBeVisible();

    await drawer.typeCard('CUSTOM_ROOM').click();

    // Pending banner visible, form fields updated, but no network call yet.
    await expect(page.getByText(/changing the type/i)).toBeVisible();
    await expect(drawer.drawer.locator('input[id*="roomType"]')).toBeVisible();
    expect(captured.body).toBeNull();
  });

  test('EC-2: submitting a pending type change calls the per-transition endpoint with metadata', async ({
    preAuthPage: page,
  }) => {
    const captured: { body: unknown } = { body: null };
    await mockConvertToPatch(page, 'store-rooms', STORAGE.uuid, 'custom-room', { captured });
    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: STORAGES_RESPONSE,
      capabilities: STARTER_CAPS,
    });

    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(STORAGE.name);
    await list.menuItems.edit.click();
    await drawer.typeCard('CUSTOM_ROOM').click();
    await drawer.drawer.locator('input[id*="roomType"]').fill('Laboratory');
    await drawer.submit();

    await expect(drawer.drawer).toBeHidden({ timeout: 5_000 });
    expect(captured.body).toMatchObject({ roomType: 'Laboratory' });
  });

  test('EC-3: reverting a pending type change hides the banner and restores the original form', async ({
    preAuthPage: page,
  }) => {
    const captured: { body: unknown } = { body: null };
    await mockConvertToPatch(page, 'store-rooms', STORAGE.uuid, 'warehouse', { captured });
    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: STORAGES_RESPONSE,
      capabilities: STARTER_CAPS,
    });

    const list = new StoragesListPage(page);
    const drawer = new EditStorageDrawerPage(page);

    await list.openCardMenu(STORAGE.name);
    await list.menuItems.edit.click();
    await drawer.typeCard('WAREHOUSE').click();
    await expect(page.getByText(/changing the type/i)).toBeVisible();

    await page.getByRole('button', { name: /cancel change/i }).click();
    await expect(page.getByText(/changing the type/i)).toBeHidden();
    expect(captured.body).toBeNull();
  });
});
