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
 * Executes a fetch with automatic retry on 429 (rate limit) and ECONNRESET.
 * Uses the server's Retry-After headers when available.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 5,
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      // Retry on ECONNRESET or other transient network errors
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw error;
    }

    if (response.status === 429 && attempt < maxRetries) {
      // Drain the response body to release the connection
      await response.text();
      const retryAfterMedium = Number(response.headers.get('retry-after-medium') ?? '0');
      const retryAfterShort = Number(response.headers.get('x-ratelimit-reset-short') ?? '1');
      const delaySeconds = Math.max(retryAfterMedium, retryAfterShort, 2);
      await new Promise((r) => setTimeout(r, delaySeconds * 1000));
      continue;
    }

    return response;
  }

  throw new Error(`[api.helper] fetch failed after ${maxRetries} retries: ${url}`);
}

/**
 * Registers a new user via the API.
 * Returns the access token (user will still need email verification).
 */
export async function apiSignUp(payload: SignUpPayload): Promise<SignUpResult> {
  const response = await fetchWithRetry(`${API_BASE}/authentication/sign-up`, {
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
 * Completes onboarding by creating a tenant for the authenticated user.
 * Requires a valid access token from sign-up or sign-in.
 */
export async function apiCompleteOnboarding(accessToken: string): Promise<{ tenantId: string }> {
  const response = await fetchWithRetry(`${API_BASE}/tenant/onboarding/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      name: `PW Test Business ${Date.now()}`,
      businessType: 'retail',
      country: 'MX',
      timezone: 'America/Mexico_City',
    }),
  });

  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(
      `[api.helper] complete-onboarding failed (${response.status}): ${body.message ?? 'unknown'}`,
    );
  }

  const body = (await response.json()) as { data: { tenantId: string } };
  return { tenantId: body.data.tenantId };
}

/**
 * Signs in an existing verified user via the API.
 * Returns the access token for use with authenticated API calls.
 */
export async function apiSignIn(
  emailOrUsername: string,
  password: string,
): Promise<{ accessToken: string }> {
  const response = await fetchWithRetry(`${API_BASE}/authentication/sign-in`, {
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
