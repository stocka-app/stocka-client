import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordInput } from '@/features/authentication/components/PasswordInput';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('PasswordInput', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('Given the component is rendered with default props', () => {
    it('Then it renders as a password input (hidden characters)', () => {
      render(<PasswordInput />);
      expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
    });

    it('Then it shows the "visibility_off" icon indicating the password is hidden', () => {
      render(<PasswordInput />);
      expect(screen.getByText('visibility_off')).toBeInTheDocument();
    });
  });

  describe('Given the user clicks the toggle button to reveal the password', () => {
    it('Then it switches the input type to text', async () => {
      render(<PasswordInput />);
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      expect(document.querySelector('input[type="text"]')).toBeInTheDocument();
    });

    it('Then it shows the "visibility" icon indicating the password is visible', async () => {
      render(<PasswordInput />);
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      expect(screen.getByText('visibility')).toBeInTheDocument();
    });
  });

  describe('Given the user toggles the password visibility twice', () => {
    it('Then it reverts to password type (hidden)', async () => {
      render(<PasswordInput />);
      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      await user.click(toggleButton);
      expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
    });
  });

  describe('Given additional props are passed', () => {
    it('Then it forwards them to the underlying input element', () => {
      render(<PasswordInput placeholder="Enter password" disabled />);
      const input = document.querySelector('input');
      expect(input).toHaveAttribute('placeholder', 'Enter password');
      expect(input).toBeDisabled();
    });
  });
});
