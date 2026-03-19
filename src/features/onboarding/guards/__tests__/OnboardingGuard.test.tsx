import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store';
import { OnboardingGuard } from '@/features/onboarding/guards/OnboardingGuard';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/features/onboarding/store/onboarding.store');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type StoreState = ReturnType<typeof useOnboardingStore>;

function buildStoreState(overrides: Partial<StoreState> = {}): StoreState {
  return {
    step: 0,
    path: null,
    consents: null,
    preferences: null,
    businessProfile: null,
    invitationCode: null,
    context: null,
    completedAt: null,
    isLoading: false,
    error: null,
    invitationDetails: null,
    invitationSubStep: 'code-entry',
    setStep: vi.fn(),
    setPath: vi.fn(),
    setConsents: vi.fn(),
    setPreferences: vi.fn(),
    setBusinessProfile: vi.fn(),
    setInvitationCode: vi.fn(),
    setContext: vi.fn(),
    setCompletedAt: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
    setInvitationDetails: vi.fn(),
    setInvitationSubStep: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  } as StoreState;
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

  describe('Given the user has not completed onboarding yet', () => {
    beforeEach(() => {
      vi.mocked(useOnboardingStore).mockReturnValue(
        buildStoreState({ completedAt: null }),
      );
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
      vi.mocked(useOnboardingStore).mockReturnValue(
        buildStoreState({ completedAt: '2026-01-01T00:00:00.000Z' }),
      );
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
