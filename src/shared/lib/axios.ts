import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, AuthenticationErrorCode } from '@/features/authentication/types/authentication.types';
import { env } from './env';
import i18n from './i18n';

const API_URL = env.VITE_API_URL;

// In-memory access token — not persisted to localStorage (XSS mitigation)
let inMemoryAccessToken: string | null = null;

/**
 * Updates the in-memory access token.
 * Called by the authentication store whenever the token changes.
 */
export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

/**
 * Returns the current in-memory access token.
 */
export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

// Nombre de la clave de persistencia de Zustand
const AUTH_STORAGE_KEY = 'authentication-storage';

// ─── Refresh lock ──────────────────────────────────────────────────────────────
// Single lock shared by BOTH the 401 interceptor AND proactive callers
// (hydrateAuth). Guarantees that at most one POST /refresh-session is in-flight
// at any time, regardless of which code path triggered it.

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processRefreshQueue(error: unknown, token: string | null): void {
  refreshQueue.forEach(({ resolve, reject }) => {
    /* istanbul ignore next 2 */
    if (error) reject(error);
    else resolve(token as string);
  });
  refreshQueue = [];
}

/**
 * Executes a single refresh-session call, or joins an in-flight one.
 *
 * This is the ONLY function in the app that actually calls POST /refresh-session.
 * Both the 401 interceptor and proactive callers (hydrateAuth) go through here,
 * ensuring the isRefreshing lock is shared and cookie rotation never collides.
 *
 * @returns The fresh access token.
 */
export interface RefreshResponseData {
  accessToken: string;
  username: string | null;
  givenName: string | null;
  familyName: string | null;
  avatarUrl: string | null;
  onboardingStatus: string | null;
}

// Stores the full refresh response so hydrateAuth can read it after executeRefresh()
let lastRefreshData: RefreshResponseData | null = null;

export function getLastRefreshData(): RefreshResponseData | null {
  return lastRefreshData;
}

/**
 * Executes a single refresh-session call, or joins an in-flight one.
 *
 * This is the ONLY function in the app that actually calls POST /refresh-session.
 * Both the 401 interceptor and proactive callers (hydrateAuth) go through here,
 * ensuring the isRefreshing lock is shared and cookie rotation never collides.
 *
 * @returns The fresh access token.
 */
