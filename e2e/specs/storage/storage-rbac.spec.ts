import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from '../../fixtures/auth.fixture';
import { SpacesPage } from '../../pages/spaces.page';
import { apiSignIn } from '../../helpers/api.helper';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const USERS_FILE = resolve(__dirname, '../../.auth/users.json');

const API_BASE = process.env.PW_API_URL ?? 'http://localhost:3002/api';

// ─── Mock data ────────────────────────────────────────────────────────────────

// Backend always wraps responses in { data: T, success: boolean }.
// The storages service unwraps with `envelope.data` and parses via storagesPageSchema,
// which expects { items, total, page, limit, totalPages }.
// UUIDs must be valid v4/v7 strings to pass z.string().uuid() validation.
const MOCK_STORAGES_RESPONSE = {
  success: true,
  data: {
    items: [
      {
        uuid: '12345678-0000-4000-8000-000000000001',
        name: 'E2E Active Warehouse',
        type: 'WAREHOUSE',
        status: 'ACTIVE',
        address: 'Calle Test 1',
        roomType: null,
        icon: 'warehouse',
        color: '#3B82F6',
        description: null,
        archivedAt: null,
        frozenAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        uuid: '12345678-0000-4000-8000-000000000002',
        name: 'E2E Archived Room',
        type: 'CUSTOM_ROOM',
        status: 'ARCHIVED',
        address: null,
        roomType: null,
        icon: 'restaurant',
        color: '#0D9488',
        description: null,
        archivedAt: '2026-03-01T00:00:00.000Z',
        frozenAt: null,
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-03-01T00:00:00.000Z',
      },
    ],
    total: 2,
    page: 1,
    limit: 50,
    totalPages: 1,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface RbacPayload {
  role: string;
  actions: string[];
}

/**
 * Set up route mocks (RBAC + storages list) then navigate directly to /storages.
 * The preAuthPage fixture pre-loads storageState so no UI sign-in is needed.
 * Mocks must be registered BEFORE navigation so they intercept the first requests.
 */
async function setupAndNavigate(page: Page, rbac: RbacPayload): Promise<void> {
  // Pre-seed the RBAC store in localStorage with the desired permissions BEFORE
  // navigation. The Zustand persist middleware rehydrates synchronously from
  // localStorage on module load, so we must write the correct mock data here —
  // merely removing the key would race with rehydration.
  const rbacStorageValue = JSON.stringify({
    state: {
      role: rbac.role,
      tier: 'FREE',
      tenantStatus: 'ACTIVE',
      permissions: rbac.actions,
      grants: [],
      loaded: true,
    },
    version: 0,
  });
  await page.addInitScript((value: string) => {
    localStorage.setItem('rbac-storage', value);
  }, rbacStorageValue);

  // RBAC store does: response.data → envelope; envelope.data → payload
  // So the network response must be { success: true, data: { role, tier, actions, grants } }
  await page.route(/\/api\/rbac\/my-permissions(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          role: rbac.role,
          tier: 'FREE',
          actions: rbac.actions,
          grants: [],
        },
      }),
    });
  });

  // Storages service does: unwrap(response.data) → data.data → parse storagesPageSchema
  // Match storages endpoint with or without query params (e.g. ?page=1&limit=50&sortOrder=ASC)
  await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_STORAGES_RESPONSE),
      });
    } else {
      await route.continue();
    }
  });

  // storageState already loaded in context — navigate directly (no sign-in needed)
  await page.goto('/storages');
  await page.waitForURL('**/storages', { timeout: 15_000 });
}

// ─── Role-based UI visibility ─────────────────────────────────────────────────

test.describe('Given a Viewer (STORAGE_READ only) on the Spaces page', () => {
  test.describe('When they view the space cards', () => {
    test('Then only the View action is shown — no Edit, Archive, or Delete', async ({
      preAuthPage: page,
    }) => {
      await setupAndNavigate(page, {
        role: 'viewer',
        actions: ['STORAGE_READ'],
      });

      const spacesPage = new SpacesPage(page);
      await spacesPage.waitForContent('E2E Active Warehouse');
      await spacesPage.openCardMenu('E2E Active Warehouse');

      await expect(spacesPage.viewButtons().first()).toBeVisible();
      await expect(spacesPage.editButtons()).not.toBeVisible();
      await expect(spacesPage.archiveButtons()).not.toBeVisible();
      await expect(spacesPage.deleteButtons()).not.toBeVisible();
    });

    test('Then the New space button is not shown', async ({ preAuthPage: page }) => {
      await setupAndNavigate(page, {
        role: 'viewer',
        actions: ['STORAGE_READ'],
      });

      const spacesPage = new SpacesPage(page);
      await spacesPage.waitForContent('E2E Active Warehouse');

      await expect(spacesPage.createButton).not.toBeVisible();
    });
  });
});

