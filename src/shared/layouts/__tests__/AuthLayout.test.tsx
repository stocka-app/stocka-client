import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthLayout } from '../AuthLayout';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

vi.mock('@/shared/components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">Lang</div>,
}));

vi.mock('@/shared/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme</div>,
}));

vi.mock('@/shared/components/StockaIcon', () => ({
  StockaIcon: () => <div data-testid="stocka-icon">Icon</div>,
}));

vi.mock('@/shared/components/illustrations', () => ({
  IsometricCubesIllustration: () => <div data-testid="illustration">Cubes</div>,
}));

vi.mock('@/shared/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: false }),
}));

describe('AuthLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Given the layout renders', () => {
    beforeEach(() => {
      render(<AuthLayout />);
    });

    it('Then the Outlet (child routes) is rendered', () => {
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('Then the Stocka brand name is visible', () => {
      expect(screen.getAllByText('Stocka').length).toBeGreaterThan(0);
    });

    it('Then the hero title is shown', () => {
      expect(screen.getByText('layout.heroTitle')).toBeInTheDocument();
    });

    it('Then the footer has terms of service link', () => {
      expect(screen.getByText('layout.termsOfService')).toBeInTheDocument();
    });

    it('Then the footer has privacy policy link', () => {
      expect(screen.getByText('layout.privacyPolicy')).toBeInTheDocument();
    });
  });
});
