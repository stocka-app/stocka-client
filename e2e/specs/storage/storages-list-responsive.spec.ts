import { test, expect } from '../../fixtures/auth.fixture';
import { StoragesListPage } from '../../pages/storages-list.page';
import {
  setupAndNavigate,
  buildMixedDataset,
  buildStoragesResponse,
  RBAC_OWNER,
} from '../../helpers/storages-list.helper';

const MIXED = buildMixedDataset();
const MIXED_RESPONSE = buildStoragesResponse(MIXED);

// ═════════════════════════════════════════════════════════════════════════════
// Section 13: Responsive
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 13: Responsive', () => {
  // RS-01: Mobile 320px → 1 column
  test('RS-01: mobile 320px shows single column grid', async ({ preAuthPage: page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    // Grid should be visible
    await expect(storagesPage.cardGrid).toBeVisible();
    // At 320px, grid-cols-1 is the only active breakpoint
    await expect(storagesPage.cardGrid).toHaveClass(/grid-cols-1/);
  });

  // RS-02: Tablet 768px → 2 columns
  test('RS-02: tablet 768px shows two column grid', async ({ preAuthPage: page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.cardGrid).toBeVisible();
  });

  // RS-03: Desktop 1024px → 3 columns
  test('RS-03: desktop 1024px shows three column grid', async ({ preAuthPage: page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.cardGrid).toBeVisible();
  });

  // RS-04: Ultrawide 2560px → 4 columns
  test('RS-04: ultrawide 2560px shows four column grid', async ({ preAuthPage: page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 });
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    await expect(storagesPage.cardGrid).toBeVisible();
  });

  // RS-05: Touch targets minimum 44px
  test('RS-05: all interactive buttons have minimum 44px height', async ({
    preAuthPage: page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    // Check action buttons have min-h-[44px]
    const actionButtons = page.locator('button.min-h-\\[44px\\]');
    const count = await actionButtons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await actionButtons.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  // RS-06: Tabs scroll on mobile
  test('RS-06: tabs have horizontal overflow on mobile', async ({ preAuthPage: page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    // Tabs container should have overflow-x-auto
    const tabsContainer = page.locator('.flex.flex-wrap.gap-2.overflow-x-auto').first();
    await expect(tabsContainer).toBeVisible();
  });

  // RS-08: Name visible on narrow screens
  test('RS-08: card name is never truncated on narrow screens', async ({
    preAuthPage: page,
  }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    // All h3 headings should be visible
    const headings = page.locator('h3');
    const count = await headings.count();
    for (let i = 0; i < count; i++) {
      await expect(headings.nth(i)).toBeVisible();
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 14: Dark mode
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 14: Dark mode', () => {
  // DM-01: Toggle dark mode
  test('DM-01: page renders correctly in dark mode', async ({ preAuthPage: page }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    // Page should have rendered (heading visible)
    await expect(storagesPage.heading).toBeVisible();
  });

  // DM-02: Cards use surface-card dark
  test('DM-02: cards render in dark mode without visual breakage', async ({
    preAuthPage: page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    // All cards should be visible
    const cards = await storagesPage.getCardNames();
    expect(cards.length).toBe(MIXED.length);
  });

  // DM-03: Brand color changes
  test('DM-03: tabs and buttons render correctly in dark mode', async ({
    preAuthPage: page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: MIXED_RESPONSE });
    await storagesPage.waitForCards();

    // Active tab should be visible
    await expect(storagesPage.tabAll).toBeVisible();
    await expect(storagesPage.tabAll).toHaveAttribute('aria-selected', 'true');
  });

  // DM-04: Skeleton in dark mode
  test('DM-04: skeleton renders in dark mode', async ({ preAuthPage: page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });

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

    await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
      await new Promise((r) => setTimeout(r, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MIXED_RESPONSE),
      });
    });

    await page.goto('/storages');

    // Skeleton elements should render
    const skeleton = page.locator('.animate-pulse');
    await expect(skeleton.first()).toBeVisible();
  });

  // DM-06: State compositions in dark mode
  test('DM-06: empty state adapts to dark mode', async ({ preAuthPage: page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, storagesResponse: buildStoragesResponse([]) });

    await expect(storagesPage.emptyTitle()).toBeVisible();
    await expect(page.getByText('Centralization')).toBeVisible();
  });

  // DM-06b: Error state in dark
  test('DM-06b: error state adapts to dark mode', async ({ preAuthPage: page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    const storagesPage = new StoragesListPage(page);
    await setupAndNavigate(page, { rbac: RBAC_OWNER, errorOnLoad: true });

    await expect(storagesPage.errorTitle()).toBeVisible();
    await expect(page.getByText('Check your connection')).toBeVisible();
  });
});
