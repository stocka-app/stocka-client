import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, AuthErrorCode } from '@/features/auth/types/auth.types';
import { env } from './env';
import i18n from './i18n';

const API_URL = env.VITE_API_URL;

// In-memory access token — not persisted to localStorage (XSS mitigation)
let inMemoryAccessToken: string | null = null;

/**
 * Updates the in-memory access token.
 * Called by the auth store whenever the token changes.
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
const AUTH_STORAGE_KEY = 'auth-storage';

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
  (error) => Promise.reject(error),
);

/**
 * Rutas de autenticación que NO deben manejar 401 automáticamente
 * (el 401 en estas rutas es un error de credenciales, no de token expirado)
 */
const AUTH_ROUTES = ['/auth/sign-in', '/auth/sign-up', '/auth/verify-email'];

/**
 * Verifica si la URL es una ruta de autenticación
 */
function isAuthRoute(url?: string): boolean {
  if (!url) return false;
  return AUTH_ROUTES.some((route) => url.includes(route));
}

/**
 * Response interceptor
 * - Maneja refresh de tokens automático en 401 (excepto en rutas de auth)
 * - La cookie refresh_token se envía automáticamente gracias a withCredentials: true
 * - La llamada a /auth/refresh NO lleva Authorization header (es un endpoint público)
 * - Transforma errores al formato ApiError
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // NO hacer refresh automático en rutas de autenticación
    // El 401 en /auth/sign-in es "credenciales inválidas", no "token expirado"
    if (isAuthRoute(originalRequest?.url)) {
      const backendError = (error.response?.data ?? {}) as Partial<ApiError>;
      const apiError: ApiError = {
        statusCode: error.response?.status || 500,
        message:
          typeof backendError.message === 'string'
            ? backendError.message
            : error.message || 'An unexpected error occurred',
        error:
          typeof backendError.error === 'string'
            ? backendError.error
            : ('UNKNOWN_ERROR' as AuthErrorCode),
        ...backendError,
      };
      return Promise.reject(apiError);
    }

    // Si es 401 y no es un retry, intentar refresh via cookie httpOnly
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // La cookie refresh_token se envía automáticamente por el navegador.
        // No incluir Authorization header — este endpoint es público.
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        // El backend devuelve { data: { accessToken }, success: true }
        const responseData = response.data?.data ?? response.data;
        const { accessToken } = responseData;
        inMemoryAccessToken = accessToken;

        // Reintentar la petición original con el nuevo access token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falló (cookie expirada o inválida) → limpiar estado y redirigir a login
        clearAuthStorage();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    // Transformar error al formato ApiError
    const backendError = (error.response?.data ?? {}) as Partial<ApiError>;
    const apiError: ApiError = {
      statusCode: error.response?.status || 500,
      message:
        typeof backendError.message === 'string'
          ? backendError.message
          : error.message || 'An unexpected error occurred',
      error:
        typeof backendError.error === 'string'
          ? backendError.error
          : ('UNKNOWN_ERROR' as AuthErrorCode),
      ...backendError,
    };

    return Promise.reject(apiError);
  },
);

export default api;
