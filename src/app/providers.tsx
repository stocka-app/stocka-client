import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthenticationStore } from '@/features/authentication/store/authentication.store';
import { setAccessToken, executeRefresh, getLastRefreshData } from '@/shared/lib/axios';
import { extractTenantContext } from '@/shared/lib/jwt';
import { useThemeStore } from '@/store/theme.store';
import { useRBACStore } from '@/store/rbac.store';
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
        // Use the centralized executeRefresh() — shares the isRefreshing lock
        // with the 401 interceptor, preventing duplicate refresh-session calls
        // if a concurrent request triggers the interceptor before we finish.
        const accessToken = await executeRefresh();

        // setAccessToken is already called inside executeRefresh, but we keep
        // the explicit call so the rest of hydrateAuth has the token in scope.
        setAccessToken(accessToken);

        // Refresh-session now returns enriched data (social + onboarding status)
        // so we no longer need a separate getMe() call.
        const refreshData = getLastRefreshData();

        // Refresh tenant context from JWT on every silent refresh
        const { tenantId, role, displayName, tierLimits } = extractTenantContext(accessToken);
        const currentUser = useAuthenticationStore.getState().user;
        const updatedUser = currentUser
          ? {
              ...currentUser,
              tenantId,
              role,
              displayName,
              tierLimits,
              username: refreshData?.username ?? currentUser.username,
              givenName: refreshData?.givenName ?? currentUser.givenName,
              familyName: refreshData?.familyName ?? currentUser.familyName,
              avatarUrl: refreshData?.avatarUrl ?? currentUser.avatarUrl,
            }
          : null;

        // Only load permissions if user has a tenant (not during onboarding)
        const onboardingCompleted = refreshData?.onboardingStatus === 'COMPLETED';
        if (onboardingCompleted) {
          useRBACStore.getState().loadPermissions().catch(() => {});
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
  const theme = useThemeStore((s) => s.theme);

  return (
    <ThemeInitializer>
      <AuthInitializer>
        <RouterProvider router={router} />
        <Toaster
          richColors
          closeButton
          position="bottom-center"
          theme={theme}
          toastOptions={{
            classNames: {
              closeButton: '!left-auto !right-0 !translate-x-[35%] !-translate-y-[35%]',
            },
          }}
        />
        {children}
      </AuthInitializer>
    </ThemeInitializer>
  );
}
