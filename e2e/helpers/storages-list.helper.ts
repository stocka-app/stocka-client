import type { Page } from '@playwright/test';

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

interface MockStoragesPageResponse {
  success: boolean;
  data: {
    items: MockStorage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
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

export function buildStoragesResponse(
  items: MockStorage[],
  page = 1,
  limit = 50,
): MockStoragesPageResponse {
  return {
    success: true,
    data: {
      items,
      total: items.length,
      page,
      limit,
      totalPages: Math.ceil(items.length / limit) || 1,
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
  return {
    success: true,
    data: {
      items: pageItems,
      total: allItems.length,
      page,
      limit,
      totalPages: Math.ceil(allItems.length / limit),
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
  actions: ['STORAGE_READ', 'STORAGE_CREATE', 'STORAGE_UPDATE', 'STORAGE_ARCHIVE', 'STORAGE_DELETE'],
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

    // Patch the JWT's tierLimits in the refresh-session response so
    // useCapabilities reads the mocked tier instead of the real one.
    // The frontend decodes JWTs without verifying the signature, so
    // re-encoding the modified payload is safe for E2E tests.
    await page.route(/\/api\/authentication\/refresh-session$/, async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      const token: string | undefined = json?.data?.accessToken;
      if (token) {
        const [header, payload, signature] = token.split('.');
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        decoded.tierLimits = {
          tier: capabilities.tier,
          maxCustomRooms: capabilities.maxCustomRooms,
          maxStoreRooms: capabilities.maxStoreRooms,
          maxWarehouses: capabilities.maxWarehouses,
        };
        const patched = btoa(JSON.stringify(decoded))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
        json.data.accessToken = [header, patched, signature].join('.');
      }
      await route.fulfill({ response, json });
    });
  }

  await page.goto('/storages');
  await page.waitForURL('**/storages', { timeout: 15_000 });
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
