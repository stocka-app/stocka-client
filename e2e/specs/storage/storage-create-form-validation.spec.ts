import { type Page } from '@playwright/test';
import { test, expect } from '../../fixtures/auth.fixture';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';
import {
  setupAndNavigate,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

// ─── Shared setup ─────────────────────────────────────────────────────────────

const EMPTY_RESPONSE = buildStoragesResponse([]);

/**
 * STARTER capabilities — enough quota for all types so tier limits never fire
 * during form-validation tests (FREE plan blocks warehouses entirely).
 */
const STARTER_CAPS = { tier: 'STARTER', maxWarehouses: 1, maxStoreRooms: 3, maxCustomRooms: 3 };

async function navigate(page: Page): Promise<void> {
  await setupAndNavigate(page, {
    rbac: RBAC_OWNER,
    storagesResponse: EMPTY_RESPONSE,
    capabilities: STARTER_CAPS,
  });
}

// Helper: open drawer, select type, advance to step 2
async function openAt(
  page: Page,
  drawer: CreateStorageDrawerPage,
  type: 'WAREHOUSE' | 'STORE_ROOM' | 'CUSTOM_ROOM',
): Promise<void> {
  await drawer.openDrawer();
  await drawer.selectType(type);
  await drawer.continueButton.click();
}

// ═════════════════════════════════════════════════════════════════════════════
// CD-10 — CD-18: Submit button activation and field validation
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user is on Step 2 of the Create Installation drawer', () => {
  test('CD-10: When WAREHOUSE is selected and neither name nor address is filled, Then the submit button is disabled', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);
    await navigate(page);
    await openAt(page, drawer, 'WAREHOUSE');

    await expect(drawer.submitButton).toBeDisabled();
  });

  test('CD-11: When WAREHOUSE is selected and name has 3+ chars but address is empty, Then the submit button stays disabled', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);
    await navigate(page);
    await openAt(page, drawer, 'WAREHOUSE');

    await drawer.fillStep2({ name: 'Main Warehouse' });

    await expect(drawer.submitButton).toBeDisabled();
  });

  test('CD-12: When WAREHOUSE is selected and both name (3+ chars) and address are filled, Then the submit button is enabled', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);
    await navigate(page);
    await openAt(page, drawer, 'WAREHOUSE');

    await drawer.fillStep2({ name: 'Main Warehouse', address: 'Av. Industrial 500' });

    await expect(drawer.submitButton).toBeEnabled();
  });

  test('CD-13: When STORE_ROOM is selected and both name and address are filled, Then the submit button is enabled', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);
    await navigate(page);
    await openAt(page, drawer, 'STORE_ROOM');

    await drawer.fillStep2({ name: 'Back Store Room', address: 'Calle 10' });

    await expect(drawer.submitButton).toBeEnabled();
  });

  test('CD-14: When CUSTOM_ROOM is selected and both name and address are filled, Then the submit button is enabled', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);
    await navigate(page);
    await openAt(page, drawer, 'CUSTOM_ROOM');

    await drawer.fillStep2({ name: 'Downtown Store', address: 'Calle Reforma 1' });

    await expect(drawer.submitButton).toBeEnabled();
  });

  test('CD-15: When the name has exactly 2 characters, Then the submit button stays disabled', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);
    await navigate(page);
    await openAt(page, drawer, 'WAREHOUSE');

    await drawer.fillStep2({ name: 'AB', address: 'Av. Test 1' });

    await expect(drawer.submitButton).toBeDisabled();
  });

  test('CD-16: When the name has 62 characters typed, Then the chars counter shows 18 remaining', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);
    await navigate(page);
    await openAt(page, drawer, 'WAREHOUSE');

    // 80 - 62 = 18 remaining
    const longName = 'A'.repeat(62);
    await drawer.fillStep2({ name: longName });

    await expect(drawer.nameCharsCounter).toBeVisible();
    await expect(drawer.nameCharsCounter).toHaveText('18 remaining');
  });

  test('CD-17: When the description has 4 characters and the form is submitted, Then a validation error appears', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);
    await navigate(page);
    await openAt(page, drawer, 'WAREHOUSE');

    await drawer.fillStep2({
      name: 'Valid Name',
      address: 'Av. Test 500',
      description: 'Abcd', // 4 chars — invalid (min 5)
    });

    await drawer.submit();

    await expect(page.getByText('Description must be at least 5 characters if provided')).toBeVisible();
  });

  test('CD-18: When the description is empty, Then no description validation error appears', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);
    await navigate(page);
    await openAt(page, drawer, 'WAREHOUSE');

    await drawer.fillStep2({ name: 'Valid Name', address: 'Av. Test 500' });

    // Description left empty — should not show the min-length error
    await expect(page.getByText('Description must be at least 5 characters if provided')).not.toBeVisible();
  });

  test('CD-19: When the description has exactly 5 characters and the form is submitted, Then no description validation error appears', async ({
    preAuthPage: page,
  }) => {
    const drawer = new CreateStorageDrawerPage(page);
    await navigate(page);
    await openAt(page, drawer, 'WAREHOUSE');

    await drawer.fillStep2({
      name: 'Valid Name',
      address: 'Av. Test 500',
      description: 'Hello', // exactly 5 chars — valid
    });

    // The submit button should be enabled (form is valid)
    await expect(drawer.submitButton).toBeEnabled();
    await expect(page.getByText('Description must be at least 5 characters if provided')).not.toBeVisible();
  });
});
