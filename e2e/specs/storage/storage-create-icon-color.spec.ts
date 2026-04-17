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
// CD-19 — CD-23: Icon/color picker behavior (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Create drawer icon/color picker (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_icon_color_${ts}@stocka.test`;
  const username = `pw_icon_color_${ts}`;
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

  test('CD-19: When WAREHOUSE is selected, Then the icon/color section shows "Fixed icon and color"', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('WAREHOUSE');
    await expect(page.getByText('Fixed icon and color')).toBeVisible();
    await expect(page.getByText('Warehouse type does not allow customization.')).toBeVisible();
  });

  test('CD-20: When STORE_ROOM is selected, Then the icon/color section shows "Fixed icon and color"', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('STORE_ROOM');
    await expect(page.getByText('Fixed icon and color')).toBeVisible();
    await expect(page.getByText('Store Room type does not allow customization.')).toBeVisible();
  });

  test('CD-21: When CUSTOM_ROOM is selected, Then the icon/color section shows "Icon and color" with a picker', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('CUSTOM_ROOM');
    await expect(page.getByText('Icon and color')).toBeVisible();
    await expect(page.getByText('restaurant').first()).toBeVisible();
  });

  test('CD-22: When the user selects a color swatch, Then the selected color is visually applied', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('CUSTOM_ROOM');

    const pickerOpenButton = page.locator('button').filter({ has: page.getByText('restaurant') }).first();
    await pickerOpenButton.click();

    const pickerDialog = page.getByRole('dialog', { name: /Customize icon and color/i });
    await expect(pickerDialog).toBeVisible();

    await page.getByRole('button', { name: '#EF4444' }).click();
    await page.getByRole('button', { name: 'Apply' }).click();

    await expect(pickerDialog).not.toBeVisible();
    await expect(page.getByText('#EF4444')).toBeVisible();
  });

  test('CD-23: When CUSTOM_ROOM is created without picking a custom icon/color, Then the form submits successfully with default values', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);
    const drawer = new CreateStorageDrawerPage(page);
    await drawer.openDrawer();
    await drawer.selectType('CUSTOM_ROOM');
    await drawer.fillStep2({ name: `Pop-up Store ${Date.now()}`, address: 'Calle 5 de Mayo 10' });
    await drawer.submit();
    await expect(drawer.drawer).not.toBeVisible({ timeout: 5_000 });
  });
});
