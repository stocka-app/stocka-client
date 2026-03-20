import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAccessToken } from '@/shared/lib/axios';
import { authenticationService } from '../api/authentication.service';
import { openOAuthPopup } from '../api/oauth-popup.helper';
import { useAuthenticationStore } from '../store/authentication.store';
import type { OAuthProvider, User } from '../types/authentication.types';

const OAUTH_STORAGE_KEY = 'stocka-oauth-result';

export interface UseOAuthPopupReturn {
  initiateOAuthPopup: (provider: OAuthProvider) => void;
}

/**
 * Hook that manages the OAuth popup flow.
 *
 * Communication: the popup writes the access token to localStorage.
 * The parent window listens for the 'storage' event, which fires reliably
 * across same-origin windows — even when the popup closes immediately after writing.
 */
export function useOAuthPopup(): UseOAuthPopupReturn {
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuthenticationStore();

  const popupRef = useRef<Window | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingRef = useRef(false);

  const cleanup = useCallback((): void => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    popupRef.current = null;
  }, []);

  const processToken = useCallback(
    async (accessToken: string): Promise<void> => {
      if (processingRef.current) return;
      processingRef.current = true;

      cleanup();
      localStorage.removeItem(OAUTH_STORAGE_KEY);

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
    },
    [cleanup, handleOAuthCallback, navigate],
  );

  useEffect(() => {
    const handleStorage = (event: StorageEvent): void => {
      if (event.key !== OAUTH_STORAGE_KEY || !event.newValue) return;

      try {
        const data = JSON.parse(event.newValue) as { accessToken?: string };
        if (data.accessToken) {
          processToken(data.accessToken);
        }
      } catch {
        // Malformed data — ignore
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      cleanup();
    };
  }, [cleanup, processToken]);

  const initiateOAuthPopup = useCallback(
    (provider: OAuthProvider): void => {
      // Clean any stale token from a previous attempt
      localStorage.removeItem(OAUTH_STORAGE_KEY);
      processingRef.current = false;

      const url = `${authenticationService.getOAuthUrl(provider)}?mode=popup`;
      const popup = openOAuthPopup(url);

      if (!popup) return;

      popupRef.current = popup;

      // Poll popup.closed to clean up when the user dismisses the popup manually
      intervalRef.current = setInterval((): void => {
        if (popupRef.current?.closed && !processingRef.current) {
          // Check if a token arrived while we were polling (race window)
          const stored = localStorage.getItem(OAUTH_STORAGE_KEY);
          if (stored) {
            try {
              const data = JSON.parse(stored) as { accessToken?: string };
              if (data.accessToken) {
                processToken(data.accessToken);
                return;
              }
            } catch {
              // ignore
            }
          }
          cleanup();
        }
      }, 500);
    },
    [cleanup, processToken],
  );

  return { initiateOAuthPopup };
}
