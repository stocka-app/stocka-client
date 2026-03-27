import { expect } from '@playwright/test';
import { test } from '../../fixtures/auth.fixture';

/**
 * E2E tests for the token refresh mechanism on the Storages page.
 *
 * These tests run against the real dev server + real backend.
 * No module mocks — we only use Playwright's network interception to
 * simulate an expired token by returning 401 on the first GET /storages request.
 *
 * Architecture notes:
 * - React 19 StrictMode fires useEffect twice (mount → cleanup → mount).
 *   The first mount's AbortController is cancelled before the request is sent
 *   (cleanup fires synchronously in the same microtask), so only the SECOND
 *   mount's request actually reaches the network.
 * - hydrateAuth (AuthInitializer) fires a proactive POST /refresh-session on
 *   every page load. ProtectedRoute blocks the page until it completes, so the
 *   401 interceptor and hydrateAuth's refresh are sequential, not concurrent.
 *   The maximum number of POST /refresh-session calls per page load is therefore
 *   2: one from hydrateAuth and at most one from the 401 interceptor.
 * - The executeRefresh() deduplication lock prevents concurrent 401s from each
 *   firing their own independent refresh. Without the lock, cookie rotation
 *   from the first refresh would invalidate the second, causing logout.
 */

test.describe('Given a signed-in user navigates to the Storages page', () => {
  // ── Happy path: fresh token, no refresh needed ──────────────────────────────

  test.describe('When the access token is still valid', () => {
    test('Then at most one refresh-session fires and the page renders without errors', async ({
      authenticatedPage: page,
    }) => {
      let refreshSessionCount = 0;
      page.on('request', (req) => {
        if (req.url().includes('/authentication/refresh-session') && req.method() === 'POST') {
          refreshSessionCount++;
        }
      });

      await page.goto('/storages');
      await page.waitForLoadState('networkidle');

      // Fresh token: hydrateAuth calls executeRefresh() once per page load. That's expected.
      // The critical invariant: at most ONE refresh-session must fire (not two from a race condition).
      expect(refreshSessionCount).toBeLessThanOrEqual(1);

      // No error banner visible
      await expect(page.getByText('Failed to load storages')).not.toBeVisible();

      // Still on the storages page (no redirect to sign-in)
      await expect(page).toHaveURL(/\/storages/);
    });
  });

  // ── Token expiry scenario ────────────────────────────────────────────────────
  // We inject a 401 for the first GET /storages request that reaches the network
  // (StrictMode's first mount is aborted before being sent; only the second mount's
  // request is real). The axios interceptor must:
  //   1. Call executeRefresh() to get a fresh token
  //   2. Retry the original request successfully (route.continue() on the retry)
  //   3. Render the page without showing the error banner or redirecting to sign-in
  //
  // The expected refresh count is at most 2:
  //   - 1 from hydrateAuth (proactive, fires on every page load)
  //   - At most 1 from the 401 interceptor
  // Before the executeRefresh() deduplication fix, additional concurrent 401s
  // could each fire their own independent refresh, rotating the cookie and causing
  // the subsequent refresh to fail → clearAuthStorage() → redirect to sign-in.

  test.describe('When the access token has expired (simulated via 401 injection on /storages)', () => {
    test('Then at most two POST /refresh-session calls fire (hydrateAuth + interceptor)', async ({
      authenticatedPage: page,
    }) => {
      let refreshSessionCount = 0;

      page.on('request', (req) => {
        if (req.url().includes('/authentication/refresh-session') && req.method() === 'POST') {
          refreshSessionCount++;
        }
      });

      // Return 401 for the first GET /storages call that reaches the network,
      // then pass through — the retry must always get a 200.
      let injected401s = 0;
      await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
        if (route.request().method() === 'GET' && injected401s < 1) {
          injected401s++;
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 401,
              message: 'Unauthorized',
              error: 'UNAUTHORIZED',
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/storages');

      // Give time for: 401 → executeRefresh() → refresh-session → retry → render
      await page.waitForLoadState('networkidle');

      // At most 2 refresh-session calls: 1 from hydrateAuth + 1 from the 401 interceptor.
      // More than 2 would indicate the deduplication lock is broken (concurrent 401s each
      // firing their own independent refresh, causing cookie rotation failure → logout).
      expect(refreshSessionCount).toBeLessThanOrEqual(2);
    });

    test('Then the page recovers and does NOT redirect to sign-in', async ({
      authenticatedPage: page,
    }) => {
      let injected401s = 0;
      await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
        if (route.request().method() === 'GET' && injected401s < 1) {
          injected401s++;
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              statusCode: 401,
              message: 'Unauthorized',
              error: 'UNAUTHORIZED',
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/storages');
      await page.waitForLoadState('networkidle');

      // Must stay on /storages — not get kicked to sign-in
      await expect(page).toHaveURL(/\/storages/);

      // Must not show the error banner
      await expect(page.getByText('Failed to load storages')).not.toBeVisible();
    });
  });
});
