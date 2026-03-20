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
// BroadcastChannel mock
// ---------------------------------------------------------------------------

interface MockChannelInstance {
  onmessage: ((event: MessageEvent) => void) | null;
  close: ReturnType<typeof vi.fn>;
  name: string;
}

let capturedChannel: MockChannelInstance | null = null;
const mockChannelClose = vi.fn();

class MockBroadcastChannel {
  onmessage: ((event: MessageEvent) => void) | null = null;
  close = mockChannelClose;
  name: string;

  constructor(name: string) {
    this.name = name;
    capturedChannel = this;
  }
}

vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dispatchChannelMessage(data: unknown): void {
  if (capturedChannel?.onmessage) {
    capturedChannel.onmessage(new MessageEvent('message', { data }));
  }
}

const OAUTH_URL = 'http://localhost:3001/api/authentication/google';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useOAuthPopup', () => {
  let clearIntervalSpy: ReturnType<typeof vi.spyOn>;
  let setIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    capturedChannel = null;

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

      it('Then it creates a BroadcastChannel named stocka-oauth', () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        expect(capturedChannel).not.toBeNull();
        expect(capturedChannel?.name).toBe('stocka-oauth');
      });

      it('Then it starts polling the popup closed state', () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        expect(setIntervalSpy).toHaveBeenCalled();
      });
    });

    describe('When a valid oauth-success message arrives on the BroadcastChannel', () => {
      it('Then it sets the access token in memory', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchChannelMessage({ type: 'oauth-success', accessToken: 'oauth-access-token' });
        });

        expect(setAccessToken).toHaveBeenCalledWith('oauth-access-token');
      });

      it('Then it calls getMe to load the user profile', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchChannelMessage({ type: 'oauth-success', accessToken: 'oauth-access-token' });
        });

        expect(authenticationService.getMe).toHaveBeenCalledTimes(1);
      });

      it('Then it marks the user as authenticated in the store', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchChannelMessage({ type: 'oauth-success', accessToken: 'oauth-access-token' });
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

        await act(async () => {
          dispatchChannelMessage({ type: 'oauth-success', accessToken: 'oauth-access-token' });
        });

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
      });

      it('Then it closes the BroadcastChannel after success', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchChannelMessage({ type: 'oauth-success', accessToken: 'oauth-access-token' });
        });

        expect(mockChannelClose).toHaveBeenCalled();
      });

      it('Then it clears the polling interval after success', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchChannelMessage({ type: 'oauth-success', accessToken: 'oauth-access-token' });
        });

        expect(clearIntervalSpy).toHaveBeenCalled();
      });
    });

    describe('When a message with an unknown type arrives on the BroadcastChannel', () => {
      it('Then it ignores the message and does not set the access token', async () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        await act(async () => {
          dispatchChannelMessage({ type: 'SOME_OTHER_TYPE', accessToken: 'some-token' });
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
        expect(mockChannelClose).toHaveBeenCalled();
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
  });

  // =========================================================================
  // initiateOAuthPopup — popup blocked
  // =========================================================================

  describe('Given the browser blocks the popup', () => {
    beforeEach(() => {
      vi.mocked(openOAuthPopup).mockReturnValue(null);
    });

    describe('When initiateOAuthPopup is called', () => {
      it('Then it does not create a BroadcastChannel', () => {
        const { result } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        expect(capturedChannel).toBeNull();
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
      it('Then it closes the BroadcastChannel', () => {
        const { result, unmount } = renderHook(() => useOAuthPopup());

        act(() => {
          result.current.initiateOAuthPopup('google');
        });

        unmount();

        expect(mockChannelClose).toHaveBeenCalled();
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
