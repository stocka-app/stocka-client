import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../DashboardPage';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('@/features/authentication', () => ({
  useAuthentication: () => ({
    user: {
      username: 'carlos',
      email: 'carlos@stocka.mx',
    },
  }),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Given a logged-in user', () => {
    beforeEach(() => {
      render(<DashboardPage />);
    });

    it('Then the greeting shows the username', () => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard — carlos');
    });

    it('Then the user email is displayed', () => {
      expect(screen.getByText('carlos@stocka.mx')).toBeInTheDocument();
    });

    it('Then the placeholder banner is shown', () => {
      expect(screen.getByText('Placeholder')).toBeInTheDocument();
    });
  });

  describe('Given no user is available', () => {
    beforeEach(() => {
      // Re-mock with null user
      vi.resetModules();
    });

    it('Then the fallback "Usuario" is shown', async () => {
      vi.doMock('@/features/authentication', () => ({
        useAuthentication: () => ({ user: null }),
      }));

      const { default: DashboardPageFresh } = await import('../DashboardPage');
      render(<DashboardPageFresh />);

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard — Usuario');
    });
  });
});
