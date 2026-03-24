/**
 * Decodes the payload of a JWT token without verifying the signature.
 * This is safe for client-side use — the backend is the authority on validation.
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );
  return JSON.parse(jsonPayload) as T;
}

/**
 * JWT payload structure from Stocka backend.
 */
export interface StockaJwtPayload {
  sub: string;
  email: string;
  tenantId: string | null;
  role: string | null;
  displayName: string | null;
  iat: number;
  exp: number;
}

/**
 * Extracts tenant context (tenantId and role) from a Stocka access token.
 */
export function extractTenantContext(accessToken: string): {
  tenantId: string | null;
  role: string | null;
  displayName: string | null;
} {
  try {
    const payload = decodeJwtPayload<StockaJwtPayload>(accessToken);
    return {
      tenantId: payload.tenantId ?? null,
      role: payload.role ?? null,
      displayName: payload.displayName ?? null,
    };
  } catch {
    return { tenantId: null, role: null, displayName: null };
  }
}
