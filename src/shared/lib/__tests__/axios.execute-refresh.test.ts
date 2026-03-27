import axios from 'axios';
import type { AxiosResponse } from 'axios';
import { executeRefresh, setAccessToken, getAccessToken } from '@/shared/lib/axios';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a fake Axios response matching the backend envelope. */
function fakeRefreshResponse(accessToken: string): AxiosResponse {
  return {
    data: { data: { accessToken }, success: true },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: {} },
  } as AxiosResponse;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('Given the executeRefresh token refresh lock', () => {
  let postSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset any previous access token so each test starts clean
    setAccessToken(null);

    // Spy on raw axios.post — executeRefresh uses this, NOT the `api` instance
    postSpy = vi.spyOn(axios, 'post');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Concurrent calls ────────────────────────────────────────────────────

  describe('When called concurrently while a refresh is already in flight', () => {
    beforeEach(() => {
      // Simulate a delayed network call so both callers hit the lock
      postSpy.mockImplementation(
        () =>
          new Promise<AxiosResponse>((resolve) => {
            setTimeout(() => resolve(fakeRefreshResponse('token-abc')), 50);
          }),
      );
    });

    it('Then only one POST /refresh-session request is sent', async () => {
      const [result1, result2] = await Promise.all([executeRefresh(), executeRefresh()]);

      // Both resolved
      expect(result1).toBe('token-abc');
      expect(result2).toBe('token-abc');

      // Only ONE HTTP call was made
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith(
        expect.stringContaining('/authentication/refresh-session'),
        {},
        { withCredentials: true },
      );
    });

    it('Then all callers receive the same access token', async () => {
      const promises = [executeRefresh(), executeRefresh(), executeRefresh()];
      const results = await Promise.all(promises);

      // Every caller got the exact same token
      expect(results).toEqual(['token-abc', 'token-abc', 'token-abc']);

      // And the in-memory token was updated
      expect(getAccessToken()).toBe('token-abc');
    });
  });

  // ─── Sequential calls (lock released) ────────────────────────────────────

  describe('When called after a previous refresh completed', () => {
    it('Then a new POST /refresh-session request is made', async () => {
      // First call returns token-1
      postSpy.mockResolvedValueOnce(fakeRefreshResponse('token-1'));
      // Second call returns token-2
      postSpy.mockResolvedValueOnce(fakeRefreshResponse('token-2'));

      const first = await executeRefresh();
      expect(first).toBe('token-1');
      expect(getAccessToken()).toBe('token-1');

      // Lock is released — this should trigger a brand-new HTTP call
      const second = await executeRefresh();
      expect(second).toBe('token-2');
      expect(getAccessToken()).toBe('token-2');

      // Two separate HTTP calls were made
      expect(postSpy).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Error propagation ───────────────────────────────────────────────────

  describe('When the refresh request fails', () => {
    const refreshError = new Error('Refresh token expired');

    beforeEach(() => {
      postSpy.mockImplementation(
        () =>
          new Promise<AxiosResponse>((_, reject) => {
            setTimeout(() => reject(refreshError), 50);
          }),
      );
    });

    it('Then all concurrent callers receive the same error', async () => {
      const promise1 = executeRefresh();
      const promise2 = executeRefresh();

      await expect(promise1).rejects.toThrow('Refresh token expired');
      await expect(promise2).rejects.toThrow('Refresh token expired');

      // Only one HTTP call was attempted
      expect(postSpy).toHaveBeenCalledTimes(1);
    });

    it('Then the lock is released so a subsequent call can retry', async () => {
      // First attempt fails
      await expect(executeRefresh()).rejects.toThrow('Refresh token expired');

      // Now set up a successful response for the retry
      postSpy.mockResolvedValueOnce(fakeRefreshResponse('token-retry'));

      const result = await executeRefresh();
      expect(result).toBe('token-retry');

      // 2 calls total: 1 failed + 1 retry
      expect(postSpy).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Integration with the 401 interceptor scenario ───────────────────────

  describe('When a 401 retry and a proactive hydration call executeRefresh at the same time', () => {
    it('Then only one POST /refresh-session is sent and both callers get the token', async () => {
      // Simulate realistic delay
      postSpy.mockImplementation(
        () =>
          new Promise<AxiosResponse>((resolve) => {
            setTimeout(() => resolve(fakeRefreshResponse('shared-token')), 30);
          }),
      );

      // Simulate hydrateAuth starting a refresh
      const hydratePromise = executeRefresh();

      // Simulate a 401 interceptor calling executeRefresh while the first is in-flight
      // In a real scenario this would be triggered from the Axios response interceptor
      const interceptorPromise = executeRefresh();

      const [hydrateToken, interceptorToken] = await Promise.all([
        hydratePromise,
        interceptorPromise,
      ]);

      expect(hydrateToken).toBe('shared-token');
      expect(interceptorToken).toBe('shared-token');
      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(getAccessToken()).toBe('shared-token');
    });
  });
});
