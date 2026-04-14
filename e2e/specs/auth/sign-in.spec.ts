import { expect } from '@playwright/test';
import { test } from '../../fixtures/auth.fixture';
import { LoginPage } from '../../pages/login.page';
import { DashboardPage } from '../../pages/dashboard.page';

test.describe('Given a verified user on the Sign In page', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
    await loginPage.goto();
  });

  test.describe('When the user enters valid credentials and submits', () => {
    test('Then they are redirected to the dashboard', async ({ page, verifiedUser }) => {
      await loginPage.signIn(verifiedUser.email, verifiedUser.password);

      await page.waitForURL('**/dashboard');
      await expect(dashboardPage.logoutButton).toBeVisible();
    });

    test('Then the dashboard shows the correct user email', async ({ page, verifiedUser }) => {
      await loginPage.signIn(verifiedUser.email, verifiedUser.password);

      await page.waitForURL('**/dashboard');
      await expect(dashboardPage.userEmailText).toContainText(verifiedUser.email);
    });

    test('Then the dashboard shows the correct username', async ({ page, verifiedUser }) => {
      await loginPage.signIn(verifiedUser.email, verifiedUser.password);

      await page.waitForURL('**/dashboard');
      await expect(dashboardPage.userUsernameText).toContainText(verifiedUser.username);
    });
  });

  test.describe('When the user enters wrong credentials and submits', () => {
    test('Then an error message is shown and they stay on the login page', async ({
      page,
      verifiedUser,
    }) => {
      await loginPage.signIn(verifiedUser.email, 'WrongPass99');

      await expect(loginPage.errorAlert).toBeVisible();
      await expect(page).toHaveURL(/\/authentication\/sign-in/);
    });
  });

  test.describe('When the user clicks "Forgot Password?" after typing their email', () => {
    test('Then they are redirected to the Forgot Password page with the email pre-filled', async ({
      page,
      verifiedUser,
    }) => {
      await loginPage.emailOrUsernameInput.fill(verifiedUser.email);
      await loginPage.forgotPasswordLink.click();

      await page.waitForURL('**/forgot-password');
      const emailInput = page.getByLabel(/email/i);
      await expect(emailInput).toHaveValue(verifiedUser.email);
    });
  });

  test.describe('When the user clicks "Create an account"', () => {
    test('Then they are navigated to the Register page', async ({ page }) => {
      await loginPage.createAccountLink.click();

      await expect(page).toHaveURL(/\/authentication\/sign-up/);
    });
  });
});

test.describe('Given a user who is already signed in', () => {
  test('When they try to access the login page, Then they are redirected to the dashboard', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/authentication/sign-in');
    await authenticatedPage.waitForURL('**/dashboard');

    const dashboardPage = new DashboardPage(authenticatedPage);
    await expect(dashboardPage.logoutButton).toBeVisible();
  });
});
