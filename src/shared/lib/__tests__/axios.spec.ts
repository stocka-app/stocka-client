/**
 * Unit tests for src/shared/lib/axios.ts
 *
 * Covers: axios instance creation, request interceptor (token + language),
 * response interceptor (401 refresh flow, queue management, auth-route bypass,
 * cancel passthrough, error transformation), token storage helpers,
 * getLastRefreshData, isNetworkError / resolveErrorCode branches.
 *
 * Only axios (the HTTP boundary) is mocked.
 */

import axios from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// ─── Module-level mocks ────────────────────────────────────────────────────────
// Mock env before the module under test is imported (it reads env at module scope)
vi.mock('@/shared/lib/env', () => ({
  env: { VITE_API_URL: 'http://test-api', VITE_APP_NAME: 'Stocka', VITE_APP_VERSION: '0.0.0' },
}));

vi.mock('@/shared/lib/i18n', () => ({
  default: { language: 'es' },
}));

// ─── Imports under test ────────────────────────────────────────────────────────
import {
  api,
  setAccessToken,
  getAccessToken,
  executeRefresh,
  getLastRefreshData,
} from '@/shared/lib/axios';

// ─── Test helpers ──────────────────────────────────────────────────────────────

/** Builds a minimal AxiosResponse for the refresh endpoint. */
function fakeRefreshResponse(
  accessToken: string,
  extra: Record<string, unknown> = {},
): AxiosResponse {
  return {
    data: {
      data: { accessToken, username: null, givenName: null, familyName: null, avatarUrl: null, onboardingStatus: null, ...extra },
      success: true,
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: {} },
  } as AxiosResponse;
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('axios.ts module', () => {
  // ─── Token storage ─────────────────────────────────────────────────────────

  describe('setAccessToken / getAccessToken', () => {
    afterEach(() => setAccessToken(null));

    it('should return null when no token has been set', () => {
      setAccessToken(null);
      expect(getAccessToken()).toBeNull();
    });

    it('should store and return the provided token', () => {
      setAccessToken('my-token');
      expect(getAccessToken()).toBe('my-token');
    });

    it('should clear the token when set to null', () => {
      setAccessToken('token-a');
      setAccessToken(null);
      expect(getAccessToken()).toBeNull();
    });
  });

  // ─── getLastRefreshData ────────────────────────────────────────────────────

  describe('getLastRefreshData', () => {
    let postSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      setAccessToken(null);
      postSpy = vi.spyOn(axios, 'post');
    });

    afterEach(() => vi.restoreAllMocks());

    it('should return the full refresh response data after a successful refresh', async () => {
      postSpy.mockResolvedValueOnce(
        fakeRefreshResponse('tok-1', { username: 'alice', givenName: 'Alice' }),
      );
      await executeRefresh();
      const data = getLastRefreshData();
      expect(data).toEqual(
        expect.objectContaining({ accessToken: 'tok-1', username: 'alice', givenName: 'Alice' }),
      );
    });

    it('should return null after a failed refresh', async () => {
      // First succeed to populate lastRefreshData
      postSpy.mockResolvedValueOnce(fakeRefreshResponse('tok-ok'));
      await executeRefresh();
      expect(getLastRefreshData()).not.toBeNull();

      // Now fail
      postSpy.mockRejectedValueOnce(new Error('fail'));
      await expect(executeRefresh()).rejects.toThrow('fail');
      expect(getLastRefreshData()).toBeNull();
    });
  });

  // ─── api instance configuration ───────────────────────────────────────────

  describe('api instance', () => {
    it('should have baseURL set from env', () => {
      expect(api.defaults.baseURL).toBe('http://test-api');
    });

    it('should have withCredentials enabled', () => {
      expect(api.defaults.withCredentials).toBe(true);
    });

    it('should have a 10s timeout', () => {
      expect(api.defaults.timeout).toBe(10000);
    });

    it('should default Content-Type to application/json', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  // ─── Request interceptor ──────────────────────────────────────────────────

  describe('Request interceptor', () => {
    afterEach(() => {
      setAccessToken(null);
      vi.restoreAllMocks();
    });

    it('should attach Authorization header when an access token exists', async () => {
      // This is already covered by the adapter-based test below.
      // Kept as a simple smoke test that a request with a token doesn't blow up.
      setAccessToken('bearer-test');

      const adapterMock = vi.fn().mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });

      await api.get('/test', { adapter: adapterMock });

      const sentConfig = adapterMock.mock.calls[0][0];
      expect(sentConfig.headers.get('Authorization')).toBe('Bearer bearer-test');
    });

    it('should set Accept-Language header to the current i18n language', async () => {
      // We need to go through the actual interceptor chain — mock at adapter level
      const adapterMock = vi.fn().mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });

      setAccessToken('tok-lang');

      await api.get('/lang-test', { adapter: adapterMock });

      const sentConfig = adapterMock.mock.calls[0][0];
      expect(sentConfig.headers.get('Accept-Language')).toBe('es');
      expect(sentConfig.headers.get('Authorization')).toBe('Bearer tok-lang');
    });

    it('should NOT attach Authorization when no token is set', async () => {
      setAccessToken(null);

      const adapterMock = vi.fn().mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });

      await api.get('/no-auth', { adapter: adapterMock });

      const sentConfig = adapterMock.mock.calls[0][0];
      expect(sentConfig.headers.has('Authorization')).toBe(false);
    });

    it('should reject when the request interceptor error handler is triggered', async () => {
      // Access the request interceptor error handler: it's the second fn in the use() pair.
      // We simulate by manually invoking the interceptor manager's error path.
      // The error handler is: (error) => Promise.reject(error)
      // This is implicitly tested when network errors propagate, but we ensure coverage
      // by sending a request that triggers an adapter-level rejection.
      const adapterMock = vi.fn().mockRejectedValue(new Error('adapter-fail'));

      await expect(api.get('/fail-req', { adapter: adapterMock })).rejects.toThrow();
    });
  });

  // ─── Response interceptor — auth route bypass ─────────────────────────────

  describe('Response interceptor — auth route detection', () => {
    afterEach(() => {
      setAccessToken(null);
      vi.restoreAllMocks();
    });

    it.each([
      '/authentication/sign-in',
      '/authentication/sign-up',
      '/authentication/verify-email',
      '/authentication/refresh-session',
    ])('should NOT attempt refresh for auth route %s on 401', async (route) => {
      const postSpy = vi.spyOn(axios, 'post');

      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(401, route, { error: 'INVALID_CREDENTIALS', message: 'Bad creds' }),
      );

      try {
        await api.get(route, { adapter: adapterMock });
      } catch (err: unknown) {
        const apiErr = err as { statusCode: number; error: string };
        expect(apiErr.statusCode).toBe(401);
        expect(apiErr.error).toBe('INVALID_CREDENTIALS');
      }

      // No refresh call
      expect(postSpy).not.toHaveBeenCalled();
      postSpy.mockRestore();
    });

    it('should use backend error code from response data for auth routes', async () => {
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(401, '/authentication/sign-in', {
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email',
        }),
      );

      try {
        await api.get('/authentication/sign-in', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { error: string; message: string; statusCode: number };
        expect(apiErr.error).toBe('EMAIL_NOT_VERIFIED');
        expect(apiErr.message).toBe('Please verify your email');
        expect(apiErr.statusCode).toBe(401);
      }
    });

    it('should resolve NETWORK_ERROR for auth route network failures', async () => {
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(undefined, '/authentication/sign-in', undefined, {
          code: 'ERR_NETWORK',
          message: 'Network Error',
        }),
      );

      try {
        await api.get('/authentication/sign-in', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { error: string; statusCode: number };
        expect(apiErr.error).toBe('NETWORK_ERROR');
        expect(apiErr.statusCode).toBe(500);
      }
    });

    it('should resolve NETWORK_ERROR for ECONNABORTED without response on auth route', async () => {
      // When there is no response and code is ECONNABORTED, isNetworkError returns true
      // so resolveErrorCode maps it to NETWORK_ERROR (not REQUEST_TIMEOUT).
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(undefined, '/authentication/sign-in', undefined, {
          code: 'ECONNABORTED',
          message: 'timeout',
        }),
      );

      try {
        await api.get('/authentication/sign-in', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { error: string };
        expect(apiErr.error).toBe('NETWORK_ERROR');
      }
    });

    it('should resolve REQUEST_TIMEOUT for ECONNABORTED WITH a response on auth route', async () => {
      // REQUEST_TIMEOUT is only reachable when error.response exists (isNetworkError → false)
      // AND error.code === 'ECONNABORTED'
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(408, '/authentication/sign-in', {}, {
          code: 'ECONNABORTED',
          message: 'timeout of 10000ms exceeded',
        }),
      );

      try {
        await api.get('/authentication/sign-in', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { error: string };
        expect(apiErr.error).toBe('REQUEST_TIMEOUT');
      }
    });

    it('should fall back to UNKNOWN_ERROR when no backend code and no network error on auth route', async () => {
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(400, '/authentication/sign-up', {}),
      );

      try {
        await api.get('/authentication/sign-up', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { error: string };
        expect(apiErr.error).toBe('UNKNOWN_ERROR');
      }
    });
  });

  // ─── Response interceptor — 401 refresh flow ─────────────────────────────

  describe('Response interceptor — 401 token refresh', () => {
    let postSpy: ReturnType<typeof vi.spyOn>;
    const originalLocation = window.location;

    beforeEach(() => {
      setAccessToken(null);
      postSpy = vi.spyOn(axios, 'post');
      localStorage.clear();

      // Mock window.location for redirect assertions
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, href: '' },
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      });
    });

    it('should refresh the token on 401 and retry the original request', async () => {
      postSpy.mockResolvedValueOnce(fakeRefreshResponse('new-token'));

      let callCount = 0;
      const adapterMock = vi.fn().mockImplementation((config: InternalAxiosRequestConfig) => {
        callCount++;
        if (callCount === 1) {
          // First call: 401
          return Promise.reject(
            createAxiosError(401, '/api/data', undefined, {}, config),
          );
        }
        // Retry: success
        return Promise.resolve({
          data: { result: 'ok' },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
      });

      const result = await api.get('/api/data', { adapter: adapterMock });

      expect(result.data).toEqual({ result: 'ok' });
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith(
        'http://test-api/authentication/refresh-session',
        {},
        { withCredentials: true },
      );
      // The retried request should have the new token
      const retryConfig = adapterMock.mock.calls[1]?.[0];
      expect(retryConfig.headers.get('Authorization')).toBe('Bearer new-token');
    });

    it('should redirect to login when refresh fails', async () => {
      postSpy.mockRejectedValueOnce(new Error('refresh-failed'));
      localStorage.setItem('authentication-storage', '{"some":"data"}');

      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(401, '/api/protected'),
      );

      await expect(api.get('/api/protected', { adapter: adapterMock })).rejects.toThrow(
        'refresh-failed',
      );

      // Auth storage cleared
      expect(localStorage.getItem('authentication-storage')).toBeNull();
      // Redirected
      expect(window.location.href).toBe('/authentication/sign-in');
    });

    it('should NOT retry if the request was already a retry (_retry=true)', async () => {
      // A 401 on a request that already has _retry should be transformed, not refreshed
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(401, '/api/data', { error: 'TOKEN_EXPIRED', message: 'expired' }, { _retry: true }),
      );

      try {
        await api.get('/api/data', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { statusCode: number; error: string };
        expect(apiErr.statusCode).toBe(401);
        expect(apiErr.error).toBe('TOKEN_EXPIRED');
      }

      // No refresh attempted
      expect(postSpy).not.toHaveBeenCalled();
    });

    it('should strip the AbortSignal from the retry config', async () => {
      postSpy.mockResolvedValueOnce(fakeRefreshResponse('tok-no-signal'));

      const controller = new AbortController();
      let callCount = 0;
      const adapterMock = vi.fn().mockImplementation((config: InternalAxiosRequestConfig) => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(createAxiosError(401, '/api/data', undefined, {}, config));
        }
        // Second call: verify signal is gone
        return Promise.resolve({
          data: { ok: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        });
      });

      await api.get('/api/data', { adapter: adapterMock, signal: controller.signal });

      const retryConfig = adapterMock.mock.calls[1][0];
      expect(retryConfig.signal).toBeUndefined();
    });
  });

  // ─── Response interceptor — non-401 error transformation ──────────────────

  describe('Response interceptor — error transformation', () => {
    afterEach(() => vi.restoreAllMocks());

    it('should transform a 500 error into ApiError format', async () => {
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(500, '/api/endpoint', {
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Something broke',
        }),
      );

      try {
        await api.get('/api/endpoint', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { statusCode: number; error: string; message: string };
        expect(apiErr.statusCode).toBe(500);
        expect(apiErr.error).toBe('INTERNAL_SERVER_ERROR');
        expect(apiErr.message).toBe('Something broke');
      }
    });

    it('should transform a 403 error with no backend message', async () => {
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(403, '/api/forbidden', {}),
      );

      try {
        await api.get('/api/forbidden', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { statusCode: number; error: string; message: string };
        expect(apiErr.statusCode).toBe(403);
        expect(apiErr.error).toBe('UNKNOWN_ERROR');
        // Falls back to axios error message
        expect(apiErr.message).toBe('Request failed');
      }
    });

    it('should transform network errors to NETWORK_ERROR', async () => {
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(undefined, '/api/data', undefined, {
          code: 'ERR_NETWORK',
          message: 'Network Error',
        }),
      );

      try {
        await api.get('/api/data', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { error: string; statusCode: number };
        expect(apiErr.error).toBe('NETWORK_ERROR');
        expect(apiErr.statusCode).toBe(500);
      }
    });

    it('should transform ECONNABORTED without response to NETWORK_ERROR', async () => {
      // When no response and code is ECONNABORTED, isNetworkError returns true first
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(undefined, '/api/data', undefined, {
          code: 'ECONNABORTED',
          message: 'timeout of 10000ms exceeded',
        }),
      );

      try {
        await api.get('/api/data', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { error: string };
        expect(apiErr.error).toBe('NETWORK_ERROR');
      }
    });

    it('should transform ECONNABORTED WITH response to REQUEST_TIMEOUT', async () => {
      // REQUEST_TIMEOUT path requires error.response to exist so isNetworkError is false
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(408, '/api/data', {}, {
          code: 'ECONNABORTED',
          message: 'timeout of 10000ms exceeded',
        }),
      );

      try {
        await api.get('/api/data', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { error: string };
        expect(apiErr.error).toBe('REQUEST_TIMEOUT');
      }
    });

    it('should fall back to UNKNOWN_ERROR when no specific code matches', async () => {
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(422, '/api/data', {}),
      );

      try {
        await api.get('/api/data', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { error: string };
        expect(apiErr.error).toBe('UNKNOWN_ERROR');
      }
    });

    it('should use fallback message when response data message is not a string', async () => {
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(400, '/api/data', { message: 12345, error: 'VALIDATION_ERROR' }),
      );

      try {
        await api.get('/api/data', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { message: string; error: string };
        expect(apiErr.error).toBe('VALIDATION_ERROR');
        // Falls back to error.message since data.message is not a string
        expect(apiErr.message).toBe('Request failed');
      }
    });

    it('should provide "An unexpected error occurred" when both messages are absent', async () => {
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(400, '/api/data', {}, { message: '' }),
      );

      try {
        await api.get('/api/data', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { message: string };
        expect(apiErr.message).toBe('An unexpected error occurred');
      }
    });
  });

  // ─── Response interceptor — cancelled requests ────────────────────────────

  describe('Response interceptor — cancelled requests', () => {
    it('should pass through cancelled requests without transformation', async () => {
      const controller = new AbortController();
      controller.abort();

      const adapterMock = vi.fn().mockImplementation(() => {
        const cancelError = new axios.Cancel('Operation cancelled');
        return Promise.reject(cancelError);
      });

      try {
        await api.get('/api/data', { adapter: adapterMock, signal: controller.signal });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        // Should be the original CanceledError, NOT an ApiError
        expect(axios.isCancel(err)).toBe(true);
      }
    });
  });

  // ─── Response interceptor — non-401 with no response data ────────────────

  describe('Response interceptor — missing response data', () => {
    afterEach(() => vi.restoreAllMocks());

    it('should handle errors with null/undefined response data gracefully', async () => {
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(502, '/api/data', undefined),
      );

      try {
        await api.get('/api/data', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { statusCode: number; error: string };
        expect(apiErr.statusCode).toBe(502);
        expect(apiErr.error).toBe('UNKNOWN_ERROR');
      }
    });
  });

  // ─── Auth route detection — edge cases ────────────────────────────────────

  describe('isAuthRoute edge cases', () => {
    afterEach(() => vi.restoreAllMocks());

    it('should NOT treat a non-auth URL as an auth route', async () => {
      const postSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce(fakeRefreshResponse('tok'));

      let callCount = 0;
      const adapterMock = vi.fn().mockImplementation((config: InternalAxiosRequestConfig) => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(createAxiosError(401, '/api/products', undefined, {}, config));
        }
        return Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });
      });

      await api.get('/api/products', { adapter: adapterMock });

      // Refresh WAS called (not an auth route)
      expect(postSpy).toHaveBeenCalledTimes(1);
      postSpy.mockRestore();
    });

    it('should handle auth route with error.response.data being undefined', async () => {
      const adapterMock = vi.fn().mockRejectedValue(
        createAxiosError(401, '/authentication/sign-in', undefined),
      );

      try {
        await api.get('/authentication/sign-in', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        const apiErr = err as { statusCode: number };
        expect(apiErr.statusCode).toBe(401);
      }
    });
  });

  // ─── executeRefresh — response shape handling ─────────────────────────────

  describe('executeRefresh — response.data.data vs response.data fallback', () => {
    let postSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      setAccessToken(null);
      postSpy = vi.spyOn(axios, 'post');
    });

    afterEach(() => vi.restoreAllMocks());

    it('should handle flat response (no data wrapper)', async () => {
      postSpy.mockResolvedValueOnce({
        data: { accessToken: 'flat-token', username: null, givenName: null, familyName: null, avatarUrl: null, onboardingStatus: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} },
      } as AxiosResponse);

      const token = await executeRefresh();
      expect(token).toBe('flat-token');
      expect(getAccessToken()).toBe('flat-token');
    });
  });

  // ─── executeRefresh — piggyback on in-flight refresh ──────────────────────

  describe('executeRefresh — concurrent call piggyback (line 87)', () => {
    let postSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      setAccessToken(null);
      postSpy = vi.spyOn(axios, 'post');
    });

    afterEach(() => vi.restoreAllMocks());

    it('should piggyback on an in-flight refresh and return the same promise', async () => {
      // Use a delayed response so the first call is still in-flight when the second arrives
      postSpy.mockImplementation(
        () =>
          new Promise<AxiosResponse>((resolve) => {
            setTimeout(() => resolve(fakeRefreshResponse('piggy-token')), 50);
          }),
      );

      // Fire two concurrent calls
      const p1 = executeRefresh();
      const p2 = executeRefresh();

      const [t1, t2] = await Promise.all([p1, p2]);

      expect(t1).toBe('piggy-token');
      expect(t2).toBe('piggy-token');
      // Only one HTTP call
      expect(postSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Request interceptor — error handler (line 159) ───────────────────────

  describe('Request interceptor — error rejection path', () => {
    afterEach(() => {
      setAccessToken(null);
      vi.restoreAllMocks();
    });

    it('should reject with the original error when request interceptor error handler fires', async () => {
      // To trigger the request interceptor's error handler, we add a custom
      // interceptor that throws BEFORE the request reaches the adapter.
      // The built-in error handler `(error) => Promise.reject(error)` will forward it.
      const interceptorId = api.interceptors.request.use(() => {
        throw new Error('interceptor-boom');
      });

      const adapterMock = vi.fn().mockResolvedValue({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      });

      try {
        await api.get('/trigger-error', { adapter: adapterMock });
        expect.unreachable('Should have thrown');
      } catch (err: unknown) {
        expect((err as Error).message).toBe('interceptor-boom');
      }

      // Clean up the custom interceptor so it doesn't pollute other tests
      api.interceptors.request.eject(interceptorId);
    });
  });
});

// ─── Helper: create realistic AxiosError for adapter rejection ─────────────

function createAxiosError(
  status: number | undefined,
  url: string,
  data?: Record<string, unknown>,
  overrides: Record<string, unknown> = {},
  sourceConfig?: InternalAxiosRequestConfig,
) {
  const config: InternalAxiosRequestConfig & { _retry?: boolean } = sourceConfig
    ? { ...sourceConfig }
    : {
        url,
        headers: {} as InternalAxiosRequestConfig['headers'],
      };

  if (!sourceConfig) {
    config.url = url;
  }

  if (overrides._retry) {
    config._retry = true;
  }

  const err = new Error((overrides.message as string) ?? 'Request failed') as Error & {
    config: typeof config;
    response?: { status: number; data: unknown; headers: Record<string, unknown>; config: typeof config; statusText: string };
    isAxiosError: boolean;
    code?: string;
    toJSON: () => Record<string, unknown>;
    __CANCEL__?: boolean;
  };

  err.config = config;
  err.isAxiosError = true;
  err.code = overrides.code as string | undefined;
  err.toJSON = () => ({});

  if (status !== undefined) {
    err.response = {
      status,
      data: data ?? undefined,
      headers: {},
      config,
      statusText: 'Error',
    };
  }

  return err;
}
