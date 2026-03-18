/**
 * API helper for Playwright e2e tests.
 *
 * Wraps direct HTTP calls to the backend API so that test setup can create
 * users and seed state without going through the browser UI.
 */

const API_BASE = process.env.PW_API_URL ?? 'http://localhost:3001/api';

interface SignUpPayload {
  email: string;
  username: string;
  password: string;
}

interface SignUpResult {
  userId: string;
  accessToken: string;
  emailSent: boolean;
}

/**
 * Registers a new user via the API.
 * Returns the access token (user will still need email verification).
 */
export async function apiSignUp(payload: SignUpPayload): Promise<SignUpResult> {
  const response = await fetch(`${API_BASE}/authentication/sign-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(`[api.helper] sign-up failed (${response.status}): ${body.message ?? 'unknown'}`);
  }

  const body = (await response.json()) as {
    data: { user: { id: string }; accessToken: string; emailSent: boolean };
  };

  return {
    userId: body.data.user.id,
    accessToken: body.data.accessToken,
    emailSent: body.data.emailSent,
  };
}

/**
 * Signs in an existing verified user via the API.
 * Returns the access token for use with authenticated API calls.
 */
export async function apiSignIn(
  emailOrUsername: string,
  password: string,
): Promise<{ accessToken: string }> {
  const response = await fetch(`${API_BASE}/authentication/sign-in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emailOrUsername, password }),
  });

  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(
      `[api.helper] sign-in failed (${response.status}): ${body.message ?? 'unknown'}`,
    );
  }

  const body = (await response.json()) as { data: { accessToken: string } };
  return { accessToken: body.data.accessToken };
}
