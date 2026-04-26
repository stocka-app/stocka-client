import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerificationCodeInput } from '../VerificationCodeInput';

// ── Mocks ─────────────────────────────────────────────────────────────

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('VerificationCodeInput', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnChange = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  // ── Render ────────────────────────────────────────────────────────

  describe('Given default props', () => {
    beforeEach(() => {
      render(
        <VerificationCodeInput value="" onChange={mockOnChange} autoFocus={false} />,
      );
    });

    it('Then 6 input fields are rendered', () => {
      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(6);
    });

    it('Then each input has a max length of 1', () => {
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('maxLength', '1');
      });
    });

    it('Then each input has an aria-label for accessibility', () => {
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Given autoFocus is omitted (default true)', () => {
    it('Then the first input is focused on mount', () => {
      render(<VerificationCodeInput value="" onChange={vi.fn()} />);
      const inputs = screen.getAllByRole('textbox');
      expect(document.activeElement).toBe(inputs[0]);
    });
  });

  // ── Custom length ─────────────────────────────────────────────────

  describe('Given length is 4', () => {
    it('Then 4 input fields are rendered', () => {
      render(
        <VerificationCodeInput
          value=""
          onChange={mockOnChange}
          length={4}
          autoFocus={false}
        />,
      );
      expect(screen.getAllByRole('textbox')).toHaveLength(4);
    });
  });

  // ── Pre-filled value ─────────────────────────────────────────────

  describe('Given value is "ABC"', () => {
    it('Then the first 3 inputs show A, B, C', () => {
      render(
        <VerificationCodeInput value="ABC" onChange={mockOnChange} autoFocus={false} />,
      );
      const inputs = screen.getAllByRole('textbox');
      expect(inputs[0]).toHaveValue('A');
      expect(inputs[1]).toHaveValue('B');
      expect(inputs[2]).toHaveValue('C');
      expect(inputs[3]).toHaveValue('');
    });
  });

  // ── Typing advances focus ─────────────────────────────────────────

  describe('Given the user types a character', () => {
    it('Then onChange is called with the new value', async () => {
      render(
        <VerificationCodeInput value="" onChange={mockOnChange} autoFocus={false} />,
      );
      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[0]);
      await user.keyboard('A');

      expect(mockOnChange).toHaveBeenCalledWith('A');
    });
  });

  // ── Paste fills all fields ────────────────────────────────────────

  describe('Given the user pastes a full code', () => {
    it('Then onChange is called with the pasted value', async () => {
      render(
        <VerificationCodeInput value="" onChange={mockOnChange} autoFocus={false} />,
      );
      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[0]);
      await user.paste('ABC123');

      expect(mockOnChange).toHaveBeenCalledWith('ABC123');
    });
  });

  // ── Only alphanumeric accepted ────────────────────────────────────

  describe('Given the user types a non-alphanumeric character', () => {
    it('Then onChange is not called with that character', async () => {
      render(
        <VerificationCodeInput value="" onChange={mockOnChange} autoFocus={false} />,
      );
      const inputs = screen.getAllByRole('textbox');
      await user.click(inputs[0]);
      await user.keyboard('!');

      // Either not called or called without the special char
      const calls = mockOnChange.mock.calls;
      const hasSpecialChar = calls.some(
        (call: string[]) => typeof call[0] === 'string' && call[0].includes('!'),
      );
      expect(hasSpecialChar).toBe(false);
    });
  });

  // ── Disabled state ────────────────────────────────────────────────

  describe('Given disabled is true', () => {
    it('Then all inputs are disabled', () => {
      render(
        <VerificationCodeInput
          value=""
          onChange={mockOnChange}
          disabled
          autoFocus={false}
        />,
      );
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach((input) => {
        expect(input).toBeDisabled();
      });
    });
  });

  // ── Error state ──────────────────────────────────────────────────

  describe('Given error is true', () => {
    it('Then inputs have error styling', () => {
      render(
        <VerificationCodeInput
          value=""
          onChange={mockOnChange}
          error
          autoFocus={false}
        />,
      );
      const inputs = screen.getAllByRole('textbox');
      expect(inputs[0].className).toContain('border-red-500');
    });
  });
});
