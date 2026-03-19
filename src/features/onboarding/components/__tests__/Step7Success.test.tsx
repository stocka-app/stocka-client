import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step7Success } from '@/features/onboarding/components/steps/Step7Success';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('Step7Success', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onGoToDashboard = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Given the user has completed onboarding', () => {
    beforeEach(() => {
      render(<Step7Success onGoToDashboard={onGoToDashboard} />);
    });

    it('Then the success message is visible', () => {
      expect(screen.getByText('step7.successMessage')).toBeInTheDocument();
    });

    it('Then the go to dashboard button is visible', () => {
      expect(screen.getByRole('button', { name: /step7.ctaButton/i })).toBeInTheDocument();
    });

    describe('When the user clicks go to dashboard', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step7.ctaButton/i }));
      });

      it('Then onGoToDashboard is called', () => {
        expect(onGoToDashboard).toHaveBeenCalledOnce();
      });
    });
  });
});
