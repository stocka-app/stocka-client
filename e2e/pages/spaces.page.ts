import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Spaces page (/warehouse).
 * Labels use EN locale values (tests run with locale: 'en-US').
 */
export class SpacesPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly createButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', { name: /Storages|Spaces/i });
    this.createButton = page.getByRole('button', { name: /New storage/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/warehouse');
    await this.page.waitForURL('**/warehouse');
  }

  /**
   * Wait for at least one space card to appear in the grid.
   * Uses the space name text to confirm the list has rendered.
   */
  async waitForContent(spaceName: string): Promise<void> {
    await this.page.getByText(spaceName).waitFor({ state: 'visible' });
  }

  /** Open the three-dot context menu on a card containing the given text */
  async openCardMenu(cardText: string): Promise<void> {
    const card = this.page.getByText(cardText).locator('..').locator('..');
    await card.getByLabel('Actions menu').click();
  }

  editButtons(): Locator {
    return this.page.getByRole('menuitem', { name: 'Edit' });
  }

  archiveButtons(): Locator {
    return this.page.getByRole('menuitem', { name: 'Archive' });
  }

  deleteButtons(): Locator {
    return this.page.getByRole('menuitem', { name: 'Delete' });
  }

  restoreButtons(): Locator {
    return this.page.getByRole('menuitem', { name: 'Restore' });
  }

  viewButtons(): Locator {
    return this.page.getByRole('menuitem', { name: 'View' });
  }
}
