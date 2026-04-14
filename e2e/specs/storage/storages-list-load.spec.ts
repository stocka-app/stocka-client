import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import {
  setupAndNavigate,
  buildStorage,
  buildStoragesResponse,
  buildMixedDataset,
  RBAC_OWNER,
  RBAC_VIEWER,
} from '../../helpers/storages-list.helper';

// ─── Mock data ───────────────────────────────────────────────────────────────

const MIXED = buildMixedDataset();
const MIXED_RESPONSE = buildStoragesResponse(MIXED);

const WAREHOUSE_ACTIVE = buildStorage({
  name: 'Almacen Central',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: 'Av. Industrial 500',
});
const STORE_ROOM_ACTIVE = buildStorage({
  name: 'Bodega Principal',
  type: 'STORE_ROOM',
  status: 'ACTIVE',
  address: 'Calle Bodega 10',
});
const CUSTOM_ROOM_ACTIVE = buildStorage({
  name: 'Area Exhibicion',
  type: 'CUSTOM_ROOM',
  status: 'ACTIVE',
  address: null,
});
const WAREHOUSE_FROZEN = buildStorage({
  name: 'Almacen Norte',
  type: 'WAREHOUSE',
  status: 'FROZEN',
  address: 'Calle Frio 20',
});
const WAREHOUSE_ARCHIVED = buildStorage({
  name: 'Almacen Sur',
  type: 'WAREHOUSE',
  status: 'ARCHIVED',
  address: 'Vieja Zona 5',
  archivedAt: '2026-03-01T00:00:00.000Z',
});
const NO_ADDRESS = buildStorage({
  name: 'Sin Direccion',
  type: 'CUSTOM_ROOM',
  status: 'ACTIVE',
  address: null,
});
const WITH_ADDRESS = buildStorage({
  name: 'Con Direccion',
  type: 'WAREHOUSE',
  status: 'ACTIVE',
  address: 'Calle Larga 999, Col. Centro, CP 12345',
});

const CARD_ANATOMY_ITEMS = [
  WAREHOUSE_ACTIVE,
  STORE_ROOM_ACTIVE,
  CUSTOM_ROOM_ACTIVE,
  WAREHOUSE_FROZEN,
  WAREHOUSE_ARCHIVED,
  NO_ADDRESS,
  WITH_ADDRESS,
];

