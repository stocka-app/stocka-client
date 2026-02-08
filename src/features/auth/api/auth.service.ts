import { api } from '@/shared/lib/axios'
import type {
  LoginCredentials,
  RegisterCredentials,
  SignInResponse,
  SignUpResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationCodeRequest,
  ResendVerificationCodeResponse,
  RefreshSessionResponse,
  User,
  OAuthProvider,
} from '../types/auth.types'

/**
 * Servicio de autenticación
 * Conecta con el backend stocka-server
 */
export const authService = {
  /**
   * Registrar nuevo usuario
   * POST /auth/sign-up
   *
   * @returns SignUpResponse con emailVerificationRequired: true
   */
  async signUp(credentials: RegisterCredentials): Promise<SignUpResponse> {
    const response = await api.post<SignUpResponse>('/auth/sign-up', credentials)
    return response.data
  },

  /**
   * Iniciar sesión
   * POST /auth/sign-in
   *
   * @returns SignInResponse con emailVerificationRequired si el usuario no ha verificado
   */
  async signIn(credentials: LoginCredentials): Promise<SignInResponse> {
    const response = await api.post<SignInResponse>('/auth/sign-in', credentials)
    return response.data
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
   * @returns Nuevos tokens de acceso y refresh
   */
  async refreshSession(refreshToken: string): Promise<RefreshSessionResponse> {
    const response = await api.post<RefreshSessionResponse>('/auth/refresh-session', {
      refreshToken,
    })
    return response.data
  },

  /**
   * Obtener usuario actual
   * GET /auth/me
   *
   * Requiere token de acceso válido
   */
  async getMe(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  },

  /**
   * Verificar email con código de 6 dígitos
   * POST /auth/verify-email
   *
   * @param data - Email y código de verificación
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const response = await api.post<VerifyEmailResponse>('/auth/verify-email', data)
    return response.data
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
    const response = await api.post<ResendVerificationCodeResponse>(
      '/auth/resend-verification-code',
      data
    )
    return response.data
  },

  /**
   * Obtener URL para iniciar OAuth con un proveedor
   *
   * @param provider - 'google' | 'facebook' | 'apple'
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
   * @param provider - 'google' | 'facebook' | 'apple'
   */
  initiateOAuth(provider: OAuthProvider): void {
    const url = this.getOAuthUrl(provider)
    window.location.href = url
  },
}

export default authService
