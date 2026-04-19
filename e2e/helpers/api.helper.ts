/**
 * API helper for Playwright e2e tests.
 *
 * Wraps direct HTTP calls to the backend API so that test setup can create
 * users and seed state without going through the browser UI.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env.e2e into process.env so worker processes have the correct API URL.
// Playwright config sets process.env in the main process but that does NOT
// propagate to test worker processes — helpers must load it themselves.
// ESM: use import.meta.url instead of __dirname.
try {
  const dir = fileURLToPath(new URL('.', import.meta.url));
  const envContent = readFileSync(resolve(dir, '../../.env.e2e'), 'utf8');
  for (const line of envContent.split('\n')) {
    const match = /^([^#=\s][^=]*)=(.*)$/.exec(line.trim());
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
} catch {
  // .env.e2e not found — fall back to defaults below
}

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
      // Fail fast if the backend wants us to wait more than 30 seconds — waiting that long
      // would exceed the Playwright test timeout. The fix is to restart the E2E backend
      // (clears in-memory rate limit counters) or start it with E2E_MODE=true.
      if (delaySeconds > 30) {
        throw new Error(
          `[api.helper] Rate limited on ${url} — Retry-After: ${delaySeconds}s. ` +
            `Restart the E2E backend to clear in-memory rate limit counters, ` +
            `or start it with E2E_MODE=true to disable progressive blocking.`,
        );
      }
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
 * Completes the full onboarding flow via API calls, mirroring what the UI does:
 *   1. POST /onboarding/start          — create onboarding session
 *   2. PATCH /onboarding/progress       — save consents (step 0)
 *   3. POST /users/me/consents          — legal audit trail
 *   4. PATCH /onboarding/progress       — save path selection (step 1)
 *   5. PATCH /onboarding/progress       — save businessProfile (step 3)
 *   6. POST /onboarding/complete        — create tenant + mark session COMPLETED
 *
 * This ensures the onboarding session has all required stepData so the frontend
 * skips the onboarding flow and redirects straight to /dashboard after sign-in.
 */
export async function apiCompleteOnboarding(accessToken: string): Promise<{ tenantId: string }> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };

  const saveProgress = async (section: string, data: Record<string, unknown>, currentStep: number): Promise<void> => {
    const res = await fetchWithRetry(`${API_BASE}/onboarding/progress`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ section, data, currentStep }),
    });
    if (!res.ok) {
      const body = (await res.json()) as { message?: string };
      throw new Error(`[api.helper] save-progress(${section}) failed (${res.status}): ${body.message ?? 'unknown'}`);
    }
  };

  // 1. Start onboarding session
  await fetchWithRetry(`${API_BASE}/onboarding/start`, { method: 'POST', headers });

  // 2. Save consents to onboarding session (frontend reads stepData, not user_consents)
  await saveProgress('consents', { terms: true, marketing: false, analytics: false }, 0);

  // 3. Record legal consent audit trail
  const consentsRes = await fetchWithRetry(`${API_BASE}/users/me/consents`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ terms: true, marketing: false, analytics: false }),
  });
  if (!consentsRes.ok) {
    const body = (await consentsRes.json()) as { message?: string };
    throw new Error(`[api.helper] record-consents failed (${consentsRes.status}): ${body.message ?? 'unknown'}`);
  }

  // 4. Save path selection (CREATE)
  await saveProgress('path', { path: 'CREATE' }, 1);

  // 5. Save business profile (required by CompleteOnboardingHandler)
  await saveProgress('businessProfile', {
    name: `PW Test Business ${Date.now()}`,
    businessType: 'retail',
    country: 'MX',
    timezone: 'America/Mexico_City',
  }, 3);

  // 6. Complete onboarding (creates tenant + marks session COMPLETED)
  const response = await fetchWithRetry(`${API_BASE}/onboarding/complete`, {
    method: 'POST',
    headers,
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
 * Triggers the forgot-password flow via the API.
 * The backend sends a reset email (or silently succeeds for unknown emails).
 */
export async function apiForgotPassword(email: string): Promise<void> {
  const response = await fetchWithRetry(`${API_BASE}/authentication/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok && response.status !== 429) {
    const body = (await response.json()) as { message?: string };
    throw new Error(`[api.helper] forgot-password failed (${response.status}): ${body.message ?? 'unknown'}`);
  }
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
