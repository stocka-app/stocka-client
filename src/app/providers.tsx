import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthenticationStore } from '@/features/authentication/store/authentication.store';
import { authenticationService } from '@/features/authentication/api/authentication.service';
import { setAccessToken } from '@/shared/lib/axios';
import { extractTenantContext } from '@/shared/lib/jwt';
import { useThemeStore } from '@/store/theme.store';
import { Toaster } from 'sonner';

// Import i18n configuration
import '@/shared/lib/i18n';

/**
 * Inicializa la sesión al montar la aplicación via silent refresh.
 *
 * Flujo:
 * 1. Llama a POST /authentication/refresh — el navegador envía la cookie httpOnly automáticamente
 * 2. Si OK → hidrata el store con el nuevo accessToken → isAuthenticated: true
 * 3. Si falla → sesión expirada → isAuthenticated: false
 *
 * Si el usuario está en el flujo de verificación de email (emailVerificationRequired: true),
 * sigue intentando el refresh para tener un accessToken válido, pero NO marca isAuthenticated: true
 * hasta que el email esté verificado.
 */
let hydrationStarted = false;

function AuthInitializer({ children }: { readonly children: React.ReactNode }) {
  useEffect(() => {
    const hydrateAuth = async () => {
      // Prevent duplicate call caused by StrictMode double-mount in development
      if (hydrationStarted) return;
      hydrationStarted = true;
      // Skip silent refresh on the OAuth callback page — the callback handles
      // its own token flow and must run before any auth state changes.
      if (window.location.pathname === '/authentication/callback') {
        useAuthenticationStore.setState({ isInitializing: false });
        return;
      }

      const { emailVerificationRequired } = useAuthenticationStore.getState();

      try {
        const response = await authenticationService.refreshSession();
        const { accessToken } = response.data;

        setAccessToken(accessToken);

        // Refresh tenant context from JWT on every silent refresh
        const { tenantId, role, displayName } = extractTenantContext(accessToken);
        const currentUser = useAuthenticationStore.getState().user;
        let updatedUser = currentUser ? { ...currentUser, tenantId, role, displayName } : null;

        // Fetch social name and avatar data from /me endpoint
        try {
          const meResponse = await authenticationService.getMe();
          const socialData = {
            givenName: meResponse.data.givenName ?? null,
            familyName: meResponse.data.familyName ?? null,
            avatarUrl: meResponse.data.avatarUrl ?? null,
          };
          if (updatedUser) {
            updatedUser = { ...updatedUser, ...socialData };
          }
        } catch (err) {
          // Non-critical — social data is optional, but log to aid debugging
          console.error('[Stocka] getMe() failed during silent refresh:', err);
        }

        if (emailVerificationRequired) {
          // Sesión válida pero pendiente de verificación de email —
          // tenemos el accessToken en memoria pero no marcamos como autenticado aún
          useAuthenticationStore.setState({ accessToken, user: updatedUser, isInitializing: false });
        } else {
          useAuthenticationStore.setState({ accessToken, user: updatedUser, isAuthenticated: true, isInitializing: false });
        }
      } catch {
        // Sin sesión activa o cookie expirada
        if (emailVerificationRequired) {
          // Si la cookie expiró durante el flujo de verificación, reiniciar authentication
          useAuthenticationStore.setState({
            isAuthenticated: false,
            emailVerificationRequired: false,
            pendingVerificationEmail: null,
            verificationCodeSentAt: null,
            isInitializing: false,
          });
        } else {
          useAuthenticationStore.setState({ isAuthenticated: false, isInitializing: false });
        }
      }
    };

    hydrateAuth();
  }, []);

  return <>{children}</>;
}

interface ProvidersProps {
  children?: React.ReactNode;
}

/**
 * Ensures the persisted theme (dark/light) is applied to the document
 * before any route renders. Waits for Zustand hydration from localStorage
 * to avoid a flash of wrong theme.
 */
function ThemeInitializer({ children }: { readonly children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const isHydrated = useThemeStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, isHydrated]);

  return <>{children}</>;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeInitializer>
      <AuthInitializer>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
        {children}
      </AuthInitializer>
    </ThemeInitializer>
  );
}
