import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthentication } from '@/features/authentication';
import { useOnboarding } from '../hooks/useOnboarding';
import { OnboardingCard } from '../components/OnboardingCard';
import { Step0PathSelection } from '../components/steps/Step0PathSelection';
import { Step1Welcome } from '../components/steps/Step1Welcome';
import { Step2Preferences } from '../components/steps/Step2Preferences';
import { Step3BusinessProfile } from '../components/steps/Step3BusinessProfile';
import { Step4Spaces } from '../components/steps/Step4Spaces';
import { Step5Context } from '../components/steps/Step5Context';
import { Step6QuickStart } from '../components/steps/Step6QuickStart';
import { Step7Success } from '../components/steps/Step7Success';
import { InvitationCodeEntry } from '../components/invitation/InvitationCodeEntry';
import { InvitationConfirmation } from '../components/invitation/InvitationConfirmation';

export default function OnboardingPage(): React.ReactElement {
  const { t } = useTranslation('onboarding');
  const navigate = useNavigate();
  const { user } = useAuthentication();

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
    goToPreviousStep,
    goToNextStep,
    submitConsents,
    submitPreferences,
    submitBusinessProfile,
    submitContext,
    completeOnboarding,
    validateInvitationCode,
    acceptInvitation,
    setInvitationSubStep,
  } = useOnboarding();

  const tier = (user as { tier?: string } | null)?.tier;

  // Step 0 — Path selection (no progress bar, no card wrapper)
  if (currentStep === 0) {
    return (
      <OnboardingCard step={0} title={t('step0.title')} subtitle={t('step0.subtitle')}>
        <Step0PathSelection onSelectPath={selectPath} />
      </OnboardingCard>
    );
  }

  // Invitation sub-flow
  if (path === 'invitation') {
    if (invitationSubStep === 'code-entry') {
      return (
        <OnboardingCard
          step={1}
          title={t('invitation.codeEntry.title')}
          subtitle={t('invitation.codeEntry.subtitle')}
        >
          <InvitationCodeEntry
            onValidate={validateInvitationCode}
            onBack={() => {
              setInvitationSubStep('code-entry');
              selectPath('create');
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

  // Create business flow — steps 1-7
  if (currentStep === 1) {
    return (
      <OnboardingCard step={1} title={t('step1.title')} subtitle={t('step1.subtitle')}>
        <Step1Welcome
          onSubmit={submitConsents}
          isLoading={isLoading}
          error={error}
          defaultValues={consents ?? undefined}
        />
      </OnboardingCard>
    );
  }

  if (currentStep === 2) {
    return (
      <OnboardingCard step={2} title={t('step2.title')} subtitle={t('step2.subtitle')}>
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
      <OnboardingCard step={3} title={t('step3.title')} subtitle={t('step3.subtitle')}>
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
      <OnboardingCard step={4} title={t('step4.title')} subtitle={t('step4.subtitle')}>
        <Step4Spaces
          tier={tier}
          onContinue={goToNextStep}
          onSkip={goToNextStep}
          onBack={goToPreviousStep}
          isLoading={isLoading}
        />
      </OnboardingCard>
    );
  }

  if (currentStep === 5) {
    return (
      <OnboardingCard step={5} title={t('step5.title')} subtitle={t('step5.subtitle')}>
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

  if (currentStep === 6) {
    return (
      <OnboardingCard step={6} title={t('step6.title')} subtitle={t('step6.subtitle')}>
        <Step6QuickStart
          onComplete={completeOnboarding}
          onSkip={completeOnboarding}
          isLoading={isLoading}
          error={error}
        />
      </OnboardingCard>
    );
  }

  // Step 7 — Success
  return (
    <OnboardingCard step={7} title={t('step7.title')} subtitle={t('step7.subtitle')}>
      <Step7Success onGoToDashboard={() => navigate('/dashboard')} />
    </OnboardingCard>
  );
}