test.describe(
  'Given a Manager (STORAGE_READ + STORAGE_UPDATE + STORAGE_ARCHIVE + STORAGE_DELETE) on the Spaces page',
  () => {
    test.describe('When they view the active space card', () => {
      test('Then Edit and Archive actions are shown', async ({ preAuthPage: page }) => {
        await setupAndNavigate(page, {
          role: 'manager',
          actions: ['STORAGE_READ', 'STORAGE_UPDATE', 'STORAGE_ARCHIVE', 'STORAGE_DELETE'],
        });

        const spacesPage = new SpacesPage(page);
        await spacesPage.waitForContent('E2E Active Warehouse');
        await spacesPage.openCardMenu('E2E Active Warehouse');

        await expect(spacesPage.editButtons().first()).toBeVisible();
        await expect(spacesPage.archiveButtons().first()).toBeVisible();
      });
    });

    test.describe('When they view the archived space card', () => {
      test('Then Edit and Restore actions are shown', async ({ preAuthPage: page }) => {
        await setupAndNavigate(page, {
          role: 'manager',
          actions: ['STORAGE_READ', 'STORAGE_UPDATE', 'STORAGE_ARCHIVE', 'STORAGE_DELETE'],
        });

        const spacesPage = new SpacesPage(page);
        await spacesPage.waitForContent('E2E Archived Room');
        await spacesPage.openCardMenu('E2E Archived Room');

        await expect(spacesPage.editButtons().first()).toBeVisible();
        await expect(spacesPage.restoreButtons().first()).toBeVisible();
      });
    });
  },
);

test.describe('Given an Owner with full storage permissions on the Spaces page', () => {
  test.describe('When they view the page', () => {
    test('Then the New space button is visible', async ({ preAuthPage: page }) => {
      await setupAndNavigate(page, {
        role: 'owner',
        actions: ['STORAGE_READ', 'STORAGE_CREATE', 'STORAGE_UPDATE', 'STORAGE_ARCHIVE', 'STORAGE_DELETE'],
      });

      const spacesPage = new SpacesPage(page);
      await spacesPage.waitForContent('E2E Active Warehouse');

      await expect(spacesPage.createButton).toBeVisible();
    });

    test('Then Edit, Archive, and View are all shown for the active space', async ({
      preAuthPage: page,
    }) => {
      await setupAndNavigate(page, {
        role: 'owner',
        actions: ['STORAGE_READ', 'STORAGE_CREATE', 'STORAGE_UPDATE', 'STORAGE_ARCHIVE', 'STORAGE_DELETE'],
      });

      const spacesPage = new SpacesPage(page);
      await spacesPage.waitForContent('E2E Active Warehouse');
      await spacesPage.openCardMenu('E2E Active Warehouse');

      await expect(spacesPage.viewButtons().first()).toBeVisible();
      await expect(spacesPage.editButtons().first()).toBeVisible();
      await expect(spacesPage.archiveButtons().first()).toBeVisible();
    });
  });
});

// ─── API-level RBAC enforcement ───────────────────────────────────────────────

test.describe('Given a Viewer member calls DELETE /storages', () => {
  test.describe('When the request reaches the backend', () => {
    test('Then the API returns 403 Forbidden', async () => {
      // Load the viewer user pre-seeded by globalSetup — no runtime sign-up needed.
      const { viewerUser } = JSON.parse(readFileSync(USERS_FILE, 'utf-8')) as {
        viewerUser: { email: string; password: string };
      };

      // Sign in as viewer to obtain a fresh access token
      const { accessToken } = await apiSignIn(viewerUser.email, viewerUser.password);

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
    });
  });
});
