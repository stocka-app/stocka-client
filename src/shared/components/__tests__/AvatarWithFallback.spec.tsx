import { render, screen, fireEvent } from '@testing-library/react';
import { AvatarWithFallback, getInitials } from '@/shared/components/AvatarWithFallback';

// ---------------------------------------------------------------------------
// AvatarWithFallback — conditional avatar vs initials
// ---------------------------------------------------------------------------

describe('AvatarWithFallback', () => {
  describe('Given the user has an avatar URL', () => {
    describe('When the image loads successfully', () => {
      it('Then it shows the avatar image instead of initials', () => {
        render(
          <AvatarWithFallback
            avatarUrl="https://example.com/avatar.jpg"
            initials="RM"
          />,
        );

        const img = screen.getByRole('img');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
        expect(img).toHaveAttribute('alt', 'RM');
        expect(screen.queryByText('RM')).not.toBeInTheDocument();
      });

      it('Then it applies the provided className to the image', () => {
        render(
          <AvatarWithFallback
            avatarUrl="https://example.com/avatar.jpg"
            initials="RM"
            className="h-9 w-9"
          />,
        );

        const img = screen.getByRole('img');
        expect(img).toHaveClass('h-9', 'w-9', 'rounded-full', 'object-cover');
      });
    });

    describe('When the image fails to load', () => {
      it('Then it falls back to showing the initials span', () => {
        render(
          <AvatarWithFallback
            avatarUrl="https://example.com/broken.jpg"
            initials="RM"
          />,
        );

        const img = screen.getByRole('img');
        fireEvent.error(img);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('RM')).toBeInTheDocument();
      });
    });
  });

  describe('Given the user has no avatar URL', () => {
    it('Then it shows the initials span when avatarUrl is null', () => {
      render(<AvatarWithFallback avatarUrl={null} initials="RM" />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('RM')).toBeInTheDocument();
    });

    it('Then it shows the initials span when avatarUrl is undefined', () => {
      render(<AvatarWithFallback avatarUrl={undefined} initials="RM" />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('RM')).toBeInTheDocument();
    });

    it('Then it shows the initials span when avatarUrl is an empty string', () => {
      render(<AvatarWithFallback avatarUrl="" initials="RM" />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('RM')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// getInitials — priority: givenName+familyName > givenName > displayName > username
// ---------------------------------------------------------------------------

describe('getInitials', () => {
  describe('Given the user has both givenName and familyName', () => {
    it('Then it returns the first letter of each in uppercase', () => {
      expect(getInitials('Roberto', 'Medina', null, 'rmedina')).toBe('RM');
    });
  });

  describe('Given the user has only givenName', () => {
    it('Then it returns the first two letters of givenName in uppercase', () => {
      expect(getInitials('Roberto', null, null, 'rmedina')).toBe('RO');
    });
  });

  describe('Given the user has a displayName with two or more words', () => {
    it('Then it returns the initials of the first two words', () => {
      expect(getInitials(null, null, 'Roberto Medina', 'rmedina')).toBe('RM');
    });

    it('Then it returns first and third word initials when four or more words', () => {
      expect(getInitials(null, null, 'Roberto Carlos Medina Austin', 'rmedina')).toBe('RM');
    });
  });

  describe('Given the user has a displayName with a single word', () => {
    it('Then it returns the first two characters in uppercase', () => {
      expect(getInitials(null, null, 'Roberto', 'rmedina')).toBe('RO');
    });
  });

  describe('Given the user has no names at all', () => {
    it('Then it falls back to the first two characters of the username in uppercase', () => {
      expect(getInitials(null, null, null, 'rmedina')).toBe('RM');
    });
  });
});
