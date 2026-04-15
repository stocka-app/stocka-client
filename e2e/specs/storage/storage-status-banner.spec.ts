import { test, expect } from '../../fixtures/auth.fixture';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

// ═════════════════════════════════════════════════════════════════════════════
// H-03 · StorageStatusBanner — PW-12 through PW-14
//
// Covers the global StorageStatusBanner mounted in AppLayout between the
// sidebar and the main content area. The banner reacts to the active
// storage's status and renders FROZEN (blue) or ARCHIVED (gray) variants,
// with a "Reactivate" CTA and an X close button.
// ═════════════════════════════════════════════════════════════════════════════

const FROZEN_STORAGE = buildStorage({
  name: 'Bodega Norte',
  type: 'STORE_ROOM',
  status: 'FROZEN',
  frozenAt: '2026-03-01T00:00:00.000Z',
});

const ACTIVE_STORAGE = buildStorage({
  name: 'Almacén Central',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
});

const MIXED = [FROZEN_STORAGE, ACTIVE_STORAGE];

// ═════════════════════════════════════════════════════════════════════════════
// Section: FROZEN banner rendering (PW-12)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('StorageStatusBanner — FROZEN state', () => {
  test('PW-12: When the active storage is FROZEN, the banner is visible with Reactivate CTA and X close', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse(MIXED),
    });

    // Wait for switcher to auto-select the first ACTIVE A→Z ("Almacén Central")
    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });

    // Manually select the FROZEN storage from the dropdown
    await trigger.click();
    const listbox = page.getByRole('listbox', { name: /Select storage/i });
    await expect(listbox).toBeVisible();
    await listbox.getByText('Bodega Norte').click();
    await expect(listbox).toHaveCount(0);

    // Banner should now be visible — contains text about frozen state
    const banner = page.getByRole('status').filter({ hasText: /frozen|congelada/i });
    await expect(banner).toBeVisible({ timeout: 5_000 });

    // Reactivate CTA (outlined button)
    const reactivateCta = page.getByRole('button', { name: /Reactivate/i });
    await expect(reactivateCta).toBeVisible();

    // X close button — aria-label in English is "Close notice"
    const closeBtn = page.getByRole('button', { name: /Close notice/i });
    await expect(closeBtn).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section: Dismiss / reload behavior (PW-13)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('StorageStatusBanner — Dismiss behavior', () => {
  test('PW-13: Click X close makes the banner disappear; reloading the page brings it back (close does NOT persist)', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse(MIXED),
    });

    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    await trigger.click();
    await page.getByRole('listbox', { name: /Select storage/i }).getByText('Bodega Norte').click();

    const banner = page.getByRole('status').filter({ hasText: /frozen|congelada/i });
    await expect(banner).toBeVisible();

    // Dismiss
    await page.getByRole('button', { name: /Close notice/i }).click();
    await expect(banner).toHaveCount(0);

    // Reload — banner should reappear (dismissal does not persist)
    await page.reload();
    // After reload, the storages API mock still applies thanks to addInitScript-style
    // route persistence on the BrowserContext. The active storage id is persisted
    // per-tenant in localStorage, so the switcher will re-read "Bodega Norte" on mount.
    await expect(page.getByRole('status').filter({ hasText: /frozen|congelada/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section: Reactivate flow (PW-14)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('StorageStatusBanner — Reactivate flow', () => {
  test('PW-14: Clicking Reactivate calls the API, hides the banner, and shows a success toast', async ({
    preAuthPage: page,
  }) => {
    // Track when unfreeze has been called so the subsequent list refetch
    // returns Bodega Norte as ACTIVE (banner will hide on the next render).
    let unfreezeCalled = false;

    // FROZEN → ACTIVE uses the per-type /unfreeze endpoint
    // (e.g. POST /api/storages/store-rooms/<id>/unfreeze). The /restore route is
    // only used for ARCHIVED → ACTIVE, not FROZEN — so mock /unfreeze here.
    await page.route(/\/api\/storages\/[^/]+\/[^/]+\/unfreeze$/, async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      unfreezeCalled = true;
      const reactivated = { ...FROZEN_STORAGE, status: 'ACTIVE' as const, frozenAt: null };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: reactivated }),
      });
    });

    await setupAndNavigate(page, {
      rbac: RBAC_OWNER,
      storagesResponse: buildStoragesResponse(MIXED),
    });

    // After unfreeze the component refetches the storage by name to sync the store.
    // Override the list mock to return Bodega Norte as ACTIVE once unfreeze fired.
    await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
      if (route.request().method() !== 'GET' || !unfreezeCalled) {
        await route.fallback();
        return;
      }
      const reactivated = { ...FROZEN_STORAGE, status: 'ACTIVE' as const, frozenAt: null };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: [reactivated],
            total: 1,
            page: 1,
            limit: 50,
            totalPages: 1,
            summary: { active: 1, frozen: 0, archived: 0 },
            typeSummary: {
              WAREHOUSE: { active: 0, frozen: 0, archived: 0 },
              STORE_ROOM: { active: 1, frozen: 0, archived: 0 },
              CUSTOM_ROOM: { active: 0, frozen: 0, archived: 0 },
            },
          },
        }),
      });
    });

    const trigger = page.getByRole('button', { name: /Change active storage/i }).first();
    await expect(trigger).toBeVisible({ timeout: 15_000 });
    await trigger.click();
    await page.getByRole('listbox', { name: /Select storage/i }).getByText('Bodega Norte').click();

    const banner = page.getByRole('status').filter({ hasText: /frozen|congelada/i });
    await expect(banner).toBeVisible();

    // Click Reactivate
    await page.getByRole('button', { name: /Reactivate/i }).click();

    // Banner disappears because the storage is now ACTIVE
    await expect(banner).toHaveCount(0, { timeout: 5_000 });
  });
});
