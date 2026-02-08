import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authService } from '../api/auth.service'
import type {
  AuthStore,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
  User,
  ApiError,
  AuthResult,
  ResendVerificationCodeResponse,
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

  // Información de bloqueo
  blockInfo: null,
}

/**
 * Store de autenticación con Zustand
 *
 * Maneja:
 * - Login y registro con API real
 * - Verificación de email
 * - OAuth social
 * - Persistencia en localStorage
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
        set({ isLoading: true, error: null, errorCode: null })
        try {
          const response = await authService.signIn(credentials)

          // Verificar si necesita verificación de email
          if (response.emailVerificationRequired) {
            set({
              isLoading: false,
              emailVerificationRequired: true,
              pendingVerificationEmail: response.user.email,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              user: response.user,
              isAuthenticated: false, // No autenticado hasta verificar
            })
            return { requiresVerification: true }
          }

          // Login exitoso sin verificación pendiente
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            emailVerificationRequired: false,
            pendingVerificationEmail: null,
            error: null,
            errorCode: null,
          })
          return { requiresVerification: false }
        } catch (error) {
          const apiError = error as ApiError
          set({
            error: apiError.message || 'Login failed',
            errorCode: apiError.error || 'UNKNOWN_ERROR',
            isLoading: false,
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
          const response = await authService.signUp(credentials)

          // Registro exitoso - siempre requiere verificación
          set({
            isLoading: false,
            emailVerificationRequired: true,
            pendingVerificationEmail: response.user.email,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            user: response.user,
            isAuthenticated: false,
          })
          return { requiresVerification: true }
        } catch (error) {
          const apiError = error as ApiError
          set({
            error: apiError.message || 'Registration failed',
            errorCode: apiError.error || 'UNKNOWN_ERROR',
            isLoading: false,
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

          // Manejar información de bloqueo si existe
          let blockInfo: BlockInfo | null = null
          if (apiError.error === 'VERIFICATION_BLOCKED') {
            // Extraer tiempo de bloqueo del mensaje si está disponible
            blockInfo = {
              isBlocked: true,
              reason: 'attempts',
            }
          } else if (apiError.error === 'TOO_MANY_VERIFICATION_ATTEMPTS') {
            // Extraer intentos restantes si están en el mensaje
            const match = apiError.message?.match(/(\d+)\s*attempts?\s*remaining/i)
            blockInfo = {
              isBlocked: false,
              attemptsRemaining: match ? parseInt(match[1]) : undefined,
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
      resendVerificationCode: async (): Promise<ResendVerificationCodeResponse> => {
        const { pendingVerificationEmail } = get()
        if (!pendingVerificationEmail) {
          throw new Error('No email pending verification')
        }

        set({ isLoading: true, error: null, errorCode: null })
        try {
          const response = await authService.resendVerificationCode({
            email: pendingVerificationEmail,
          })
          set({ isLoading: false })
          return response
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
      }),
    }
  )
)
