import { renderHook, act } from '@testing-library/react';
import { useOAuthPopup } from '@/features/authentication/hooks/useOAuthPopup';
import { authenticationService } from '@/features/authentication/api/authentication.service';
import { openOAuthPopup } from '@/features/authentication/api/oauth-popup.helper';
import { useAuthenticationStore } from '@/features/authentication/store/authentication.store';
import { setAccessToken } from '@/shared/lib/axios';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/features/authentication/api/oauth-popup.helper', () => ({
  openOAuthPopup: vi.fn(),
}));

vi.mock('@/features/authentication/api/authentication.service', () => ({
  authenticationService: {
    getOAuthUrl: vi.fn(),
    getMe: vi.fn(),
  },
}));

vi.mock('@/shared/lib/axios', () => ({
  setAccessToken: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OAUTH_URL = 'http://localhost:3001/api/authentication/google';
const STORAGE_KEY = 'stocka-oauth-result';

// Build a fake JWT that decodeJwtPayload can decode
function buildFakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

const FAKE_JWT = buildFakeJwt({
  sub: '00000000-0000-0000-0000-000000000001',
  email: 'oauth@test.com',
  tenantId: null,
  role: null,
  iat: 1700000000,
  exp: 1700003600,
});

function dispatchStorageEvent(accessToken: string): void {
  const value = JSON.stringify({ accessToken });
  localStorage.setItem(STORAGE_KEY, value);
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: STORAGE_KEY,
      newValue: value,
      storageArea: localStorage,
    }),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useOAuthPopup', () => {
  let clearIntervalSpy: ReturnType<typeof vi.spyOn>;
  let setIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.removeItem(STORAGE_KEY);

    clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    vi.mocked(authenticationService.getOAuthUrl).mockReturnValue(OAUTH_URL);
    vi.mocked(authenticationService.getMe).mockResolvedValue({
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'oauth@test.com',
        username: 'oauth',
        status: 'email_verified_by_provider',
        createdAt: new Date().toISOString(),
        givenName: 'Roberto',
        familyName: 'Medina',
        avatarUrl: 'https://example.com/avatar.jpg',
      },
      success: true,
    } as never);

    // Reset auth store to clean state
    useAuthenticationStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitializing: false,
      isLoading: false,
      error: null,
      errorCode: null,
      emailVerificationRequired: false,
      pendingVerificationEmail: null,
      verificationCodeSentAt: null,
      verificationEmailSent: null,
      blockInfo: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.removeItem(STORAGE_KEY);
  });

  // =========================================================================
  // initiateOAuthPopup — popup opened
  // =========================================================================

  describe('Given the browser allows popups', () => {
    let fakePopup: { closed: boolean };

    beforeEach(() => {
      fakePopup = { closed: false };
      vi.mocked(openOAuthPopup).mockReturnValue(fakePopup as Window);
    });

    describe('When initiateOAuthPopup is called with a provider', () => {
      it('Then it opens a popup with the OAuth URL appended with ?mode=popup', () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        expect(openOAuthPopup).toHaveBeenCalledWith(`${OAUTH_URL}?mode=popup`);
      });

      it('Then it clears any stale OAuth token from localStorage', () => {
        localStorage.setItem(STORAGE_KEY, 'stale');

        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      });

      it('Then it starts polling the popup closed state', () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        expect(setIntervalSpy).toHaveBeenCalled();
      });
    });

    describe('When the popup writes the OAuth token to localStorage', () => {
      it('Then it sets the access token in memory', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchStorageEvent(FAKE_JWT);
        });

        expect(setAccessToken).toHaveBeenCalledWith(FAKE_JWT);
      });

      it('Then it builds the user from the JWT payload and enriches it with social data', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchStorageEvent(FAKE_JWT);
        });

        const storeState = useAuthenticationStore.getState();
        expect(storeState.user).toBeTruthy();
        expect(storeState.user!.id).toBe('00000000-0000-0000-0000-000000000001');
        expect(storeState.user!.email).toBe('oauth@test.com');
        expect(storeState.user!.givenName).toBe('Roberto');
        expect(storeState.user!.familyName).toBe('Medina');
        expect(storeState.user!.avatarUrl).toBe('https://example.com/avatar.jpg');
      });

      it('Then it keeps social fields as null when getMe returns null values', async () => {
        vi.mocked(authenticationService.getMe).mockResolvedValueOnce({
          data: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'oauth@test.com',
            username: 'oauth',
            status: 'email_verified_by_provider',
            createdAt: new Date().toISOString(),
            givenName: null,
            familyName: null,
            avatarUrl: null,
          },
          success: true,
        } as never);

        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchStorageEvent(FAKE_JWT);
        });

        const storeState = useAuthenticationStore.getState();
        expect(storeState.user!.givenName).toBeNull();
        expect(storeState.user!.familyName).toBeNull();
        expect(storeState.user!.avatarUrl).toBeNull();
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });

      it('Then it calls getMe to enrich social data even when getMe fails', async () => {
        vi.mocked(authenticationService.getMe).mockRejectedValueOnce(new Error('network error'));

        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchStorageEvent(FAKE_JWT);
        });

        // Still navigates despite getMe failure
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
        // User is set from JWT (avatarUrl null since getMe failed)
        const storeState = useAuthenticationStore.getState();
        expect(storeState.user).toBeTruthy();
        expect(storeState.user!.avatarUrl).toBeNull();
      });

      it('Then it marks the user as authenticated in the store', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchStorageEvent(FAKE_JWT);
        });

        const storeState = useAuthenticationStore.getState();
        expect(storeState.isAuthenticated).toBe(true);
        expect(storeState.accessToken).toBe(FAKE_JWT);
      });

      it('Then it navigates to the dashboard', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchStorageEvent(FAKE_JWT);
        });

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });

      it('Then it removes the token from localStorage after processing', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchStorageEvent(FAKE_JWT);
        });

        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      });

      it('Then it clears the polling interval after success', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchStorageEvent(FAKE_JWT);
        });

        expect(clearIntervalSpy).toHaveBeenCalled();
      });
    });

    describe('When a storage event with an unrelated key fires', () => {
      it('Then it ignores the event and does not set the access token', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          window.dispatchEvent(
            new StorageEvent('storage', {
              key: 'some-other-key',
              newValue: JSON.stringify({ accessToken: 'some-token' }),
            }),
          );
        });

        expect(setAccessToken).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    describe('When the user manually closes the popup without completing OAuth', () => {
      it('Then the polling interval detects popup.closed and cleans up', () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        fakePopup.closed = true;

        act(() => {
          vi.advanceTimersByTime(600);
        });

        expect(clearIntervalSpy).toHaveBeenCalled();
      });

      it('Then the polling interval does nothing while the popup is still open', () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        fakePopup.closed = false;

        const clearIntervalCallsBefore = clearIntervalSpy.mock.calls.length;

        act(() => {
          vi.advanceTimersByTime(600);
        });

        expect(clearIntervalSpy.mock.calls.length).toBe(clearIntervalCallsBefore);
      });
    });

    describe('When the popup closes but a token was written to localStorage', () => {
      it('Then the polling interval picks up the token and processes it', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        // Simulate: popup wrote token and closed, but storage event was missed
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken: FAKE_JWT }));
        fakePopup.closed = true;

        await act(async () => {
          vi.advanceTimersByTime(600);
        });

        expect(setAccessToken).toHaveBeenCalledWith(FAKE_JWT);
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });
    });
  });

  // =========================================================================
  // Storage event with missing accessToken (line 73)
  // =========================================================================

  describe('Given a storage event with correct key but no accessToken in data', () => {
    let fakePopup: { closed: boolean };

    beforeEach(() => {
      fakePopup = { closed: false };
      vi.mocked(openOAuthPopup).mockReturnValue(fakePopup as Window);
    });

    it('Then it ignores the event and does not process', async () => {
      const { result } = renderHook(() => useOAuthPopup());

      act(() => {
        result.current.initiateOAuthPopup('google');
      });

      await act(async () => {
        const value = JSON.stringify({ someOtherField: 'value' });
        localStorage.setItem(STORAGE_KEY, value);
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: value,
            storageArea: localStorage,
          }),
        );
      });

      expect(setAccessToken).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Storage event with malformed JSON (catch block in storage handler)
  // =========================================================================

  describe('Given a storage event with malformed JSON', () => {
    let fakePopup: { closed: boolean };

    beforeEach(() => {
      fakePopup = { closed: false };
      vi.mocked(openOAuthPopup).mockReturnValue(fakePopup as Window);
    });

    it('Then it catches the parse error and does not crash', async () => {
      const { result } = renderHook(() => useOAuthPopup());

      act(() => {
        result.current.initiateOAuthPopup('google');
      });

      await act(async () => {
        window.dispatchEvent(
          new StorageEvent('storage', {
            key: STORAGE_KEY,
            newValue: 'not-valid-json{{{',
            storageArea: localStorage,
          }),
        );
      });

      expect(setAccessToken).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Polling picks up stored data with no accessToken (line 109)
  // =========================================================================

  describe('Given the popup closes and localStorage has data without accessToken', () => {
    let fakePopup: { closed: boolean };

    beforeEach(() => {
      fakePopup = { closed: false };
      vi.mocked(openOAuthPopup).mockReturnValue(fakePopup as Window);
    });

    it('Then the polling cleans up without processing a token', async () => {
      const { result } = renderHook(() => useOAuthPopup());

      act(() => {
        result.current.initiateOAuthPopup('google');
      });

      // Store data without accessToken, then close popup
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ error: 'denied' }));
      fakePopup.closed = true;

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(setAccessToken).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Polling picks up malformed JSON in localStorage (catch block in polling)
  // =========================================================================

  describe('Given the popup closes and localStorage has malformed JSON', () => {
    let fakePopup: { closed: boolean };

    beforeEach(() => {
      fakePopup = { closed: false };
      vi.mocked(openOAuthPopup).mockReturnValue(fakePopup as Window);
    });

    it('Then the polling catches the error and cleans up', async () => {
      const { result } = renderHook(() => useOAuthPopup());

      act(() => {
        result.current.initiateOAuthPopup('google');
      });

      localStorage.setItem(STORAGE_KEY, 'broken-json{{{');
      fakePopup.closed = true;

      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      expect(setAccessToken).not.toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // initiateOAuthPopup — popup blocked
  // =========================================================================

  describe('Given the browser blocks the popup', () => {
    beforeEach(() => {
      vi.mocked(openOAuthPopup).mockReturnValue(null);
    });

    describe('When initiateOAuthPopup is called', () => {
      it('Then it does not start polling', () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        expect(setIntervalSpy).not.toHaveBeenCalled();
      });
    });
  });

  // =========================================================================
  // Cleanup on unmount
  // =========================================================================

  describe('Given a popup has been opened and is still open', () => {
    beforeEach(() => {
      vi.mocked(openOAuthPopup).mockReturnValue({ closed: false } as Window);
    });

    describe('When the hook unmounts before the OAuth flow completes', () => {
      it('Then it clears the polling interval', () => {
        const { result, unmount } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        unmount();

        expect(clearIntervalSpy).toHaveBeenCalled();
      });
    });
  });
});
