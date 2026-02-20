import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiError, AuthErrorCode } from '@/features/auth/types/auth.types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Nombre de la clave de persistencia de Zustand
const AUTH_STORAGE_KEY = 'auth-storage'

/**
 * Cliente HTTP configurado para el backend de Stocka
 */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Obtiene el estado de autenticación del localStorage (Zustand persist)
 */
function getAuthState(): { accessToken?: string; refreshToken?: string } | null {
  try {
    const authStorage = localStorage.getItem(AUTH_STORAGE_KEY)
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      return parsed.state || null
    }
  } catch {
    // Error al parsear, ignorar
  }
  return null
}

/**
 * Actualiza los tokens en el localStorage (Zustand persist)
 */
function updateTokensInStorage(accessToken: string, refreshToken: string): void {
  try {
    const authStorage = localStorage.getItem(AUTH_STORAGE_KEY)
    if (authStorage) {
      const parsed = JSON.parse(authStorage)
      parsed.state = {
        ...parsed.state,
        accessToken,
        refreshToken,
      }
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(parsed))
    }
  } catch {
    // Error al actualizar, ignorar
  }
}

/**
 * Limpia el estado de autenticación del localStorage
 */
function clearAuthStorage(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

/**
 * Request interceptor
 * - Agrega el token de acceso a las peticiones
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authState = getAuthState()
    if (authState?.accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${authState.accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Rutas de autenticación que NO deben manejar 401 automáticamente
 * (el 401 en estas rutas es un error de credenciales, no de token expirado)
 */
const AUTH_ROUTES = ['/auth/sign-in', '/auth/sign-up', '/auth/verify-email']

/**
 * Verifica si la URL es una ruta de autenticación
 */
function isAuthRoute(url?: string): boolean {
  if (!url) return false
  return AUTH_ROUTES.some((route) => url.includes(route))
}

/**
 * Response interceptor
 * - Maneja refresh de tokens automático en 401 (excepto en rutas de auth)
 * - Transforma errores al formato ApiError
 */
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }

    // NO hacer refresh automático en rutas de autenticación
    // El 401 en /auth/sign-in es "credenciales inválidas", no "token expirado"
    if (isAuthRoute(originalRequest?.url)) {
      // Transformar error al formato ApiError y dejarlo pasar
      // Siempre incluir statusCode del HTTP response, incluso si el backend no lo envía
      const backendError = (error.response?.data ?? {}) as Partial<ApiError>;
      const apiError: ApiError = {
        statusCode: error.response?.status || 500,
        message: typeof backendError.message === 'string' ? backendError.message : error.message || 'An unexpected error occurred',
        error: typeof backendError.error === 'string' ? backendError.error : ('UNKNOWN_ERROR' as AuthErrorCode),
        ...backendError,
      };
      return Promise.reject(apiError)
    }

    // Si es 401 y no es un retry, intentar refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const authState = getAuthState()
      if (authState?.refreshToken) {
        try {
          // Intentar renovar el token
          const response = await axios.post(`${API_URL}/auth/refresh-session`, {
            refreshToken: authState.refreshToken,
          })

          const { accessToken, refreshToken } = response.data

          // Actualizar tokens en localStorage
          updateTokensInStorage(accessToken, refreshToken)

          // Reintentar la petición original con el nuevo token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }
          return api(originalRequest)
        } catch (refreshError) {
          // Refresh falló, limpiar estado y redirigir a login
          clearAuthStorage()
          window.location.href = '/auth/login'
          return Promise.reject(refreshError)
        }
      } else {
        // No hay refresh token, redirigir a login
        clearAuthStorage()
        window.location.href = '/auth/login'
      }
    }

    // Transformar error al formato ApiError
    // Siempre incluir statusCode del HTTP response, incluso si el backend no lo envía
    const backendError = (error.response?.data ?? {}) as Partial<ApiError>;
    const apiError: ApiError = {
      statusCode: error.response?.status || 500,
      message: typeof backendError.message === 'string' ? backendError.message : error.message || 'An unexpected error occurred',
      error: typeof backendError.error === 'string' ? backendError.error : ('UNKNOWN_ERROR' as AuthErrorCode),
      ...backendError,
    };

    return Promise.reject(apiError)
  }
)

export default api
