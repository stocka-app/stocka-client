import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step3BusinessProfile } from '@/features/onboarding/components/steps/Step3BusinessProfile';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('Step3BusinessProfile', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onBack = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Given the user is on the business profile step', () => {
    beforeEach(() => {
      render(
        <Step3BusinessProfile
          onSubmit={onSubmit}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
    });

    it('Then the business name input is visible', () => {
      expect(
        screen.getByRole('textbox', { name: /step3.businessNameLabel/i }),
      ).toBeInTheDocument();
    });

    it('Then all 9 business type options are displayed', () => {
      const typeButtons = screen.getAllByRole('button', { name: /step3.businessTypes\./i });
      expect(typeButtons.length).toBeGreaterThanOrEqual(9);
    });

    it('Then the state dropdown is visible', () => {
      expect(screen.getByRole('combobox', { name: /step3.stateLabel/i })).toBeInTheDocument();
    });

    describe('When the user tries to submit without filling required fields', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step3.ctaButton/i }));
      });

      it('Then onSubmit is NOT called', () => {
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });

    describe('When the user selects a business type', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step3.businessTypes.RETAIL/i }));
      });

      it('Then the selected type button is marked as pressed', () => {
        expect(
          screen.getByRole('button', { name: /step3.businessTypes.RETAIL/i }),
        ).toHaveAttribute('aria-pressed', 'true');
      });
    });

    describe('When the user fills all fields and submits', () => {
      beforeEach(async () => {
        await user.type(
          screen.getByRole('textbox', { name: /step3.businessNameLabel/i }),
          'Mi Negocio',
        );
        await user.click(screen.getByRole('button', { name: /step3.businessTypes.RETAIL/i }));
        await user.selectOptions(
          screen.getByRole('combobox', { name: /step3.stateLabel/i }),
          'Jalisco',
        );
        await user.click(screen.getByRole('button', { name: /step3.ctaButton/i }));
      });

      it('Then onSubmit is called with the business profile data', () => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            businessName: 'Mi Negocio',
            businessType: 'RETAIL',
            state: 'Jalisco',
          }),
        );
      });
    });

    describe('When the user clicks the back button', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /common.back/i }));
      });

      it('Then onBack is called', () => {
        expect(onBack).toHaveBeenCalledOnce();
      });
    });
  });

  describe('Given an API error occurred', () => {
    beforeEach(() => {
      render(
        <Step3BusinessProfile
          onSubmit={onSubmit}
          onBack={onBack}
          isLoading={false}
          error="errors.profileUpdateFailed"
        />,
      );
    });

    it('Then the error alert is shown', () => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Given a submission is in progress', () => {
    beforeEach(() => {
      render(
        <Step3BusinessProfile
          onSubmit={onSubmit}
          onBack={onBack}
          isLoading={true}
          error={null}
        />,
      );
    });

    it('Then the submit button is disabled', () => {
      expect(screen.getByRole('button', { name: /step3.ctaButton/i })).toBeDisabled();
    });
  });
});
