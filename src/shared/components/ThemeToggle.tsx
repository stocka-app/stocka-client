import { useTheme } from '@/shared/hooks/useTheme';

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="
        flex items-center justify-center w-9 h-9 rounded-lg
        text-neutral-600 hover:text-neutral-900
        hover:bg-neutral-100
        dark:text-neutral-600 dark:hover:text-neutral-600
        dark:hover:bg-white/10
        transition-colors duration-200
      "
    >
      <span className="material-symbols-outlined text-[20px]">
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
