import { test, expect } from '../../fixtures/auth.fixture';
import { TeamSettingsPage } from '../../pages/team-settings.page';
import {
  setupAndNavigateToTeam,
  OWNER_RBAC,
  VIEWER_RBAC,
  MOCK_OWNER_MEMBER,
  MOCK_MANAGER_MEMBER,
  MOCK_VIEWER_MEMBER,
  MOCK_PENDING_INVITATION,
  buildMember,
  buildInvitation,
} from '../../helpers/team.helper';

// ═════════════════════════════════════════════════════════════════════════════
// Section 1: Initial render
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the organization owner opens the Team settings', () => {
  test.describe('When the page loads', () => {
    test('Then the heading "Team" is visible', async ({ preAuthPage: page }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC });
      await teamPage.waitForMembersTab();

      await expect(teamPage.heading).toBeVisible();
    });

    test('Then the Members tab is active by default', async ({ preAuthPage: page }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC });
      await teamPage.waitForMembersTab();

      await expect(teamPage.tabMembers).toHaveAttribute('aria-selected', 'true');
    });

    test('Then the three tabs (Members, Invitations, Roles) are visible', async ({
      preAuthPage: page,
    }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC });
      await teamPage.waitForMembersTab();

      await expect(teamPage.tabMembers).toBeVisible();
      await expect(teamPage.tabInvitations).toBeVisible();
      await expect(teamPage.tabRoles).toBeVisible();
    });

    test('Then the Invite member button is visible for owners', async ({ preAuthPage: page }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC });
      await teamPage.waitForMembersTab();

      await expect(teamPage.inviteButton).toBeVisible();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 2: Empty members list
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the tenant has no team members', () => {
  test.describe('When the owner is on the Members tab', () => {
    test('Then the empty state message "No team members yet." is shown', async ({
      preAuthPage: page,
    }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC, members: [] });
      await teamPage.waitForMembersTab();

      await expect(teamPage.membersEmptyText).toBeVisible();
    });

    test('Then no members table is rendered', async ({ preAuthPage: page }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC, members: [] });
      await teamPage.waitForMembersTab();

      await expect(teamPage.membersTable).not.toBeVisible();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 3: Members list with data
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the tenant has multiple team members', () => {
  const MEMBERS = [MOCK_OWNER_MEMBER, MOCK_MANAGER_MEMBER, MOCK_VIEWER_MEMBER];

  test.describe('When the Members tab is active', () => {
    test('Then all member names are visible in the table', async ({ preAuthPage: page }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC, members: MEMBERS });
      await teamPage.waitForMembersTab();

      await expect(teamPage.membersTable).toBeVisible();
      await expect(page.getByText(MOCK_OWNER_MEMBER.name)).toBeVisible();
      await expect(page.getByText(MOCK_MANAGER_MEMBER.name)).toBeVisible();
      await expect(page.getByText(MOCK_VIEWER_MEMBER.name)).toBeVisible();
    });

    test('Then all member emails are visible in the table', async ({ preAuthPage: page }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC, members: MEMBERS });
      await teamPage.waitForMembersTab();

      await expect(page.getByText(MOCK_OWNER_MEMBER.email)).toBeVisible();
      await expect(page.getByText(MOCK_MANAGER_MEMBER.email)).toBeVisible();
      await expect(page.getByText(MOCK_VIEWER_MEMBER.email)).toBeVisible();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 4: Invitations tab
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user is on the Team settings Members tab', () => {
  test.describe('When the user clicks the Invitations tab', () => {
    test('Then the Invitations tab panel is shown', async ({ preAuthPage: page }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC });
      await teamPage.waitForMembersTab();

      await teamPage.clickInvitations();

      await expect(teamPage.tabInvitations).toHaveAttribute('aria-selected', 'true');
    });

    test('Then the empty invitations message is shown when there are no invitations', async ({
      preAuthPage: page,
    }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC, invitations: [] });
      await teamPage.waitForMembersTab();

      await teamPage.clickInvitations();

      await expect(teamPage.invitationsEmptyText).toBeVisible({ timeout: 10_000 });
    });

    test('Then existing invitations are shown in the table', async ({ preAuthPage: page }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, {
        rbac: OWNER_RBAC,
        invitations: [MOCK_PENDING_INVITATION],
      });
      await teamPage.waitForMembersTab();

      await teamPage.clickInvitations();

      await expect(teamPage.invitationsTable).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(MOCK_PENDING_INVITATION.email)).toBeVisible();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 5: Roles tab
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user is on the Team settings Members tab', () => {
  test.describe('When the user clicks the Roles tab', () => {
    test('Then the Roles tab panel is shown with role reference cards', async ({
      preAuthPage: page,
    }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC });
      await teamPage.waitForMembersTab();

      await teamPage.clickRoles();

      await expect(teamPage.rolesContent).toBeVisible({ timeout: 10_000 });
      // At least the Owner role card is visible
      await expect(page.getByText('Owner').first()).toBeVisible();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 6: Invite modal — open and close
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the owner is on the Team settings Members tab', () => {
  test.describe('When the owner clicks the Invite member button', () => {
    test('Then the invite modal is shown with email and role fields', async ({
      preAuthPage: page,
    }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC });
      await teamPage.waitForMembersTab();

      await teamPage.inviteButton.click();

      await expect(teamPage.inviteModal).toBeVisible();
      await expect(teamPage.emailInput).toBeVisible();
      await expect(teamPage.roleSelect).toBeVisible();
    });

    test('Then closing the modal with Cancel hides it', async ({ preAuthPage: page }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC });
      await teamPage.waitForMembersTab();

      await teamPage.inviteButton.click();
      await expect(teamPage.inviteModal).toBeVisible();

      await teamPage.cancelButton.click();

      await expect(teamPage.inviteModal).not.toBeVisible();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 7: Send invitation
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the owner has opened the Invite member modal', () => {
  test.describe('When the owner fills in an email and role and submits', () => {
    test('Then the POST /api/tenants/me/invitations request is sent', async ({
      preAuthPage: page,
    }) => {
      let postCalled = false;

      await page.addInitScript((value: string) => {
        localStorage.setItem('rbac-storage', value);
      }, JSON.stringify({
        state: {
          role: OWNER_RBAC.role,
          tier: OWNER_RBAC.tier,
          tenantStatus: 'ACTIVE',
          permissions: OWNER_RBAC.actions,
          grants: OWNER_RBAC.grants,
          loaded: true,
        },
        version: 0,
      }));

      await page.route(/\/api\/rbac\/my-permissions(\?.*)?$/, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { role: OWNER_RBAC.role, tier: OWNER_RBAC.tier, actions: OWNER_RBAC.actions, grants: OWNER_RBAC.grants } }),
        });
      });

      await page.route(/\/api\/tenants\/me\/members(\?.*)?$/, async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
      });

      await page.route(/\/api\/tenants\/me\/invitations(\?.*)?$/, async (route) => {
        if (route.request().method() === 'POST') {
          postCalled = true;
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: buildInvitation({ email: 'test@test.com', role: 'VIEWER' }) }),
          });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
        }
      });

      await page.goto('/settings/team');
      await page.waitForURL('**/settings/team', { timeout: 15_000 });

      const teamPage = new TeamSettingsPage(page);
      await teamPage.waitForMembersTab();

      await teamPage.inviteButton.click();
      await teamPage.emailInput.fill('test@test.com');
      await teamPage.roleSelect.selectOption('VIEWER');
      await teamPage.submitButton.click();

      // Wait for modal to close after successful submission
      await expect(teamPage.inviteModal).not.toBeVisible({ timeout: 10_000 });
      expect(postCalled).toBe(true);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 8: RBAC — Invite button hidden for viewer
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given a viewer opens the Team settings', () => {
  test.describe('When the Members tab is active', () => {
    test('Then the Invite member button is NOT visible (no MEMBER_INVITE permission)', async ({
      preAuthPage: page,
    }) => {
      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: VIEWER_RBAC });
      await teamPage.waitForMembersTab();

      await expect(teamPage.inviteButton).not.toBeVisible();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 9: Multiple invitations display
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given there are multiple pending invitations', () => {
  test.describe('When the owner is on the Invitations tab', () => {
    test('Then all invitation emails are visible in the table', async ({ preAuthPage: page }) => {
      const invitations = [
        buildInvitation({ email: 'first@example.com', status: 'PENDING' }),
        buildInvitation({ email: 'second@example.com', status: 'PENDING' }),
        buildInvitation({ email: 'third@example.com', status: 'EXPIRED' }),
      ];

      const teamPage = new TeamSettingsPage(page);
      await setupAndNavigateToTeam(page, { rbac: OWNER_RBAC, invitations });
      await teamPage.waitForMembersTab();

      await teamPage.clickInvitations();

      await expect(teamPage.invitationsTable).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText('first@example.com')).toBeVisible();
      await expect(page.getByText('second@example.com')).toBeVisible();
      await expect(page.getByText('third@example.com')).toBeVisible();
    });
  });
});
