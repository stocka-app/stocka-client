import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ZodError } from 'zod';
import { authenticationService } from '../api/authentication.service';
import { setAccessToken } from '@/shared/lib/axios';
import type { SignInRequest, SignUpRequest } from '../schemas/authentication.schema';
import type {
  AuthStore,
  AuthState,
  User,
  ApiError,
  AuthResult,
  BlockInfo,
} from '../types/authentication.types';

/**
 * Estado inicial de autenticación
 */
const initialState: AuthState = {
  // Usuario y access token (en memoria — no persistido)
  user: null,
  accessToken: null,
  // refreshToken eliminado — gestionado por el navegador via httpOnly cookie

  // Estados de UI
  isAuthenticated: false,
  isInitializing: true, // true hasta que el silent refresh on mount completa
  isLoading: false,
  error: null,
  errorCode: null,

  // Verificación de email
  emailVerificationRequired: false,
  pendingVerificationEmail: null,
  verificationCodeSentAt: null,

  // Información de bloqueo
  blockInfo: null,
};

/**
 * Store de autenticación con Zustand
 *
 * Maneja:
 * - Login y registro con API real
 * - Verificación de email
 * - OAuth social
 * - Persistencia parcial en localStorage (solo user + estado de verificación)
 * - El accessToken vive solo en memoria; el refreshToken en httpOnly cookie
 */
