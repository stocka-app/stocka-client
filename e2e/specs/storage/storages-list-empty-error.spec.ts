import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import {
  setupAndNavigate,
  buildStoragesResponse,
  RBAC_OWNER,
  RBAC_VIEWER,
} from '../../helpers/storages-list.helper';

const EMPTY_RESPONSE = buildStoragesResponse([]);

// ═════════════════════════════════════════════════════════════════════════════
// Section 3: Empty state (no storages)
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 3: Empty state', () => {
  // E-01
  test('E-01: business without storages shows warehouse icon', async ({ preAuthPage: page }) => {
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE });
    const storagesPage = new StoragesListPage(page);

    await expect(storagesPage.emptyTitle()).toBeVisible();
    // Warehouse icon in the state composition
    await expect(page.getByText('warehouse').first()).toBeVisible();
  });

  // E-02
  test('E-02: empty state title reads "You don\'t have any storages yet"', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE });
    const storagesPage = new StoragesListPage(page);

    await expect(storagesPage.emptyTitle()).toBeVisible();
  });

  // E-03
  test('E-03: CTA "Create my first storage" visible for users with STORAGE_CREATE', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE });
    const storagesPage = new StoragesListPage(page);

    await expect(storagesPage.emptyCreateButton()).toBeVisible();
  });

  test('E-03b: CTA "Create my first storage" NOT visible for viewers', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, { rbac: RBAC_VIEWER, storagesResponse: EMPTY_RESPONSE });
    const storagesPage = new StoragesListPage(page);

    await expect(storagesPage.emptyTitle()).toBeVisible();
    await expect(storagesPage.emptyCreateButton()).not.toBeVisible();
  });

  // E-04
  test('E-04: "What is a storage?" help link visible', async ({ preAuthPage: page }) => {
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE });
    const storagesPage = new StoragesListPage(page);

    await expect(storagesPage.emptyHelpLink()).toBeVisible();
  });

  // E-05
  test('E-05: 3 value proposition cards visible', async ({ preAuthPage: page }) => {
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE });

    await expect(page.getByText('Centralization')).toBeVisible();
    await expect(page.getByText('Optimization')).toBeVisible();
    await expect(page.getByText('Roles & Permissions')).toBeVisible();
  });

  // E-06
  test('E-06: no controls (stats bar, search bar, tabs) in empty state', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE });
    const storagesPage = new StoragesListPage(page);

    await expect(storagesPage.emptyTitle()).toBeVisible();
    // Tabs should not have role="tab" in empty state
    await expect(storagesPage.tabAll).not.toBeVisible();
    await expect(storagesPage.searchInput).not.toBeVisible();
  });

  // E-07
  test('E-07: CTA opens creation panel', async ({ preAuthPage: page }) => {
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: EMPTY_RESPONSE });
    const storagesPage = new StoragesListPage(page);

    await storagesPage.emptyCreateButton().click();

    // Modal should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('New storage')).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 4: Error state
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 4: Error state', () => {
  // ER-01
  test('ER-01: network failure shows cloud_off icon', async ({ preAuthPage: page }) => {
    await setupAndNavigate(page, { rbac: RBAC_OWNER, errorOnLoad: true });

    await expect(page.getByText('cloud_off').first()).toBeVisible();
  });

  // ER-02
  test('ER-02: error title reads "We couldn\'t load your storages"', async ({
    preAuthPage: page,
  }) => {
    await setupAndNavigate(page, { rbac: RBAC_OWNER, errorOnLoad: true });
    const storagesPage = new StoragesListPage(page);

    await expect(storagesPage.errorTitle()).toBeVisible();
  });

  // ER-03
  test('ER-03: "Retry" button visible', async ({ preAuthPage: page }) => {
    await setupAndNavigate(page, { rbac: RBAC_OWNER, errorOnLoad: true });
    const storagesPage = new StoragesListPage(page);

    await expect(storagesPage.retryButton()).toBeVisible();
  });

  // ER-04
  test('ER-04: "Get help" button visible', async ({ preAuthPage: page }) => {
    await setupAndNavigate(page, { rbac: RBAC_OWNER, errorOnLoad: true });
    const storagesPage = new StoragesListPage(page);

    await expect(storagesPage.getHelpButton()).toBeVisible();
  });

  // ER-05
  test('ER-05: 3 troubleshooting cards visible', async ({ preAuthPage: page }) => {
    await setupAndNavigate(page, { rbac: RBAC_OWNER, errorOnLoad: true });

    await expect(page.getByText('Check your connection')).toBeVisible();
    await expect(page.getByText('Refresh the page')).toBeVisible();
    await expect(page.getByText('Contact support')).toBeVisible();
  });

  // ER-06
  test('ER-06: no technical messages shown', async ({ preAuthPage: page }) => {
    await setupAndNavigate(page, { rbac: RBAC_OWNER, errorOnLoad: true });

    // Should not show any error codes, stack traces, or server messages
    await expect(page.getByText('Internal Server Error')).not.toBeVisible();
    await expect(page.getByText('500')).not.toBeVisible();
  });

  // ER-07
  test('ER-07: clicking "Retry" loads data when network recovers', async ({
    preAuthPage: page,
  }) => {
    let requestCount = 0;
    const storagesPage = new StoragesListPage(page);

    await page.addInitScript((value: string) => {
      localStorage.setItem('rbac-storage', value);
    }, JSON.stringify({
      state: { role: 'owner', tier: 'FREE', tenantStatus: 'ACTIVE', permissions: RBAC_OWNER.actions, grants: [], loaded: true },
      version: 0,
    }));

    await page.route(/\/api\/rbac\/my-permissions(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { role: 'owner', tier: 'FREE', actions: RBAC_OWNER.actions, grants: [] } }),
      });
    });

    const successResponse = buildStoragesResponse([
      { uuid: '12345678-0000-4000-8000-000000000099', name: 'Recovered Storage', type: 'WAREHOUSE', status: 'ACTIVE', address: 'Calle 1', roomType: null, archivedAt: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
    ]);

    await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
      requestCount++;
      if (requestCount === 1) {
        await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false }) });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(successResponse) });
      }
    });

    await page.goto('/storages');
    await page.waitForURL('**/storages', { timeout: 15_000 });

    // Error state should appear
    await expect(storagesPage.errorTitle()).toBeVisible();

    // Click retry
    await storagesPage.retryButton().click();

    // Data should now load
    await expect(page.getByText('Recovered Storage')).toBeVisible();
  });
});
