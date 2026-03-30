import type {
  SignInRequest,
  SignUpRequest,
  SignInResponse,
  SignUpResponse,
} from '../schemas/authentication.schema';

// Simula delay de red (800-1500ms)
const simulateNetworkDelay = () =>
  new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

/**
 * Mock login - simula validación de credenciales
 * Retorna la estructura igual que el backend real: { data: { user, accessToken }, success: true }
 * El refreshToken ya no viene en el body — el backend lo setea como httpOnly cookie
 */
export async function mockLogin(credentials: SignInRequest): Promise<SignInResponse> {
  await simulateNetworkDelay();

  if (credentials.password.length < 8) {
    throw new Error('Invalid credentials');
  }

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
      emailVerificationRequired: false,
    },
    success: true,
  };
}

/**
 * Mock register - simula creación de cuenta
 * Retorna la estructura igual que el backend real: { data: { user, accessToken }, success: true }
 * El refreshToken ya no viene en el body — el backend lo setea como httpOnly cookie
 */
export async function mockRegister(credentials: SignUpRequest): Promise<SignUpResponse> {
  await simulateNetworkDelay();

  if (credentials.email === 'test@test.com') {
    throw new Error('Email already registered');
  }

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
      emailSent: true,
    },
    success: true,
  };
}
