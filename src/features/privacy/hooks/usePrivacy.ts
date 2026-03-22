import { useState, useEffect, useCallback, useRef } from 'react';
import { privacyService } from '../api/privacy.service';
import type { ConsentsState } from '../types/privacy.types';

interface UsePrivacyReturn {
  consents: ConsentsState | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  updateError: string | null;
  toggleMarketing: () => Promise<void>;
  toggleAnalytics: () => Promise<void>;
  retry: () => void;
}

const INITIAL_CONSENTS: ConsentsState = {
  marketing: false,
  analytics: false,
  termsAcceptedAt: null,
  privacyAcceptedAt: null,
};

/**
 * Hook that manages privacy consent state.
 *
 * Fetches consents on mount and provides toggle functions that
 * optimistically update the UI then persist via the API.
 * On API failure the toggle is rolled back and an error is surfaced.
 */
export function usePrivacy(): UsePrivacyReturn {
  const [consents, setConsents] = useState<ConsentsState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Keep a ref to latest consents so toggle closures always read fresh state
  const consentsRef = useRef(consents);
  consentsRef.current = consents;

  const fetchConsents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const records = await privacyService.getConsents();

      const state: ConsentsState = { ...INITIAL_CONSENTS };

      for (const record of records) {
        switch (record.consentType) {
          case 'marketing_communications':
            state.marketing = record.granted;
            break;
          case 'anonymous_analytics':
            state.analytics = record.granted;
            break;
          case 'terms_of_service':
            state.termsAcceptedAt = record.grantedAt;
            break;
          case 'privacy_policy':
            state.privacyAcceptedAt = record.grantedAt;
            break;
        }
      }

      setConsents(state);
    } catch {
      setError('errors.fetchFailed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsents();
  }, [fetchConsents]);

  const toggleMarketing = useCallback(async () => {
    const current = consentsRef.current;
    if (!current) return;

    const newValue = !current.marketing;
    const previous = { ...current };

    // Optimistic update
    setConsents({ ...current, marketing: newValue });
    setIsSaving(true);
    setUpdateError(null);

    try {
      await privacyService.updateConsents(newValue, current.analytics);
    } catch {
      // Rollback
      setConsents(previous);
      setUpdateError('errors.updateFailed');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const toggleAnalytics = useCallback(async () => {
    const current = consentsRef.current;
    if (!current) return;

    const newValue = !current.analytics;
    const previous = { ...current };

    // Optimistic update
    setConsents({ ...current, analytics: newValue });
    setIsSaving(true);
    setUpdateError(null);

    try {
      await privacyService.updateConsents(current.marketing, newValue);
    } catch {
      // Rollback
      setConsents(previous);
      setUpdateError('errors.updateFailed');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const retry = useCallback(() => {
    fetchConsents();
  }, [fetchConsents]);

  return {
    consents,
    isLoading,
    isSaving,
    error,
    updateError,
    toggleMarketing,
    toggleAnalytics,
    retry,
  };
}
