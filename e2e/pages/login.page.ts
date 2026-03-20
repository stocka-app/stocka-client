import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Sign In page (/authentication/sign-in).
 *
 * Selector priority: getByRole > getByLabel > getByPlaceholder > getByTestId
 * Labels are the EN translation values (tests run with locale: 'en-US').
 */
export class LoginPage {
  readonly page: Page;

  // Form fields
  readonly emailOrUsernameInput: Locator;
  readonly passwordInput: Locator;

  // Actions
  readonly signInButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly createAccountLink: Locator;

  // Error / alert areas
  readonly errorAlert: Locator;
  readonly rateLimitBanner: Locator;
  readonly socialAccountRequiredBanner: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailOrUsernameInput = page.getByLabel('Enter your username or email address');
    this.passwordInput = page.getByLabel('Enter your Password');

    this.signInButton = page.getByRole('button', { name: 'Sign in', exact: true });
    this.forgotPasswordLink = page.getByRole('button', { name: 'Forgot Password?' });
    this.createAccountLink = page.getByRole('link', { name: 'Create an account' });

    this.errorAlert = page.locator('.bg-destructive\\/10');
    this.rateLimitBanner = page.locator('.bg-amber-50, .bg-amber-950\\/30').first();
    this.socialAccountRequiredBanner = page.locator('[class*="amber"]').first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/authentication/sign-in');
  }

  async fillCredentials(emailOrUsername: string, password: string): Promise<void> {
    await this.emailOrUsernameInput.fill(emailOrUsername);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.signInButton.click();
  }

  async signIn(emailOrUsername: string, password: string): Promise<void> {
    await this.fillCredentials(emailOrUsername, password);
    await this.submit();
  }
}
