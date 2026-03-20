import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAccessToken } from '@/shared/lib/axios';
import { authenticationService } from '../api/authentication.service';
import { openOAuthPopup } from '../api/oauth-popup.helper';
import { useAuthenticationStore } from '../store/authentication.store';
import type { OAuthProvider, User } from '../types/authentication.types';

const OAUTH_BROADCAST_CHANNEL = 'stocka-oauth';

interface OAuthSuccessMessage {
  type: 'oauth-success';
  accessToken: string;
}

function isOAuthSuccessMessage(data: unknown): data is OAuthSuccessMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as Record<string, unknown>)['type'] === 'oauth-success' &&
    typeof (data as Record<string, unknown>)['accessToken'] === 'string'
  );
}

export interface UseOAuthPopupReturn {
  initiateOAuthPopup: (provider: OAuthProvider) => void;
}

/**
 * Hook that manages the OAuth popup flow.
 *
 * Responsibilities:
 * - Opens a centered popup via openOAuthPopup
 * - Listens for BroadcastChannel messages from the OAuth callback page
 * - BroadcastChannel is same-origin only and unaffected by window.opener
 *   being nulled by cross-origin navigation through OAuth providers
 * - On OAUTH_SUCCESS: persists the token, loads the user, navigates to dashboard
 * - Polls popup.closed to clean up if the user closes the popup manually
 * - Cleans up channel and interval on unmount
 */
export function useOAuthPopup(): UseOAuthPopupReturn {
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuthenticationStore();

  const popupRef = useRef<Window | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback((): void => {
    if (channelRef.current) {
      channelRef.current.close();
      channelRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    popupRef.current = null;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const initiateOAuthPopup = useCallback(
    (provider: OAuthProvider): void => {
      const url = `${authenticationService.getOAuthUrl(provider)}?mode=popup`;
      const popup = openOAuthPopup(url);

      if (!popup) {
        // Popup was blocked — openOAuthPopup already triggered a full-page redirect
        return;
      }

      popupRef.current = popup;

      const channel = new BroadcastChannel(OAUTH_BROADCAST_CHANNEL);
      channelRef.current = channel;

      const handleMessage = async (event: MessageEvent): Promise<void> => {
        if (!isOAuthSuccessMessage(event.data)) {
          return;
        }

        const { accessToken } = event.data;

        cleanup();

        setAccessToken(accessToken);

        let user: User | null = null;
        try {
          const response = await authenticationService.getMe();
          user = response.data as unknown as User;
        } catch {
          // Non-fatal — store can operate without user object initially
        }

        handleOAuthCallback({ accessToken, user: user as User });
        navigate('/dashboard', { replace: true });
      };

      channel.onmessage = handleMessage as (event: MessageEvent) => void;

      // Poll popup.closed to clean up when the user dismisses the popup manually
      intervalRef.current = setInterval((): void => {
        if (popupRef.current?.closed) {
          cleanup();
        }
      }, 500);
    },
    [cleanup, handleOAuthCallback, navigate],
  );

  return { initiateOAuthPopup };
}
