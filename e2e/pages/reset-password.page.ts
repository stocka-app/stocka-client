import { type Page, type Locator } from '@playwright/test';

export class ResetPasswordPage {
  readonly page: Page;

  readonly heading: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;

  // Invalid/expired token state
  readonly invalidTokenMessage: Locator;
  readonly requestNewLinkButton: Locator;
  readonly backToLoginLink: Locator;

  // Success state
  readonly successHeading: Locator;
  readonly goToLoginButton: Locator;

  // Password hints
  readonly hintMinLength: Locator;
  readonly hintUppercase: Locator;
  readonly hintNumber: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', { name: 'Set new password' });
    this.passwordInput = page.getByLabel('New password');
    this.confirmPasswordInput = page.getByLabel('Confirm password');
    this.submitButton = page.getByRole('button', { name: 'Reset password' });

    this.invalidTokenMessage = page.getByText(/expired|invalid|already used/i);
    this.requestNewLinkButton = page.getByRole('button', { name: 'Request new link' });
    this.backToLoginLink = page.getByRole('link', { name: /Back to sign in/i });

    this.successHeading = page.getByRole('heading', { name: 'Password updated!' });
    this.goToLoginButton = page.getByRole('button', { name: 'Go to sign in' });

    this.hintMinLength = page.getByText('At least 8 characters');
    this.hintUppercase = page.getByText('At least one uppercase letter');
    this.hintNumber = page.getByText('At least one number');
  }

  async goto(token?: string): Promise<void> {
    const url = token
      ? `/authentication/reset-password?token=${token}`
      : '/authentication/reset-password';
    await this.page.goto(url);
  }

  async fillAndSubmit(password: string): Promise<void> {
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.submitButton.click();
  }
}
