import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTheme } from '@/shared/hooks/useTheme';

const mockToggle = vi.fn();
const mockSetTheme = vi.fn();

vi.mock('@/store/theme.store', () => ({
  useThemeStore: (selector: (s: { theme: string; toggle: () => void; setTheme: (t: string) => void }) => unknown) =>
    selector({ theme: currentTheme, toggle: mockToggle, setTheme: mockSetTheme }),
}));

let currentTheme = 'light';

describe('useTheme', () => {
  beforeEach(() => {
    currentTheme = 'light';
    vi.clearAllMocks();
  });

  describe('Given the current theme is light', () => {
    describe('When the hook is called', () => {
      it('Then isDark is false', () => {
        const { result } = renderHook(() => useTheme());
        expect(result.current.isDark).toBe(false);
      });

      it('Then isLight is true', () => {
        const { result } = renderHook(() => useTheme());
        expect(result.current.isLight).toBe(true);
      });

      it('Then theme is "light"', () => {
        const { result } = renderHook(() => useTheme());
        expect(result.current.theme).toBe('light');
      });

      it('Then toggle is exposed', () => {
        const { result } = renderHook(() => useTheme());
        expect(typeof result.current.toggle).toBe('function');
      });

      it('Then setTheme is exposed', () => {
        const { result } = renderHook(() => useTheme());
        expect(typeof result.current.setTheme).toBe('function');
      });
    });
  });

  describe('Given the current theme is dark', () => {
    beforeEach(() => {
      currentTheme = 'dark';
    });

    describe('When the hook is called', () => {
      it('Then isDark is true', () => {
        const { result } = renderHook(() => useTheme());
        expect(result.current.isDark).toBe(true);
      });

      it('Then isLight is false', () => {
        const { result } = renderHook(() => useTheme());
        expect(result.current.isLight).toBe(false);
      });

      it('Then theme is "dark"', () => {
        const { result } = renderHook(() => useTheme());
        expect(result.current.theme).toBe('dark');
      });
    });
  });
});
