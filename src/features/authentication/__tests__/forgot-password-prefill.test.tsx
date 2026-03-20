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
vi.mock('../store/authentication.store', async () => {
  const { authenticationStoreMock } = await import('@/test/mocks/authentication.mock');
  return authenticationStoreMock;
});
vi.mock('../api/authentication.service', async () => {
  const { authenticationServiceMock } = await import('@/test/mocks/authentication.mock');
  return authenticationServiceMock;
});
vi.mock('../components/SocialButton', async () => {
  const { socialButtonMock } = await import('@/test/mocks/authentication.mock');
  return socialButtonMock;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderLoginToForgotFlow() {
  return render(
    <MemoryRouter initialEntries={['/authentication/sign-in']}>
      <Routes>
        <Route path="/authentication/sign-in" element={<LoginForm />} />
        <Route path="/authentication/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderForgotPasswordWithState(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/authentication/forgot-password', state }]}>
      <Routes>
        <Route path="/authentication/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Forgot Password email pre-fill', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Full flow: Sign In → Forgot Password', () => {
    describe('Given the user is on Sign In and has typed a valid email', () => {
      beforeEach(async () => {
        renderLoginToForgotFlow();
        await user.type(screen.getByPlaceholderText('emailOrUsernamePlaceholder'), 'maria@stocka.com');
      });

      describe('When they click "Forgot password?"', () => {
        beforeEach(async () => {
          await user.click(screen.getByRole('button', { name: 'forgotPassword' }));
        });

        it('Then the Forgot Password page shows the email pre-filled', () => {
          expect(
            screen.getByRole<HTMLInputElement>('textbox', { name: 'forgotPasswordPage.emailLabel' }).value,
          ).toBe('maria@stocka.com');
        });
      });
    });

    describe('Given the user is on Sign In and has typed a username instead of an email', () => {
      beforeEach(async () => {
        renderLoginToForgotFlow();
        await user.type(screen.getByPlaceholderText('emailOrUsernamePlaceholder'), 'mariusr');
      });

      describe('When they click "Forgot password?"', () => {
        beforeEach(async () => {
          await user.click(screen.getByRole('button', { name: 'forgotPassword' }));
        });

        it('Then the Forgot Password page shows an empty email field', () => {
          expect(
            screen.getByRole<HTMLInputElement>('textbox', { name: 'forgotPasswordPage.emailLabel' }).value,
          ).toBe('');
        });
      });
    });

    describe('Given the user is on Sign In and has not typed anything', () => {
      beforeEach(() => {
        renderLoginToForgotFlow();
      });

      describe('When they click "Forgot password?"', () => {
        beforeEach(async () => {
          await user.click(screen.getByRole('button', { name: 'forgotPassword' }));
        });

        it('Then the Forgot Password page shows an empty email field', () => {
          expect(
            screen.getByRole<HTMLInputElement>('textbox', { name: 'forgotPasswordPage.emailLabel' }).value,
          ).toBe('');
        });
      });
    });
  });

  describe('Direct navigation to /forgot-password', () => {
    describe('Given the user lands on Forgot Password directly without coming from Sign In', () => {
      beforeEach(() => {
        renderForgotPasswordWithState(null);
      });

      describe('When the page loads', () => {
        it('Then shows an empty email field', () => {
          expect(
            screen.getByRole<HTMLInputElement>('textbox', { name: 'forgotPasswordPage.emailLabel' }).value,
          ).toBe('');
        });
      });
    });

    describe('Given the user arrives at Forgot Password and an email was passed from a previous step', () => {
      beforeEach(() => {
        renderForgotPasswordWithState({ email: 'directo@stocka.com' });
      });

      describe('When the page loads', () => {
        it('Then pre-fills the email field with that email', () => {
          expect(
            screen.getByRole<HTMLInputElement>('textbox', { name: 'forgotPasswordPage.emailLabel' }).value,
          ).toBe('directo@stocka.com');
        });
      });
    });

    describe('Given the user arrives at Forgot Password but no email was passed from a previous step', () => {
      beforeEach(() => {
        renderForgotPasswordWithState({ otherProp: 'something' });
      });

      describe('When the page loads', () => {
        it('Then shows an empty email field', () => {
          expect(
            screen.getByRole<HTMLInputElement>('textbox', { name: 'forgotPasswordPage.emailLabel' }).value,
          ).toBe('');
        });
      });
    });
  });
});
