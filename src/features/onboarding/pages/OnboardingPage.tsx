import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useAuthentication } from '@/features/authentication';
import { useThemeStore } from '@/store/theme.store';
import { FlagUS, FlagMX } from '@/shared/components/flags';
import { useOnboarding } from '../hooks/useOnboarding';
import { useOnboardingStore } from '../store/onboarding.store';
import { OnboardingCard } from '../components/OnboardingCard';
import { Step0PathSelection } from '../components/steps/Step0PathSelection';
import { Step1Welcome } from '../components/steps/Step1Welcome';
import { Step2Preferences } from '../components/steps/Step2Preferences';
import { Step3BusinessProfile } from '../components/steps/Step3BusinessProfile';
import { Step4Spaces } from '../components/steps/Step4Spaces';
import { Step5Context } from '../components/steps/Step5Context';
import { Step6QuickStart } from '../components/steps/Step6QuickStart';
import { InvitationCodeEntry } from '../components/invitation/InvitationCodeEntry';
import { InvitationConfirmation } from '../components/invitation/InvitationConfirmation';

export default function OnboardingPage(): React.ReactElement {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const { user, logout } = useAuthentication();
  const { theme, toggle: toggleTheme } = useThemeStore();

  const {
    currentStep,
    path,
    consents,
    preferences,
    businessProfile,
    context,
    isLoading,
    error,
    invitationDetails,
    invitationSubStep,
    selectPath,
    goToStep,
    goToPreviousStep,
    goToNextStep,
    submitConsents,
    submitPreferences,
    submitBusinessProfile,
    submitSpaces,
    submitContext,
    completeOnboarding,
    validateInvitationCode,
    acceptInvitation,
    setInvitationSubStep,
  } = useOnboarding();

  const setPath = useOnboardingStore((s) => s.setPath);
  const tier = (user as { tier?: string } | null)?.tier;

  // Auto-redirect to dashboard when onboarding is completed (step 7 = completed state)
  useEffect(() => {
    if (currentStep === 7) {
      navigate('/dashboard');
    }
  }, [currentStep, navigate]);

  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const toggleLanguage = () => {
    i18n.changeLanguage(currentLang === 'es' ? 'en' : 'es');
  };

  // Footer with exit button, language toggle, and theme toggle
  const footerAction = (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={logout}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        {t('exitOnboarding')}
      </button>
      <span className="text-neutral-300">|</span>
      <button
        type="button"
        onClick={toggleLanguage}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
        aria-label={currentLang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
      >
        {currentLang === 'es' ? (
          <><FlagUS className="h-4 w-auto rounded-[1px]" /> English</>
        ) : (
          <><FlagMX className="h-4 w-auto rounded-[1px]" /> Español</>
        )}
      </button>
      <span className="text-neutral-300">|</span>
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>
    </div>
  );

  // Step 0 — Consents / Terms
  // Skip if already accepted — consent is recorded in the DB, no need to re-ask
  if (currentStep === 0) {
    if (consents !== null) {
      // Auto-advance: consents already given, go to path selection
      goToStep(1);
      return null;
    }
    return (
      <OnboardingCard step={0} title={t('step1.title')} subtitle={t('step1.subtitle')} footerAction={footerAction}>
        <Step1Welcome
          onSubmit={submitConsents}
          isLoading={isLoading}
          error={error}
          defaultValues={consents ?? undefined}
        />
      </OnboardingCard>
    );
  }

  // Auto-advance: path 'create' already selected, go to preferences
  // This handles resuming from a session where path was saved but step wasn't advanced to 2.
  if (currentStep === 1 && path === 'create') {
    goToStep(2);
    return null;
  }

  // Step 1 — Path selection (owner or invited)
  if (currentStep === 1 && !path) {
    return (
      <OnboardingCard step={1} title={t('step0.title')} subtitle={t('step0.subtitle')} footerAction={footerAction}>
        <Step0PathSelection onSelectPath={selectPath} />
      </OnboardingCard>
    );
  }

  // Invitation sub-flow (after path = invitation is selected at step 1)
  if (path === 'invitation') {
    if (invitationSubStep === 'code-entry') {
      return (
        <OnboardingCard
          step={1}
          title={t('invitation.codeEntry.title')}
          subtitle={t('invitation.codeEntry.subtitle')}
          footerAction={footerAction}
        >
          <InvitationCodeEntry
            onValidate={validateInvitationCode}
            onBack={() => {
              setInvitationSubStep('code-entry');
              goToStep(1);
              setPath(null);
            }}
            isLoading={isLoading}
            error={error}
          />
        </OnboardingCard>
      );
    }

    if (invitationSubStep === 'confirmation' && invitationDetails) {
      return (
        <OnboardingCard
          step={1}
          title={t('invitation.confirmation.title')}
          subtitle={t('invitation.confirmation.subtitle')}
          footerAction={footerAction}
        >
          <InvitationConfirmation
            invitationDetails={invitationDetails}
            onAccept={acceptInvitation}
            onCancel={() => setInvitationSubStep('code-entry')}
            isLoading={isLoading}
            error={error}
          />
        </OnboardingCard>
      );
    }
  }

  if (currentStep === 2) {
    return (
      <OnboardingCard step={2} title={t('step2.title')} subtitle={t('step2.subtitle')} footerAction={footerAction}>
        <Step2Preferences
          onSubmit={submitPreferences}
          onBack={goToPreviousStep}
          isLoading={isLoading}
          error={error}
          defaultValues={preferences ?? undefined}
        />
      </OnboardingCard>
    );
  }

  if (currentStep === 3) {
    return (
      <OnboardingCard step={3} title={t('step3.title')} subtitle={t('step3.subtitle')} footerAction={footerAction}>
        <Step3BusinessProfile
          onSubmit={submitBusinessProfile}
          onBack={goToPreviousStep}
          isLoading={isLoading}
          error={error}
          defaultValues={businessProfile ?? undefined}
        />
      </OnboardingCard>
    );
  }

  if (currentStep === 4) {
    return (
      <OnboardingCard step={4} title={t('step4.title')} subtitle={t('step4.subtitle')} footerAction={footerAction}>
        <Step4Spaces
          businessType={businessProfile?.businessType ?? 'OTHER'}
          tier={tier ?? null}
          onSubmit={submitSpaces}
          onSkip={goToNextStep}
          onBack={goToPreviousStep}
          isLoading={isLoading}
          error={error}
        />
      </OnboardingCard>
    );
  }

  if (currentStep === 5) {
    return (
      <OnboardingCard step={5} title={t('step5.title')} subtitle={t('step5.subtitle')} footerAction={footerAction}>
        <Step5Context
          onSubmit={submitContext}
          onSkip={goToNextStep}
          onBack={goToPreviousStep}
          isLoading={isLoading}
          error={error}
          defaultValues={context ?? undefined}
        />
      </OnboardingCard>
    );
  }

  // Step 6 — Completion (final visible step)
  // Step 7 is an internal "completed" state that auto-redirects to dashboard via useEffect
  return (
    <OnboardingCard step={6} title={t('step6.title')} subtitle={t('step6.subtitle')} footerAction={footerAction}>
      <Step6QuickStart
        onComplete={completeOnboarding}
        isLoading={isLoading}
        error={error}
      />
    </OnboardingCard>
  );
}
