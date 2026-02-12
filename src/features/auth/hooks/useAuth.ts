import { useAuthStore } from '../store/auth.store'

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    errorCode,
    canVerifyExistingEmail,
    login,
    register,
    logout,
    clearError,
    setPendingVerificationEmail,
  } = useAuthStore()

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    errorCode,
    canVerifyExistingEmail,
    login,
    register,
    logout,
    clearError,
    setPendingVerificationEmail,
  }
}
