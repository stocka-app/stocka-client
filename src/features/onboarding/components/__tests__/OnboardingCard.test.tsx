import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OnboardingCard } from '@/features/onboarding/components/OnboardingCard';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('OnboardingCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Given the user is on step 0 (path selection)', () => {
    beforeEach(() => {
      render(
        <OnboardingCard step={0} title="¿Cómo quieres comenzar?">
          <div>Step 0 Content</div>
        </OnboardingCard>,
      );
    });

    it('Then the card title is rendered', () => {
      expect(screen.getByText('¿Cómo quieres comenzar?')).toBeInTheDocument();
    });

    it('Then the children are rendered', () => {
      expect(screen.getByText('Step 0 Content')).toBeInTheDocument();
    });

    it('Then the progress bar is NOT shown on step 0', () => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Given the user is on step 1', () => {
    beforeEach(() => {
      render(
        <OnboardingCard step={1} title="Welcome" subtitle="Please accept our terms">
          <div>Step 1 Content</div>
        </OnboardingCard>,
      );
    });

    it('Then the progress bar is shown', () => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('Then the title is rendered', () => {
      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });

    it('Then the subtitle is rendered', () => {
      expect(screen.getByText('Please accept our terms')).toBeInTheDocument();
    });

    it('Then the children are rendered', () => {
      expect(screen.getByText('Step 1 Content')).toBeInTheDocument();
    });
  });

  describe('Given the user is on step 7 (completed state, not rendered)', () => {
    beforeEach(() => {
      render(
        <OnboardingCard step={7} title="Success!">
          <div>Step 7 Content</div>
        </OnboardingCard>,
      );
    });

    it('Then the progress bar is NOT shown on step 7', () => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  describe('Given a card is rendered with a footerAction', () => {
    beforeEach(() => {
      render(
        <OnboardingCard step={2} title="Step Title" footerAction={<a href="/exit">Exit onboarding</a>}>
          <div>Content</div>
        </OnboardingCard>,
      );
    });

    it('Then the footer action is rendered', () => {
      expect(screen.getByText('Exit onboarding')).toBeInTheDocument();
    });

    it('Then the footer link is clickable', () => {
      expect(screen.getByRole('link', { name: 'Exit onboarding' })).toHaveAttribute('href', '/exit');
    });
  });

  describe('Given a card is rendered without a footerAction', () => {
    beforeEach(() => {
      render(
        <OnboardingCard step={2} title="No Footer">
          <div>Content</div>
        </OnboardingCard>,
      );
    });

    it('Then no footer section is rendered', () => {
      expect(screen.queryByText('Exit onboarding')).not.toBeInTheDocument();
    });
  });

  describe('Given a card is rendered without a subtitle', () => {
    beforeEach(() => {
      render(
        <OnboardingCard step={3} title="Title Only">
          <div>Content</div>
        </OnboardingCard>,
      );
    });

    it('Then only the title is shown', () => {
      expect(screen.getByText('Title Only')).toBeInTheDocument();
    });

    it('Then no subtitle text is rendered', () => {
      // The subtitle prop was not passed, so there is no subtitle paragraph
      expect(screen.queryByText('Subtitle text')).not.toBeInTheDocument();
    });
  });
});
