import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step5Context } from '@/features/onboarding/components/steps/Step5Context';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('Step5Context', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onSkip = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Given the user is on the business context step', () => {
    beforeEach(() => {
      render(
        <Step5Context
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={false}
          error={null}
        />,
      );
    });

    it('Then the team size chip group is visible', () => {
      expect(screen.getByRole('group', { name: /step5.teamSizeLabel/i })).toBeInTheDocument();
    });

    it('Then the revenue chip group is visible', () => {
      expect(screen.getByRole('group', { name: /step5.revenueLabel/i })).toBeInTheDocument();
    });

    it('Then all 5 team size options are present', () => {
      const teamChips = [
        /step5.teamSizeSolo/i,
        /step5.teamSize2to5/i,
        /step5.teamSize6to20/i,
        /step5.teamSize21to50/i,
        /step5.teamSize50plus/i,
      ];
      teamChips.forEach((name) => {
        expect(screen.getByRole('button', { name })).toBeInTheDocument();
      });
    });

    describe('When the user selects a team size chip', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step5.teamSizeSolo/i }));
      });

      it('Then that chip is marked as pressed', () => {
        expect(
          screen.getByRole('button', { name: /step5.teamSizeSolo/i }),
        ).toHaveAttribute('aria-pressed', 'true');
      });

      describe('When the user clicks the same chip again', () => {
        beforeEach(async () => {
          await user.click(screen.getByRole('button', { name: /step5.teamSizeSolo/i }));
        });

        it('Then the chip is deselected', () => {
          expect(
            screen.getByRole('button', { name: /step5.teamSizeSolo/i }),
          ).toHaveAttribute('aria-pressed', 'false');
        });
      });
    });

    describe('When the user selects and then deselects a revenue chip', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step5.revenueLess50k/i }));
        await user.click(screen.getByRole('button', { name: /step5.revenueLess50k/i }));
      });

      it('Then the revenue chip is deselected', () => {
        expect(
          screen.getByRole('button', { name: /step5.revenueLess50k/i }),
        ).toHaveAttribute('aria-pressed', 'false');
      });
    });

    describe('When the user clicks continue without any selections', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step5.ctaButton/i }));
      });

      it('Then onSubmit is called with empty context (both fields undefined)', () => {
        expect(onSubmit).toHaveBeenCalledWith({
          teamSize: undefined,
          monthlyRevenue: undefined,
        });
      });
    });

    describe('When the user clicks skip', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step5.skipLink/i }));
      });

      it('Then onSkip is called', () => {
        expect(onSkip).toHaveBeenCalledOnce();
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
        <Step5Context
          onSubmit={onSubmit}
          onSkip={onSkip}
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
        <Step5Context
          onSubmit={onSubmit}
          onSkip={onSkip}
          onBack={onBack}
          isLoading={true}
          error={null}
        />,
      );
    });

    it('Then the continue button is disabled', () => {
      expect(screen.getByRole('button', { name: /step5.ctaButton/i })).toBeDisabled();
    });

    it('Then the saving text is shown inside the button', () => {
      expect(screen.getByText('step5.saving')).toBeInTheDocument();
    });
  });
});
