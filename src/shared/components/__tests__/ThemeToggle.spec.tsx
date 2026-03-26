import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '@/shared/components/ThemeToggle';

const mockToggle = vi.fn();

vi.mock('@/shared/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: currentIsDark, toggle: mockToggle }),
}));

let currentIsDark = false;

describe('ThemeToggle', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    currentIsDark = false;
    mockToggle.mockClear();
    user = userEvent.setup();
  });

  describe('Given the user is in light mode', () => {
    describe('When ThemeToggle renders', () => {
      it('Then it shows the Moon icon', () => {
        const { container } = render(<ThemeToggle />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('Then the aria-label says "Switch to dark mode"', () => {
        render(<ThemeToggle />);
        expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument();
      });
    });

    describe('When the user clicks the toggle', () => {
      it('Then toggle is called once', async () => {
        render(<ThemeToggle />);
        await user.click(screen.getByRole('button'));
        expect(mockToggle).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Given the user is in dark mode', () => {
    beforeEach(() => {
      currentIsDark = true;
    });

    describe('When ThemeToggle renders', () => {
      it('Then it shows the Sun icon', () => {
        const { container } = render(<ThemeToggle />);
        expect(container.querySelector('svg')).toBeInTheDocument();
      });

      it('Then the aria-label says "Switch to light mode"', () => {
        render(<ThemeToggle />);
        expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
      });
    });
  });
});
