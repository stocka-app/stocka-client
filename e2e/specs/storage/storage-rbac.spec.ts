import { expect } from '@playwright/test';
import { Pool } from 'pg';
import { test } from '../../fixtures/auth.fixture';
import { SpacesPage } from '../../pages/spaces.page';
import { LoginPage } from '../../pages/login.page';
import { apiSignUp, apiSignIn } from '../../helpers/api.helper';
import { verifyUserEmail, addMemberToTenant, findTenantByUserUuid } from '../../helpers/db.helper';

const DB_URL =
  process.env.PW_DATABASE_URL ??
  'postgresql://stocka:stocka_dev_password@localhost:5434/stocka_playwright';

const API_BASE = process.env.PW_API_URL ?? 'http://localhost:3001/api';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SPACES = [
  {
    uuid: 'e2e-space-active-001',
    name: 'E2E Active Warehouse',
    type: 'WAREHOUSE',
    status: 'ACTIVE',
    address: 'Calle Test 1',
    roomType: null,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    uuid: 'e2e-space-archived-001',
    name: 'E2E Archived Room',
    type: 'CUSTOM_ROOM',
    status: 'ARCHIVED',
    address: null,
    roomType: null,
    archivedAt: '2026-03-01T00:00:00.000Z',
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface RbacPayload {
  role: string;
  actions: string[];
}

/**
 * Set up route mocks (RBAC + storages list) and sign in as verifiedUser.
 * Must be called BEFORE AppLayout mounts so the RBAC mock is intercepted.
 */
async function setupAndSignIn(
  page: ConstructorParameters<typeof LoginPage>[0],
  verifiedUser: { email: string; password: string },
  rbac: RbacPayload,
): Promise<void> {
  await page.route('**/rbac/my-permissions', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        role: rbac.role,
        tier: 'FREE',
        actions: rbac.actions,
        grants: [],
      }),
    });
  });

  await page.route(/\/api\/storages$/, (route) => {
    if (route.request().method() === 'GET') {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SPACES),
      });
    } else {
      void route.continue();
    }
  });

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.signIn(verifiedUser.email, verifiedUser.password);
  await page.waitForURL('**/dashboard');
}

// ─── Role-based UI visibility ─────────────────────────────────────────────────

test.describe('Given a Viewer (STORAGE_READ only) on the Spaces page', () => {
  test.describe('When they view the space cards', () => {
    test('Then only the View action is shown — no Edit, Archive, or Delete', async ({
      page,
      verifiedUser,
    }) => {
      await setupAndSignIn(page, verifiedUser, {
        role: 'viewer',
        actions: ['STORAGE_READ'],
      });

      const spacesPage = new SpacesPage(page);
      await spacesPage.goto();
      await spacesPage.waitForContent('E2E Active Warehouse');

      await expect(spacesPage.viewButtons().first()).toBeVisible();
      await expect(spacesPage.editButtons()).not.toBeVisible();
      await expect(spacesPage.archiveButtons()).not.toBeVisible();
      await expect(spacesPage.deleteButtons()).not.toBeVisible();
    });

    test('Then the New space button is not shown', async ({ page, verifiedUser }) => {
      await setupAndSignIn(page, verifiedUser, {
        role: 'viewer',
        actions: ['STORAGE_READ'],
      });

      const spacesPage = new SpacesPage(page);
      await spacesPage.goto();
      await spacesPage.waitForContent('E2E Active Warehouse');

      await expect(spacesPage.createButton).not.toBeVisible();
    });
  });
});

