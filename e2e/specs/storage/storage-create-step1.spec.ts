import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  clearAllStoragesForUser,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { StoragesListPage } from '../../pages/storages-list.page';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';

// ═════════════════════════════════════════════════════════════════════════════
// CD-05 — CD-09: Type selection behavior (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Create drawer Step 1 — type selection (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_step1_${ts}@stocka.test`;
  const username = `pw_step1_${ts}`;
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();

    const signUp = await apiSignUp({ email, username, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');
    await clearAllStoragesForUser(pool, signUp.userId);
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('CD-05: When Step 1 is displayed, Then exactly 3 type cards are shown', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();

    await expect(drawer.warehouseCard).toBeVisible();
    await expect(drawer.storeRoomCard).toBeVisible();
    await expect(drawer.customRoomCard).toBeVisible();

    const allCards = page.locator('[data-testid^="type-card-"]');
    await expect(allCards).toHaveCount(3);
  });

  test('CD-06: When the user selects Warehouse, Then Step 2 shows an address field', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');

    await expect(page.locator('p').getByText('STEP 2 OF 2')).toBeVisible();
    await expect(drawer.addressInput).toBeVisible();
  });

  test('CD-07: When the user selects Store Room, Then Step 2 shows an address field', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');

    await expect(page.locator('p').getByText('STEP 2 OF 2')).toBeVisible();
    await expect(drawer.addressInput).toBeVisible();
  });

  test('CD-08: When the user selects Custom area, Then Step 2 shows the icon/color section', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('CUSTOM_ROOM');

    await expect(page.locator('p').getByText('STEP 2 OF 2')).toBeVisible();
    await expect(drawer.iconColorSection).toBeVisible();
  });

  test('CD-09: When each type is selected, Then the name placeholder reflects the chosen type', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    const storagesPage = new StoragesListPage(page);

    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await expect(drawer.nameInput).toHaveAttribute(
      'placeholder',
      'E.g. Central Warehouse, North Distribution Warehouse',
    );

    await drawer.closeButton.click();
    await storagesPage.emptyCreateButton().click();
    await drawer.selectType('STORE_ROOM');
    await expect(drawer.nameInput).toHaveAttribute(
      'placeholder',
      'E.g. Back store room, Emergency stock',
    );

    await drawer.closeButton.click();
    await storagesPage.emptyCreateButton().click();
    await drawer.selectType('CUSTOM_ROOM');
    await expect(drawer.nameInput).toHaveAttribute(
      'placeholder',
      'E.g. Downtown Store, Polanco Branch, Counter',
    );
  });
});
