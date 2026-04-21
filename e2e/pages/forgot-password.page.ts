import { type Page, type Locator } from '@playwright/test';

export class ForgotPasswordPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly backToSignInLink: Locator;
  readonly errorAlert: Locator;

  // Success view
  readonly successHeading: Locator;
  readonly resendButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', { name: 'Reset your password' });
    this.emailInput = page.getByRole('textbox', { name: 'Email address' });
    this.submitButton = page.getByRole('button', { name: 'Send instructions' });
    this.backToSignInLink = page.getByRole('link', { name: 'Back to sign in' });
    this.errorAlert = page.locator('[class*="bg-destructive"]').first();

    this.successHeading = page.getByRole('heading', { name: 'Check your inbox!' });
    this.resendButton = page.getByRole('button', { name: /Resend|resend/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/authentication/forgot-password');
  }

  async submitEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
