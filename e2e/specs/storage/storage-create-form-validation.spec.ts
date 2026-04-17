import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  clearAllStoragesForUser,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { CreateStorageDrawerPage } from '../../pages/create-storage-drawer.page';

// ═════════════════════════════════════════════════════════════════════════════
// CD-10 — CD-19: Form validation (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Create drawer Step 2 — form validation (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_form_val_${ts}@stocka.test`;
  const username = `pw_form_val_${ts}`;
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

  async function openAt(
    page: import('@playwright/test').Page,
    type: 'WAREHOUSE' | 'STORE_ROOM' | 'CUSTOM_ROOM',
  ): Promise<CreateStorageDrawerPage> {
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType(type);
    return drawer;
  }

  test('CD-10: When WAREHOUSE is selected and neither name nor address is filled, Then the submit button is disabled', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = await openAt(page, 'WAREHOUSE');
    await expect(drawer.submitButton).toBeDisabled();
  });

  test('CD-11: When WAREHOUSE is selected and name has 3+ chars but address is empty, Then the submit button stays disabled', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = await openAt(page, 'WAREHOUSE');
    await drawer.fillStep2({ name: 'Main Warehouse' });
    await expect(drawer.submitButton).toBeDisabled();
  });

  test('CD-12: When WAREHOUSE is selected and both name and address are filled, Then the submit button is enabled', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = await openAt(page, 'WAREHOUSE');
    await drawer.fillStep2({ name: 'Main Warehouse', address: 'Av. Industrial 500' });
    await expect(drawer.submitButton).toBeEnabled();
  });

  test('CD-13: When STORE_ROOM is selected and both name and address are filled, Then the submit button is enabled', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = await openAt(page, 'STORE_ROOM');
    await drawer.fillStep2({ name: 'Back Store Room', address: 'Calle 10' });
    await expect(drawer.submitButton).toBeEnabled();
  });

  test('CD-14: When CUSTOM_ROOM is selected and both name and address are filled, Then the submit button is enabled', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = await openAt(page, 'CUSTOM_ROOM');
    await drawer.fillStep2({ name: 'Downtown Store', address: 'Calle Reforma 1' });
    await expect(drawer.submitButton).toBeEnabled();
  });

  test('CD-15: When the name has exactly 2 characters, Then the submit button stays disabled', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = await openAt(page, 'WAREHOUSE');
    await drawer.fillStep2({ name: 'AB', address: 'Av. Test 1' });
    await expect(drawer.submitButton).toBeDisabled();
  });

  test('CD-16: When the name has 62 characters, Then the chars counter shows 18 remaining', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = await openAt(page, 'WAREHOUSE');
    await drawer.fillStep2({ name: 'A'.repeat(62) });
    await expect(drawer.nameCharsCounter).toBeVisible();
    await expect(drawer.nameCharsCounter).toHaveText('18 remaining');
  });

  test('CD-17: When the description has 4 characters and the form is submitted, Then a validation error appears', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = await openAt(page, 'WAREHOUSE');
    await drawer.fillStep2({ name: 'Valid Name', address: 'Av. Test 500', description: 'Abcd' });
    await drawer.submit();
    await expect(page.getByText('Description must be at least 5 characters if provided')).toBeVisible();
  });

  test('CD-18: When the description is empty, Then no description validation error appears', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = await openAt(page, 'WAREHOUSE');
    await drawer.fillStep2({ name: 'Valid Name', address: 'Av. Test 500' });
    await expect(page.getByText('Description must be at least 5 characters if provided')).not.toBeVisible();
  });

  test('CD-19: When the description has exactly 5 characters, Then no validation error appears', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = await openAt(page, 'WAREHOUSE');
    await drawer.fillStep2({ name: 'Valid Name', address: 'Av. Test 500', description: 'Hello' });
    await expect(drawer.submitButton).toBeEnabled();
    await expect(page.getByText('Description must be at least 5 characters if provided')).not.toBeVisible();
  });
});
