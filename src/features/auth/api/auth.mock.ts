import type { LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth.types'

// Simula delay de red (800-1500ms)
const simulateNetworkDelay = () =>
  new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700))

// Mock login - simula validación de credenciales
export async function mockLogin(credentials: LoginCredentials): Promise<AuthResponse> {
  await simulateNetworkDelay()

  // Simula error para credenciales inválidas
  if (credentials.password.length < 8) {
    throw new Error('Invalid credentials')
  }

  // Simula usuario demo
  const isEmail = credentials.emailOrUsername.includes('@')
  
  return {
    user: {
      id: 'user-123',
      email: isEmail ? credentials.emailOrUsername : `${credentials.emailOrUsername}@stocka.com`,
      username: isEmail ? credentials.emailOrUsername.split('@')[0] : credentials.emailOrUsername,
      createdAt: new Date().toISOString(),
    },
    accessToken: 'mock-jwt-token-' + Date.now(),
    refreshToken: 'mock-refresh-token-' + Date.now(),
  }
}

// Mock register - simula creación de cuenta
export async function mockRegister(credentials: RegisterCredentials): Promise<AuthResponse> {
  await simulateNetworkDelay()

  // Simula error si email ya existe
  if (credentials.email === 'test@test.com') {
    throw new Error('Email already registered')
  }

  // Simula error si username ya existe
  if (credentials.username === 'admin') {
    throw new Error('Username already taken')
  }

  return {
    user: {
      id: 'user-' + Date.now(),
      email: credentials.email,
      username: credentials.username,
      createdAt: new Date().toISOString(),
    },
    accessToken: 'mock-jwt-token-' + Date.now(),
    refreshToken: 'mock-refresh-token-' + Date.now(),
  }
}
