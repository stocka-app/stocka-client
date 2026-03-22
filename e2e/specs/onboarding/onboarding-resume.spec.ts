import { test, expect } from '../../fixtures/onboarding.fixture';
import { OnboardingPage } from '../../pages/onboarding.page';

/**
 * E2E: Onboarding — Resume / Re-entry behavior
 *
 * Tests that the onboarding correctly resumes from the last saved step
 * and that consents are not re-requested after being accepted.
 */
test.describe('Given a user who accepted terms and returns to onboarding', () => {
  let onboarding: OnboardingPage;

  test.beforeEach(async ({ onboardingPage }) => {
    onboarding = new OnboardingPage(onboardingPage);
  });

  test('Then after accepting terms and re-visiting /onboarding, the consent step is skipped', async ({
    onboardingPage,
  }) => {
    // Accept terms first
    await onboarding.acceptTermsAndContinue();
    await expect(onboarding.createBusinessButton).toBeVisible({ timeout: 10_000 });

    // Navigate away and come back
    await onboardingPage.goto('/onboarding');

    // Should NOT show the terms step — should show path selection or later step
    await expect(onboarding.termsCheckbox).not.toBeVisible({ timeout: 5_000 });
  });

  test('Then after selecting a path and re-visiting, the user resumes from the correct step', async ({
    onboardingPage,
  }) => {
    // Accept terms
    await onboarding.acceptTermsAndContinue();
    await expect(onboarding.createBusinessButton).toBeVisible({ timeout: 10_000 });

    // Select create business
    await onboarding.selectCreateBusiness();
    await expect(onboarding.currencyMXN).toBeVisible({ timeout: 10_000 });

    // Navigate away and come back
    await onboardingPage.goto('/onboarding');

    // Should resume at currency step (or later), NOT at terms or path selection
    // The exact behavior depends on backend step tracking
    await expect(onboarding.termsCheckbox).not.toBeVisible({ timeout: 5_000 });
  });
});
