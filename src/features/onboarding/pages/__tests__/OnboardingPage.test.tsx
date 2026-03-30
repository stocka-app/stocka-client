import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingPage from '../OnboardingPage';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockLogout = vi.fn();
vi.mock('@/features/authentication', () => ({
  useAuthentication: () => ({
    user: { username: 'carlos', tier: 'STARTER' },
    logout: mockLogout,
  }),
}));

const mockToggleTheme = vi.fn();
const mutableThemeStore = { theme: 'light' as string };
vi.mock('@/store/theme.store', () => ({
  useThemeStore: () => ({
    theme: mutableThemeStore.theme,
    toggle: mockToggleTheme,
  }),
}));

let mockOnboardingReturn: Record<string, unknown> = {};

vi.mock('../../hooks/useOnboarding', () => ({
  useOnboarding: () => mockOnboardingReturn,
}));

const mockSetPath = vi.fn();
vi.mock('../../store/onboarding.store', () => ({
  useOnboardingStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const fakeStore = { setPath: mockSetPath };
    return selector(fakeStore);
  },
}));

vi.mock('@/shared/components/flags', () => ({
  FlagUS: () => <span data-testid="flag-us">US</span>,
  FlagMX: () => <span data-testid="flag-mx">MX</span>,
}));

vi.mock('lucide-react', () => ({
  LogOut: () => <span data-testid="icon-logout">LogOut</span>,
  Moon: () => <span data-testid="icon-moon">Moon</span>,
  Sun: () => <span data-testid="icon-sun">Sun</span>,
}));

/** Stub all step components — capture props */
let onboardingCardProps: Record<string, unknown> = {};
vi.mock('../../components/OnboardingCard', () => ({
  OnboardingCard: (props: Record<string, unknown>) => {
    onboardingCardProps = props;
    return (
      <div data-testid={`onboarding-card-step-${props.step}`} data-title={props.title}>
        {props.children as React.ReactNode}
        {props.footerAction as React.ReactNode}
      </div>
    );
  },
}));

let step0Props: Record<string, unknown> = {};
vi.mock('../../components/steps/Step0PathSelection', () => ({
  Step0PathSelection: (props: Record<string, unknown>) => {
    step0Props = props;
    return <div data-testid="step-path-selection">PathSelection</div>;
  },
}));

let step1Props: Record<string, unknown> = {};
vi.mock('../../components/steps/Step1Welcome', () => ({
  Step1Welcome: (props: Record<string, unknown>) => {
    step1Props = props;
    return <div data-testid="step-welcome">Welcome</div>;
  },
}));

let step2Props: Record<string, unknown> = {};
vi.mock('../../components/steps/Step2Preferences', () => ({
  Step2Preferences: (props: Record<string, unknown>) => {
    step2Props = props;
    return <div data-testid="step-preferences">Preferences</div>;
  },
}));

let step3Props: Record<string, unknown> = {};
vi.mock('../../components/steps/Step3BusinessProfile', () => ({
  Step3BusinessProfile: (props: Record<string, unknown>) => {
    step3Props = props;
    return <div data-testid="step-business-profile">BusinessProfile</div>;
  },
}));

let step4Props: Record<string, unknown> = {};
vi.mock('../../components/steps/Step4Spaces', () => ({
  Step4Spaces: (props: Record<string, unknown>) => {
    step4Props = props;
    return <div data-testid="step-spaces">Spaces</div>;
  },
}));

let step5Props: Record<string, unknown> = {};
vi.mock('../../components/steps/Step5Context', () => ({
  Step5Context: (props: Record<string, unknown>) => {
    step5Props = props;
    return <div data-testid="step-context">Context</div>;
  },
}));

let step6Props: Record<string, unknown> = {};
vi.mock('../../components/steps/Step6QuickStart', () => ({
  Step6QuickStart: (props: Record<string, unknown>) => {
    step6Props = props;
    return <div data-testid="step-quickstart">QuickStart</div>;
  },
}));

let invCodeEntryProps: Record<string, unknown> = {};
vi.mock('../../components/invitation/InvitationCodeEntry', () => ({
  InvitationCodeEntry: (props: Record<string, unknown>) => {
    invCodeEntryProps = props;
    return <div data-testid="invitation-code-entry">CodeEntry</div>;
  },
}));

