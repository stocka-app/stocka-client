export interface User {
  id: string
  email: string
  username: string
  createdAt: string
}

export interface LoginCredentials {
  emailOrUsername: string
  password: string
}

export interface RegisterCredentials {
  email: string
  username: string
  password: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  clearError: () => void
  setLoading: (loading: boolean) => void
}

export type AuthStore = AuthState & AuthActions
