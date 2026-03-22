import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePrivacy } from '../usePrivacy';
import { privacyService } from '../../api/privacy.service';
import type { ConsentRecord } from '../../types/privacy.types';

vi.mock('../../api/privacy.service', () => ({
  privacyService: {
    getConsents: vi.fn(),
    updateConsents: vi.fn(),
  },
}));

const mockedService = vi.mocked(privacyService);

// ── Fixtures ──────────────────────────────────────────────────────────

const consentRecords: ConsentRecord[] = [
  { consentType: 'marketing_communications', granted: true, documentVersion: '1.0', grantedAt: '2026-01-15T00:00:00Z' },
  { consentType: 'anonymous_analytics', granted: false, documentVersion: '1.0', grantedAt: '2026-01-15T00:00:00Z' },
  { consentType: 'terms_of_service', granted: true, documentVersion: '1.0', grantedAt: '2026-02-01T00:00:00Z' },
  { consentType: 'privacy_policy', granted: true, documentVersion: '1.0', grantedAt: '2026-02-01T00:00:00Z' },
];

describe('usePrivacy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Fetch on mount ────────────────────────────────────────────────

  describe('Given the API returns consent records on mount', () => {
    beforeEach(() => {
      mockedService.getConsents.mockResolvedValue(consentRecords);
    });

    it('Then isLoading is true initially and false after fetch', async () => {
      const { result } = renderHook(() => usePrivacy());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('Then consents are mapped correctly from records', async () => {
      const { result } = renderHook(() => usePrivacy());

      await waitFor(() => {
        expect(result.current.consents).toEqual({
          marketing: true,
          analytics: false,
          termsAcceptedAt: '2026-02-01T00:00:00Z',
          privacyAcceptedAt: '2026-02-01T00:00:00Z',
        });
      });
    });

    it('Then error is null', async () => {
      const { result } = renderHook(() => usePrivacy());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
    });
  });

  // ── Fetch failure ─────────────────────────────────────────────────

  describe('Given the API fails on mount', () => {
    beforeEach(() => {
      mockedService.getConsents.mockRejectedValue(new Error('Network error'));
    });

    it('Then error is set to fetchFailed', async () => {
      const { result } = renderHook(() => usePrivacy());

      await waitFor(() => {
        expect(result.current.error).toBe('errors.fetchFailed');
      });
    });

    it('Then isLoading is false after failure', async () => {
      const { result } = renderHook(() => usePrivacy());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('Then consents remain null', async () => {
      const { result } = renderHook(() => usePrivacy());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.consents).toBeNull();
    });
  });

  // ── toggleMarketing ───────────────────────────────────────────────

  describe('Given consents are loaded and marketing is true', () => {
    beforeEach(() => {
      mockedService.getConsents.mockResolvedValue(consentRecords);
      mockedService.updateConsents.mockResolvedValue(undefined);
    });

    describe('When toggleMarketing is called', () => {
      it('Then it optimistically flips marketing to false', async () => {
        const { result } = renderHook(() => usePrivacy());

        await waitFor(() => {
          expect(result.current.consents).not.toBeNull();
        });

        act(() => {
          result.current.toggleMarketing();
        });

        expect(result.current.consents?.marketing).toBe(false);
      });

      it('Then it calls updateConsents with the new marketing value', async () => {
        const { result } = renderHook(() => usePrivacy());

        await waitFor(() => {
          expect(result.current.consents).not.toBeNull();
        });

        await act(async () => {
          await result.current.toggleMarketing();
        });

        expect(mockedService.updateConsents).toHaveBeenCalledWith(false, false);
      });

      it('Then isSaving is true during the call and false after', async () => {
        let resolveUpdate: () => void;
        mockedService.updateConsents.mockImplementation(
          () => new Promise<void>((resolve) => { resolveUpdate = resolve; }),
        );

        const { result } = renderHook(() => usePrivacy());

        await waitFor(() => {
          expect(result.current.consents).not.toBeNull();
        });

        act(() => {
          result.current.toggleMarketing();
        });

        expect(result.current.isSaving).toBe(true);

        await act(async () => {
          resolveUpdate!();
        });

        expect(result.current.isSaving).toBe(false);
      });
    });

    describe('When toggleMarketing is called and the API fails', () => {
      beforeEach(() => {
        mockedService.updateConsents.mockRejectedValue(new Error('Server error'));
      });

      it('Then the marketing value is rolled back to true', async () => {
        const { result } = renderHook(() => usePrivacy());

        await waitFor(() => {
          expect(result.current.consents).not.toBeNull();
        });

        await act(async () => {
          await result.current.toggleMarketing();
        });

        expect(result.current.consents?.marketing).toBe(true);
      });

      it('Then updateError is set', async () => {
        const { result } = renderHook(() => usePrivacy());

        await waitFor(() => {
          expect(result.current.consents).not.toBeNull();
        });

        await act(async () => {
          await result.current.toggleMarketing();
        });

        expect(result.current.updateError).toBe('errors.updateFailed');
      });
    });
  });

  // ── toggleMarketing early return ──────────────────────────────────

  describe('Given consents have not loaded yet', () => {
    beforeEach(() => {
      mockedService.getConsents.mockImplementation(
        () => new Promise(() => {}), // never resolves
      );
    });

    it('Then toggleMarketing returns without calling the API', async () => {
      const { result } = renderHook(() => usePrivacy());

      await act(async () => {
        await result.current.toggleMarketing();
      });

      expect(mockedService.updateConsents).not.toHaveBeenCalled();
    });

    it('Then toggleAnalytics returns without calling the API', async () => {
      const { result } = renderHook(() => usePrivacy());

      await act(async () => {
        await result.current.toggleAnalytics();
      });

      expect(mockedService.updateConsents).not.toHaveBeenCalled();
    });
  });

  // ── toggleAnalytics ───────────────────────────────────────────────

  describe('Given consents are loaded and analytics is false', () => {
    beforeEach(() => {
      mockedService.getConsents.mockResolvedValue(consentRecords);
      mockedService.updateConsents.mockResolvedValue(undefined);
    });

    describe('When toggleAnalytics is called', () => {
      it('Then it optimistically flips analytics to true', async () => {
        const { result } = renderHook(() => usePrivacy());

        await waitFor(() => {
          expect(result.current.consents).not.toBeNull();
        });

        act(() => {
          result.current.toggleAnalytics();
        });

        expect(result.current.consents?.analytics).toBe(true);
      });

      it('Then it calls updateConsents with the new analytics value', async () => {
        const { result } = renderHook(() => usePrivacy());

        await waitFor(() => {
          expect(result.current.consents).not.toBeNull();
        });

        await act(async () => {
          await result.current.toggleAnalytics();
        });

        // marketing=true (from fixture), analytics flipped to true
        expect(mockedService.updateConsents).toHaveBeenCalledWith(true, true);
      });

      it('Then isSaving is true during the call and false after', async () => {
        let resolveUpdate: () => void;
        mockedService.updateConsents.mockImplementation(
          () => new Promise<void>((resolve) => { resolveUpdate = resolve; }),
        );

        const { result } = renderHook(() => usePrivacy());

        await waitFor(() => {
          expect(result.current.consents).not.toBeNull();
        });

        act(() => {
          result.current.toggleAnalytics();
        });

        expect(result.current.isSaving).toBe(true);

        await act(async () => {
          resolveUpdate!();
        });

        expect(result.current.isSaving).toBe(false);
      });
    });

    describe('When toggleAnalytics is called and the API fails', () => {
      beforeEach(() => {
        mockedService.updateConsents.mockRejectedValue(new Error('Server error'));
      });

      it('Then the analytics value is rolled back to false', async () => {
        const { result } = renderHook(() => usePrivacy());

        await waitFor(() => {
          expect(result.current.consents).not.toBeNull();
        });

        await act(async () => {
          await result.current.toggleAnalytics();
        });

        expect(result.current.consents?.analytics).toBe(false);
      });

      it('Then updateError is set', async () => {
        const { result } = renderHook(() => usePrivacy());

        await waitFor(() => {
          expect(result.current.consents).not.toBeNull();
        });

        await act(async () => {
          await result.current.toggleAnalytics();
        });

        expect(result.current.updateError).toBe('errors.updateFailed');
      });
    });
  });

  // ── retry ─────────────────────────────────────────────────────────

  describe('Given the initial fetch failed', () => {
    beforeEach(() => {
      mockedService.getConsents
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(consentRecords);
    });

    describe('When retry is called', () => {
      it('Then it re-fetches consents and clears the error', async () => {
        const { result } = renderHook(() => usePrivacy());

        await waitFor(() => {
          expect(result.current.error).toBe('errors.fetchFailed');
        });

        await act(async () => {
          result.current.retry();
        });

        await waitFor(() => {
          expect(result.current.error).toBeNull();
          expect(result.current.consents).not.toBeNull();
        });
      });
    });
  });

  // ── updateError is cleared on next toggle ─────────────────────────

  describe('Given a previous toggle produced an updateError', () => {
    beforeEach(() => {
      mockedService.getConsents.mockResolvedValue(consentRecords);
      mockedService.updateConsents
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce(undefined);
    });

    it('Then the next toggle clears updateError', async () => {
      const { result } = renderHook(() => usePrivacy());

      await waitFor(() => {
        expect(result.current.consents).not.toBeNull();
      });

      // First toggle fails
      await act(async () => {
        await result.current.toggleMarketing();
      });

      expect(result.current.updateError).toBe('errors.updateFailed');

      // Second toggle succeeds and clears the error
      await act(async () => {
        await result.current.toggleMarketing();
      });

      expect(result.current.updateError).toBeNull();
    });
  });
});