let invConfirmationProps: Record<string, unknown> = {};
vi.mock('../../components/invitation/InvitationConfirmation', () => ({
  InvitationConfirmation: (props: Record<string, unknown>) => {
    invConfirmationProps = props;
    return <div data-testid="invitation-confirmation">Confirmation</div>;
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────

function buildOnboarding(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    currentStep: 0,
    path: null,
    consents: null,
    preferences: null,
    businessProfile: null,
    context: null,
    isLoading: false,
    error: null,
    invitationDetails: null,
    invitationSubStep: 'code-entry',
    selectPath: vi.fn(),
    goToStep: vi.fn(),
    goToPreviousStep: vi.fn(),
    goToNextStep: vi.fn(),
    submitConsents: vi.fn(),
    submitPreferences: vi.fn(),
    submitBusinessProfile: vi.fn(),
    submitSpaces: vi.fn(),
    submitContext: vi.fn(),
    completeOnboarding: vi.fn(),
    validateInvitationCode: vi.fn(),
    acceptInvitation: vi.fn(),
    setInvitationSubStep: vi.fn(),
    ...overrides,
  };
}

describe('OnboardingPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    mutableThemeStore.theme = 'light';
    onboardingCardProps = {};
    step0Props = {};
    step1Props = {};
    step2Props = {};
    step3Props = {};
    step4Props = {};
    step5Props = {};
    step6Props = {};
    invCodeEntryProps = {};
    invConfirmationProps = {};
  });

  // ══════════════════════════════════════════════════════════════════
  // Step 0: Consents (no consents given yet)
  // ══════════════════════════════════════════════════════════════════

  describe('Given the user is at step 0 with no consents', () => {
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({ currentStep: 0, consents: null });
      render(<OnboardingPage />);
    });

    it('should render the welcome step', () => {
      expect(screen.getByTestId('step-welcome')).toBeInTheDocument();
    });

    it('should render inside OnboardingCard with step 0', () => {
      expect(screen.getByTestId('onboarding-card-step-0')).toBeInTheDocument();
    });

    it('should pass submitConsents to Step1Welcome', () => {
      expect(step1Props.onSubmit).toBeDefined();
    });

    it('should pass isLoading to Step1Welcome', () => {
      expect(step1Props.isLoading).toBe(false);
    });

    it('should pass error to Step1Welcome', () => {
      expect(step1Props.error).toBeNull();
    });

    it('should pass defaultValues as undefined when consents is null', () => {
      expect(step1Props.defaultValues).toBeUndefined();
    });
  });

  // ── Step 0: Auto-advance when consents already given ──────────────

  describe('Given the user is at step 0 with existing consents', () => {
    const mockGoToStep = vi.fn();
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({
        currentStep: 0,
        consents: { terms: true, marketing: false, analytics: true },
        goToStep: mockGoToStep,
      });
      render(<OnboardingPage />);
    });

    it('should auto-advance to step 1', () => {
      expect(mockGoToStep).toHaveBeenCalledWith(1);
    });

    it('should return null (no visible UI)', () => {
      expect(screen.queryByTestId('step-welcome')).not.toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Step 1: Path selection
  // ══════════════════════════════════════════════════════════════════

  describe('Given the user is at step 1 with no path', () => {
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({ currentStep: 1, path: null });
      render(<OnboardingPage />);
    });

    it('should render the path selection step', () => {
      expect(screen.getByTestId('step-path-selection')).toBeInTheDocument();
    });

    it('should render inside OnboardingCard with step 1', () => {
      expect(screen.getByTestId('onboarding-card-step-1')).toBeInTheDocument();
    });

    it('should pass selectPath to Step0PathSelection', () => {
      expect(step0Props.onSelectPath).toBeDefined();
    });
  });

  // ── Step 1: Auto-advance when path is create ──────────────────────

  describe('Given step 1 and path is create', () => {
    const mockGoToStep = vi.fn();
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({
        currentStep: 1,
        path: 'create',
        goToStep: mockGoToStep,
      });
      render(<OnboardingPage />);
    });

    it('should auto-advance to step 2', () => {
      expect(mockGoToStep).toHaveBeenCalledWith(2);
    });

    it('should return null (no visible UI)', () => {
      expect(screen.queryByTestId('step-path-selection')).not.toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Invitation flow
  // ══════════════════════════════════════════════════════════════════

  describe('Given path is invitation and sub-step is code-entry', () => {
    const mockSetInvSubStep = vi.fn();
    const mockGoToStep = vi.fn();
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({
        currentStep: 1,
        path: 'invitation',
        invitationSubStep: 'code-entry',
        setInvitationSubStep: mockSetInvSubStep,
        goToStep: mockGoToStep,
      });
      render(<OnboardingPage />);
    });

    it('should render the invitation code entry', () => {
      expect(screen.getByTestId('invitation-code-entry')).toBeInTheDocument();
    });

    it('should pass validateInvitationCode to InvitationCodeEntry', () => {
      expect(invCodeEntryProps.onValidate).toBeDefined();
    });

    it('should pass isLoading to InvitationCodeEntry', () => {
      expect(invCodeEntryProps.isLoading).toBe(false);
    });

    it('should pass error to InvitationCodeEntry', () => {
      expect(invCodeEntryProps.error).toBeNull();
    });

    it('should call setPath(null) and goToStep(1) when back is clicked', () => {
      (invCodeEntryProps.onBack as () => void)();
      expect(mockSetInvSubStep).toHaveBeenCalledWith('code-entry');
      expect(mockGoToStep).toHaveBeenCalledWith(1);
      expect(mockSetPath).toHaveBeenCalledWith(null);
    });
  });

  describe('Given path is invitation and sub-step is confirmation', () => {
    const mockSetInvSubStep = vi.fn();
    const mockAcceptInvitation = vi.fn();
    const invDetails = { tenantName: 'Stocka HQ', role: 'VIEWER', inviterName: 'Carlos' };
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({
        currentStep: 1,
        path: 'invitation',
        invitationSubStep: 'confirmation',
        invitationDetails: invDetails,
        setInvitationSubStep: mockSetInvSubStep,
        acceptInvitation: mockAcceptInvitation,
      });
      render(<OnboardingPage />);
    });

    it('should render the invitation confirmation', () => {
      expect(screen.getByTestId('invitation-confirmation')).toBeInTheDocument();
    });

    it('should pass invitationDetails to InvitationConfirmation', () => {
      expect(invConfirmationProps.invitationDetails).toEqual(invDetails);
    });

    it('should pass acceptInvitation as onAccept', () => {
      expect(invConfirmationProps.onAccept).toBe(mockAcceptInvitation);
    });

    it('should call setInvitationSubStep code-entry when cancel is clicked', () => {
      (invConfirmationProps.onCancel as () => void)();
      expect(mockSetInvSubStep).toHaveBeenCalledWith('code-entry');
    });
  });

  describe('Given path is invitation, sub-step is confirmation, but no details', () => {
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({
        currentStep: 1,
        path: 'invitation',
        invitationSubStep: 'confirmation',
        invitationDetails: null,
      });
      render(<OnboardingPage />);
    });

    it('should not render the confirmation view', () => {
      expect(screen.queryByTestId('invitation-confirmation')).not.toBeInTheDocument();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Step 2: Preferences
  // ══════════════════════════════════════════════════════════════════

  describe('Given the user is at step 2', () => {
    const mockSubmitPreferences = vi.fn();
    const mockGoToPrev = vi.fn();
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({
        currentStep: 2,
        path: 'create',
        submitPreferences: mockSubmitPreferences,
        goToPreviousStep: mockGoToPrev,
        preferences: { language: 'es', currency: 'MXN', theme: 'light' },
      });
      render(<OnboardingPage />);
    });

    it('should render the preferences step', () => {
      expect(screen.getByTestId('step-preferences')).toBeInTheDocument();
    });

    it('should pass submitPreferences to Step2', () => {
      expect(step2Props.onSubmit).toBe(mockSubmitPreferences);
    });

    it('should pass goToPreviousStep to Step2', () => {
      expect(step2Props.onBack).toBe(mockGoToPrev);
    });

    it('should pass defaultValues from preferences', () => {
      expect(step2Props.defaultValues).toEqual({ language: 'es', currency: 'MXN', theme: 'light' });
    });
  });

  // ── Step 2: no default values when preferences is null ────────────

  describe('Given the user is at step 2 with null preferences', () => {
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({ currentStep: 2, path: 'create', preferences: null });
      render(<OnboardingPage />);
    });

    it('should pass undefined as defaultValues', () => {
      expect(step2Props.defaultValues).toBeUndefined();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Step 3: Business Profile
  // ══════════════════════════════════════════════════════════════════

  describe('Given the user is at step 3', () => {
    const mockSubmitBP = vi.fn();
    const mockGoToPrev = vi.fn();
    const bp = { businessName: 'Tienda', businessType: 'RETAIL', country: 'MX' };
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({
        currentStep: 3,
        path: 'create',
        submitBusinessProfile: mockSubmitBP,
        goToPreviousStep: mockGoToPrev,
        businessProfile: bp,
      });
      render(<OnboardingPage />);
    });

    it('should render the business profile step', () => {
      expect(screen.getByTestId('step-business-profile')).toBeInTheDocument();
    });

    it('should pass submitBusinessProfile to Step3', () => {
      expect(step3Props.onSubmit).toBe(mockSubmitBP);
    });

    it('should pass goToPreviousStep to Step3', () => {
      expect(step3Props.onBack).toBe(mockGoToPrev);
    });

    it('should pass defaultValues from businessProfile', () => {
      expect(step3Props.defaultValues).toEqual(bp);
    });
  });

  // ── Step 3: null businessProfile ──────────────────────────────────

  describe('Given the user is at step 3 with null businessProfile', () => {
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({ currentStep: 3, path: 'create', businessProfile: null });
      render(<OnboardingPage />);
    });

    it('should pass undefined as defaultValues', () => {
      expect(step3Props.defaultValues).toBeUndefined();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Step 4: Spaces
  // ══════════════════════════════════════════════════════════════════

  describe('Given the user is at step 4', () => {
    const mockSubmitSpaces = vi.fn();
    const mockGoToNext = vi.fn();
    const mockGoToPrev = vi.fn();
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({
        currentStep: 4,
        path: 'create',
        submitSpaces: mockSubmitSpaces,
        goToNextStep: mockGoToNext,
        goToPreviousStep: mockGoToPrev,
        businessProfile: { businessType: 'RETAIL' },
      });
      render(<OnboardingPage />);
    });

    it('should render the spaces step', () => {
      expect(screen.getByTestId('step-spaces')).toBeInTheDocument();
    });

    it('should pass submitSpaces to Step4', () => {
      expect(step4Props.onSubmit).toBe(mockSubmitSpaces);
    });

    it('should pass goToNextStep as onSkip', () => {
      expect(step4Props.onSkip).toBe(mockGoToNext);
    });

    it('should pass goToPreviousStep as onBack', () => {
      expect(step4Props.onBack).toBe(mockGoToPrev);
    });

    it('should pass businessType from businessProfile', () => {
      expect(step4Props.businessType).toBe('RETAIL');
    });

    it('should pass tier from user', () => {
      expect(step4Props.tier).toBe('STARTER');
    });
  });

  // ── Step 4: null businessProfile defaults to OTHER ────────────────

  describe('Given step 4 with null businessProfile', () => {
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({ currentStep: 4, path: 'create', businessProfile: null });
      render(<OnboardingPage />);
    });

    it('should default businessType to OTHER', () => {
      expect(step4Props.businessType).toBe('OTHER');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Step 5: Context
  // ══════════════════════════════════════════════════════════════════

  describe('Given the user is at step 5', () => {
    const mockSubmitContext = vi.fn();
    const mockGoToNext = vi.fn();
    const mockGoToPrev = vi.fn();
    const ctx = { teamSize: '5-10', monthlyRevenue: '50k-100k' };
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({
        currentStep: 5,
        path: 'create',
        submitContext: mockSubmitContext,
        goToNextStep: mockGoToNext,
        goToPreviousStep: mockGoToPrev,
        context: ctx,
      });
      render(<OnboardingPage />);
    });

    it('should render the context step', () => {
      expect(screen.getByTestId('step-context')).toBeInTheDocument();
    });

    it('should pass submitContext to Step5', () => {
      expect(step5Props.onSubmit).toBe(mockSubmitContext);
    });

    it('should pass goToNextStep as onSkip', () => {
      expect(step5Props.onSkip).toBe(mockGoToNext);
    });

    it('should pass goToPreviousStep as onBack', () => {
      expect(step5Props.onBack).toBe(mockGoToPrev);
    });

    it('should pass defaultValues from context', () => {
      expect(step5Props.defaultValues).toEqual(ctx);
    });
  });

  // ── Step 5: null context ──────────────────────────────────────────

  describe('Given step 5 with null context', () => {
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({ currentStep: 5, path: 'create', context: null });
      render(<OnboardingPage />);
    });

    it('should pass undefined as defaultValues', () => {
      expect(step5Props.defaultValues).toBeUndefined();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Step 6: QuickStart (final visible step)
  // ══════════════════════════════════════════════════════════════════

  describe('Given the user is at step 6', () => {
    const mockComplete = vi.fn();
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({
        currentStep: 6,
        path: 'create',
        completeOnboarding: mockComplete,
      });
      render(<OnboardingPage />);
    });

    it('should render the quick start step', () => {
      expect(screen.getByTestId('step-quickstart')).toBeInTheDocument();
    });

    it('should pass completeOnboarding to Step6', () => {
      expect(step6Props.onComplete).toBe(mockComplete);
    });

    it('should pass isLoading to Step6', () => {
      expect(step6Props.isLoading).toBe(false);
    });

    it('should pass error to Step6', () => {
      expect(step6Props.error).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Step 7: Auto-redirect to dashboard
  // ══════════════════════════════════════════════════════════════════

  describe('Given the user reaches step 7 (completed)', () => {
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({ currentStep: 7, path: 'create' });
      render(<OnboardingPage />);
    });

    it('should navigate to /dashboard', () => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  // ══════════════════════════════════════════════════════════════════
  // Footer action: exit/logout
  // ══════════════════════════════════════════════════════════════════

  describe('Given the footer action buttons are visible', () => {
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({ currentStep: 2, path: 'create' });
      render(<OnboardingPage />);
    });

    it('should show the exit onboarding button with logout icon', () => {
      expect(screen.getByText('exitOnboarding')).toBeInTheDocument();
    });

    it('should call logout when exit button is clicked', async () => {
      await user.click(screen.getByText('exitOnboarding'));
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  // ── Footer action: language toggle ────────────────────────────────

  describe('Given the language is Spanish', () => {
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({ currentStep: 2, path: 'create' });
      render(<OnboardingPage />);
    });

    it('should show the English language option', () => {
      expect(screen.getByText('English')).toBeInTheDocument();
    });

    it('should show the US flag', () => {
      expect(screen.getByTestId('flag-us')).toBeInTheDocument();
    });

    it('should have the correct aria-label', () => {
      expect(screen.getByLabelText('Switch to English')).toBeInTheDocument();
    });
  });

  // ── Footer action: theme toggle (light mode) ─────────────────────

  describe('Given the theme is light', () => {
    beforeEach(() => {
      mutableThemeStore.theme = 'light';
      mockOnboardingReturn = buildOnboarding({ currentStep: 2, path: 'create' });
      render(<OnboardingPage />);
    });

    it('should show Dark label', () => {
      expect(screen.getByText('Dark')).toBeInTheDocument();
    });

    it('should show the moon icon', () => {
      expect(screen.getByTestId('icon-moon')).toBeInTheDocument();
    });

    it('should have the correct aria-label for dark mode switch', () => {
      expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument();
    });

    it('should call toggleTheme when clicked', async () => {
      await user.click(screen.getByText('Dark'));
      expect(mockToggleTheme).toHaveBeenCalled();
    });
  });

  // ── Footer action: theme toggle (dark mode) ──────────────────────

  describe('Given the theme is dark', () => {
    beforeEach(() => {
      mutableThemeStore.theme = 'dark';
      mockOnboardingReturn = buildOnboarding({ currentStep: 2, path: 'create' });
      render(<OnboardingPage />);
    });

    it('should show Light label', () => {
      expect(screen.getByText('Light')).toBeInTheDocument();
    });

    it('should show the sun icon', () => {
      expect(screen.getByTestId('icon-sun')).toBeInTheDocument();
    });

    it('should have the correct aria-label for light mode switch', () => {
      expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument();
    });
  });

  // ── Step 1 with path 'invitation' and sub-step not matching ──────

  describe('Given path is invitation but sub-step is neither code-entry nor confirmation', () => {
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({
        currentStep: 2,
        path: 'invitation',
        invitationSubStep: 'unknown',
      });
      render(<OnboardingPage />);
    });

    it('should render step 2 preferences (falls through invitation checks)', () => {
      expect(screen.getByTestId('step-preferences')).toBeInTheDocument();
    });
  });

  // ── Loading state passed down ─────────────────────────────────────

  describe('Given isLoading is true', () => {
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({ currentStep: 0, isLoading: true });
      render(<OnboardingPage />);
    });

    it('should pass isLoading true to Step1Welcome', () => {
      expect(step1Props.isLoading).toBe(true);
    });
  });

  // ── Error state passed down ───────────────────────────────────────

  describe('Given there is an error', () => {
    beforeEach(() => {
      mockOnboardingReturn = buildOnboarding({ currentStep: 0, error: 'Something broke' });
      render(<OnboardingPage />);
    });

    it('should pass the error to Step1Welcome', () => {
      expect(step1Props.error).toBe('Something broke');
    });
  });
});
