/**
 * STOC-181 — Auto-rellenar email en Forgot Password cuando viene de Sign In
 *
 * Criterios de aceptación:
 * 1. Email válido en Sign In → campo pre-rellenado en Forgot Password
 * 2. Username (sin @) en Sign In → campo vacío en Forgot Password
 * 3. Acceso directo a /forgot-password → campo vacío
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';

// ---------------------------------------------------------------------------
// Mocks globales
// ---------------------------------------------------------------------------

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.defaultValue) return opts.defaultValue as string;
      return key;
    },
  }),
}));

vi.mock('../store/auth.store', () => ({
  useAuthStore: () => ({
    login: vi.fn(),
    isLoading: false,
    error: null,
    errorCode: null,
    blockInfo: null,
    clearError: vi.fn(),
    setPendingVerificationEmail: vi.fn(),
  }),
}));

vi.mock('../api/auth.service', () => ({
  authService: {
    forgotPassword: vi.fn().mockResolvedValue({}),
  },
}));

// SocialButton hace fetch de OAuth URL — lo silenciamos
vi.mock('../components/SocialButton', () => ({
  SocialButton: () => null,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renderiza LoginForm + ForgotPasswordPage dentro de un MemoryRouter compartido
 * con rutas reales, para que navigate() con state funcione de extremo a extremo.
 */
function renderLoginToForgotFlow(initialPath = '/auth/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/auth/login" element={<LoginForm />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

/**
 * Renderiza ForgotPasswordPage directamente con un location.state dado.
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

describe('STOC-181 — Auto-rellenar email en Forgot Password desde Sign In', () => {
  const user = userEvent.setup();

  describe('Desde LoginForm → ForgotPasswordPage (flujo completo)', () => {
    it('pre-rellena el email cuando el campo contiene un email válido', async () => {
      renderLoginToForgotFlow();

      // Escribir un email válido en el campo emailOrUsername
      const emailInput = screen.getByPlaceholderText('emailOrUsernamePlaceholder');
      await user.type(emailInput, 'maria@stocka.com');

      // Click en "Forgot password?"
      const forgotLink = screen.getByRole('button', { name: 'forgotPassword' });
      await user.click(forgotLink);

      // Verificar que ForgotPasswordPage está activa con el email pre-rellenado
      const forgotEmailInput = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'forgotPasswordPage.emailLabel',
      });
      expect(forgotEmailInput.value).toBe('maria@stocka.com');
    });

    it('NO pre-rellena el campo cuando se escribe un username (sin @)', async () => {
      renderLoginToForgotFlow();

      const emailInput = screen.getByPlaceholderText('emailOrUsernamePlaceholder');
      await user.type(emailInput, 'mariusr');

      const forgotLink = screen.getByRole('button', { name: 'forgotPassword' });
      await user.click(forgotLink);

      const forgotEmailInput = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'forgotPasswordPage.emailLabel',
      });
      expect(forgotEmailInput.value).toBe('');
    });

    it('NO pre-rellena el campo cuando emailOrUsername está vacío', async () => {
      renderLoginToForgotFlow();

      // No escribimos nada — click directo en "Forgot password?"
      const forgotLink = screen.getByRole('button', { name: 'forgotPassword' });
      await user.click(forgotLink);

      const forgotEmailInput = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'forgotPasswordPage.emailLabel',
      });
      expect(forgotEmailInput.value).toBe('');
    });
  });

  describe('ForgotPasswordPage accedida directamente', () => {
    it('campo vacío cuando no hay location.state (acceso directo a /forgot-password)', () => {
      renderForgotPasswordWithState(null);

      const emailInput = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'forgotPasswordPage.emailLabel',
      });
      expect(emailInput.value).toBe('');
    });

    it('campo pre-rellenado cuando location.state.email está presente', () => {
      renderForgotPasswordWithState({ email: 'directo@stocka.com' });

      const emailInput = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'forgotPasswordPage.emailLabel',
      });
      expect(emailInput.value).toBe('directo@stocka.com');
    });

    it('campo vacío cuando location.state existe pero sin propiedad email', () => {
      renderForgotPasswordWithState({ otherProp: 'algo' });

      const emailInput = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'forgotPasswordPage.emailLabel',
      });
      expect(emailInput.value).toBe('');
    });
  });
});
