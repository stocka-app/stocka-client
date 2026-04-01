import type { Page } from '@playwright/test';

// ─── RBAC presets ─────────────────────────────────────────────────────────────

export interface RbacPayload {
  role: string;
  tier: string;
  actions: string[];
  grants: string[];
}

export const OWNER_RBAC: RbacPayload = {
  role: 'OWNER',
  tier: 'STARTER',
  actions: [
    'REPORT_ADVANCED',
    'TENANT_SETTINGS_UPDATE',
    'TENANT_SETTINGS_READ',
    'MEMBER_INVITE',
    'STORAGE_READ',
  ],
  grants: [],
};

export const VIEWER_RBAC: RbacPayload = {
  role: 'VIEWER',
  tier: 'STARTER',
  actions: ['STORAGE_READ', 'TENANT_SETTINGS_READ'],
  grants: [],
};

// ─── Mock data ─────────────────────────────────────────────────────────────────

export const MOCK_PROFILE = {
  id: 'tenant-uuid-001',
  name: 'Ferreteria Central',
  slug: 'ferreteria-central',
  businessType: 'RETAIL',
  rfc: 'FCE123456789',
  logoUrl: null,
  status: 'ACTIVE',
  tier: 'STARTER',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const MOCK_PROFILE_SUSPENDED = {
  ...MOCK_PROFILE,
  status: 'SUSPENDED',
};

/** Quotas shape matches the Zod schema: { warehouses, members, products } each with { used, max } */
export const MOCK_QUOTAS = {
  warehouses: { used: 1, max: 3 },
  members: { used: 2, max: 5 },
  products: { used: 45, max: 1000 },
};

export const MOCK_AUDIT_ENTRIES = [
  {
    id: 'audit-001',
    timestamp: '2026-03-01T12:00:00.000Z',
    actorId: 'user-001',
    actorName: 'Roberto Medina',
    action: 'PROFILE_UPDATED',
    details: 'Updated business name',
  },
];

// ─── Setup options ─────────────────────────────────────────────────────────────

export interface SetupOptions {
  rbac?: RbacPayload;
  profile?: typeof MOCK_PROFILE;
  profileError?: boolean;
  auditEntries?: unknown[];
  quotas?: typeof MOCK_QUOTAS;
}

// ─── Setup and navigate ────────────────────────────────────────────────────────

/**
 * Pre-seeds RBAC localStorage, mocks all org-related API routes,
 * then navigates to /settings/organization.
 * Must be called with a `preAuthPage` fixture so storageState is already loaded.
 */
export async function setupAndNavigateToOrg(page: Page, opts: SetupOptions = {}): Promise<void> {
  const {
    rbac = OWNER_RBAC,
    profile = MOCK_PROFILE,
    profileError = false,
    auditEntries = [],
    quotas = MOCK_QUOTAS,
  } = opts;

  // ── RBAC localStorage pre-seed ──
  await page.addInitScript((value: string) => {
    localStorage.setItem('rbac-storage', value);
  }, JSON.stringify({
    state: {
      role: rbac.role,
      tier: rbac.tier,
      tenantStatus: 'ACTIVE',
      permissions: rbac.actions,
      grants: rbac.grants,
      loaded: true,
    },
    version: 0,
  }));

  // ── RBAC API mock ──
  await page.route(/\/api\/rbac\/my-permissions(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          role: rbac.role,
          tier: rbac.tier,
          actions: rbac.actions,
          grants: rbac.grants,
        },
      }),
    });
  });

  // ── Profile API mock (GET + PATCH) ──
  await page.route(/\/api\/tenants\/me\/profile$/, async (route) => {
    if (route.request().method() === 'GET') {
      if (profileError) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Internal Server Error' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: profile }),
        });
      }
    } else if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: profile }),
      });
    } else {
      await route.continue();
    }
  });

  // ── Audit log API mock ──
  await page.route(/\/api\/tenants\/me\/audit-log(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: auditEntries }),
    });
  });

  // ── Quotas API mock ──
  await page.route(/\/api\/tenants\/me\/quotas(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: quotas }),
    });
  });

  // ── Name availability check mock ──
  await page.route(/\/api\/tenants\/check-name(\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { available: true } }),
    });
  });

  await page.goto('/settings/organization');
  await page.waitForURL('**/settings/organization', { timeout: 15_000 });
}
