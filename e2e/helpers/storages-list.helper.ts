import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const USERS_FILE = resolve(__dirname, '../.auth/users.json');

// ─── Types ───────────────────────────────────────────────────────────────────

export type StorageType = 'WAREHOUSE' | 'STORE_ROOM' | 'CUSTOM_ROOM';
export type StorageStatus = 'ACTIVE' | 'FROZEN' | 'ARCHIVED';

export interface MockStorage {
  uuid: string;
  name: string;
  type: StorageType;
  status: StorageStatus;
  address: string | null;
  roomType: string | null;
  icon: string;
  color: string;
  description: string | null;
  archivedAt: string | null;
  frozenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RbacPayload {
  role: string;
  tier?: string;
  actions: string[];
}

interface StatusSummary {
  active: number;
  frozen: number;
  archived: number;
}

interface TypeSummary {
  WAREHOUSE: StatusSummary;
  STORE_ROOM: StatusSummary;
  CUSTOM_ROOM: StatusSummary;
}

interface MockStoragesPageResponse {
  success: boolean;
  data: {
    items: MockStorage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: StatusSummary;
    typeSummary: TypeSummary;
  };
}

interface SetupOptions {
  rbac: RbacPayload;
  storagesResponse?: MockStoragesPageResponse;
  /** If true, storages API will return 500 */
  errorOnLoad?: boolean;
  /** Delay in ms before storages API responds (for loader tests) */
  delay?: number;
  /** Capabilities response override */
  capabilities?: { tier: string; maxCustomRooms: number; maxStoreRooms: number; maxWarehouses: number };
}

// ─── UUID helpers ────────────────────────────────────────────────────────────

let uuidCounter = 0;

function mockUuid(): string {
  uuidCounter += 1;
  const hex = uuidCounter.toString(16).padStart(12, '0');
  return `12345678-0000-4000-8000-${hex}`;
}

// ─── Mock storage factories ──────────────────────────────────────────────────

export function buildStorage(overrides: Partial<MockStorage> = {}): MockStorage {
  return {
    uuid: mockUuid(),
    name: `Storage ${uuidCounter}`,
    type: 'WAREHOUSE',
    status: 'ACTIVE',
    address: 'Calle Test 123',
    roomType: null,
    icon: 'warehouse',
    color: '#3B82F6',
    description: null,
    archivedAt: null,
    frozenAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function computeSummaries(items: MockStorage[]): { summary: StatusSummary; typeSummary: TypeSummary } {
  const empty = (): StatusSummary => ({ active: 0, frozen: 0, archived: 0 });
  const typeSummary: TypeSummary = { WAREHOUSE: empty(), STORE_ROOM: empty(), CUSTOM_ROOM: empty() };
  for (const item of items) {
    const key = item.status === 'ACTIVE' ? 'active' : item.status === 'FROZEN' ? 'frozen' : 'archived';
    typeSummary[item.type][key]++;
  }
  const summary: StatusSummary = {
    active: typeSummary.WAREHOUSE.active + typeSummary.STORE_ROOM.active + typeSummary.CUSTOM_ROOM.active,
    frozen: typeSummary.WAREHOUSE.frozen + typeSummary.STORE_ROOM.frozen + typeSummary.CUSTOM_ROOM.frozen,
    archived: typeSummary.WAREHOUSE.archived + typeSummary.STORE_ROOM.archived + typeSummary.CUSTOM_ROOM.archived,
  };
  return { summary, typeSummary };
}

export function buildStoragesResponse(
  items: MockStorage[],
  page = 1,
  limit = 50,
): MockStoragesPageResponse {
  const { summary, typeSummary } = computeSummaries(items);
  return {
    success: true,
    data: {
      items,
      total: items.length,
      page,
      limit,
      totalPages: Math.ceil(items.length / limit) || 1,
      summary,
      typeSummary,
    },
  };
}

export function buildPaginatedResponse(
  allItems: MockStorage[],
  page: number,
  limit = 50,
): MockStoragesPageResponse {
  const start = (page - 1) * limit;
  const pageItems = allItems.slice(start, start + limit);
  const { summary, typeSummary } = computeSummaries(allItems);
  return {
    success: true,
    data: {
      items: pageItems,
      total: allItems.length,
      page,
      limit,
      totalPages: Math.ceil(allItems.length / limit),
      summary,
      typeSummary,
    },
  };
}

// ─── Pre-built mock datasets ─────────────────────────────────────────────────

/** Standard mixed dataset: 1 of each type × each status = 9 storages */
export function buildMixedDataset(): MockStorage[] {
  const types: StorageType[] = ['WAREHOUSE', 'STORE_ROOM', 'CUSTOM_ROOM'];
  const statuses: StorageStatus[] = ['ACTIVE', 'FROZEN', 'ARCHIVED'];
  const names: Record<StorageType, Record<StorageStatus, string>> = {
    WAREHOUSE: { ACTIVE: 'Almacen Central', FROZEN: 'Almacen Norte', ARCHIVED: 'Almacen Sur' },
    STORE_ROOM: { ACTIVE: 'Bodega Principal', FROZEN: 'Bodega Refri', ARCHIVED: 'Bodega Vieja' },
    CUSTOM_ROOM: { ACTIVE: 'Area Exhibicion', FROZEN: 'Area Temporal', ARCHIVED: 'Area Obsoleta' },
  };
  const addresses: Record<StorageType, string | null> = {
    WAREHOUSE: 'Av. Industrial 500',
    STORE_ROOM: 'Calle Bodega 10',
    CUSTOM_ROOM: null,
  };

  return types.flatMap((type) =>
    statuses.map((status) =>
      buildStorage({
        name: names[type][status],
        type,
        status,
        address: addresses[type],
        archivedAt: status === 'ARCHIVED' ? '2026-03-01T00:00:00.000Z' : null,
      }),
    ),
  );
}

/** 55 storages for pagination tests */
export function buildLargeDataset(): MockStorage[] {
  return Array.from({ length: 55 }, (_, i) =>
    buildStorage({
      name: `Storage ${String(i + 1).padStart(3, '0')}`,
      type: i % 3 === 0 ? 'WAREHOUSE' : i % 3 === 1 ? 'STORE_ROOM' : 'CUSTOM_ROOM',
      status: i % 5 === 0 ? 'FROZEN' : i % 7 === 0 ? 'ARCHIVED' : 'ACTIVE',
    }),
  );
}

// ─── RBAC presets ────────────────────────────────────────────────────────────

export const RBAC_OWNER: RbacPayload = {
  role: 'owner',
  actions: [
    'STORAGE_READ',
    'STORAGE_CREATE',
    'STORAGE_UPDATE',
    'STORAGE_FREEZE',
    'STORAGE_UNFREEZE',
    'STORAGE_ARCHIVE',
    'STORAGE_DELETE',
  ],
};

export const RBAC_MANAGER: RbacPayload = {
  role: 'manager',
  actions: ['STORAGE_READ', 'STORAGE_UPDATE', 'STORAGE_ARCHIVE', 'STORAGE_DELETE'],
};

export const RBAC_WAREHOUSE_KEEPER: RbacPayload = {
  role: 'warehouse_keeper',
  actions: ['STORAGE_READ', 'STORAGE_UPDATE'],
};

export const RBAC_VIEWER: RbacPayload = {
  role: 'viewer',
  actions: ['STORAGE_READ'],
};

// ─── Setup and navigate ──────────────────────────────────────────────────────

/**
 * Set up all route mocks (RBAC + storages + capabilities) then navigate to /storages.
 * Must be called with a `preAuthPage` fixture so storageState is already loaded.
 */
export async function setupAndNavigate(page: Page, opts: SetupOptions): Promise<void> {
  const {
    rbac,
    storagesResponse,
    errorOnLoad = false,
    delay = 0,
    capabilities,
  } = opts;

  // ── RBAC localStorage pre-seed ──
  const rbacStorageValue = JSON.stringify({
    state: {
      role: rbac.role,
      tier: rbac.tier ?? 'FREE',
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

  // ── RBAC API mock ──
  await page.route(/\/api\/rbac\/my-permissions(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          role: rbac.role,
          tier: rbac.tier ?? 'FREE',
          actions: rbac.actions,
          grants: [],
        },
      }),
    });
  });

  // ── Refresh session mock ──
  // Always fabricate a JWT instantly — never proxy to the real backend.
  // route.fetch() inside a handler blocks all subsequent handlers until it
  // resolves, which causes the storages mock to hang → error state.
  // Use the real user ID from globalSetup so the app recognizes the session.
  // Read real user data from globalSetup for the fabricated JWT
  let userId = 'e2e-fallback-uuid';
  let userEmail = 'e2e@stocka.test';
  let tenantId: string | null = null;
  try {
    const users = JSON.parse(readFileSync(USERS_FILE, 'utf-8'));
    userId = users.verifiedUser?.userId ?? userId;
    userEmail = users.verifiedUser?.email ?? userEmail;
  } catch { /* users.json not available — use fallbacks */ }
  // Read tenantId from storageState localStorage (saved by globalSetup/fixture)
  try {
    const stateFile = resolve(__dirname, '../.auth/user.json');
    const state = JSON.parse(readFileSync(stateFile, 'utf-8'));
    const origins = state.origins ?? [];
    for (const origin of origins) {
      for (const item of origin.localStorage ?? []) {
        if (item.name === 'authentication-storage') {
          const parsed = JSON.parse(item.value);
          tenantId = parsed?.state?.user?.tenantId ?? null;
        }
      }
    }
  } catch { /* storageState not available */ }

  await page.route(/\/api\/authentication\/refresh-session$/, async (route) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: userId, email: userEmail,
      tenantId: tenantId ?? 'e2e-mock-tenant', role: rbac.role, displayName: 'E2E User',
      tierLimits: capabilities
        ? { tier: capabilities.tier, maxWarehouses: capabilities.maxWarehouses, maxStoreRooms: capabilities.maxStoreRooms, maxCustomRooms: capabilities.maxCustomRooms }
        : { tier: rbac.tier ?? 'FREE', maxWarehouses: 0, maxStoreRooms: 1, maxCustomRooms: 1 },
      iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7200,
    })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const fakeToken = `${header.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.${payload}.e2e-fake`;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { accessToken: fakeToken } }),
    });
  });

  // ── Storages API mock ──
  await page.route(/\/api\/storages(\?.*)?$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }

    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }

    if (errorOnLoad) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Internal Server Error' }),
      });
      return;
    }

    const url = new URL(route.request().url());
    const reqPage = Number(url.searchParams.get('page') ?? '1');

    // If a custom response is provided, use it directly
    if (storagesResponse) {
      // For paginated responses, serve the right page
      if (storagesResponse.data.totalPages > 1) {
        const allItems = storagesResponse.data.items;
        const limit = storagesResponse.data.limit;
        const start = (reqPage - 1) * limit;
        const pageItems = allItems.slice(start, start + limit);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              items: pageItems,
              total: allItems.length,
              page: reqPage,
              limit,
              totalPages: storagesResponse.data.totalPages,
              summary: storagesResponse.data.summary,
              typeSummary: storagesResponse.data.typeSummary,
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(storagesResponse),
        });
      }
      return;
    }

    // Default: empty
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildStoragesResponse([])),
    });
  });

  // ── Capabilities API mock ──
  if (capabilities) {
    await page.route(/\/api\/tenants\/me\/capabilities(\?.*)?$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: capabilities }),
      });
    });

  }

  await page.goto('/storages');
  await page.waitForURL('**/storages', { timeout: 15_000 });
  // networkidle ensures the auth refresh completes before tests interact.
  // Without it, the page is in a transient state and interactions fail.
  // The catch prevents hanging forever if a background request stays open.
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
}

