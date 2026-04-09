import { test, expect } from '../../fixtures/auth.fixture';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

// ═════════════════════════════════════════════════════════════════════════════
// H-03 · StorageSwitcher — Mobile viewport (PW-15)
//
// Validates that the switcher is usable from the mobile drawer (< md):
//   - The full trigger lives inside the drawer (256px wide)
//   - Opening the popover floats it over the drawer overlay, anchored to
//     the right edge of the drawer — NOT in-place below the trigger
// ═════════════════════════════════════════════════════════════════════════════

const ITEMS = [
  buildStorage({ name: 'Almacén Central', type: 'WAREHOUSE', status: 'ACTIVE' }),
  buildStorage({ name: 'Bodega Principal', type: 'STORE_ROOM', status: 'ACTIVE' }),
  buildStorage({ name: 'Tienda Centro', type: 'CUSTOM_ROOM', status: 'ACTIVE' }),
];

test.use({ viewport: { width: 375, height: 812 } });

test.describe('StorageSwitcher — Mobile viewport', () => {
  test('PW-15: On mobile, opening the drawer reveals the switcher; its popover floats over the overlay', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse(ITEMS),
    });

    // At mobile width the sidebar is hidden by default — look for the
    // hamburger menu button and click it to open the drawer.
    const hamburger = page.getByRole('button', { name: /sidebar\.open|Open sidebar|Menu/i });
    await expect(hamburger).toBeVisible({ timeout: 15_000 });
    await hamburger.click();

    // After opening the drawer, the switcher trigger (full variant) should
    // be visible inside the drawer.
    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 5_000 });

    // Click the trigger to open the popover
    await trigger.click();
    const listbox = page.getByRole('listbox', { name: /Select storage/i });
    await expect(listbox).toBeVisible();

    // The popover floats over the drawer overlay. Compare the popover's
    // bounding box with the drawer's — the popover should start at or
    // beyond the drawer's right edge (not nested below inside the drawer's
    // vertical scroll).
    const drawer = page.locator('aside').first();
    const drawerBox = await drawer.boundingBox();
    const listboxBox = await listbox.boundingBox();
    expect(drawerBox).not.toBeNull();
    expect(listboxBox).not.toBeNull();
    if (drawerBox && listboxBox) {
      // Popover's left edge is at the right edge of the drawer (± a few px for ml-2 gap)
      expect(listboxBox.x).toBeGreaterThanOrEqual(drawerBox.x + drawerBox.width - 20);
    }

    // Clicking an item still works end-to-end
    await listbox.getByText('Bodega Principal').click();
    await expect(listbox).toHaveCount(0);
  });
});
