import { test, expect } from '../../fixtures/auth.fixture';
import { OrganizationSettingsPage } from '../../pages/organization-settings.page';
import {
  setupAndNavigateToOrg,
  OWNER_RBAC,
  VIEWER_RBAC,
  MOCK_PROFILE,
  MOCK_PROFILE_SUSPENDED,
  MOCK_QUOTAS,
  MOCK_AUDIT_ENTRIES,
} from '../../helpers/organization.helper';

// ═════════════════════════════════════════════════════════════════════════════
// Section 1: Initial render
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the organization owner opens the Organization settings', () => {
  test.describe('When the profile loads successfully', () => {
    test('Then the page heading "Organization" is visible', async ({ preAuthPage: page }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: OWNER_RBAC, profile: MOCK_PROFILE });
      await orgPage.waitForProfile();

      await expect(orgPage.heading).toBeVisible();
    });

    test('Then the Profile tab is active by default', async ({ preAuthPage: page }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: OWNER_RBAC, profile: MOCK_PROFILE });
      await orgPage.waitForProfile();

      await expect(orgPage.tabProfile).toBeVisible();
      // Profile tab is active — org name is shown in the profile card
      await expect(page.getByText(MOCK_PROFILE.name)).toBeVisible();
    });

    test('Then the three tabs (Profile, Limits, Audit Log) are visible', async ({
      preAuthPage: page,
    }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: OWNER_RBAC, profile: MOCK_PROFILE });
      await orgPage.waitForProfile();

      await expect(orgPage.tabProfile).toBeVisible();
      await expect(orgPage.tabLimits).toBeVisible();
      await expect(orgPage.tabAudit).toBeVisible();
    });

    test('Then the organization name is displayed in the profile card', async ({
      preAuthPage: page,
    }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: OWNER_RBAC, profile: MOCK_PROFILE });
      await orgPage.waitForProfile();

      await expect(page.getByText(MOCK_PROFILE.name)).toBeVisible();
    });

    test('Then the Edit button is visible for owners (TENANT_SETTINGS_UPDATE)', async ({
      preAuthPage: page,
    }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: OWNER_RBAC, profile: MOCK_PROFILE });
      await orgPage.waitForProfile();

      await expect(orgPage.editButton).toBeVisible();
    });

    test('Then the Danger zone section is visible for owners', async ({
      preAuthPage: page,
    }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: OWNER_RBAC, profile: MOCK_PROFILE });
      await orgPage.waitForProfile();

      await expect(orgPage.dangerZoneTitle).toBeVisible();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 2: Profile visibility for viewer role
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given a viewer opens the Organization settings', () => {
  test.describe('When the profile loads successfully', () => {
    test('Then the Edit button is NOT visible (no TENANT_SETTINGS_UPDATE permission)', async ({
      preAuthPage: page,
    }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: VIEWER_RBAC, profile: MOCK_PROFILE });
      await orgPage.waitForProfile();

      await expect(orgPage.editButton).not.toBeVisible();
    });

    test('Then the Danger zone section is NOT visible', async ({ preAuthPage: page }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: VIEWER_RBAC, profile: MOCK_PROFILE });
      await orgPage.waitForProfile();

      await expect(orgPage.dangerZoneTitle).not.toBeVisible();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 3: Tab navigation
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the user is on the Organization settings Profile tab', () => {
  test.describe('When the user clicks the Limits tab', () => {
    test('Then the Quotas and limits section is shown', async ({ preAuthPage: page }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: OWNER_RBAC, profile: MOCK_PROFILE, quotas: MOCK_QUOTAS });
      await orgPage.waitForProfile();

      await orgPage.clickLimits();

      await expect(orgPage.quotasTitle).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('When the owner clicks the Audit Log tab', () => {
    test('Then the audit log table is shown (owner has REPORT_ADVANCED)', async ({
      preAuthPage: page,
    }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, {
        rbac: OWNER_RBAC,
        profile: MOCK_PROFILE,
        auditEntries: MOCK_AUDIT_ENTRIES,
      });
      await orgPage.waitForProfile();

      await orgPage.clickAudit();

      await expect(orgPage.auditTable).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('When the viewer clicks the Audit Log tab', () => {
    test('Then the no-permission message is shown (viewer lacks REPORT_ADVANCED)', async ({
      preAuthPage: page,
    }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: VIEWER_RBAC, profile: MOCK_PROFILE });
      await orgPage.waitForProfile();

      await orgPage.clickAudit();

      await expect(orgPage.auditNoPermission).toBeVisible({ timeout: 10_000 });
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 4: Edit mode
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the owner is on the Organization Profile tab', () => {
  test.describe('When the owner clicks the Edit button', () => {
    test('Then the edit form is shown with the name input', async ({ preAuthPage: page }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: OWNER_RBAC, profile: MOCK_PROFILE });
      await orgPage.waitForProfile();

      await orgPage.editButton.click();

      await expect(orgPage.nameInput).toBeVisible();
    });

    test('Then the Save changes and Cancel buttons are visible', async ({ preAuthPage: page }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: OWNER_RBAC, profile: MOCK_PROFILE });
      await orgPage.waitForProfile();

      await orgPage.editButton.click();

      await expect(orgPage.saveButton).toBeVisible();
      await expect(orgPage.cancelButton).toBeVisible();
    });

    test('Then the name input is pre-filled with the current business name', async ({
      preAuthPage: page,
    }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: OWNER_RBAC, profile: MOCK_PROFILE });
      await orgPage.waitForProfile();

      await orgPage.editButton.click();

      await expect(orgPage.nameInput).toHaveValue(MOCK_PROFILE.name);
    });
  });

  test.describe('When the owner opens the edit form and clicks Cancel', () => {
    test('Then the profile card is shown again (edit form is closed)', async ({
      preAuthPage: page,
    }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: OWNER_RBAC, profile: MOCK_PROFILE });
      await orgPage.waitForProfile();

      await orgPage.editButton.click();
      await expect(orgPage.nameInput).toBeVisible();

      await orgPage.cancelButton.click();

      await expect(orgPage.nameInput).not.toBeVisible();
      await expect(page.getByText(MOCK_PROFILE.name)).toBeVisible();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 5: Edit form submit
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the owner has opened the edit form', () => {
  test.describe('When the owner changes the business name and submits', () => {
    test('Then the PATCH request is sent and the profile card is shown again', async ({
      preAuthPage: page,
    }) => {
      const updatedProfile = { ...MOCK_PROFILE, name: 'Nueva Ferreteria' };

      // Override PATCH to return the updated profile
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

      let patchCalled = false;
      await page.route(/\/api\/tenants\/me\/profile$/, async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: MOCK_PROFILE }),
          });
        } else if (route.request().method() === 'PATCH') {
          patchCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: updatedProfile }),
          });
        } else {
          await route.continue();
        }
      });

      await page.route(/\/api\/tenants\/me\/quotas(\?.*)?$/, async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: MOCK_QUOTAS }) });
      });
      await page.route(/\/api\/tenants\/me\/audit-log(\?.*)?$/, async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
      });
      await page.route(/\/api\/tenants\/check-name(\?.*)?$/, async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { available: true } }) });
      });

      await page.goto('/settings/organization');
      await page.waitForURL('**/settings/organization', { timeout: 15_000 });

      const orgPage = new OrganizationSettingsPage(page);
      await orgPage.waitForProfile();

      await orgPage.editButton.click();
      await orgPage.nameInput.fill('Nueva Ferreteria');
      await orgPage.saveButton.click();

      // After save, form should close and PATCH should have been called
      await expect(orgPage.nameInput).not.toBeVisible({ timeout: 10_000 });
      expect(patchCalled).toBe(true);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 6: Loading state
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the organization profile is being fetched', () => {
  test.describe('When the API response is delayed', () => {
    test('Then the loading text is shown while waiting', async ({ preAuthPage: page }) => {
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

      // Hold the profile request to keep loading state visible
      let resolveRoute: (() => void) | null = null;
      const routeReady = new Promise<void>((r) => {
        resolveRoute = r;
      });

      await page.route(/\/api\/tenants\/me\/profile$/, async (route) => {
        resolveRoute?.();
        // Keep request pending to maintain loading state
        await new Promise((r) => setTimeout(r, 5_000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: MOCK_PROFILE }),
        });
      });

      await page.goto('/settings/organization');
      await routeReady;

      const orgPage = new OrganizationSettingsPage(page);
      await expect(orgPage.loadingText).toBeVisible({ timeout: 5_000 });
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 7: Error state
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the organization profile API returns an error', () => {
  test.describe('When the page loads', () => {
    test('Then an error message is displayed', async ({ preAuthPage: page }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, { rbac: OWNER_RBAC, profileError: true });

      // Error text from i18n key errors.fetchProfileFailed
      await expect(
        page.getByText('Could not load the organization profile.'),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Section 8: Suspended organization banner
// ═════════════════════════════════════════════════════════════════════════════

test.describe('Given the organization has status SUSPENDED', () => {
  test.describe('When the profile tab is active', () => {
    test('Then the suspended status banner is shown', async ({ preAuthPage: page }) => {
      const orgPage = new OrganizationSettingsPage(page);
      await setupAndNavigateToOrg(page, {
        rbac: OWNER_RBAC,
        profile: MOCK_PROFILE_SUSPENDED,
      });
      await orgPage.waitForProfile();

      await expect(orgPage.suspendedBanner).toBeVisible();
      await expect(
        page.getByText('Your organization is suspended. Some features are limited.'),
      ).toBeVisible();
    });
  });
});
