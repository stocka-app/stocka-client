import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Organization Settings page (/settings/organization).
 * Labels use EN locale values (tests run with locale: 'en-US').
 */
export class OrganizationSettingsPage {
  readonly page: Page;

  // ── Page heading ─────────────────────────────────────────────────────────
  readonly heading: Locator;

  // ── Tabs (rendered as <button> elements, not role="tab") ─────────────────
  readonly tabProfile: Locator;
  readonly tabLimits: Locator;
  readonly tabAudit: Locator;

  // ── Profile card ──────────────────────────────────────────────────────────
  readonly editButton: Locator;

  // ── Edit form ─────────────────────────────────────────────────────────────
  readonly nameInput: Locator;
  readonly businessTypeSelect: Locator;
  readonly rfcInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  // ── Audit tab ─────────────────────────────────────────────────────────────
  readonly auditNoPermission: Locator;
  readonly auditTable: Locator;

  // ── Limits tab ────────────────────────────────────────────────────────────
  readonly quotasTitle: Locator;

  // ── Danger zone ───────────────────────────────────────────────────────────
  readonly dangerZoneTitle: Locator;

  // ── Status banner ─────────────────────────────────────────────────────────
  readonly suspendedBanner: Locator;

  // ── Loading / Error states ────────────────────────────────────────────────
  readonly loadingText: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Heading
    this.heading = page.getByRole('heading', { name: 'Organization' });

    // Tabs — the org page renders plain <button> elements (not role="tab")
    this.tabProfile = page.getByRole('button', { name: 'Profile' });
    this.tabLimits = page.getByRole('button', { name: 'Limits' });
    this.tabAudit = page.getByRole('button', { name: 'Audit Log' });

    // Profile card actions
    this.editButton = page.getByRole('button', { name: 'Edit' });

    // Edit form fields
    this.nameInput = page.locator('#org-name');
    this.businessTypeSelect = page.locator('#org-business-type');
    this.rfcInput = page.locator('#org-rfc');
    this.saveButton = page.getByRole('button', { name: 'Save changes' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });

    // Audit tab content
    this.auditNoPermission = page.getByText('You do not have permission to view the audit log.');
    this.auditTable = page.locator('table');

    // Limits tab content
    this.quotasTitle = page.getByText('Quotas and limits');

    // Danger zone
    this.dangerZoneTitle = page.getByText('Danger zone');

    // Status banner (role="alert" from TenantStatusBanner)
    this.suspendedBanner = page.getByRole('alert');

    // Loading state text (shared between profile and audit loading)
    this.loadingText = page.getByText('Loading...');

    // Error state — red-bordered error box
    this.errorMessage = page.locator('.text-red-700, .text-red-400').first();
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/settings/organization');
    await this.page.waitForURL('**/settings/organization', { timeout: 15_000 });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Wait for the profile data to be visible (org name rendered in the profile card heading) */
  async waitForProfile(): Promise<void> {
    await this.page.getByRole('heading', { level: 2 }).waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Click the Profile tab */
  async clickProfile(): Promise<void> {
    await this.tabProfile.click();
  }

  /** Click the Limits tab */
  async clickLimits(): Promise<void> {
    await this.tabLimits.click();
  }

  /** Click the Audit Log tab */
  async clickAudit(): Promise<void> {
    await this.tabAudit.click();
  }
}
