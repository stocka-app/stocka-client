import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialButton } from '@/features/authentication/components/SocialButton';
import { authenticationService } from '@/features/authentication/api/authentication.service';

vi.mock('@/features/authentication/api/authentication.service', () => ({
  authenticationService: {
    initiateOAuth: vi.fn(),
  },
}));

const sessionStorageSetItem = vi.spyOn(Storage.prototype, 'setItem');

describe('SocialButton', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('Given provider="google" and variant="full"', () => {
    it('Then it renders a button with the provider label', () => {
      render(<SocialButton provider="google" label="Continue with Google" />);
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    it('Then it renders the Google SVG icon', () => {
      const { container } = render(<SocialButton provider="google" label="Continue with Google" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Given variant="icon" is used', () => {
    it('Then it renders a compact icon-only button without a text label', () => {
      render(<SocialButton provider="google" variant="icon" />);
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Given provider="microsoft"', () => {
    it('Then it renders the Microsoft icon', () => {
      const { container } = render(<SocialButton provider="microsoft" label="Sign in with Microsoft" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Given no onClick prop is provided', () => {
    it('Then clicking the button stores the provider in sessionStorage and initiates OAuth', async () => {
      render(<SocialButton provider="google" label="Google" />);
      await user.click(screen.getByRole('button'));

      expect(sessionStorageSetItem).toHaveBeenCalledWith('lastOAuthProvider', 'google');
      expect(authenticationService.initiateOAuth).toHaveBeenCalledWith('google');
    });
  });

  describe('Given a custom onClick handler is provided', () => {
    it('Then clicking the button calls the custom handler instead of initiating OAuth', async () => {
      const customOnClick = vi.fn();
      render(<SocialButton provider="google" label="Google" onClick={customOnClick} />);

      await user.click(screen.getByRole('button'));

      expect(customOnClick).toHaveBeenCalledTimes(1);
      expect(authenticationService.initiateOAuth).not.toHaveBeenCalled();
    });
  });
});
