import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Onboarding flow (/onboarding).
 *
 * Selector priority: getByRole > getByLabel > getByText > getByTestId
 * Labels are the EN translation values (tests run with locale: 'en-US').
 */
export class OnboardingPage {
  readonly page: Page;

  // ── Step 0 — Consents ──
  readonly termsCheckbox: Locator;
  readonly marketingCheckbox: Locator;
  readonly analyticsCheckbox: Locator;
  readonly getStartedButton: Locator;

  // ── Step 1 — Path Selection ──
  readonly createBusinessButton: Locator;
  readonly invitationCodeButton: Locator;

  // ── Step 2 — Currency ──
  readonly currencyMXN: Locator;
  readonly currencyUSD: Locator;
  readonly currencyEUR: Locator;

  // ── Step 3 — Business Profile ──
  readonly businessNameInput: Locator;
  readonly countrySelect: Locator;

  // ── Shared ──
  readonly continueButton: Locator;
  readonly backButton: Locator;
  readonly skipButton: Locator;
  readonly errorAlert: Locator;
  readonly progressBar: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step 0 — Consents
    this.termsCheckbox = page.getByLabel(/Terms of Service/i);
    this.marketingCheckbox = page.getByLabel(/product communications/i);
    this.analyticsCheckbox = page.getByLabel(/anonymous usage data/i);
    this.getStartedButton = page.getByRole('button', { name: /get started/i });

    // Step 1 — Path Selection
    this.createBusinessButton = page.getByLabel(/create my business/i);
    this.invitationCodeButton = page.getByLabel(/invitation code/i);

    // Step 2 — Currency
    this.currencyMXN = page.getByRole('radio', { name: /MXN/i });
    this.currencyUSD = page.getByRole('radio', { name: /USD/i });
    this.currencyEUR = page.getByRole('radio', { name: /EUR/i });

    // Step 3 — Business Profile
    this.businessNameInput = page.getByLabel(/business name/i);
    this.countrySelect = page.getByLabel(/country/i);

    // Shared
    this.continueButton = page.getByRole('button', { name: 'Continue', exact: true });
    this.backButton = page.getByRole('button', { name: /back/i });
    this.skipButton = page.getByRole('button', { name: /skip/i }).or(page.getByText(/skip/i));
    this.errorAlert = page.getByRole('alert');
    this.progressBar = page.getByRole('progressbar');
  }

  async goto(): Promise<void> {
    await this.page.goto('/onboarding');
  }

  // ── Step 0 helpers ──

  async acceptTermsAndContinue(): Promise<void> {
    // If terms were already accepted (worker-scoped user), step 0 is skipped — bail out early
    if (!(await this.termsCheckbox.isVisible({ timeout: 2_000 }).catch(() => false))) return;
    await this.termsCheckbox.check();
    await this.getStartedButton.click();
  }

  // ── Step 1 helpers ──

  async selectCreateBusiness(): Promise<void> {
    await this.createBusinessButton.click();
  }

  // ── Step 2 helpers ──

  async selectCurrencyAndContinue(currency: 'MXN' | 'USD' | 'EUR' = 'MXN'): Promise<void> {
    const map = { MXN: this.currencyMXN, USD: this.currencyUSD, EUR: this.currencyEUR };
    await map[currency].click();
    await this.continueButton.click();
  }

  // ── Step 3 helpers ──

  async fillBusinessProfileAndContinue(
    name: string,
    businessType: string,
    country: string,
  ): Promise<void> {
    await this.businessNameInput.fill(name);

    // Click the business type button
    const typeButton = this.page.getByRole('button', { name: new RegExp(businessType, 'i') });
    await typeButton.click();

    // Select country from dropdown
    await this.countrySelect.selectOption(country);

    await this.continueButton.click();
  }

  // ── Navigation helpers ──

  async skipCurrentStep(): Promise<void> {
    await this.skipButton.first().click();
  }

  /** Get the visible step title text */
  async getStepTitle(): Promise<string> {
    const heading = this.page.getByRole('heading', { level: 1 });
    return (await heading.textContent()) ?? '';
  }
}