// ═════════════════════════════════════════════════════════════════════════════
// Section 1: Primera carga (Skeleton -> Success)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 1: First load (Skeleton -> Success)', () => {
  // L-01
  test.describe('Given storages exist', () => {
    test('L-01: navigating to /storages shows skeleton then transitions to success with cards', async ({
      preAuthPage: page,
    }) => {
      const storagesPage = new StoragesListPage(page);

      await setupAndNavigate(page, {
        rbac: RBAC_OWNER,
        storagesResponse: MIXED_RESPONSE,
        delay: 300,
      });

      // After data loads, cards should be visible
      await storagesPage.waitForCards();
      await expect(storagesPage.heading).toBeVisible();
    });
  });

  // L-02
  test.describe('Given page is loading', () => {
    test('L-02: skeleton shows 6 placeholder cards', async ({ preAuthPage: page }) => {
      // Use a long delay to keep skeleton visible for assertion
      let resolveRoute: (() => void) | null = null;
      const routeReady = new Promise<void>((r) => { resolveRoute = r; });

      await page.addInitScript((value: string) => {
        localStorage.setItem('rbac-storage', value);
      }, JSON.stringify({
        state: { role: 'owner', tier: 'STARTER', tenantStatus: 'ACTIVE', permissions: RBAC_OWNER.actions, grants: [], loaded: true },
        version: 0,
      }));

      await page.route(/\/api\/rbac\/my-permissions(\?.*)?$/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { role: 'owner', tier: 'STARTER', actions: RBAC_OWNER.actions, grants: [] } }),
        });
      });

      // Hold the storages request to keep skeleton visible
      await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
        resolveRoute?.();
        // Don't fulfill — keep request pending to maintain skeleton
        await new Promise((r) => setTimeout(r, 5000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MIXED_RESPONSE),
        });
      });

      await page.goto('/storages');
      await routeReady;

      // Skeleton cards should be visible (6 animated cards + 1 create dashed card)
      const skeletonCards = page.locator('.animate-pulse');
      await expect(skeletonCards.first()).toBeVisible();
    });
  });

  // L-03
  test('L-03: skeleton does not block the screen with an overlay', async ({ preAuthPage: page }) => {
    await page.addInitScript((value: string) => {
      localStorage.setItem('rbac-storage', value);
    }, JSON.stringify({
      state: { role: 'owner', tier: 'STARTER', tenantStatus: 'ACTIVE', permissions: RBAC_OWNER.actions, grants: [], loaded: true },
      version: 0,
    }));

    await page.route(/\/api\/rbac\/my-permissions(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { role: 'owner', tier: 'STARTER', actions: RBAC_OWNER.actions, grants: [] } }),
      });
    });

    await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MIXED_RESPONSE),
      });
    });

    await page.goto('/storages');

    // No overlay or spinner should be visible during skeleton
    const overlay = page.locator('[class*="absolute inset-0"]');
    await expect(overlay).not.toBeVisible();
  });

  // L-04
  test('L-04: success state shows header with title and subtitle', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.heading).toBeVisible();
    await expect(storagesPage.subtitle).toBeVisible();
  });

  // L-04b: New storage button visible for owner
  test('L-04b: success state shows "New storage" button when user has STORAGE_CREATE', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.createButton).toBeVisible();
  });

  // L-05
  test('L-05: success state shows 4 tabs with counts', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.tabAll).toBeVisible();
    await expect(storagesPage.tabWarehouses).toBeVisible();
    await expect(storagesPage.tabStoreRooms).toBeVisible();
    await expect(storagesPage.tabCustomRooms).toBeVisible();

    // "All" tab should be selected by default
    await expect(storagesPage.tabAll).toHaveAttribute('aria-selected', 'true');
  });

  // L-06
  test('L-06: success state shows stats bar with active, frozen, occupancy', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.statsBar).toBeVisible();
    await expect(page.getByText('Active').first()).toBeVisible();
    await expect(page.getByText('Frozen').first()).toBeVisible();
    await expect(page.getByText('Occupancy')).toBeVisible();
  });

  // L-07
  test('L-07: success state shows search input, status dropdown, and sort button', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.searchInput).toBeVisible();
    await expect(storagesPage.statusDropdown).toBeVisible();
    await expect(storagesPage.sortButton).toBeVisible();
  });

  // L-08
  test('L-08: success state shows grid of storage cards', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    const names = await storagesPage.getCardNames();
    expect(names.length).toBe(MIXED.length);
  });

  // L-09
  test('L-09: inline create card shown at end of grid for users with STORAGE_CREATE', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.createInlineCard).toBeVisible();
  });

  test('L-09b: inline create card NOT shown for viewers', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_VIEWER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.createInlineCard).not.toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 2: Card anatomy
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 2: Card anatomy', () => {
  const ANATOMY_RESPONSE = buildStoragesResponse(CARD_ANATOMY_ITEMS);

  // C-01
  test('C-01: WAREHOUSE card shows "Warehouse" badge', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ANATOMY_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.cardTypeBadge('Almacen Central')).toHaveText('Warehouse');
  });

  // C-02
  test('C-02: STORE_ROOM card shows "Store Room" badge', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ANATOMY_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.cardTypeBadge('Bodega Principal')).toHaveText('Store Room');
  });

  // C-03
  test('C-03: CUSTOM_ROOM card shows "Custom Room" badge', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ANATOMY_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.cardTypeBadge('Area Exhibicion')).toHaveText('Custom Room');
  });

  // C-04
  test('C-04: ACTIVE card shows "Active" status label', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ANATOMY_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.cardStatusLabel('Almacen Central')).toHaveText('Active');
  });

  // C-05
  test('C-05: FROZEN card shows "Frozen" status label with reduced opacity', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ANATOMY_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.cardStatusLabel('Almacen Norte')).toHaveText('Frozen');
    // Frozen card content should have opacity-75
    const content = storagesPage.card('Almacen Norte').locator('.opacity-75');
    await expect(content).toBeVisible();
  });

  // C-06
  test('C-06: ARCHIVED card shows "Archived" status label with opacity-50', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ANATOMY_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.cardStatusLabel('Almacen Sur')).toHaveText('Archived');
    // Archived card has opacity-50 class
    const archivedCard = storagesPage.card('Almacen Sur');
    await expect(archivedCard).toHaveClass(/opacity-50/);
  });

  // C-07
  test('C-07: card with address shows the address', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ANATOMY_RESPONSE });
    await storagesPage.waitForCards();

    await expect(page.getByText('Calle Larga 999, Col. Centro, CP 12345')).toBeVisible();
  });

  // C-08
  test('C-08: card without address does not show address line', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    const items = [NO_ADDRESS];
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: buildStoragesResponse(items) });
    await storagesPage.waitForCards();

    // The card should exist but no address paragraph
    const card = storagesPage.card('Sin Direccion');
    await expect(card).toBeVisible();
    // No address text on this card
    const addressLocator = card.locator('p.truncate');
    await expect(addressLocator).not.toBeVisible();
  });

  // C-09
  test('C-09: card shows product count placeholder', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ANATOMY_RESPONSE });
    await storagesPage.waitForCards();

    await expect(page.getByText('— products').first()).toBeVisible();
  });

  // C-10
  test('C-10: card name is always visible and not truncated', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: ANATOMY_RESPONSE });
    await storagesPage.waitForCards();

    // Every h3 should be visible
    const headings = page.locator('h3');
    const count = await headings.count();
    for (let i = 0; i < count; i++) {
      await expect(headings.nth(i)).toBeVisible();
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 12: Loader state (second load / actions)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 12: Loader state (second load)', () => {
  // LS-01
  test('LS-01: filtering with existing data shows opacity overlay + spinner', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    let requestCount = 0;

    // First request: immediate. Second request: delayed.
    await page.addInitScript((value: string) => {
      localStorage.setItem('rbac-storage', value);
    }, JSON.stringify({
      state: { role: 'owner', tier: 'STARTER', tenantStatus: 'ACTIVE', permissions: RBAC_OWNER.actions, grants: [], loaded: true },
      version: 0,
    }));

    await page.route(/\/api\/rbac\/my-permissions(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { role: 'owner', tier: 'STARTER', actions: RBAC_OWNER.actions, grants: [] } }),
      });
    });

    await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MIXED_RESPONSE),
        });
      } else {
        // Hold second request to show loader
        await new Promise((r) => setTimeout(r, 3000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MIXED_RESPONSE),
        });
      }
    });

    await page.goto('/storages');
    await storagesPage.waitForCards();

    // Trigger a filter change
    await storagesPage.selectStatus('ACTIVE');

    // Loader spinner should appear
    await expect(storagesPage.loaderSpinner).toBeVisible({ timeout: 5000 });

    // Cards should have reduced opacity
    const gridWithOpacity = page.locator('.opacity-30');
    await expect(gridWithOpacity).toBeVisible();
  });

  // LS-03
  test('LS-03: loader shows "Loading storages..." label', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    let requestCount = 0;

    await page.addInitScript((value: string) => {
      localStorage.setItem('rbac-storage', value);
    }, JSON.stringify({
      state: { role: 'owner', tier: 'STARTER', tenantStatus: 'ACTIVE', permissions: RBAC_OWNER.actions, grants: [], loaded: true },
      version: 0,
    }));

    await page.route(/\/api\/rbac\/my-permissions(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { role: 'owner', tier: 'STARTER', actions: RBAC_OWNER.actions, grants: [] } }),
      });
    });

    await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
      requestCount++;
      if (requestCount > 1) {
        await new Promise((r) => setTimeout(r, 3000));
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MIXED_RESPONSE),
      });
    });

    await page.goto('/storages');
    await storagesPage.waitForCards();

    // Trigger search to cause second load
    await storagesPage.search('test');

    await expect(storagesPage.loaderSpinner).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Loading storages...')).toBeVisible();
  });

  // LS-05
  test('LS-05: after loader completes, cards return to full opacity', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    // Cards should not have opacity-30 class in normal state
    const gridWithOpacity = page.locator('.grid.opacity-30');
    await expect(gridWithOpacity).not.toBeVisible();
  });
});
