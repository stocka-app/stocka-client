import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseAuthStore = vi.hoisted(() => vi.fn());

vi.mock('../store/auth.store', () => ({
  useAuthStore: mockUseAuthStore,
}));

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

vi.mock('../components/SocialButton', async () => {
  const { socialButtonMock } = await import('@/test/mocks/auth.mock');
  return socialButtonMock;
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseStore = {
  login: vi.fn(),
  isLoading: false,
  error: null,
  errorCode: null,
  blockInfo: null,
  clearError: vi.fn(),
  setPendingVerificationEmail: vi.fn(),
};

function renderLoginForm() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Flexible Pendiente — SOCIAL_ACCOUNT_REQUIRED error on sign-in (EC-002)', () => {
  describe('Given a customer whose account is in Flexible Pendiente state', () => {
    describe('When they try to sign in with their email and password', () => {
      beforeEach(() => {
        mockUseAuthStore.mockReturnValue({
          ...baseStore,
          error: 'This account can only sign in with its linked social provider.',
          errorCode: 'SOCIAL_ACCOUNT_REQUIRED',
        });
        renderLoginForm();
      });

      it('Then an informative amber banner explains they must use their OAuth provider', () => {
        expect(screen.getByText('errors.SOCIAL_ACCOUNT_REQUIRED')).toBeInTheDocument();
      });

      it('Then the banner also reminds them to use the OAuth buttons available on the page', () => {
        expect(screen.getByText('errors.useAlternativeLogin')).toBeInTheDocument();
      });

      it('Then the generic red error block is not shown', () => {
        const genericError = screen.queryByText(
          'This account can only sign in with its linked social provider.',
        );
        expect(genericError).not.toBeInTheDocument();
      });

      it('Then no "Verify now" link is shown — this is not an email verification issue', () => {
        expect(screen.queryByText('verifyEmail.verifyNow')).not.toBeInTheDocument();
      });
    });
  });

  describe('Given a customer with a regular sign-in error', () => {
    describe('When the API returns INVALID_CREDENTIALS', () => {
      beforeEach(() => {
        mockUseAuthStore.mockReturnValue({
          ...baseStore,
          error: 'Invalid email/username or password',
          errorCode: 'INVALID_CREDENTIALS',
        });
        renderLoginForm();
      });

      it('Then the generic error block is shown, not the amber social banner', () => {
        expect(screen.queryByText('errors.SOCIAL_ACCOUNT_REQUIRED')).not.toBeInTheDocument();
        expect(screen.queryByText('errors.useAlternativeLogin')).not.toBeInTheDocument();
      });
    });
  });
});
