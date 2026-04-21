import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding, apiSignIn } from '../../helpers/api.helper';
import { createDbPool, verifyUserEmail } from '../../helpers/db.helper';
import {
  apiCreateWarehouse,
  apiCreateStoreRoom,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';

// ═════════════════════════════════════════════════════════════════════════════
// StorageSwitcher — Mobile viewport (real BE, no mocks)
// ═════════════════════════════════════════════════════════════════════════════

test.use({ viewport: { width: 375, height: 812 } });

test.describe('StorageSwitcher — Mobile viewport (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const email = `pw_mob_${ts}@stocka.test`;
  const username = `pw_mob_${ts}`;
  const password = 'TestPass1!';

  let storeRoomName: string;

  test.beforeAll(async () => {
    pool = createDbPool();
    const signUp = await apiSignUp({ email, username, password });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, email);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(signUp.accessToken);
    await setTierByUserUuid(pool, signUp.userId, 'STARTER');

    const { accessToken } = await apiSignIn(email, password);
    await apiCreateWarehouse(accessToken, 'Almacén Central', 'Av. Industrial 500');
    const sr = await apiCreateStoreRoom(accessToken, 'Bodega Principal', 'Calle Bodega 10');
    storeRoomName = sr.name;
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('PW-15: On mobile, the switcher popover floats over the drawer overlay', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, email, password);

    const hamburger = page.getByRole('button', { name: /Open navigation|Abrir navegación/i });
    await expect(hamburger).toBeVisible({ timeout: 15_000 });
    await hamburger.click();

    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 5_000 });
    await trigger.click();

    const listbox = page.getByRole('listbox', { name: /Select storage/i });
    await expect(listbox).toBeVisible();

    const drawer = page.locator('aside').first();
    const drawerBox = await drawer.boundingBox();
    const listboxBox = await listbox.boundingBox();
    expect(drawerBox).not.toBeNull();
    expect(listboxBox).not.toBeNull();
    if (drawerBox && listboxBox) {
      expect(listboxBox.x).toBeGreaterThanOrEqual(drawerBox.x + drawerBox.width - 20);
    }

    await listbox.getByText(storeRoomName).click();
    await expect(listbox).toHaveCount(0);
  });
});
