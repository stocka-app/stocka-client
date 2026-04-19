import { type Page, type Locator } from '@playwright/test';

export class VerifyEmailPage {
  readonly page: Page;

  // Content
  readonly title: Locator;
  readonly emailDisplay: Locator;

  // Form — 6 individual digit inputs
  readonly digitInputs: Locator;
  readonly verifyButton: Locator;
  readonly resendButton: Locator;

  // Status
  readonly errorAlert: Locator;
  readonly emailNotDeliveredWarning: Locator;
  readonly expirationTimer: Locator;

  constructor(page: Page) {
    this.page = page;

    this.title = page.getByRole('heading', { name: 'Verify your email' });
    this.emailDisplay = page.locator('p.font-medium.text-primary');

    this.digitInputs = page.getByRole('textbox', { name: /Digit \d+ of 6/ });
    this.verifyButton = page.getByRole('button', { name: 'Verify Email' });
    this.resendButton = page.getByRole('button', { name: /Resend code|Resend in/ });

    this.errorAlert = page.locator('[class*="bg-destructive"]').first();
    this.emailNotDeliveredWarning = page.getByText(/could not deliver/i);
    this.expirationTimer = page.getByText(/Code expires in/);
  }

  async goto(): Promise<void> {
    await this.page.goto('/authentication/verify-email');
  }

  async enterCode(code: string): Promise<void> {
    const digits = code.split('');
    for (let i = 0; i < digits.length && i < 6; i++) {
      await this.page.getByRole('textbox', { name: `Digit ${i + 1} of 6` }).fill(digits[i]);
    }
  }

  async submitCode(code: string): Promise<void> {
    await this.enterCode(code);
    // After filling all digits, the verify button should become enabled
    await this.verifyButton.click();
  }
}
