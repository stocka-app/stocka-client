// =============================================================================
// RE-EXPORT CONTRACT TYPES FROM ZOD SCHEMAS
// =============================================================================

export type {
  // Request types
  SignInRequest,
  SignUpRequest,
  VerifyEmailRequest,
  ResendVerificationCodeRequest,
  RefreshSessionRequest,
  SignOutRequest,
  // Response types
  BackendUser,
  SignUpResponse,
  SignInResponse,
  RefreshSessionResponse,
  GetMeResponse,
  VerifyEmailResponse,
  ResendVerificationCodeResponse,
  ApiErrorResponse,
  // Form types
  LoginFormData,
  RegisterFormData,
} from '../schemas/auth.schema'

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
 * Usuario con información completa (usado en el frontend)
 */
export interface User {
  id: string // UUID
  email: string
  username: string
  status: UserStatus
  createdAt: string // ISO 8601
}

// =============================================================================
// LEGACY CREDENTIAL INTERFACES (para compatibilidad)
// =============================================================================

/**
 * Credenciales para login
 * @deprecated Usar SignInRequest de schemas
 */
export interface LoginCredentials {
  emailOrUsername: string
  password: string
}

/**
 * Credenciales para registro
 * @deprecated Usar SignUpRequest de schemas
 */
export interface RegisterCredentials {
  email: string
  username: string
  password: string
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
  | 'EMAIL_NOT_VERIFIED'
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
 * Incluye campos de metadata específicos según el tipo de error
 */
export interface ApiError {
  statusCode: number
  message: string
  error: AuthErrorCode
  details?: Array<{
    field: string
    message: string
  }>
  // Campos de metadata según el tipo de error
  attemptsRemaining?: number // TOO_MANY_VERIFICATION_ATTEMPTS
  minutesRemaining?: number // VERIFICATION_BLOCKED
  blockedUntil?: string // VERIFICATION_BLOCKED (ISO string)
  canVerify?: boolean // EMAIL_ALREADY_EXISTS (cuando status es pending_verification)
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
  verificationCodeSentAt: string | null // ISO timestamp de cuando se envió el código

  // Información de bloqueo
  blockInfo: BlockInfo | null

  // Indica si el email existente puede ser verificado (pending_verification)
  canVerifyExistingEmail: boolean
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
  resendVerificationCode: () => Promise<{ success: boolean; message: string; cooldownSeconds?: number; remainingResends?: number }>

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
  setPendingVerificationEmail: (email: string | null) => void
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