export async function executeRefresh(): Promise<string> {
  // If a refresh is already in flight, piggyback on it
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async (): Promise<string> => {
    try {
      // The httpOnly refresh_token cookie is sent automatically.
      // Use raw axios (not `api`) to avoid triggering our own interceptors.
      const response = await axios.post(
        `${API_URL}/authentication/refresh-session`,
        {},
        { withCredentials: true },
      );

      // Backend envelope: { data: { accessToken, ... }, success: true }
      const responseData = response.data?.data ?? response.data;
      const { accessToken } = responseData as RefreshResponseData;
      inMemoryAccessToken = accessToken;
      lastRefreshData = responseData as RefreshResponseData;

      processRefreshQueue(null, accessToken);
      return accessToken;
    } catch (refreshError) {
      lastRefreshData = null;
      processRefreshQueue(refreshError, null);
      throw refreshError;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Cliente HTTP configurado para el backend de Stocka
 * withCredentials: true → el navegador envía la cookie httpOnly refresh_token automáticamente
 */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Limpia el estado de autenticación del localStorage y el token en memoria
 */
function clearAuthStorage(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  inMemoryAccessToken = null;
}

/**
 * Request interceptor
 * - Agrega el access token a las peticiones (desde memoria, no desde localStorage)
 * - Agrega el header Accept-Language para i18n del backend
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    // Enviar el idioma activo para que el backend renderice
    // correos y respuestas en el idioma correcto
    config.headers['Accept-Language'] = i18n.language;
    return config;
  },
  /* istanbul ignore next */
  (error) => Promise.reject(error),
);

/**
 * Rutas de autenticación que NO deben manejar 401 automáticamente
 * (el 401 en estas rutas es un error de credenciales, no de token expirado)
 */
const AUTH_ROUTES = ['/authentication/sign-in', '/authentication/sign-up', '/authentication/verify-email', '/authentication/refresh-session'];

/**
 * Verifica si la URL es una ruta de autenticación
 */
function isAuthRoute(url?: string): boolean {
  if (!url) return false;
  return AUTH_ROUTES.some((route) => url.includes(route));
}

/**
 * Detects network-level errors (no response received from server).
 * These are distinct from server errors (4xx/5xx) where a response IS received.
 */
function isNetworkError(error: AxiosError): boolean {
  return !error.response && (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || error.message === 'Network Error');
}

/**
 * Resolves the most specific error code from an AxiosError.
 * Priority: backend error code > network error detection > generic fallback.
 */
function resolveErrorCode(error: AxiosError<ApiError>): AuthenticationErrorCode {
  const backendCode = error.response?.data?.error;
  if (typeof backendCode === 'string') return backendCode as AuthenticationErrorCode;

  if (isNetworkError(error)) return 'NETWORK_ERROR' as AuthenticationErrorCode;
  if (error.code === 'ECONNABORTED') return 'REQUEST_TIMEOUT' as AuthenticationErrorCode;

  return 'UNKNOWN_ERROR' as AuthenticationErrorCode;
}

/**
 * Response interceptor
 * - Maneja refresh de tokens automático en 401 (excepto en rutas de authentication)
 * - La cookie refresh_token se envía automáticamente gracias a withCredentials: true
 * - La llamada a /authentication/refresh NO lleva Authorization header (es un endpoint público)
 * - Transforma errores al formato ApiError
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    // Re-throw cancelled requests without transformation — callers use
    // axios.isCancel() to detect AbortController cancellations and must
    // receive the original CanceledError, not a transformed ApiError.
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // NO hacer refresh automático en rutas de autenticación
    // El 401 en /authentication/sign-in es "credenciales inválidas", no "token expirado"
    if (isAuthRoute(originalRequest?.url)) {
      const errorCode = resolveErrorCode(error);
      const backendError = (error.response?.data ?? {}) as Partial<ApiError>;
      const apiError: ApiError = {
        ...backendError,
        statusCode: error.response?.status || 500,
        message:
          typeof backendError.message === 'string'
            ? backendError.message
            : /* istanbul ignore next */ error.message || 'An unexpected error occurred',
        error: errorCode,
      };
      return Promise.reject(apiError);
    }

    // Si es 401 y no es un retry, intentar refresh via cookie httpOnly
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // executeRefresh() is the single entry point for ALL refresh calls.
        // If hydrateAuth or another 401 already started a refresh, this call
        // piggybacks on the in-flight promise — no duplicate POST.
        const accessToken = await executeRefresh();

        // Strip the original AbortSignal before retrying — in React 19 StrictMode
        // the signal from the first mount's AbortController is already aborted by the
        // time the refresh completes, causing the retry to fail with CanceledError.
        const retryConfig = { ...originalRequest, signal: undefined };
        /* istanbul ignore next 3 */
        if (retryConfig.headers) {
          retryConfig.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(retryConfig);
      } catch (refreshError) {
        // Refresh falló (cookie expirada o inválida) → limpiar estado y redirigir a login
        clearAuthStorage();
        window.location.href = '/authentication/sign-in';
        return Promise.reject(refreshError);
      }
    }

    // Transformar error al formato ApiError
    const errorCode = resolveErrorCode(error);
    const backendError = (error.response?.data ?? {}) as Partial<ApiError>;
    const apiError: ApiError = {
      ...backendError,
      statusCode: error.response?.status || 500,
      message:
        typeof backendError.message === 'string'
          ? backendError.message
          : error.message || 'An unexpected error occurred',
      error: errorCode,
    };

    return Promise.reject(apiError);
  },
);

export default api;
