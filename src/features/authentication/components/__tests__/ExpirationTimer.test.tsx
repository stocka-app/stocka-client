import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ExpirationTimer } from '../ExpirationTimer';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('ExpirationTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Initial render ────────────────────────────────────────────────

  describe('Given default props', () => {
    beforeEach(() => {
      render(<ExpirationTimer />);
    });

    it('Then the timer displays 10:00 (default 600s)', () => {
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('Then the "code expires" text is shown', () => {
      expect(screen.getByText('verifyEmail.codeExpires')).toBeInTheDocument();
    });
  });

  // ── Custom initial seconds ────────────────────────────────────────

  describe('Given initialSeconds is 120', () => {
    beforeEach(() => {
      render(<ExpirationTimer initialSeconds={120} />);
    });

    it('Then the timer displays 02:00', () => {
      expect(screen.getByText('02:00')).toBeInTheDocument();
    });
  });

  // ── Countdown behavior ────────────────────────────────────────────

  describe('Given the timer is counting down', () => {
    beforeEach(() => {
      render(<ExpirationTimer initialSeconds={5} />);
    });

    it('Then after 1 second the timer shows 00:04', () => {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText('00:04')).toBeInTheDocument();
    });

    it('Then after 3 seconds the timer shows 00:02', () => {
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByText('00:02')).toBeInTheDocument();
    });
  });

  // ── Expire callback ──────────────────────────────────────────────

  describe('Given an onExpire callback is provided', () => {
    it('Then onExpire is called when the timer reaches 0', () => {
      const onExpire = vi.fn();
      render(<ExpirationTimer initialSeconds={2} onExpire={onExpire} />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(onExpire).toHaveBeenCalledOnce();
    });
  });

  // ── Expired state ────────────────────────────────────────────────

  describe('Given the timer has expired', () => {
    beforeEach(() => {
      render(<ExpirationTimer initialSeconds={1} />);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    });

    it('Then the expired message is shown', () => {
      expect(screen.getByText('verifyEmail.codeExpired')).toBeInTheDocument();
    });
  });

  // ── Warning state (<=120s, >30s) ──────────────────────────────────

  describe('Given the time is in warning range (<=120s, >30s)', () => {
    it('Then the timer has amber color class', () => {
      render(<ExpirationTimer initialSeconds={90} />);
      const container = screen.getByText('verifyEmail.codeExpires').closest('div');
      expect(container?.className).toContain('text-amber-600');
    });
  });

  // ── Critical state (<=30s) ────────────────────────────────────────

  describe('Given the time is in critical range (<=30s)', () => {
    it('Then the timer has red color class and animate-pulse', () => {
      render(<ExpirationTimer initialSeconds={20} />);
      const container = screen.getByText('verifyEmail.codeExpires').closest('div');
      expect(container?.className).toContain('text-red-600');
      expect(container?.className).toContain('animate-pulse');
    });
  });

  // ── Paused ────────────────────────────────────────────────────────

  describe('Given the timer is paused', () => {
    beforeEach(() => {
      render(<ExpirationTimer initialSeconds={10} paused />);
    });

    it('Then the timer does not count down', () => {
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(screen.getByText('00:10')).toBeInTheDocument();
    });
  });

  // ── Without icon ──────────────────────────────────────────────────

  describe('Given showIcon is false', () => {
    it('Then no clock icon is rendered', () => {
      const { container } = render(<ExpirationTimer showIcon={false} initialSeconds={60} />);
      // lucide icons render as SVG elements
      expect(container.querySelector('svg')).toBeNull();
    });
  });
});
