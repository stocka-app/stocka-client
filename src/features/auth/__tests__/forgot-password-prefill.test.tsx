/**
 * Acceptance criteria:
 * 1. Valid email typed in Sign In → field pre-filled in Forgot Password
 * 2. Username (no @) typed in Sign In → field empty in Forgot Password
 * 3. Direct navigation to /forgot-password → field empty
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';

// ---------------------------------------------------------------------------
// Mocks
//
// vi.mock() is hoisted before imports, so imported variables are not yet
// available inside synchronous factories. Async factories let us import
// from shared mock files after hoisting is resolved.
// ---------------------------------------------------------------------------

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});
vi.mock('../store/auth.store', async () => {
  const { authStoreMock } = await import('@/test/mocks/auth.mock');
  return authStoreMock;
});
vi.mock('../api/auth.service', async () => {
  const { authServiceMock } = await import('@/test/mocks/auth.mock');
  return authServiceMock;
});
vi.mock('../components/SocialButton', async () => {
  const { socialButtonMock } = await import('@/test/mocks/auth.mock');
  return socialButtonMock;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders LoginForm + ForgotPasswordPage in a shared MemoryRouter so that
 * navigate() with state works end-to-end.
 */
function renderLoginToForgotFlow() {
  return render(
    <MemoryRouter initialEntries={['/auth/login']}>
      <Routes>
        <Route path="/auth/login" element={<LoginForm />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

/**
 * Renders ForgotPasswordPage directly with a given location.state.
 */
function renderForgotPasswordWithState(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/auth/forgot-password', state }]}>
      <Routes>
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('STOC-181 — Forgot Password email pre-fill', () => {
  const user = userEvent.setup();

  describe('Full flow: Sign In → Forgot Password', () => {
    it('pre-fills the email field when the user typed a valid email in Sign In', async () => {
      // GIVEN the user is on the Sign In page
      renderLoginToForgotFlow();

      // WHEN they type a valid email and click "Forgot password?"
      const emailInput = screen.getByPlaceholderText('emailOrUsernamePlaceholder');
      await user.type(emailInput, 'maria@stocka.com');

      const forgotLink = screen.getByRole('button', { name: 'forgotPassword' });
      await user.click(forgotLink);

      // THEN the Forgot Password page shows the email pre-filled
      const forgotEmailInput = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'forgotPasswordPage.emailLabel',
      });
      expect(forgotEmailInput.value).toBe('maria@stocka.com');
    });

    it('leaves the email field empty when the user typed a username (no @) in Sign In', async () => {
      // GIVEN the user is on the Sign In page
      renderLoginToForgotFlow();

      // WHEN they type a username (not an email) and click "Forgot password?"
      const emailInput = screen.getByPlaceholderText('emailOrUsernamePlaceholder');
      await user.type(emailInput, 'mariusr');

      const forgotLink = screen.getByRole('button', { name: 'forgotPassword' });
      await user.click(forgotLink);

      // THEN the Forgot Password page shows an empty email field (no PII leak)
      const forgotEmailInput = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'forgotPasswordPage.emailLabel',
      });
      expect(forgotEmailInput.value).toBe('');
    });

    it('leaves the email field empty when the Sign In field was blank', async () => {
      // GIVEN the user is on the Sign In page with no input
      renderLoginToForgotFlow();

      // WHEN they click "Forgot password?" without typing anything
      const forgotLink = screen.getByRole('button', { name: 'forgotPassword' });
      await user.click(forgotLink);

      // THEN the Forgot Password page shows an empty email field
      const forgotEmailInput = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'forgotPasswordPage.emailLabel',
      });
      expect(forgotEmailInput.value).toBe('');
    });
  });

  describe('Direct navigation to /forgot-password', () => {
    it('shows an empty email field when there is no location.state', () => {
      // GIVEN the user navigates directly to /forgot-password (no state)
      renderForgotPasswordWithState(null);

      // THEN the email field is empty
      const emailInput = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'forgotPasswordPage.emailLabel',
      });
      expect(emailInput.value).toBe('');
    });

    it('pre-fills the email field when location.state carries an email', () => {
      // GIVEN the user arrives at /forgot-password with an email in location.state
      renderForgotPasswordWithState({ email: 'directo@stocka.com' });

      // THEN the email field is pre-filled with that email
      const emailInput = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'forgotPasswordPage.emailLabel',
      });
      expect(emailInput.value).toBe('directo@stocka.com');
    });

    it('shows an empty email field when location.state exists but has no email property', () => {
      // GIVEN the user arrives at /forgot-password with unrelated state
      renderForgotPasswordWithState({ otherProp: 'something' });

      // THEN the email field is empty
      const emailInput = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'forgotPasswordPage.emailLabel',
      });
      expect(emailInput.value).toBe('');
    });
  });
});