// ─── Create POST mock ─────────────────────────────────────────────────────────

type CreatePostType = 'warehouse' | 'store-room' | 'custom-room';

interface MockCreatePostOptions {
  /** HTTP status code to return. Defaults to 201. */
  status?: number;
  /** Response body. Defaults to the success envelope with a mock UUID. */
  body?: object;
  /** Artificial delay in milliseconds before the response is sent. */
  delay?: number;
  /**
   * Error code string to embed in the response body.
   * When provided, the body becomes `{ error: errorCode }`.
   */
  errorCode?: string;
}

/**
 * Registers a page.route() mock for one of the three create POST endpoints.
 * Must be called BEFORE navigating to /storages (i.e. before setupAndNavigate).
 */
export async function mockCreatePost(
  page: Page,
  type: CreatePostType,
  opts: MockCreatePostOptions = {},
): Promise<void> {
  const {
    status = 201,
    delay = 0,
    errorCode,
  } = opts;

  const defaultBody = { success: true, data: { storageUUID: 'mock-created-uuid' } };
  const body = opts.body ?? (errorCode ? { error: errorCode } : defaultBody);

  // Map the logical type name to the actual plural REST path segment
  const pathSegmentMap: Record<CreatePostType, string> = {
    warehouse: 'warehouses',
    'store-room': 'store-rooms',
    'custom-room': 'custom-rooms',
  };
  const urlSuffix = `/api/storages/${pathSegmentMap[type]}`;

  await page.route(
    (url) => url.pathname === urlSuffix,
    async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }

      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    },
  );
}

