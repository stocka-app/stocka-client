import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Step0PathSelection } from '@/features/onboarding/components/steps/Step0PathSelection';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('Step0PathSelection', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const onSelectPath = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Given the user lands on the path selection screen', () => {
    beforeEach(() => {
      render(<Step0PathSelection onSelectPath={onSelectPath} />);
    });

    it('Then both path options are visible', () => {
      expect(screen.getByRole('button', { name: /step0.createBusiness/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /step0.haveInvitationCode/i }),
      ).toBeInTheDocument();
    });

    describe('When the user selects the create business option', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step0.createBusiness/i }));
      });

      it('Then onSelectPath is called with create', () => {
        expect(onSelectPath).toHaveBeenCalledWith('create');
      });
    });

    describe('When the user selects the invitation code option', () => {
      beforeEach(async () => {
        await user.click(screen.getByRole('button', { name: /step0.haveInvitationCode/i }));
      });

      it('Then onSelectPath is called with invitation', () => {
        expect(onSelectPath).toHaveBeenCalledWith('invitation');
      });
    });
  });
});
