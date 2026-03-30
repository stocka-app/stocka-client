import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Storages list page (/storages).
 * Labels use EN locale values (tests run with locale: 'en-US').
 */
export class StoragesListPage {
  readonly page: Page;

  // ── Header ───────────────────────────────────────────────────────────
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly createButton: Locator;

  // ── Tabs ─────────────────────────────────────────────────────────────
  readonly tabAll: Locator;
  readonly tabWarehouses: Locator;
  readonly tabStoreRooms: Locator;
  readonly tabCustomRooms: Locator;

  // ── Stats bar ────────────────────────────────────────────────────────
  readonly statsBar: Locator;

  // ── Search / filter / sort controls ──────────────────────────────────
  readonly searchInput: Locator;
  readonly statusDropdown: Locator;
  readonly sortButton: Locator;

  // ── States ───────────────────────────────────────────────────────────
  readonly skeletonCards: Locator;
  readonly progressBar: Locator;
  readonly loaderSpinner: Locator;

  // ── Card grid ────────────────────────────────────────────────────────
  readonly cardGrid: Locator;
  readonly createInlineCard: Locator;
  readonly upgradeCard: Locator;

  // ── Pagination ───────────────────────────────────────────────────────
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly pageIndicator: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.heading = page.getByRole('heading', { name: 'Storages' });
    this.subtitle = page.getByText('Manage your storages');
    this.createButton = page.getByRole('button', { name: 'New storage' });

    // Tabs (role="tab")
    this.tabAll = page.getByRole('tab', { name: /^All/ });
    this.tabWarehouses = page.getByRole('tab', { name: /^Warehouses/ });
    this.tabStoreRooms = page.getByRole('tab', { name: /^Store Rooms/ });
    this.tabCustomRooms = page.getByRole('tab', { name: /^Custom Rooms/ });

    // Stats bar
    this.statsBar = page.locator('.flex.items-center.gap-4.overflow-x-auto.rounded-lg');

    // Search / filter / sort
    this.searchInput = page.getByPlaceholder('Search storages...');
    this.statusDropdown = page.locator('select');
    this.sortButton = page.getByRole('button', { name: /[AZ] → [AZ]/ });

    // Skeleton state
    this.skeletonCards = page.locator('.animate-pulse').first();
    this.progressBar = page.locator('[role="progressbar"]');

    // Loader overlay
    this.loaderSpinner = page.getByText('Loading storages...');

    // Card grid
    this.cardGrid = page.locator('.grid');
    this.createInlineCard = page.getByRole('button', { name: 'Create storage' });
    this.upgradeCard = page.getByText('Plan limit reached');

    // Pagination
    this.prevButton = page.getByRole('button', { name: 'Previous' });
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.pageIndicator = page.getByText(/Page \d+ of \d+/);
  }

  // ── Navigation ─────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/storages');
    await this.page.waitForURL('**/storages', { timeout: 15_000 });
  }

  // ── Queries ────────────────────────────────────────────────────────

  /** All visible storage card names in order */
  async getCardNames(): Promise<string[]> {
    const names = this.page.locator('h3');
    return names.allTextContents();
  }

  /** Get a storage card container by its name */
  card(name: string): Locator {
    return this.page
      .locator('h3')
      .filter({ hasText: name })
      .locator('..') // parent content div
      .locator('..'); // card root with bracket
  }

  /** Open the three-dot context menu on a card and return menu item locators */
  async openCardMenu(cardName: string): Promise<void> {
    const scope = this.card(cardName);
    await scope.getByLabel('Actions menu').click();
  }

  /** Menu item locators (visible after openCardMenu) */
  cardActions(_cardName: string): {
    view: Locator;
    edit: Locator;
    archive: Locator;
    restore: Locator;
    delete: Locator;
  } {
    return {
      view: this.page.getByRole('menuitem', { name: 'View' }),
      edit: this.page.getByRole('menuitem', { name: 'Edit' }),
      archive: this.page.getByRole('menuitem', { name: 'Archive' }),
      restore: this.page.getByRole('menuitem', { name: 'Restore' }),
      delete: this.page.getByRole('menuitem', { name: 'Delete' }),
    };
  }

  /** Get the type badge text for a card */
  cardTypeBadge(cardName: string): Locator {
    const scope = this.card(cardName);
    return scope.locator('.rounded-full.px-2');
  }

  /** Get the status label for a card */
  cardStatusLabel(cardName: string): Locator {
    const scope = this.card(cardName);
    return scope.locator('.text-xs.text-neutral-500').first();
  }

  /** Filter chip buttons (status / search chips) */
  filterChips(): Locator {
    return this.page.locator('button.inline-flex.items-center.gap-1.rounded-full');
  }

  filterChip(text: string): Locator {
    return this.filterChips().filter({ hasText: text });
  }

  // ── Empty state ────────────────────────────────────────────────────

  emptyTitle(): Locator {
    return this.page.getByText("You don't have any storages yet");
  }

  emptyCreateButton(): Locator {
    return this.page.getByRole('button', { name: 'Create my first storage' });
  }

  emptyHelpLink(): Locator {
    return this.page.getByText('What is a storage?');
  }

  // ── No results state ───────────────────────────────────────────────

  noResultsTitle(): Locator {
    return this.page.getByText('No storages found with that name');
  }

  noFilterResultsTitle(): Locator {
    return this.page.getByText('No storages match this filter');
  }

  clearSearchButton(): Locator {
    return this.page.getByRole('button', { name: 'Clear search' });
  }

  viewAllButton(): Locator {
    return this.page.getByRole('button', { name: 'View all' });
  }

  // ── Error state ────────────────────────────────────────────────────

  errorTitle(): Locator {
    return this.page.getByText("We couldn't load your storages");
  }

  retryButton(): Locator {
    return this.page.getByRole('button', { name: 'Retry' });
  }

  getHelpButton(): Locator {
    return this.page.getByRole('button', { name: 'Get help' });
  }

  // ── Helpers ────────────────────────────────────────────────────────

  async waitForCards(): Promise<void> {
    await this.page.locator('h3').first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  async selectStatus(status: 'ACTIVE' | 'FROZEN' | 'ARCHIVED' | ''): Promise<void> {
    await this.statusDropdown.selectOption(status);
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async toggleSort(): Promise<void> {
    await this.sortButton.click();
  }
}
