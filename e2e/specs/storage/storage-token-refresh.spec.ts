import { expect } from '../../fixtures/coverage.fixture';
import { test } from '../../fixtures/auth.fixture';

// ═════════════════════════════════════════════════════════════════════════════
// Token refresh mechanism (real BE, no mocks for happy path)
//
// The 401 injection tests (simulating expired token) are marked fixme
// because they require page.route() to inject a fake 401 — the only way
// to simulate token expiry without waiting 15+ minutes for the real JWT
// to expire. This is a network condition simulation, not a business mock.
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given a signed-in user navigates to the Storages page', () => {
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

      expect(refreshSessionCount).toBeLessThanOrEqual(1);
      await expect(page.getByText('Failed to load storages')).not.toBeVisible();
      await expect(page).toHaveURL(/\/storages/);
    });
  });

  // 401 injection requires page.route() to simulate an expired token. The
  // real JWT has a 15-minute lifetime — waiting for it to expire would make
  // the test suite impractically slow. These tests verify the deduplication
  // lock in executeRefresh(), which is also covered by Vitest unit tests.
  test.describe('When the access token has expired (simulated via 401 injection)', () => {
    test.fixme(
      'Then at most two POST /refresh-session calls fire (hydrateAuth + interceptor)',
      async () => {},
    );

    test.fixme(
      'Then the page recovers and does NOT redirect to sign-in',
      async () => {},
    );
  });
});
