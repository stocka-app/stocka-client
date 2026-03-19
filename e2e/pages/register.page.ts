import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Sign Up page (/authentication/register).
 */
export class RegisterPage {
  readonly page: Page;

  // Form fields
  readonly fullNameInput: Locator;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;

  // Actions
  readonly signUpButton: Locator;
  readonly signInLink: Locator;

  // Error area
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;

    this.fullNameInput = page.getByLabel('Full Name');
    this.usernameInput = page.getByLabel('Username');
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel(/^Enter your Password$/);
    this.confirmPasswordInput = page.getByLabel('Confirm Password');

    this.signUpButton = page.getByRole('button', { name: 'Sign up', exact: true });
    this.signInLink = page.getByRole('link', { name: 'Sign in' });

    this.errorAlert = page.locator('.bg-destructive\\/10');
  }

  async goto(): Promise<void> {
    await this.page.goto('/authentication/register');
  }

  async fillForm(data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<void> {
    await this.fullNameInput.fill(data.fullName);
    await this.usernameInput.fill(data.username);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword);
  }

  async submit(): Promise<void> {
    await this.signUpButton.click();
  }

  async signUp(data: {
    fullName: string;
    username: string;
    email: string;
    password: string;
  }): Promise<void> {
    await this.fillForm({ ...data, confirmPassword: data.password });
    await this.submit();
  }
}
