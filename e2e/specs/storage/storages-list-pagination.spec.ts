import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import {
  setupAndNavigate,
  buildLargeDataset,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

// ─── Mock data ───────────────────────────────────────────────────────────────

// 55 items → 2 pages (50 per page). Use `buildStoragesResponse` so the payload
// includes the `summary` and `typeSummary` fields demanded by the frontend
// schema — raw objects without them fail Zod parsing and drop the page into
// the error state, which broke P-01 through P-04.
const LARGE = buildLargeDataset();
const LARGE_RESPONSE = buildStoragesResponse(LARGE);

// Small dataset: 10 items → 1 page → no pagination
const SMALL_ITEMS = LARGE.slice(0, 10);
const SMALL_RESPONSE = buildStoragesResponse(SMALL_ITEMS);

// ═════════════════════════════════════════════════════════════════════════════
// Section 15: Pagination
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 15: Pagination', () => {
  // P-01: More than 50 storages → pagination visible
  test('P-01: pagination controls visible with more than 50 storages', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: LARGE_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.prevButton).toBeVisible();
    await expect(storagesPage.nextButton).toBeVisible();
    await expect(storagesPage.pageIndicator).toBeVisible();
    await expect(storagesPage.pageIndicator).toContainText('Page 1 of 2');
  });

  // P-02: First page → Previous disabled
  test('P-02: "Previous" button disabled on first page', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: LARGE_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.prevButton).toBeDisabled();
    await expect(storagesPage.nextButton).toBeEnabled();
  });

  // P-03: Last page → Next disabled
  test('P-03: "Next" button disabled on last page', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);

    // Setup smart routing that serves pages
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

    // Fabricate a STARTER-tier JWT so the FE does not render the FREE-tier
     // lock overlay (which disables search/pagination controls).
    await page.route(/\/api\/authentication\/refresh-session$/, async (route) => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const payload = btoa(JSON.stringify({
        sub: 'e2e-pagination-user', email: 'pagination@stocka.test',
        tenantId: 'e2e-mock-tenant', role: 'owner',
        tierLimits: { tier: 'STARTER', maxWarehouses: 10, maxStoreRooms: 10, maxCustomRooms: 10 },
        iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7200,
      })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { accessToken: `${header}.${payload}.e2e-fake` } }),
      });
    });

    await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
      const url = new URL(route.request().url());
      const reqPage = Number(url.searchParams.get('page') ?? '1');
      const limit = 50;
      const start = (reqPage - 1) * limit;
      const pageItems = LARGE.slice(start, start + limit);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: pageItems,
            total: LARGE.length,
            page: reqPage,
            limit,
            totalPages: Math.ceil(LARGE.length / limit),
            summary: { active: LARGE.length, frozen: 0, archived: 0 },
            typeSummary: {
              WAREHOUSE: { active: LARGE.length, frozen: 0, archived: 0 },
              STORE_ROOM: { active: 0, frozen: 0, archived: 0 },
              CUSTOM_ROOM: { active: 0, frozen: 0, archived: 0 },
            },
          },
        }),
      });
    });

    await page.goto('/storages');
    await page.waitForURL('**/storages', { timeout: 15_000 });
    await storagesPage.waitForCards();

    // Navigate to page 2
    await storagesPage.nextButton.click();

    // Wait for page indicator to update
    await expect(storagesPage.pageIndicator).toContainText('Page 2 of 2');

    await expect(storagesPage.nextButton).toBeDisabled();
    await expect(storagesPage.prevButton).toBeEnabled();
  });

  // P-04: Click next → loads next page
  test('P-04: clicking "Next" loads the next page', async ({ preAuthPage: page }) => {
    const storagesPage = new StoragesListPage(page);

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

    // Fabricate a STARTER-tier JWT so the FE does not render the FREE-tier
     // lock overlay (which disables search/pagination controls).
    await page.route(/\/api\/authentication\/refresh-session$/, async (route) => {
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const payload = btoa(JSON.stringify({
        sub: 'e2e-pagination-user', email: 'pagination@stocka.test',
        tenantId: 'e2e-mock-tenant', role: 'owner',
        tierLimits: { tier: 'STARTER', maxWarehouses: 10, maxStoreRooms: 10, maxCustomRooms: 10 },
        iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7200,
      })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { accessToken: `${header}.${payload}.e2e-fake` } }),
      });
    });

    await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
      const url = new URL(route.request().url());
      const reqPage = Number(url.searchParams.get('page') ?? '1');
      const limit = 50;
      const start = (reqPage - 1) * limit;
      const pageItems = LARGE.slice(start, start + limit);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            items: pageItems,
            total: LARGE.length,
            page: reqPage,
            limit,
            totalPages: Math.ceil(LARGE.length / limit),
            summary: { active: LARGE.length, frozen: 0, archived: 0 },
            typeSummary: {
              WAREHOUSE: { active: LARGE.length, frozen: 0, archived: 0 },
              STORE_ROOM: { active: 0, frozen: 0, archived: 0 },
              CUSTOM_ROOM: { active: 0, frozen: 0, archived: 0 },
            },
          },
        }),
      });
    });

    await page.goto('/storages');
    await page.waitForURL('**/storages', { timeout: 15_000 });
    await storagesPage.waitForCards();

    await expect(storagesPage.pageIndicator).toContainText('Page 1 of 2');

    // Navigate to page 2
    await storagesPage.nextButton.click();

    await expect(storagesPage.pageIndicator).toContainText('Page 2 of 2');
    // Page 2 should have the remaining 5 items
    const names = await storagesPage.getCardNames();
    expect(names.length).toBe(5);
  });

  // P-05: Less than 50 storages → no pagination
  test('P-05: no pagination controls with fewer than 50 storages', async ({
    preAuthPage: page,
  }) => {
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: SMALL_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.prevButton).not.toBeVisible();
    await expect(storagesPage.nextButton).not.toBeVisible();
    await expect(storagesPage.pageIndicator).not.toBeVisible();
  });
});
