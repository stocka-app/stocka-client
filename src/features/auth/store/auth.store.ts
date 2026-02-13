import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { ZodError } from 'zod'
import { authService } from '../api/auth.service'
import type {
  AuthStore,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  User,
  ApiError,
  AuthResult,
  BlockInfo,
} from '../types/auth.types'

/**
 * Estado inicial de autenticación
 */
const initialState: AuthState = {
  // Usuario y tokens
  user: null,
  accessToken: null,
  refreshToken: null,

  // Estados de UI
  isAuthenticated: false,
  isLoading: false,
  error: null,
  errorCode: null,

  // Verificación de email
  emailVerificationRequired: false,
  pendingVerificationEmail: null,
  verificationCodeSentAt: null,

  // Información de bloqueo
  blockInfo: null,

  // Indica si el email existente puede ser verificado (pending_verification)
  canVerifyExistingEmail: false,
}

/**
 * Store de autenticación con Zustand
 *
 * Maneja:
 * - Login y registro con API real
 * - Verificación de email
 * - OAuth social
 * - Persistencia en localStorage
 * - Validación de respuestas con Zod
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Iniciar sesión
       * - Si el usuario no ha verificado su email, establece emailVerificationRequired
       */
      login: async (credentials: LoginCredentials): Promise<AuthResult> => {
        set({ isLoading: true, error: null, errorCode: null, blockInfo: null })
        try {
          // authService valida la respuesta con Zod automáticamente
          const response = await authService.signIn(credentials)

          // Extraer datos de la estructura { data: { user, accessToken, refreshToken, emailVerificationRequired } }
          const { user: backendUser, accessToken, refreshToken, emailVerificationRequired } = response.data

          // Construir usuario con status basado en emailVerificationRequired
          const user: User = {
            id: backendUser.id,
            email: backendUser.email,
            username: backendUser.username,
            status: emailVerificationRequired ? 'pending_verification' : 'active',
            createdAt: backendUser.createdAt,
          }

          // Verificar si necesita verificación de email (no permitir acceso si está pendiente)
          const needsVerification = emailVerificationRequired === true

          if (needsVerification) {
            set({
              isLoading: false,
              emailVerificationRequired: true,
              pendingVerificationEmail: user.email,
              accessToken,
              refreshToken,
              user,
              isAuthenticated: false, // No autenticado hasta verificar
            })
            return { requiresVerification: true }
          }

          // Login exitoso sin verificación pendiente
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            emailVerificationRequired: false,
            pendingVerificationEmail: null,
            error: null,
            errorCode: null,
          })
          return { requiresVerification: false }
        } catch (error) {
          // Manejar diferentes tipos de errores
          let errorMessage = 'UNKNOWN_ERROR'
          let errorCode: ApiError['error'] = 'UNKNOWN_ERROR'

          // Error de validación Zod (respuesta inválida del servidor)
          if (error instanceof ZodError) {
            console.error('Invalid sign-in response structure:', error.issues)
            errorMessage = 'UNKNOWN_ERROR'
          } else if (error instanceof Error) {
            errorMessage = error.message
          }

          // Si es un error de API con estructura conocida
          const apiError = error as ApiError
          if (apiError?.error) {
            errorCode = apiError.error
          }
          if (apiError?.message) {
            errorMessage = apiError.message
          }

          // Caso especial: EMAIL_NOT_VERIFIED - guardar email para verificación
          // El email se guardará desde el LoginForm ya que el error no contiene el email
          if (errorCode === 'EMAIL_NOT_VERIFIED') {
            set({
              error: errorMessage,
              errorCode: errorCode,
              isLoading: false,
              emailVerificationRequired: true,
              // pendingVerificationEmail se establecerá desde LoginForm
            })
            throw error
          }

          // Manejar errores de rate limiting
          let blockInfo: BlockInfo | null = null

          // Cuenta bloqueada por intentos fallidos (Interceptor post-ejecución)
          if (errorCode === 'ACCOUNT_TEMPORARILY_LOCKED') {
            blockInfo = {
              isBlocked: true,
              reason: 'account_locked',
              blockedUntil: apiError.blockedUntil ? new Date(apiError.blockedUntil) : undefined,
            }
          }

          // Rate limit por IP o identifier (Guard pre-ejecución)
          if (errorCode === 'RATE_LIMIT_EXCEEDED') {
            blockInfo = {
              isBlocked: true,
              reason: 'rate_limit',
            }
          }

          // Throttle HTTP genérico (429 sin error code específico)
          if (apiError.statusCode === 429 && !blockInfo) {
            blockInfo = {
              isBlocked: true,
              reason: 'rate_limit',
            }
          }

          set({
            error: errorMessage,
            errorCode: errorCode,
            isLoading: false,
            blockInfo,
          })
          throw error
        }
      },

      /**
       * Registrar nuevo usuario
       * - Siempre requiere verificación de email para registro manual
       */
      register: async (credentials: RegisterCredentials): Promise<AuthResult> => {
        set({ isLoading: true, error: null, errorCode: null })
        try {
          // authService valida la respuesta con Zod automáticamente
          const response = await authService.signUp(credentials)

          // Extraer datos de la estructura { data: { user, accessToken, refreshToken } }
          const { user: backendUser, accessToken, refreshToken } = response.data

          // Construir usuario con status pending_verification
          const user: User = {
            id: backendUser.id,
            email: backendUser.email,
            username: backendUser.username,
            status: 'pending_verification', // Siempre pending para registro manual
            createdAt: backendUser.createdAt,
          }

          // Registro exitoso - siempre requiere verificación para registro manual
          set({
            isLoading: false,
            emailVerificationRequired: true, // Siempre true para registro manual
            pendingVerificationEmail: user.email,
            verificationCodeSentAt: new Date().toISOString(), // Guardar cuando se envió el código
            accessToken,
            refreshToken,
            user,
            isAuthenticated: false,
          })
          return { requiresVerification: true }
        } catch (error) {
          // Manejar diferentes tipos de errores
          let errorMessage = 'UNKNOWN_ERROR'
          let errorCode: ApiError['error'] = 'UNKNOWN_ERROR'

          // Error de validación Zod (respuesta inválida del servidor)
          if (error instanceof ZodError) {
            console.error('Invalid sign-up response structure:', error.issues)
            errorMessage = 'UNKNOWN_ERROR'
          } else if (error instanceof Error) {
            errorMessage = error.message
          }

          // Si es un error de API con estructura conocida
          const apiError = error as ApiError
          if (apiError?.error) {
            errorCode = apiError.error
          }
          if (apiError?.message) {
            errorMessage = apiError.message
          }

          // Si el error es EMAIL_ALREADY_EXISTS, verificar si puede ser verificado
          const canVerifyExistingEmail = errorCode === 'EMAIL_ALREADY_EXISTS' && apiError.canVerify === true

          set({
            error: errorMessage,
            errorCode: errorCode,
            isLoading: false,
            canVerifyExistingEmail,
          })
          throw error
        }
      },

      /**
       * Verificar email con código de 6 dígitos
       */
      verifyEmail: async (code: string): Promise<void> => {
        const { pendingVerificationEmail } = get()
        if (!pendingVerificationEmail) {
          throw new Error('No email pending verification')
        }

        set({ isLoading: true, error: null, errorCode: null, blockInfo: null })
        try {
          await authService.verifyEmail({
            email: pendingVerificationEmail,
            code,
          })

          // Verificación exitosa - autenticar completamente
          const currentUser = get().user
          set({
            isAuthenticated: true,
            emailVerificationRequired: false,
            pendingVerificationEmail: null,
            isLoading: false,
            user: currentUser ? { ...currentUser, status: 'active' } : null,
          })
        } catch (error) {
          const apiError = error as ApiError

          // Manejar información de bloqueo usando campos de metadata del backend
          let blockInfo: BlockInfo | null = null
          if (apiError.error === 'VERIFICATION_BLOCKED') {
            blockInfo = {
              isBlocked: true,
              reason: 'attempts',
              // Usar campos de metadata directamente del error
              blockedUntil: apiError.blockedUntil ? new Date(apiError.blockedUntil) : undefined,
            }
          } else if (apiError.error === 'TOO_MANY_VERIFICATION_ATTEMPTS') {
            blockInfo = {
              isBlocked: false,
              // Usar attemptsRemaining directamente del error
              attemptsRemaining: apiError.attemptsRemaining,
            }
          }

          set({
            error: apiError.message || 'Verification failed',
            errorCode: apiError.error || 'UNKNOWN_ERROR',
            isLoading: false,
            blockInfo,
          })
          throw error
        }
      },

      /**
       * Reenviar código de verificación
       */
      resendVerificationCode: async () => {
        const { pendingVerificationEmail } = get()
        if (!pendingVerificationEmail) {
          throw new Error('No email pending verification')
        }

        set({ isLoading: true, error: null, errorCode: null })
        try {
          const response = await authService.resendVerificationCode({
            email: pendingVerificationEmail,
          })
          // Actualizar timestamp cuando se reenvía el código
          set({
            isLoading: false,
            verificationCodeSentAt: new Date().toISOString(),
          })
          // Extraer datos de la estructura { data: { success, message, ... } }
          return response.data
        } catch (error) {
          const apiError = error as ApiError
          set({
            error: apiError.message || 'Failed to resend code',
            errorCode: apiError.error || 'UNKNOWN_ERROR',
            isLoading: false,
          })
          throw error
        }
      },

      /**
       * Cerrar sesión
       * - Intenta invalidar el token en el servidor
       * - Siempre limpia el estado local
       */
      logout: async (): Promise<void> => {
        const { refreshToken } = get()
        try {
          if (refreshToken) {
            await authService.signOut(refreshToken)
          }
        } catch {
          // Ignorar errores de logout - siempre limpiar estado local
        } finally {
          set(initialState)
        }
      },

      /**
       * Manejar callback de OAuth
       * - Establece el estado de autenticación desde los tokens recibidos
       */
      handleOAuthCallback: (tokens: {
        accessToken: string
        refreshToken: string
        user: User
      }): void => {
        set({
          user: tokens.user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          emailVerificationRequired: false,
          pendingVerificationEmail: null,
          error: null,
          errorCode: null,
          blockInfo: null,
        })
      },

      /**
       * Establecer usuario
       */
      setUser: (user: User | null): void => {
        set({ user })
      },

      /**
       * Limpiar error
       */
      clearError: (): void => {
        set({ error: null, errorCode: null })
      },

      /**
       * Establecer estado de carga
       */
      setLoading: (isLoading: boolean): void => {
        set({ isLoading })
      },

      /**
       * Establecer información de bloqueo
       */
      setBlockInfo: (blockInfo: BlockInfo | null): void => {
        set({ blockInfo })
      },

      /**
       * Establecer email pendiente de verificación
       */
      setPendingVerificationEmail: (email: string | null): void => {
        set({ pendingVerificationEmail: email })
      },

      /**
       * Resetear estado de autenticación
       */
      resetAuthState: (): void => {
        set(initialState)
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Solo persistir estos campos
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        emailVerificationRequired: state.emailVerificationRequired,
        pendingVerificationEmail: state.pendingVerificationEmail,
        verificationCodeSentAt: state.verificationCodeSentAt,
      }),
    }
  )
)