test.describe(
  'Given a Manager (STORAGE_READ + STORAGE_UPDATE + STORAGE_DELETE) on the Spaces page',
  () => {
    test.describe('When they view the active space card', () => {
      test('Then Edit and Archive actions are shown', async ({ page, verifiedUser }) => {
        await setupAndSignIn(page, verifiedUser, {
          role: 'manager',
          actions: ['STORAGE_READ', 'STORAGE_UPDATE', 'STORAGE_DELETE'],
        });

        const spacesPage = new SpacesPage(page);
        await spacesPage.goto();
        await spacesPage.waitForContent('E2E Active Warehouse');

        await expect(spacesPage.editButtons().first()).toBeVisible();
        await expect(spacesPage.archiveButtons().first()).toBeVisible();
      });
    });

    test.describe('When they view the archived space card', () => {
      test('Then Edit and Delete actions are shown', async ({ page, verifiedUser }) => {
        await setupAndSignIn(page, verifiedUser, {
          role: 'manager',
          actions: ['STORAGE_READ', 'STORAGE_UPDATE', 'STORAGE_DELETE'],
        });

        const spacesPage = new SpacesPage(page);
        await spacesPage.goto();
        await spacesPage.waitForContent('E2E Archived Room');

        await expect(spacesPage.deleteButtons().first()).toBeVisible();
      });
    });
  },
);

test.describe('Given an Owner with full storage permissions on the Spaces page', () => {
  test.describe('When they view the page', () => {
    test('Then the New space button is visible', async ({ page, verifiedUser }) => {
      await setupAndSignIn(page, verifiedUser, {
        role: 'owner',
        actions: ['STORAGE_READ', 'STORAGE_CREATE', 'STORAGE_UPDATE', 'STORAGE_DELETE'],
      });

      const spacesPage = new SpacesPage(page);
      await spacesPage.goto();
      await spacesPage.waitForContent('E2E Active Warehouse');

      await expect(spacesPage.createButton).toBeVisible();
    });

    test('Then Edit, Archive, and View are all shown for the active space', async ({
      page,
      verifiedUser,
    }) => {
      await setupAndSignIn(page, verifiedUser, {
        role: 'owner',
        actions: ['STORAGE_READ', 'STORAGE_CREATE', 'STORAGE_UPDATE', 'STORAGE_DELETE'],
      });

      const spacesPage = new SpacesPage(page);
      await spacesPage.goto();
      await spacesPage.waitForContent('E2E Active Warehouse');

      await expect(spacesPage.viewButtons().first()).toBeVisible();
      await expect(spacesPage.editButtons().first()).toBeVisible();
      await expect(spacesPage.archiveButtons().first()).toBeVisible();
    });
  });
});

// ─── API-level RBAC enforcement ───────────────────────────────────────────────

test.describe('Given a Viewer member calls DELETE /storages', () => {
  test.describe('When the request reaches the backend', () => {
    test('Then the API returns 403 Forbidden', async ({ verifiedUser }) => {
      const pool = new Pool({ connectionString: DB_URL });

      try {
        // Find the owner's tenant
        const tenantUuid = await findTenantByUserUuid(pool, verifiedUser.userId);
        if (!tenantUuid) throw new Error('[storage-rbac] No tenant found for verifiedUser');

        // Create and prepare a viewer user
        const ts = Date.now();
        const viewerEmail = `pw_viewer_${ts}@stocka.test`;
        const viewerPassword = 'TestPass1!';

        const signUpResult = await apiSignUp({
          email: viewerEmail,
          username: `pw_viewer_${ts}`,
          password: viewerPassword,
        });

        await new Promise<void>((r) => setTimeout(r, 500));
        await verifyUserEmail(pool, viewerEmail);
        await addMemberToTenant(pool, tenantUuid, signUpResult.userId, 'viewer');

        // Sign in as viewer to obtain access token
        await new Promise<void>((r) => setTimeout(r, 500));
        const { accessToken } = await apiSignIn(viewerEmail, viewerPassword);

        // Attempt to DELETE a storage — RBAC guard must deny before any DB lookup
        const response = await fetch(
          `${API_BASE}/storages/00000000-0000-0000-0000-000000000000`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        );

        expect(response.status).toBe(403);
      } finally {
        await pool.end();
      }
    });
  });
});
