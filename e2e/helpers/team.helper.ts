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
    'MEMBER_INVITE',
    'MEMBER_READ',
    'MEMBER_UPDATE_ROLE',
    'MEMBER_REMOVE',
    'TENANT_SETTINGS_UPDATE',
    'TENANT_SETTINGS_READ',
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

// ─── Mock data factories ───────────────────────────────────────────────────────

let memberIdCounter = 0;

export interface MockMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED';
  joinedAt: string;
}

export interface MockInvitation {
  id: string;
  email: string;
  role: string;
  sentAt: string;
  expiresAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
}

export function buildMember(overrides: Partial<MockMember> = {}): MockMember {
  memberIdCounter += 1;
  return {
    id: `00000000-0000-4000-8000-${String(memberIdCounter).padStart(12, '0')}`,
    userId: `00000000-0000-4001-8000-${String(memberIdCounter).padStart(12, '0')}`,
    name: `Member ${memberIdCounter}`,
    email: `member${memberIdCounter}@example.com`,
    role: 'MANAGER',
    status: 'ACTIVE',
    joinedAt: '2026-01-15T10:00:00.000Z',
    ...overrides,
  };
}

export function buildInvitation(overrides: Partial<MockInvitation> = {}): MockInvitation {
  memberIdCounter += 1;
  return {
    id: `00000000-0000-4002-8000-${String(memberIdCounter).padStart(12, '0')}`,
    email: `invited${memberIdCounter}@example.com`,
    role: 'VIEWER',
    sentAt: '2026-03-28T12:00:00.000Z',
    expiresAt: '2026-04-04T12:00:00.000Z',
    status: 'PENDING',
    ...overrides,
  };
}

// ─── Pre-built mock datasets ───────────────────────────────────────────────────

export const MOCK_OWNER_MEMBER: MockMember = {
  id: '00000000-0000-4000-8000-000000000010',
  userId: '00000000-0000-4001-8000-000000000010',
  name: 'Roberto Medina',
  email: 'roberto@example.com',
  role: 'OWNER',
  status: 'ACTIVE',
  joinedAt: '2026-01-01T00:00:00.000Z',
};

export const MOCK_MANAGER_MEMBER: MockMember = buildMember({
  id: '00000000-0000-4000-8000-000000000020',
  name: 'Ana Garcia',
  email: 'ana@example.com',
  role: 'MANAGER',
});

export const MOCK_VIEWER_MEMBER: MockMember = buildMember({
  id: '00000000-0000-4000-8000-000000000030',
  name: 'Carlos Lopez',
  email: 'carlos@example.com',
  role: 'VIEWER',
});

export const MOCK_PENDING_INVITATION: MockInvitation = buildInvitation({
  id: '00000000-0000-4002-8000-000000000010',
  email: 'newmember@example.com',
  role: 'VIEWER',
  status: 'PENDING',
});

// ─── Setup options ─────────────────────────────────────────────────────────────

export interface SetupOptions {
  rbac?: RbacPayload;
  members?: MockMember[];
  invitations?: MockInvitation[];
  inviteError?: boolean;
}

// ─── Setup and navigate ────────────────────────────────────────────────────────

/**
 * Pre-seeds RBAC localStorage, mocks all team-related API routes,
 * then navigates to /settings/team.
 * Must be called with a `preAuthPage` fixture so storageState is already loaded.
 */
export async function setupAndNavigateToTeam(page: Page, opts: SetupOptions = {}): Promise<void> {
  const {
    rbac = OWNER_RBAC,
    members = [],
    invitations = [],
    inviteError = false,
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

  // ── Members API mock ──
  await page.route(/\/api\/tenants\/me\/members(\?.*)?$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: members }),
      });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: null }),
      });
    } else {
      await route.continue();
    }
  });

  // ── Member role change mock (PATCH /api/tenants/me/members/:id/role) ──
  await page.route(/\/api\/tenants\/me\/members\/[^/]+\/role$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: members[0] ?? null }),
    });
  });

  // ── Invitations API mock ──
  await page.route(/\/api\/tenants\/me\/invitations(\?.*)?$/, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: invitations }),
      });
    } else if (route.request().method() === 'POST') {
      if (inviteError) {
        await route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, error: 'Invitation error' }),
        });
      } else {
        const newInvitation = buildInvitation({ email: 'new@example.com', role: 'VIEWER' });
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: newInvitation }),
        });
      }
    } else {
      await route.continue();
    }
  });

  await page.goto('/settings/team');
  await page.waitForURL('**/settings/team', { timeout: 15_000 });
}
