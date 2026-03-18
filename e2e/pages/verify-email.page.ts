import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Verify Email page (/authentication/verify-email).
 */
export class VerifyEmailPage {
  readonly page: Page;

  // Content
  readonly title: Locator;
  readonly emailDisplay: Locator;

  // Form
  readonly codeInput: Locator;
  readonly verifyButton: Locator;
  readonly resendButton: Locator;

  // Status
  readonly errorAlert: Locator;
  readonly emailNotDeliveredWarning: Locator;

  constructor(page: Page) {
    this.page = page;

    this.title = page.getByRole('heading', { name: 'Verify your email' });
    this.emailDisplay = page.locator('.text-primary.text-lg');

    this.codeInput = page.getByLabel('Enter verification code');
    this.verifyButton = page.getByRole('button', { name: 'Verify Email' });
    this.resendButton = page.getByRole('button', { name: /Resend code|Resend in/ });

    this.errorAlert = page.locator('.bg-destructive\\/10');
    this.emailNotDeliveredWarning = page.locator('[class*="amber"]').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/authentication/verify-email');
  }

  async enterCode(code: string): Promise<void> {
    await this.codeInput.fill(code);
  }

  async submitCode(code: string): Promise<void> {
    await this.enterCode(code);
    await this.verifyButton.click();
  }
}