// ─── Edit PATCH mock ─────────────────────────────────────────────────────────

type EditPatchType = 'warehouses' | 'store-rooms' | 'custom-rooms';

interface MockEditPatchOptions {
  status?: number;
  errorCode?: string;
  delay?: number;
}

/**
 * Registers a page.route() mock for one of the three PATCH update endpoints.
 * Must be called BEFORE navigating to /storages.
 */
export async function mockEditPatch(
  page: Page,
  type: EditPatchType,
  uuid: string,
  opts: MockEditPatchOptions = {},
): Promise<void> {
  const { status = 200, delay = 0, errorCode } = opts;
  const urlSuffix = `/api/storages/${type}/${uuid}`;

  const body = errorCode
    ? { error: errorCode, message: errorCode }
    : { success: true, data: { storageUUID: uuid } };

  await page.route(
    (url) => url.pathname === urlSuffix,
    async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.continue();
        return;
      }
      if (delay > 0) {
        await new Promise((r) => setTimeout(r, delay));
      }
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    },
  );
}

// ─── Change type PATCH mock ─────────────────────────────────────────────────

interface MockChangeTypeOptions {
  status?: number;
  errorCode?: string;
}

/**
 * Registers a page.route() mock for PATCH /api/storages/:uuid/type.
 * Must be called BEFORE navigating to /storages.
 */
export async function mockChangeTypePatch(
  page: Page,
  uuid: string,
  opts: MockChangeTypeOptions = {},
): Promise<void> {
  const { status = 200, errorCode } = opts;
  const urlSuffix = `/api/storages/${uuid}/type`;

  const body = errorCode
    ? { error: errorCode, message: errorCode }
    : { success: true, data: { storageUUID: uuid } };

  await page.route(
    (url) => url.pathname === urlSuffix,
    async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    },
  );
}
