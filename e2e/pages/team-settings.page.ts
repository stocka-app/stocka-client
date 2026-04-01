import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Team Settings page (/settings/team).
 * Labels use EN locale values (tests run with locale: 'en-US').
 */
export class TeamSettingsPage {
  readonly page: Page;

  // ── Page heading ─────────────────────────────────────────────────────────
  readonly heading: Locator;

  // ── Tabs (rendered with role="tab") ──────────────────────────────────────
  readonly tabMembers: Locator;
  readonly tabInvitations: Locator;
  readonly tabRoles: Locator;

  // ── Members tab ───────────────────────────────────────────────────────────
  readonly inviteButton: Locator;
  readonly membersEmptyText: Locator;
  readonly membersTable: Locator;

  // ── Invitations tab ───────────────────────────────────────────────────────
  readonly invitationsEmptyText: Locator;
  readonly invitationsTable: Locator;

  // ── Roles tab ─────────────────────────────────────────────────────────────
  readonly rolesContent: Locator;

  // ── Invite modal ──────────────────────────────────────────────────────────
  readonly inviteModal: Locator;
  readonly emailInput: Locator;
  readonly roleSelect: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Heading
    this.heading = page.getByRole('heading', { name: 'Team' });

    // Tabs — the team page renders <button role="tab"> elements
    this.tabMembers = page.getByRole('tab', { name: 'Members' });
    this.tabInvitations = page.getByRole('tab', { name: 'Invitations' });
    this.tabRoles = page.getByRole('tab', { name: 'Roles' });

    // Members tab
    this.inviteButton = page.getByRole('button', { name: 'Invite member' });
    this.membersEmptyText = page.getByText('No team members yet.');
    this.membersTable = page.locator('#tabpanel-members table');

    // Invitations tab
    this.invitationsEmptyText = page.getByText('No pending invitations.');
    this.invitationsTable = page.locator('#tabpanel-invitations table');

    // Roles tab
    this.rolesContent = page.locator('#tabpanel-roles');

    // Invite modal
    this.inviteModal = page.getByRole('dialog');
    this.emailInput = page.locator('#invite-email');
    this.roleSelect = page.locator('#invite-role');
    this.submitButton = page.getByRole('button', { name: 'Send invitation' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
  }

  // ── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/settings/team');
    await this.page.waitForURL('**/settings/team', { timeout: 15_000 });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Wait for the members tab panel to be present in the DOM */
  async waitForMembersTab(): Promise<void> {
    await this.page
      .locator('#tabpanel-members')
      .waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Click the Members tab */
  async clickMembers(): Promise<void> {
    await this.tabMembers.click();
  }

  /** Click the Invitations tab */
  async clickInvitations(): Promise<void> {
    await this.tabInvitations.click();
  }

  /** Click the Roles tab */
  async clickRoles(): Promise<void> {
    await this.tabRoles.click();
  }
}