export const useAuthenticationStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Iniciar sesión
       * - Si el usuario no ha verificado su email, establece emailVerificationRequired
       */
      login: async (credentials: SignInRequest): Promise<AuthResult> => {
        set({ isLoading: true, error: null, errorCode: null, blockInfo: null });
        try {
          const response = await authenticationService.signIn(credentials);

          const {
            user: backendUser,
            accessToken,
            emailVerificationRequired,
          } = response.data;

          const user: User = {
            id: backendUser.id,
            email: backendUser.email,
            username: backendUser.username,
            status: emailVerificationRequired ? 'pending_verification' : 'active',
            createdAt: backendUser.createdAt,
          };

          const needsVerification = emailVerificationRequired === true;

          // Siempre guardar el access token en memoria
          setAccessToken(accessToken);

          if (needsVerification) {
            set({
              isLoading: false,
              emailVerificationRequired: true,
              pendingVerificationEmail: user.email,
              accessToken,
              user,
              isAuthenticated: false, // No autenticado hasta verificar
            });
            return { requiresVerification: true };
          }

          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
            emailVerificationRequired: false,
            pendingVerificationEmail: null,
            error: null,
            errorCode: null,
          });
          return { requiresVerification: false };
        } catch (error) {
          let errorMessage = 'UNKNOWN_ERROR';
          let errorCode: ApiError['error'] = 'UNKNOWN_ERROR';

          if (error instanceof ZodError) {
            console.error('Invalid sign-in response structure:', error.issues);
            errorMessage = 'UNKNOWN_ERROR';
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }

          const apiError = error as ApiError;
          if (apiError?.error) {
            errorCode = apiError.error;
          }
          if (apiError?.message) {
            errorMessage = apiError.message;
          }

          let blockInfo: BlockInfo | null = null;

          if (errorCode === 'ACCOUNT_TEMPORARILY_LOCKED') {
            blockInfo = {
              isBlocked: true,
              reason: 'account_locked',
              blockedUntil: apiError.blockedUntil ? new Date(apiError.blockedUntil) : undefined,
            };
          }

          if (errorCode === 'RATE_LIMIT_EXCEEDED') {
            blockInfo = {
              isBlocked: true,
              reason: 'rate_limit',
            };
          }

          if (apiError.statusCode === 429 && !blockInfo) {
            blockInfo = {
              isBlocked: true,
              reason: 'rate_limit',
            };
          }

          const requiresEmailVerification = errorCode === 'EMAIL_NOT_VERIFIED';

          set({
            error: errorMessage,
            errorCode: errorCode,
            isLoading: false,
            blockInfo,
            emailVerificationRequired: requiresEmailVerification,
          });
          throw error;
        }
      },

      /**
       * Registrar nuevo usuario
       * - Siempre requiere verificación de email para registro manual
       */
      register: async (credentials: SignUpRequest): Promise<AuthResult> => {
        set({ isLoading: true, error: null, errorCode: null });
        try {
          const response = await authenticationService.signUp(credentials);

          const { user: backendUser, accessToken } = response.data;

          const user: User = {
            id: backendUser.id,
            email: backendUser.email,
            username: backendUser.username,
            status: 'pending_verification',
            createdAt: backendUser.createdAt,
          };

          // Guardar el access token en memoria
          setAccessToken(accessToken);

          set({
            isLoading: false,
            emailVerificationRequired: true,
            pendingVerificationEmail: user.email,
            verificationCodeSentAt: new Date().toISOString(),
            accessToken,
            user,
            isAuthenticated: false,
          });
          return { requiresVerification: true };
        } catch (error) {
          let errorMessage = 'UNKNOWN_ERROR';
          let errorCode: ApiError['error'] = 'UNKNOWN_ERROR';

          if (error instanceof ZodError) {
            console.error('Invalid sign-up response structure:', error.issues);
            errorMessage = 'UNKNOWN_ERROR';
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }

          const apiError = error as ApiError;
          if (apiError?.error) {
            errorCode = apiError.error;
          }
          if (apiError?.message) {
            errorMessage = apiError.message;
          }

          set({
            error: errorMessage,
            errorCode: errorCode,
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Verificar email con código de 6 dígitos
       */
      verifyEmail: async (code: string): Promise<void> => {
        const { pendingVerificationEmail } = get();
        if (!pendingVerificationEmail) {
          throw new Error('No email pending verification');
        }

        set({ isLoading: true, error: null, errorCode: null, blockInfo: null });
        try {
          await authenticationService.verifyEmail({
            email: pendingVerificationEmail,
            code,
          });

          const currentUser = get().user;
          set({
            isAuthenticated: true,
            emailVerificationRequired: false,
            pendingVerificationEmail: null,
            isLoading: false,
            user: currentUser ? { ...currentUser, status: 'active' } : null,
          });
        } catch (error) {
          const apiError = error as ApiError;

          let blockInfo: BlockInfo | null = null;
          if (apiError.error === 'VERIFICATION_BLOCKED') {
            blockInfo = {
              isBlocked: true,
              reason: 'attempts',
              blockedUntil: apiError.blockedUntil ? new Date(apiError.blockedUntil) : undefined,
            };
          } else if (apiError.error === 'TOO_MANY_VERIFICATION_ATTEMPTS') {
            blockInfo = {
              isBlocked: false,
              attemptsRemaining: apiError.attemptsRemaining,
            };
          }

          set({
            error: apiError.message || 'Verification failed',
            errorCode: apiError.error || 'UNKNOWN_ERROR',
            isLoading: false,
            blockInfo,
          });
          throw error;
        }
      },

      /**
       * Reenviar código de verificación
       */
      resendVerificationCode: async () => {
        const { pendingVerificationEmail } = get();
        if (!pendingVerificationEmail) {
          throw new Error('No email pending verification');
        }

        set({ isLoading: true, error: null, errorCode: null });
        try {
          const response = await authenticationService.resendVerificationCode({
            email: pendingVerificationEmail,
          });
          set({
            isLoading: false,
            verificationCodeSentAt: new Date().toISOString(),
          });
          return response.data;
        } catch (error) {
          const apiError = error as ApiError;
          set({
            error: apiError.message || 'Failed to resend code',
            errorCode: apiError.error || 'UNKNOWN_ERROR',
            isLoading: false,
          });
          throw error;
        }
      },

      /**
       * Cerrar sesión
       * - La cookie refresh_token se invalida en el servidor automáticamente
       * - Siempre limpia el estado local
       */
      logout: async (): Promise<void> => {
        try {
          // La cookie se envía automáticamente — no necesitamos pasar el token
          await authenticationService.signOut();
        } catch {
          // Ignorar errores de logout — siempre limpiar estado local
        } finally {
          setAccessToken(null);
          set({ ...initialState, isInitializing: false });
        }
      },

      /**
       * Manejar callback de OAuth
       * - El refreshToken ya llegó como httpOnly cookie en el redirect del BE
       * - Aquí solo procesamos el accessToken y el user
       */
      handleOAuthCallback: (tokens: { accessToken: string; user: User }): void => {
        setAccessToken(tokens.accessToken);
        set({
          user: tokens.user,
          accessToken: tokens.accessToken,
          isAuthenticated: true,
          isLoading: false,
          emailVerificationRequired: false,
          pendingVerificationEmail: null,
          error: null,
          errorCode: null,
          blockInfo: null,
        });
      },

      /**
       * Establecer usuario
       */
      setUser: (user: User | null): void => {
        set({ user });
      },

      /**
       * Limpiar error
       */
      clearError: (): void => {
        set({ error: null, errorCode: null });
      },

      /**
       * Establecer estado de carga
       */
      setLoading: (isLoading: boolean): void => {
        set({ isLoading });
      },

      /**
       * Establecer información de bloqueo
       */
      setBlockInfo: (blockInfo: BlockInfo | null): void => {
        set({ blockInfo });
      },

      /**
       * Establecer email pendiente de verificación
       */
      setPendingVerificationEmail: (email: string | null): void => {
        set({ pendingVerificationEmail: email });
      },

      /**
       * Resetear estado de autenticación
       */
      resetAuthState: (): void => {
        setAccessToken(null);
        set({ ...initialState, isInitializing: false });
      },
    }),
    {
      name: 'authentication-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Solo persistir el perfil del usuario y el estado de verificación de email.
        // accessToken vive solo en memoria; refreshToken lo gestiona el navegador via cookie.
        // isAuthenticated e isInitializing se re-establecen via silent refresh on mount.
        user: state.user,
        emailVerificationRequired: state.emailVerificationRequired,
        pendingVerificationEmail: state.pendingVerificationEmail,
        verificationCodeSentAt: state.verificationCodeSentAt,
      }),
    },
  ),
);
