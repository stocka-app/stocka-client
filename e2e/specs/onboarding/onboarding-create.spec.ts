import { test, expect } from '../../fixtures/onboarding.fixture';
import { OnboardingPage } from '../../pages/onboarding.page';
import { createDbPool } from '../../helpers/db.helper';
import { Pool } from 'pg';

/**
 * E2E: Onboarding — "Create my business" flow
 *
 * Tests the full happy-path from sign-in → consent → path selection →
 * currency → business profile → complete → dashboard redirect.
 *
 * Also verifies that consents are persisted in the database (legal requirement).
 */
test.describe('Given a new verified user on the Onboarding page', () => {
  let onboarding: OnboardingPage;

  test.beforeEach(async ({ onboardingPage }) => {
    onboarding = new OnboardingPage(onboardingPage);
  });

  // =========================================================================
  // Step 0 — Consents
  // =========================================================================

  test.describe('Step 0 — Consents', () => {
    test('Then the terms checkbox and Get Started button are visible', async () => {
      await expect(onboarding.termsCheckbox).toBeVisible();
      await expect(onboarding.getStartedButton).toBeVisible();
    });

    test('Then the user cannot proceed without accepting terms', async () => {
      // Click Get Started without checking terms
      await onboarding.getStartedButton.click();

      // Should stay on the same page (consent step)
      await expect(onboarding.termsCheckbox).toBeVisible();
    });

    test('Then consents are persisted in the database after accepting', async ({
      verifiedUser,
    }) => {
      await onboarding.acceptTermsAndContinue();

      // Wait for the path selection step to appear
      await expect(onboarding.createBusinessButton).toBeVisible({ timeout: 10_000 });

      // Verify consents were recorded in the database
      const pool: Pool = createDbPool();
      try {
        const result = await pool.query(
          `SELECT consent_type, granted FROM identity.user_consents WHERE user_uuid = $1 ORDER BY consent_type`,
          [verifiedUser.userId],
        );

        expect(result.rows.length).toBeGreaterThanOrEqual(4);

        const consents = new Map(result.rows.map((r) => [r.consent_type, r.granted]));
        expect(consents.get('terms_of_service')).toBe(true);
        expect(consents.get('privacy_policy')).toBe(true);
        // Marketing and analytics default to true in the form
        expect(consents.get('marketing_communications')).toBe(true);
        expect(consents.get('anonymous_analytics')).toBe(true);
      } finally {
        await pool.end();
      }
    });
  });

  // =========================================================================
  // Step 1 — Path Selection
  // =========================================================================

  test.describe('Step 1 — Path Selection', () => {
    test.beforeEach(async () => {
      await onboarding.acceptTermsAndContinue();
      await expect(onboarding.createBusinessButton).toBeVisible({ timeout: 10_000 });
    });

    test('Then both path options are visible', async () => {
      await expect(onboarding.createBusinessButton).toBeVisible();
      await expect(onboarding.invitationCodeButton).toBeVisible();
    });

    test('Then clicking "Create my business" advances to the currency step', async () => {
      await onboarding.selectCreateBusiness();

      await expect(onboarding.currencyMXN).toBeVisible({ timeout: 10_000 });
    });
  });

  // =========================================================================
  // Step 2 — Currency
  // =========================================================================

  test.describe('Step 2 — Currency', () => {
    test.beforeEach(async () => {
      await onboarding.acceptTermsAndContinue();
      await expect(onboarding.createBusinessButton).toBeVisible({ timeout: 10_000 });
      await onboarding.selectCreateBusiness();
      await expect(onboarding.currencyMXN).toBeVisible({ timeout: 10_000 });
    });

    test('Then MXN is selected by default', async () => {
      await expect(onboarding.currencyMXN).toHaveAttribute('aria-checked', 'true');
    });

    test('Then the user can select USD and continue', async () => {
      await onboarding.selectCurrencyAndContinue('USD');

      // Should advance to business profile step
      await expect(onboarding.businessNameInput).toBeVisible({ timeout: 10_000 });
    });
  });

  // =========================================================================
  // Step 3 — Business Profile
  // =========================================================================

  test.describe('Step 3 — Business Profile', () => {
    test.beforeEach(async () => {
      await onboarding.acceptTermsAndContinue();
      await expect(onboarding.createBusinessButton).toBeVisible({ timeout: 10_000 });
      await onboarding.selectCreateBusiness();
      await expect(onboarding.currencyMXN).toBeVisible({ timeout: 10_000 });
      await onboarding.selectCurrencyAndContinue();
      await expect(onboarding.businessNameInput).toBeVisible({ timeout: 10_000 });
    });

    test('Then the business name input is visible', async () => {
      await expect(onboarding.businessNameInput).toBeVisible();
    });

    test('Then the user cannot proceed without filling required fields', async () => {
      await onboarding.continueButton.click();

      // Should stay on the same step
      await expect(onboarding.businessNameInput).toBeVisible();
    });
  });

  // =========================================================================
  // Full Happy Path — Consent to Dashboard
  // =========================================================================

  test.describe('Full happy path', () => {
    test('Then the user completes onboarding and arrives at the dashboard', async ({
      onboardingPage,
    }) => {
      // Extend timeout for the full flow (many API calls)
      test.setTimeout(60_000);

      // Step 0 — Accept terms
      await onboarding.acceptTermsAndContinue();
      await expect(onboarding.createBusinessButton).toBeVisible({ timeout: 10_000 });

      // Step 1 — Select "Create my business"
      await onboarding.selectCreateBusiness();
      await expect(onboarding.currencyMXN).toBeVisible({ timeout: 10_000 });

      // Step 2 — Select currency and continue
      await onboarding.selectCurrencyAndContinue('MXN');
      await expect(onboarding.businessNameInput).toBeVisible({ timeout: 10_000 });

      // Step 3 — Fill business profile (name + type + country are required)
      await onboarding.fillBusinessProfileAndContinue('Mi Tienda Test', 'retail', 'MX');

      // Step 4 — Spaces (skip)
      const skipSpacesBtn = onboardingPage.getByRole('button', { name: /skip/i });
      await expect(skipSpacesBtn).toBeVisible({ timeout: 10_000 });
      await skipSpacesBtn.click();

      // Step 5 — Context (skip)
      const skipContextBtn = onboardingPage.getByRole('button', { name: /skip/i });
      await expect(skipContextBtn).toBeVisible({ timeout: 10_000 });
      await skipContextBtn.click();

      // Step 6 — Completion: click "Go to dashboard"
      const goToDashboardBtn = onboardingPage.getByRole('button', { name: /go to dashboard/i });
      await expect(goToDashboardBtn).toBeVisible({ timeout: 10_000 });
      await goToDashboardBtn.click();

      // Should eventually arrive at the dashboard
      await onboardingPage.waitForURL('**/dashboard', { timeout: 15_000 });
    });
  });
});
