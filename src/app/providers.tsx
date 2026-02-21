import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { authService } from '@/features/auth/api/auth.service';
import { setAccessToken } from '@/shared/lib/axios';

// Import i18n configuration
import '@/shared/lib/i18n';

/**
 * Inicializa la sesión al montar la aplicación via silent refresh.
 *
 * Flujo:
 * 1. Llama a POST /auth/refresh — el navegador envía la cookie httpOnly automáticamente
 * 2. Si OK → hidrata el store con el nuevo accessToken → isAuthenticated: true
 * 3. Si falla → sesión expirada → isAuthenticated: false
 *
 * Si el usuario está en el flujo de verificación de email (emailVerificationRequired: true),
 * sigue intentando el refresh para tener un accessToken válido, pero NO marca isAuthenticated: true
 * hasta que el email esté verificado.
 */
function AuthInitializer({ children }: { readonly children: React.ReactNode }) {
  useEffect(() => {
    const hydrateAuth = async () => {
      const { emailVerificationRequired } = useAuthStore.getState();

      try {
        const response = await authService.refreshSession();
        const { accessToken } = response.data;

        setAccessToken(accessToken);

        if (emailVerificationRequired) {
          // Sesión válida pero pendiente de verificación de email —
          // tenemos el accessToken en memoria pero no marcamos como autenticado aún
          useAuthStore.setState({ accessToken, isInitializing: false });
        } else {
          useAuthStore.setState({ accessToken, isAuthenticated: true, isInitializing: false });
        }
      } catch {
        // Sin sesión activa o cookie expirada
        if (emailVerificationRequired) {
          // Si la cookie expiró durante el flujo de verificación, reiniciar auth
          useAuthStore.setState({
            isAuthenticated: false,
            emailVerificationRequired: false,
            pendingVerificationEmail: null,
            verificationCodeSentAt: null,
            isInitializing: false,
          });
        } else {
          useAuthStore.setState({ isAuthenticated: false, isInitializing: false });
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

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthInitializer>
      <RouterProvider router={router} />
      {children}
    </AuthInitializer>
  );
}
