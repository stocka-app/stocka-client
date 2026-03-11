import { useAuthenticationStore } from '../store/authentication.store';

export function useAuthentication() {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    errorCode,
    login,
    register,
    logout,
    clearError,
    setPendingVerificationEmail,
  } = useAuthenticationStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    errorCode,
    login,
    register,
    logout,
    clearError,
    setPendingVerificationEmail,
  };
}
