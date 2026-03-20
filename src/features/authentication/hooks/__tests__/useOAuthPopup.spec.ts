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

/** Build a fake MessageEvent as postMessage would produce. */
function buildMessageEvent(origin: string, data: unknown): MessageEvent {
  return new MessageEvent('message', { origin, data });
}

/** Retrieve the last registered listener for a given event type. */
function getLastEventListener(type: string): EventListener {
  const calls = (window.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
  const matching = calls.filter((c: unknown[]) => c[0] === type);
  return matching[matching.length - 1][1] as EventListener;
}

const FRONTEND_ORIGIN = 'http://localhost:3000';
const OAUTH_URL = 'http://localhost:3001/api/authentication/google';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useOAuthPopup', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let clearIntervalSpy: ReturnType<typeof vi.spyOn>;
  let setIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

    vi.mocked(authenticationService.getOAuthUrl).mockReturnValue(OAUTH_URL);
    vi.mocked(authenticationService.getMe).mockResolvedValue({
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'oauth@test.com',
        username: 'oauthuser',
        status: 'email_verified_by_provider',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
      success: true,
    });

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

      it('Then it registers a message event listener on the window', () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
      });

      it('Then it starts polling the popup closed state', () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        expect(setIntervalSpy).toHaveBeenCalled();
      });
    });

    describe('When a valid oauth-success message arrives from the correct origin', () => {
      it('Then it sets the access token in memory', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        const listener = getLastEventListener('message');

        await act(async () => {
          listener(buildMessageEvent(FRONTEND_ORIGIN, {
            type: 'oauth-success',
            accessToken: 'oauth-access-token',
          }));
        });

        expect(setAccessToken).toHaveBeenCalledWith('oauth-access-token');
      });

      it('Then it calls getMe to load the user profile', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        const listener = getLastEventListener('message');

        await act(async () => {
          listener(buildMessageEvent(FRONTEND_ORIGIN, {
            type: 'oauth-success',
            accessToken: 'oauth-access-token',
          }));
        });

        expect(authenticationService.getMe).toHaveBeenCalledTimes(1);
      });

      it('Then it marks the user as authenticated in the store', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        const listener = getLastEventListener('message');

        await act(async () => {
          listener(buildMessageEvent(FRONTEND_ORIGIN, {
            type: 'oauth-success',
            accessToken: 'oauth-access-token',
          }));
        });

        const storeState = useAuthenticationStore.getState();
        expect(storeState.isAuthenticated).toBe(true);
        expect(storeState.accessToken).toBe('oauth-access-token');
      });

      it('Then it navigates to the dashboard', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        const listener = getLastEventListener('message');

        await act(async () => {
          listener(buildMessageEvent(FRONTEND_ORIGIN, {
            type: 'oauth-success',
            accessToken: 'oauth-access-token',
          }));
        });

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });

      it('Then it removes the message listener after success', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        const listener = getLastEventListener('message');

        await act(async () => {
          listener(buildMessageEvent(FRONTEND_ORIGIN, {
            type: 'oauth-success',
            accessToken: 'oauth-access-token',
          }));
        });

        expect(removeEventListenerSpy).toHaveBeenCalledWith('message', listener);
      });

      it('Then it clears the polling interval after success', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        const listener = getLastEventListener('message');

        await act(async () => {
          listener(buildMessageEvent(FRONTEND_ORIGIN, {
            type: 'oauth-success',
            accessToken: 'oauth-access-token',
          }));
        });

        expect(clearIntervalSpy).toHaveBeenCalled();
      });
    });

    describe('When a message arrives from an unknown origin', () => {
      it('Then it ignores the message and does not set the access token', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        const listener = getLastEventListener('message');

        await act(async () => {
          listener(buildMessageEvent('https://evil-site.com', {
            type: 'oauth-success',
            accessToken: 'stolen-token',
          }));
        });

        expect(setAccessToken).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    describe('When a message with an unknown type arrives from the correct origin', () => {
      it('Then it ignores the message', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        const listener = getLastEventListener('message');

        await act(async () => {
          listener(buildMessageEvent(FRONTEND_ORIGIN, {
            type: 'SOME_OTHER_TYPE',
            accessToken: 'some-token',
          }));
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

        // Simulate popup being closed by the user
        fakePopup.closed = true;

        // Advance timers to trigger polling interval
        act(() => {
          vi.advanceTimersByTime(600);
        });

        expect(clearIntervalSpy).toHaveBeenCalled();
        expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
      });

      it('Then the polling interval does nothing while the popup is still open', () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        // Popup is still open (closed = false)
        fakePopup.closed = false;

        const clearIntervalCallsBefore = clearIntervalSpy.mock.calls.length;

        // Advance timers — interval fires but popup is not closed yet
        act(() => {
          vi.advanceTimersByTime(600);
        });

        // clearInterval should not have been called by the polling callback
        expect(clearIntervalSpy.mock.calls.length).toBe(clearIntervalCallsBefore);
      });
    });
  });

  // =========================================================================
  // initiateOAuthPopup — popup blocked
  // =========================================================================

  describe('Given the browser blocks the popup', () => {
    beforeEach(() => {
      // openOAuthPopup falls back to redirect and returns null
      vi.mocked(openOAuthPopup).mockReturnValue(null);
    });

    describe('When initiateOAuthPopup is called', () => {
      it('Then it does not register a message listener', () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        expect(addEventListenerSpy).not.toHaveBeenCalledWith('message', expect.any(Function));
      });

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
      it('Then it removes the message listener', () => {
        const { result, unmount } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        unmount();

        expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
      });

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
