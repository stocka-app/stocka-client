// =============================================================================
// USER STATUS & TYPES
// =============================================================================

/**
 * Estados de usuario del backend
 */
export type UserStatus =
  | 'pending_verification' // Registro manual, esperando verificación de email
  | 'active' // Usuario verificado manualmente
  | 'email_verified_by_provider' // Login social (acceso inmediato)
  | 'archived' // Usuario archivado/desactivado
  | 'blocked' // Usuario bloqueado

/**
 * Usuario con información completa
 */
export interface User {
  id: string // UUID
  email: string
  username: string
  status: UserStatus
  createdAt: string // ISO 8601
}

// =============================================================================
// AUTHENTICATION CREDENTIALS
// =============================================================================

/**
 * Credenciales para login
 */
export interface LoginCredentials {
  emailOrUsername: string
  password: string
}

/**
 * Credenciales para registro
 */
export interface RegisterCredentials {
  email: string
  username: string
  password: string
}

// =============================================================================
// API RESPONSES
// =============================================================================

/**
 * Response base de autenticación
 */
export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

/**
 * Response de Sign Up
 * - emailVerificationRequired siempre es true para registro manual
 */
export interface SignUpResponse extends AuthResponse {
  emailVerificationRequired: true
}

/**
 * Response de Sign In
 * - emailVerificationRequired es true si status === 'pending_verification'
 */
export interface SignInResponse extends AuthResponse {
  emailVerificationRequired: boolean
}

/**
 * Response de Social Login
 * - emailVerificationRequired siempre es false
 */
export interface SocialSignInResponse extends AuthResponse {
  emailVerificationRequired: false
}

/**
 * Response de refresh token
 */
export interface RefreshSessionResponse {
  accessToken: string
  refreshToken: string
}

// =============================================================================
// EMAIL VERIFICATION
// =============================================================================

/**
 * Request para verificar email
 */
export interface VerifyEmailRequest {
  email: string
  code: string // 6 caracteres alfanuméricos
}

/**
 * Response de verificación de email
 */
export interface VerifyEmailResponse {
  success: boolean
  message: string
}

/**
 * Request para reenviar código de verificación
 */
export interface ResendVerificationCodeRequest {
  email: string
}

/**
 * Response de reenvío de código
 */
export interface ResendVerificationCodeResponse {
  success: boolean
  message: string
  cooldownSeconds?: number // Segundos hasta poder reenviar
  remainingResends?: number // Reenvíos restantes en la hora actual
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Códigos de error del backend
 */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_EXISTS'
  | 'USERNAME_ALREADY_EXISTS'
  | 'INVALID_VERIFICATION_CODE'
  | 'VERIFICATION_CODE_EXPIRED'
  | 'TOO_MANY_VERIFICATION_ATTEMPTS'
  | 'VERIFICATION_BLOCKED'
  | 'RESEND_COOLDOWN_ACTIVE'
  | 'MAX_RESENDS_EXCEEDED'
  | 'USER_ALREADY_VERIFIED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'ACCOUNT_DEACTIVATED'
  | 'TOKEN_EXPIRED'
  | 'UNKNOWN_ERROR'

/**
 * Error de API estandarizado del backend
 */
export interface ApiError {
  statusCode: number
  message: string
  error: AuthErrorCode
  details?: Array<{
    field: string
    message: string
  }>
}

/**
 * Información de bloqueo por intentos
 */
export interface BlockInfo {
  isBlocked: boolean
  blockedUntil?: Date
  attemptsRemaining?: number
  reason?: 'attempts' | 'rate_limit'
}

// =============================================================================
// STATE MANAGEMENT
// =============================================================================

/**
 * Estado de autenticación para Zustand store
 */
export interface AuthState {
  // Usuario y tokens
  user: User | null
  accessToken: string | null
  refreshToken: string | null

  // Estados de UI
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  errorCode: AuthErrorCode | null

  // Verificación de email
  emailVerificationRequired: boolean
  pendingVerificationEmail: string | null

  // Información de bloqueo
  blockInfo: BlockInfo | null
}

/**
 * Resultado de login/register
 */
export interface AuthResult {
  requiresVerification: boolean
}

/**
 * Acciones del store de autenticación
 */
export interface AuthActions {
  // Autenticación
  login: (credentials: LoginCredentials) => Promise<AuthResult>
  register: (credentials: RegisterCredentials) => Promise<AuthResult>
  logout: () => Promise<void>

  // Verificación de email
  verifyEmail: (code: string) => Promise<void>
  resendVerificationCode: () => Promise<ResendVerificationCodeResponse>

  // OAuth
  handleOAuthCallback: (tokens: {
    accessToken: string
    refreshToken: string
    user: User
  }) => void

  // Utilidades
  setUser: (user: User | null) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
  setBlockInfo: (blockInfo: BlockInfo | null) => void
  resetAuthState: () => void
}

/**
 * Store completo de autenticación
 */
export type AuthStore = AuthState & AuthActions

// =============================================================================
// OAUTH
// =============================================================================

/**
 * Proveedores de OAuth soportados
 * - Google: OAuth 2.0
 * - Facebook: OAuth
 * - Microsoft: Azure AD OAuth
 *
 * Nota: Apple está deshabilitado en el backend
 */
export type OAuthProvider = 'google' | 'facebook' | 'microsoft'

/**
 * Parámetros de callback de OAuth
 */
export interface OAuthCallbackParams {
  accessToken?: string
  refreshToken?: string
  user?: string // JSON stringified User
  error?: string
  errorCode?: AuthErrorCode
}
