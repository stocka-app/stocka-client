import { useThemeStore } from '@/store/theme.store';

export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);
  const setTheme = useThemeStore((s) => s.setTheme);

  return {
    theme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    toggle,
    setTheme,
  };
}
