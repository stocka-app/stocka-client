import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthenticationStore } from '../store/authentication.store';
import { authenticationService } from '../api/authentication.service';
import { setAccessToken } from '@/shared/lib/axios';
import { decodeJwtPayload, type StockaJwtPayload } from '@/shared/lib/jwt';
import { Button } from '@/shared/components/ui/button';
import type { User, OAuthProvider } from '../types/authentication.types';

type CallbackStatus = 'loading' | 'success' | 'error';

type OAuthErrorInfo = {
  title: string;
  detail: string;
  showRetryWithProvider: boolean;
  showDifferentMethod: boolean;
};

const PROVIDER_NAMES: Record<string, string> = {
  google: 'Google',
  facebook: 'Facebook',
  microsoft: 'Microsoft',
};

/**
 * Mapea el error code de la URL a info de error traducida.
 *
 * Error codes posibles del backend OAuth:
 * - access_denied: el usuario canceló en el proveedor
 * - EMAIL_ALREADY_EXISTS / OAUTH_EMAIL_CONFLICT: el email ya tiene otro método de login
 * - OAUTH_NO_EMAIL: el proveedor no pudo proporcionar el email
 * - Cualquier otro: error de conexión / genérico
 */
function resolveOAuthError(errorCode: string, t: TFunction): OAuthErrorInfo {
  const code = errorCode.toLowerCase();

  if (code === 'access_denied' || code === 'oauth_cancelled') {
    return {
      title: t('oauthCallback.cancelledTitle'),
      detail: t('oauthCallback.cancelledDetail'),
      showRetryWithProvider: true,
      showDifferentMethod: false,
    };
  }

  if (code === 'email_already_exists' || code === 'oauth_email_conflict') {
    return {
      title: t('oauthCallback.emailConflictTitle'),
      detail: t('oauthCallback.emailConflictDetail'),
      showRetryWithProvider: false,
      showDifferentMethod: true,
    };
  }

  if (code === 'oauth_no_email') {
    return {
      title: t('oauthCallback.noEmailTitle'),
      detail: t('oauthCallback.noEmailDetail'),
      showRetryWithProvider: false,
      showDifferentMethod: true,
    };
  }

  return {
    title: t('oauthCallback.connectionErrorTitle'),
    detail: t('oauthCallback.connectionErrorDetail'),
    showRetryWithProvider: true,
    showDifferentMethod: false,
  };
}

/**
 * Página de callback para OAuth
 *
 * Maneja el retorno de los proveedores de OAuth (Google, Facebook, Microsoft)
 * procesando los tokens recibidos en la URL.
 *
 * URL de éxito: /authentication/callback?accessToken=xxx&refreshToken=xxx&user=...
 * URL de error: /authentication/callback?error=xxx
 */
function OAuthCallbackPage() {
  const { t } = useTranslation('authentication');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback } = useAuthenticationStore();

  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [errorInfo, setErrorInfo] = useState<OAuthErrorInfo | null>(null);

  const lastProvider = sessionStorage.getItem('lastOAuthProvider') as OAuthProvider | null;

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Verificar si hay error en los parámetros
        const errorCode = searchParams.get('error');
        if (errorCode) {
          setErrorInfo(resolveOAuthError(errorCode, t));
          setStatus('error');
          return;
        }

        // Obtener tokens de la URL
        // El refreshToken ya no viaja en la URL — el BE lo setea como httpOnly cookie en el redirect
        const accessToken = searchParams.get('accessToken');
        const userParam = searchParams.get('user');

        if (!accessToken) {
          setErrorInfo(resolveOAuthError('connection_error', t));
          setStatus('error');
          return;
        }

        // Popup mode: broadcast token to the parent window via BroadcastChannel
        // (BroadcastChannel works same-origin regardless of window.opener status —
        //  cross-origin navigation through OAuth providers can break window.opener)
        const popupMode = searchParams.get('popup') === 'true';
        if (popupMode) {
          // Signal the parent window via localStorage. The parent listens for
          // the 'storage' event which fires reliably across same-origin windows,
          // even when the writing window is closing immediately after.
          localStorage.setItem('stocka-oauth-result', JSON.stringify({ accessToken }));
          window.close();
          return;
        }

        // Poner el accessToken en memoria antes de hacer cualquier llamada autenticada
        setAccessToken(accessToken);

        // Build user from URL params or JWT — no extra API call needed
        let user: User | null = null;
        if (userParam) {
          try {
            user = JSON.parse(decodeURIComponent(userParam));
          } catch {
            user = null;
          }
        }

        if (!user) {
          const payload = decodeJwtPayload<StockaJwtPayload>(accessToken);
          user = {
            id: payload.sub,
            email: payload.email,
            username: payload.email.split('@')[0],
            status: 'active',
            createdAt: new Date().toISOString(),
            tenantId: payload.tenantId ?? null,
            role: payload.role ?? null,
          };
        }

        handleOAuthCallback({ accessToken, user });

        // Limpiar el provider almacenado al completar exitosamente
        sessionStorage.removeItem('lastOAuthProvider');
        setStatus('success');

        // Redirigir al dashboard después de un breve momento
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } catch {
        setErrorInfo(resolveOAuthError('connection_error', t));
        setStatus('error');
      }
    };

    processCallback();
  }, [searchParams, handleOAuthCallback, navigate, t]);

  const handleRetryWithProvider = () => {
    if (lastProvider) {
      sessionStorage.setItem('lastOAuthProvider', lastProvider);
      authenticationService.initiateOAuth(lastProvider);
    } else {
      navigate('/authentication/sign-in', { replace: true });
    }
  };

  // Estado de carga
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-neutral-500">{t('oauthCallback.loading')}</p>
      </div>
    );
  }

  // Estado de éxito
  if (status === 'success') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-neutral-900">{t('oauthCallback.success')}</h2>
        <p className="mt-2 text-neutral-500">{t('common.redirecting', 'Redirecting...')}</p>
      </div>
    );
  }

  // Estado de error
  const providerName = lastProvider ? (PROVIDER_NAMES[lastProvider] ?? lastProvider) : undefined;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-neutral-900">
            {errorInfo?.title ?? t('oauthCallback.error')}
          </h2>
          {errorInfo?.detail && <p className="text-sm text-neutral-500">{errorInfo.detail}</p>}
        </div>

        <div className="flex flex-col gap-3">
          {/* Siempre visible: volver al login */}
          <Button onClick={() => navigate('/authentication/sign-in', { replace: true })} className="w-full">
            {t('oauthCallback.backToLogin')}
          </Button>

          {/* Reintentar con el mismo proveedor (cancel / connection errors) */}
          {errorInfo?.showRetryWithProvider && (
            <Button variant="outline" onClick={handleRetryWithProvider} className="w-full">
              {providerName
                ? t('oauthCallback.tryAgainWith', { provider: providerName })
                : t('oauthCallback.tryAgain')}
            </Button>
          )}

          {/* Probar otro método (conflicto de email, sin email) */}
          {errorInfo?.showDifferentMethod && (
            <Button
              variant="outline"
              onClick={() => navigate('/authentication/sign-in', { replace: true })}
              className="w-full"
            >
              {t('oauthCallback.tryDifferentMethod')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OAuthCallbackPage;
