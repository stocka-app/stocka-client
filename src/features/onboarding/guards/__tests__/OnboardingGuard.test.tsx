import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OnboardingGuard } from '@/features/onboarding/guards/OnboardingGuard';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockInitializeOnboarding = vi.fn();

let mockHookReturn: Record<string, unknown> = {};

vi.mock('@/features/onboarding/hooks/useOnboarding', () => ({
  useOnboarding: () => mockHookReturn,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildHookReturn(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    completedAt: null,
    isHydrated: true,
    initializeOnboarding: mockInitializeOnboarding,
    ...overrides,
  };
}

function renderWithRouter(ui: React.ReactElement): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <Routes>
        <Route path="/onboarding" element={ui} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OnboardingGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Given the store has not been hydrated yet', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn({ isHydrated: false });
    });

    describe('When the guard renders', () => {
      it('Then a loading spinner is shown', () => {
        renderWithRouter(
          <OnboardingGuard>
            <div>Onboarding Content</div>
          </OnboardingGuard>,
        );
        expect(screen.queryByText('Onboarding Content')).not.toBeInTheDocument();
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      });

      it('Then initializeOnboarding is called', () => {
        renderWithRouter(
          <OnboardingGuard>
            <div>Onboarding Content</div>
          </OnboardingGuard>,
        );
        expect(mockInitializeOnboarding).toHaveBeenCalled();
      });
    });
  });

  describe('Given the user has not completed onboarding yet', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn({ isHydrated: true, completedAt: null });
    });

    describe('When they navigate to the onboarding route', () => {
      it('Then the onboarding content is rendered', () => {
        renderWithRouter(
          <OnboardingGuard>
            <div>Onboarding Content</div>
          </OnboardingGuard>,
        );
        expect(screen.getByText('Onboarding Content')).toBeInTheDocument();
      });

      it('Then the user is not redirected to the dashboard', () => {
        renderWithRouter(
          <OnboardingGuard>
            <div>Onboarding Content</div>
          </OnboardingGuard>,
        );
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      });
    });
  });

  describe('Given the user has already completed onboarding', () => {
    beforeEach(() => {
      mockHookReturn = buildHookReturn({
        isHydrated: true,
        completedAt: '2026-01-01T00:00:00.000Z',
      });
    });

    describe('When they try to access the onboarding route again', () => {
      it('Then they are redirected to the dashboard', () => {
        renderWithRouter(
          <OnboardingGuard>
            <div>Onboarding Content</div>
          </OnboardingGuard>,
        );
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      it('Then the onboarding content is not rendered', () => {
        renderWithRouter(
          <OnboardingGuard>
            <div>Onboarding Content</div>
          </OnboardingGuard>,
        );
        expect(screen.queryByText('Onboarding Content')).not.toBeInTheDocument();
      });
    });
  });
});
