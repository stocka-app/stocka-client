import { api } from '@/shared/lib/axios'
import {
  SignUpResponseSchema,
  SignInResponseSchema,
  RefreshSessionResponseSchema,
  GetMeResponseSchema,
  VerifyEmailResponseSchema,
  ResendVerificationCodeResponseSchema,
  type SignInRequest,
  type SignUpRequest,
  type SignUpResponse,
  type SignInResponse,
  type RefreshSessionResponse,
  type GetMeResponse,
  type VerifyEmailRequest,
  type VerifyEmailResponse,
  type ResendVerificationCodeRequest,
  type ResendVerificationCodeResponse,
} from '../schemas/auth.schema'
import type { OAuthProvider } from '../types/auth.types'

/**
 * Servicio de autenticación
 * Conecta con el backend stocka-server
 * Usa Zod para validar las respuestas del API
 *
 * NOTA: axios retorna { data: ... }, y dentro de ese data viene la respuesta del backend
 * que tiene estructura: { data: { ... }, success: true }
 */
export const authService = {
  /**
   * Registrar nuevo usuario
   * POST /auth/sign-up
   *
   * @returns SignUpResponse validado con Zod
   */
  async signUp(credentials: SignUpRequest): Promise<SignUpResponse> {
    const response = await api.post('/auth/sign-up', credentials)
    // response.data es la respuesta del backend: { data: { user, ... }, success: true }
    return SignUpResponseSchema.parse(response.data)
  },

  /**
   * Iniciar sesión
   * POST /auth/sign-in
   *
   * @returns SignInResponse validado con Zod
   */
  async signIn(credentials: SignInRequest): Promise<SignInResponse> {
    const response = await api.post('/auth/sign-in', credentials)
    // response.data es la respuesta del backend: { data: { user, ... }, success: true }
    return SignInResponseSchema.parse(response.data)
  },

  /**
   * Cerrar sesión
   * POST /auth/sign-out
   *
   * Invalida el refresh token en el servidor
   */
  async signOut(refreshToken: string): Promise<void> {
    await api.post('/auth/sign-out', { refreshToken })
  },

  /**
   * Renovar sesión con refresh token
   * POST /auth/refresh-session
   *
   * @returns Nuevos tokens de acceso y refresh validados con Zod
   */
  async refreshSession(refreshToken: string): Promise<RefreshSessionResponse> {
    const response = await api.post('/auth/refresh-session', { refreshToken })
    return RefreshSessionResponseSchema.parse(response.data)
  },

  /**
   * Obtener usuario actual
   * GET /auth/me
   *
   * Requiere token de acceso válido
   */
  async getMe(): Promise<GetMeResponse> {
    const response = await api.get('/auth/me')
    return GetMeResponseSchema.parse(response.data)
  },

  /**
   * Verificar email con código de 6 dígitos
   * POST /auth/verify-email
   *
   * @param data - Email y código de verificación
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const response = await api.post('/auth/verify-email', data)
    return VerifyEmailResponseSchema.parse(response.data)
  },

  /**
   * Reenviar código de verificación
   * POST /auth/resend-verification-code
   *
   * @param data - Email del usuario
   * @returns Información de cooldown y resends restantes
   */
  async resendVerificationCode(
    data: ResendVerificationCodeRequest
  ): Promise<ResendVerificationCodeResponse> {
    const response = await api.post('/auth/resend-verification-code', data)
    return ResendVerificationCodeResponseSchema.parse(response.data)
  },

  /**
   * Obtener URL para iniciar OAuth con un proveedor
   *
   * @param provider - 'google' | 'facebook' | 'microsoft'
   * @returns URL completa para redirigir al usuario
   */
  getOAuthUrl(provider: OAuthProvider): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    return `${baseUrl}/auth/${provider}`
  },

  /**
   * Iniciar flujo de OAuth
   * Redirige al usuario al proveedor seleccionado
   *
   * @param provider - 'google' | 'facebook' | 'microsoft'
   */
  initiateOAuth(provider: OAuthProvider): void {
    const url = this.getOAuthUrl(provider)
    window.location.href = url
  },
}

export default authService
