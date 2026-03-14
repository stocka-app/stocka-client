import { beforeEach, describe, expect, it } from 'vitest';
import { useThemeStore } from '@/store/theme.store';

function resetStore() {
  useThemeStore.setState({ theme: 'light' });
  document.documentElement.classList.remove('dark');
}

describe('ThemeStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('Given the store is initialized with no persisted preference', () => {
    describe('When accessing the initial state', () => {
      it('Then the default theme is light', () => {
        expect(useThemeStore.getState().theme).toBe('light');
      });
    });
  });

  describe('Given the current theme is light', () => {
    describe('When toggle is called', () => {
      it('Then the theme switches to dark', () => {
        useThemeStore.getState().toggle();
        expect(useThemeStore.getState().theme).toBe('dark');
      });

      it('Then the .dark class is added to the html element', () => {
        useThemeStore.getState().toggle();
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    describe('When setTheme is called with dark', () => {
      it('Then the theme is dark', () => {
        useThemeStore.getState().setTheme('dark');
        expect(useThemeStore.getState().theme).toBe('dark');
      });

      it('Then the .dark class is added to the html element', () => {
        useThemeStore.getState().setTheme('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
      });
    });

    describe('When setTheme is called with light', () => {
      it('Then the theme stays light and .dark class is absent', () => {
        useThemeStore.getState().setTheme('light');
        expect(useThemeStore.getState().theme).toBe('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });
  });

  describe('Given localStorage is unavailable during rehydration', () => {
    it('Then onRehydrateStorage receives undefined state and does not crash', async () => {
      // When getItem throws, Zustand calls the onRehydrateStorage callback with
      // undefined state — covering the false branch of "if (state?.theme)"
      const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('Storage unavailable');
      });
      await useThemeStore.persist.rehydrate();
      spy.mockRestore();
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Given the current theme is dark', () => {
    beforeEach(() => {
      useThemeStore.setState({ theme: 'dark' });
      document.documentElement.classList.add('dark');
    });

    describe('When toggle is called', () => {
      it('Then the theme switches to light', () => {
        useThemeStore.getState().toggle();
        expect(useThemeStore.getState().theme).toBe('light');
      });

      it('Then the .dark class is removed from the html element', () => {
        useThemeStore.getState().toggle();
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });

    describe('When setTheme is called with light', () => {
      it('Then the theme is light and .dark class is absent', () => {
        useThemeStore.getState().setTheme('light');
        expect(useThemeStore.getState().theme).toBe('light');
        expect(document.documentElement.classList.contains('dark')).toBe(false);
      });
    });
  });
});
