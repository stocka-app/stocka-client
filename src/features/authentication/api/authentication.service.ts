import { api } from '@/shared/lib/axios';
import { env } from '@/shared/lib/env';
import {
  SignUpResponseSchema,
  SignInResponseSchema,
  RefreshSessionResponseSchema,
  GetMeResponseSchema,
  VerifyEmailResponseSchema,
  ResendVerificationCodeResponseSchema,
  ForgotPasswordResponseSchema,
  ResetPasswordResponseSchema,
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
  type ForgotPasswordResponse,
  type ResetPasswordResponse,
} from '../schemas/authentication.schema';

import type { OAuthProvider } from '../types/authentication.types';

/**
 * Servicio de autenticación
 * Conecta con el backend stocka-server
 * Usa Zod para validar las respuestas del API
 *
 * NOTA: axios retorna { data: ... }, y dentro de ese data viene la respuesta del backend
 * que tiene estructura: { data: { ... }, success: true }
 */
export const authenticationService = {
  /**
   * Registrar nuevo usuario
   * POST /authentication/sign-up
   *
   * @returns SignUpResponse validado con Zod
   */
  async signUp(credentials: SignUpRequest): Promise<SignUpResponse> {
    const response = await api.post('/authentication/sign-up', credentials);
    // response.data es la respuesta del backend: { data: { user, ... }, success: true }
    return SignUpResponseSchema.parse(response.data);
  },

  /**
   * Iniciar sesión
   * POST /authentication/sign-in
   *
   * @returns SignInResponse validado con Zod
   */
  async signIn(credentials: SignInRequest): Promise<SignInResponse> {
    const response = await api.post('/authentication/sign-in', credentials);
    // response.data es la respuesta del backend: { data: { user, ... }, success: true }
    return SignInResponseSchema.parse(response.data);
  },

  /**
   * Cerrar sesión
   * POST /authentication/sign-out
   *
   * No requiere body — el refresh_token viaja via httpOnly cookie (withCredentials: true)
   */
  async signOut(): Promise<void> {
    await api.post('/authentication/sign-out');
  },

  /**
   * Renovar sesión
   * POST /authentication/refresh
   *
   * No requiere body — el refresh_token viaja via httpOnly cookie (withCredentials: true)
   * @returns Nuevo access token validado con Zod
   */
  async refreshSession(): Promise<RefreshSessionResponse> {
    const response = await api.post('/authentication/refresh-session');
    return RefreshSessionResponseSchema.parse(response.data);
  },

  /**
   * Obtener usuario actual
   * GET /authentication/me
   *
   * Requiere token de acceso válido
   */
  async getMe(): Promise<GetMeResponse> {
    const response = await api.get('/users/me');
    return GetMeResponseSchema.parse(response.data);
  },

  /**
   * Verificar email con código de 6 dígitos
   * POST /authentication/verify-email
   *
   * @param data - Email y código de verificación
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const response = await api.post('/authentication/verify-email', data);
    return VerifyEmailResponseSchema.parse(response.data);
  },

  /**
   * Reenviar código de verificación
   * POST /authentication/resend-verification-code
   *
   * @param data - Email del usuario
   * @returns Información de cooldown y resends restantes
   */
  async resendVerificationCode(
    data: ResendVerificationCodeRequest,
  ): Promise<ResendVerificationCodeResponse> {
    const response = await api.post('/authentication/resend-verification-code', data);
    return ResendVerificationCodeResponseSchema.parse(response.data);
  },

  /**
   * Solicitar restablecimiento de contraseña
   * POST /authentication/forgot-password
   *
   * Siempre retorna 200 OK (no revela si el email existe)
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await api.post('/authentication/forgot-password', { email });
    return ForgotPasswordResponseSchema.parse(response.data);
  },

  /**
   * Restablecer contraseña con token del email
   * POST /authentication/reset-password
   *
   * @param token - Token plain recibido en el email (query param del link)
   * @param newPassword - Nueva contraseña del usuario
   */
  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    const response = await api.post('/authentication/reset-password', { token, newPassword });
    return ResetPasswordResponseSchema.parse(response.data);
  },

  /**
   * Obtener URL para iniciar OAuth con un proveedor
   *
   * @param provider - 'google' | 'facebook' | 'microsoft'
   * @returns URL completa para redirigir al usuario
   */
  getOAuthUrl(provider: OAuthProvider): string {
    return `${env.VITE_API_URL}/authentication/${provider}`;
  },

  /**
   * Iniciar flujo de OAuth
   * Redirige al usuario al proveedor seleccionado
   *
   * @param provider - 'google' | 'facebook' | 'microsoft'
   */
  initiateOAuth(provider: OAuthProvider): void {
    const url = this.getOAuthUrl(provider);
    window.location.href = url;
  },
};

export default authenticationService;
