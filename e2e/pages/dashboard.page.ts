import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Dashboard page (/dashboard).
 */
export class DashboardPage {
  readonly page: Page;

  readonly stockaLogo: Locator;
  readonly logoutButton: Locator;
  readonly userEmailText: Locator;
  readonly userUsernameText: Locator;

  constructor(page: Page) {
    this.page = page;

    this.stockaLogo = page.getByRole('banner').getByText('Stocka');
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
    this.userEmailText = page.locator('dd').filter({ hasText: /@/ }).first();
    this.userUsernameText = page.locator('dl').locator('dd').nth(1);
  }

  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }

  isAt(): Promise<boolean> {
    return this.stockaLogo.isVisible();
  }
}
