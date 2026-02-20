import type { SignInResponse, SignUpResponse } from '../schemas/auth.schema';
import type { LoginCredentials, RegisterCredentials } from '../types/auth.types';

// Simula delay de red (800-1500ms)
const simulateNetworkDelay = () =>
  new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

/**
 * Mock login - simula validación de credenciales
 * Retorna la estructura igual que el backend real: { data: { user, accessToken, refreshToken }, success: true }
 */
export async function mockLogin(credentials: LoginCredentials): Promise<SignInResponse> {
  await simulateNetworkDelay();

  // Simula error para credenciales inválidas
  if (credentials.password.length < 8) {
    throw new Error('Invalid credentials');
  }

  // Simula usuario demo (estructura igual al backend)
  const isEmail = credentials.emailOrUsername.includes('@');

  return {
    data: {
      user: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        email: isEmail ? credentials.emailOrUsername : `${credentials.emailOrUsername}@stocka.com`,
        username: isEmail ? credentials.emailOrUsername.split('@')[0] : credentials.emailOrUsername,
        createdAt: new Date().toISOString(),
      },
      accessToken: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      emailVerificationRequired: false, // Mock: usuario verificado
    },
    success: true,
  };
}

/**
 * Mock register - simula creación de cuenta
 * Retorna la estructura igual que el backend real: { data: { user, accessToken, refreshToken }, success: true }
 */
export async function mockRegister(credentials: RegisterCredentials): Promise<SignUpResponse> {
  await simulateNetworkDelay();

  // Simula error si email ya existe
  if (credentials.email === 'test@test.com') {
    throw new Error('Email already registered');
  }

  // Simula error si username ya existe
  if (credentials.username === 'admin') {
    throw new Error('Username already taken');
  }

  return {
    data: {
      user: {
        id: `${crypto.randomUUID()}`,
        email: credentials.email,
        username: credentials.username,
        createdAt: new Date().toISOString(),
      },
      accessToken: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
    },
    success: true,
  };
}
