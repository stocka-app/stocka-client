import { test, expect } from '../../fixtures/coverage.fixture';
import { Pool } from 'pg';
import { apiSignUp, apiCompleteOnboarding } from '../../helpers/api.helper';
import {
  createDbPool,
  verifyUserEmail,
  addMemberToTenant,
  findTenantByUserUuid,
} from '../../helpers/db.helper';
import {
  clearAllStoragesForUser,
  setTierByUserUuid,
  signInAndNavigateToStorages,
} from '../../helpers/real-storage.helper';
import { StoragesListPage } from '../../pages/storages-list.page';

// ═════════════════════════════════════════════════════════════════════════════
// Empty state & error state (real BE, no mocks)
//
// Empty state: user with 0 storages (cleared via DB).
// Error state: requires simulating a 500 — fixme (needs page.route).
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 3: Empty state (real BE, no mocks)', () => {
  let pool: Pool;
  const ts = Date.now();
  const ownerEmail = `pw_empty_${ts}@stocka.test`;
  const viewerEmail = `pw_empty_viewer_${ts}@stocka.test`;
  const password = 'TestPass1!';

  test.beforeAll(async () => {
    pool = createDbPool();

    const ownerSignUp = await apiSignUp({
      email: ownerEmail,
      username: `pw_empty_${ts}`,
      password,
    });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, ownerEmail);
    await new Promise((r) => setTimeout(r, 300));
    await apiCompleteOnboarding(ownerSignUp.accessToken);
    await setTierByUserUuid(pool, ownerSignUp.userId, 'STARTER');
    await clearAllStoragesForUser(pool, ownerSignUp.userId);

    // Viewer in the same tenant
    const viewerSignUp = await apiSignUp({
      email: viewerEmail,
      username: `pw_empty_viewer_${ts}`,
      password,
    });
    await new Promise((r) => setTimeout(r, 300));
    await verifyUserEmail(pool, viewerEmail);

    const tenantUuid = await findTenantByUserUuid(pool, ownerSignUp.userId);
    if (!tenantUuid) throw new Error('Owner tenant not found');
    await addMemberToTenant(pool, tenantUuid, viewerSignUp.userId, 'VIEWER');
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test('E-01: empty state shows warehouse icon', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);

    await expect(sp.emptyTitle()).toBeVisible();
    const emptyStateIcon = page
      .locator('[role="status"]')
      .locator('span.material-symbols-outlined', { hasText: 'warehouse' })
      .first();
    await expect(emptyStateIcon).toBeAttached();
  });

  test('E-02: title reads "You don\'t have any storages yet"', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);

    await expect(sp.emptyTitle()).toBeVisible();
  });

  test('E-03: CTA "Create my first storage" visible for owner', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);

    await expect(sp.emptyCreateButton()).toBeVisible();
  });

  test('E-03b: CTA "Create my first storage" NOT visible for viewer', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, viewerEmail, password);
    const sp = new StoragesListPage(page);

    await expect(sp.emptyTitle()).toBeVisible();
    await expect(sp.emptyCreateButton()).not.toBeVisible();
  });

  test('E-04: "What is a storage?" help link visible', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);

    await expect(sp.emptyHelpLink()).toBeVisible();
  });

  test('E-05: 3 value proposition cards visible', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);

    await expect(page.getByText('Centralization')).toBeVisible();
    await expect(page.getByText('Optimization')).toBeVisible();
    await expect(page.getByText('Roles & Permissions')).toBeVisible();
  });

  test('E-06: no controls (tabs, search) in empty state', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);

    await expect(sp.emptyTitle()).toBeVisible();
    await expect(sp.tabAll).not.toBeVisible();
    await expect(sp.searchInput).not.toBeVisible();
  });

  test('E-07: CTA opens creation panel', async ({ page }) => {
    test.setTimeout(60_000);
    await signInAndNavigateToStorages(page, ownerEmail, password);
    const sp = new StoragesListPage(page);

    await sp.emptyCreateButton().click();
    await expect(page.getByRole('dialog', { name: 'New storage' })).toBeVisible();
    await expect(page.locator('p').getByText('STEP 1 OF 2')).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 4: Error state
//
// All error state tests require simulating a 500/network failure,
// which is only possible with page.route (a mock). Marked as fixme.
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Section 4: Error state', () => {
  test.fixme('ER-01: network failure shows cloud_off icon', async () => {});
  test.fixme('ER-02: error title reads "We couldn\'t load your storages"', async () => {});
  test.fixme('ER-03: "Retry" button visible', async () => {});
  test.fixme('ER-04: "Get help" button visible', async () => {});
  test.fixme('ER-05: 3 troubleshooting cards visible', async () => {});
  test.fixme('ER-06: no technical messages shown', async () => {});
  test.fixme('ER-07: clicking "Retry" loads data when network recovers', async () => {});
});
