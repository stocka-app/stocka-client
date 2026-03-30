import type React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '@/shared/components/ErrorBoundary';

// Suppress React error boundary console.error output during tests
const consoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = consoleError;
});

const i18nMockState = { language: 'en' as string, returnNull: false };

vi.mock('@/shared/lib/i18n', () => ({
  default: {
    t: (key: string) => {
      if (i18nMockState.returnNull) return undefined;
      const translations: Record<string, string> = {
        'errorBoundary.title': 'Something went wrong',
        'errorBoundary.description': 'An unexpected error occurred.',
        'errorBoundary.reload': 'Reload page',
        'errorBoundary.goHome': 'Go to home',
        'errorBoundary.goToLogin': 'Go to login',
        'errorBoundary.tryAgain': 'Try again',
      };
      return translations[key] ?? key;
    },
    get language() {
      return i18nMockState.language;
    },
    set language(val: string) {
      i18nMockState.language = val;
    },
    changeLanguage: vi.fn(),
  },
}));

function BrokenChild(): React.ReactNode {
  throw new Error('Test render error');
}

describe('ErrorBoundary', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    i18nMockState.language = 'en';
    i18nMockState.returnNull = false;
  });

  describe('Given a child component renders without error', () => {
    it('Then it renders the children normally', () => {
      render(
        <ErrorBoundary>
          <div>Normal Content</div>
        </ErrorBoundary>,
      );
      expect(screen.getByText('Normal Content')).toBeInTheDocument();
    });
  });

  describe('Given a child throws with context="page" (default)', () => {
    it('Then it renders the full-page fallback with branding and controls', () => {
      render(
        <ErrorBoundary>
          <BrokenChild />
        </ErrorBoundary>,
      );
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
      expect(screen.getByText('Reload page')).toBeInTheDocument();
      expect(screen.getByText('Go to login')).toBeInTheDocument();
      // Branding is present
      expect(screen.getByText('Stocka')).toBeInTheDocument();
    });
  });

  describe('Given a child throws with context="inline"', () => {
    it('Then it renders the compact inline fallback', () => {
      render(
        <ErrorBoundary context="inline">
          <BrokenChild />
        </ErrorBoundary>,
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
      expect(screen.getByText('Reload page')).toBeInTheDocument();
      // No branding in inline mode
      expect(screen.queryByText('Stocka')).not.toBeInTheDocument();
    });
  });

  describe('Given the page fallback is visible and the user clicks Reload', () => {
    it('Then it calls location.reload', async () => {
      const reloadSpy = vi.fn();
      Object.defineProperty(globalThis, 'location', {
        value: { reload: reloadSpy, assign: vi.fn() },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <BrokenChild />
        </ErrorBoundary>,
      );

      await user.click(screen.getByText('Reload page'));
      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Given the inline fallback is visible and the user clicks Try again', () => {
    it('Then the Try again button is clickable', async () => {
      render(
        <ErrorBoundary context="inline">
          <BrokenChild />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      // Verify the Try again button exists and is interactive
      const tryAgainBtn = screen.getByText('Try again');
      expect(tryAgainBtn).toBeInTheDocument();
      expect(tryAgainBtn).toBeEnabled();
    });
  });

  describe('Given the page fallback is visible and the user clicks Try again', () => {
    it('Then it resets the error state and attempts to re-render children', async () => {
      let shouldThrow = true;

      function ConditionallyBrokenChild() {
        if (shouldThrow) {
          throw new Error('Test render error');
        }
        return <div>Recovered Content</div>;
      }

      render(
        <ErrorBoundary>
          <ConditionallyBrokenChild />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Fix the child before resetting
      shouldThrow = false;

      await user.click(screen.getByText('Try again'));

      expect(screen.getByText('Recovered Content')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Given the inline fallback is visible and the user clicks Reload', () => {
    it('Then it calls location.reload', async () => {
      const reloadSpy = vi.fn();
      Object.defineProperty(globalThis, 'location', {
        value: { reload: reloadSpy, assign: vi.fn() },
        writable: true,
      });

      render(
        <ErrorBoundary context="inline">
          <BrokenChild />
        </ErrorBoundary>,
      );

      await user.click(screen.getByText('Reload page'));
      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Given the page fallback is visible and the user clicks the theme toggle', () => {
    it('Then it adds the dark class when the document is in light mode', async () => {
      document.documentElement.classList.remove('dark');

      render(
        <ErrorBoundary>
          <BrokenChild />
        </ErrorBoundary>,
      );

      await user.click(screen.getByText('Dark', { exact: false }));

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('stocka-theme')).toBe('dark');
    });

    it('Then it removes the dark class when the document is in dark mode', async () => {
      document.documentElement.classList.add('dark');

      render(
        <ErrorBoundary>
          <BrokenChild />
        </ErrorBoundary>,
      );

      await user.click(screen.getByText('Light', { exact: false }));

      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('stocka-theme')).toBe('light');
    });
  });

  describe('Given the page fallback is visible and the user clicks the language toggle', () => {
    it('Then it calls changeLanguage with es when current language is en', async () => {
      const i18nMock = (await import('@/shared/lib/i18n')).default;

      render(
        <ErrorBoundary>
          <BrokenChild />
        </ErrorBoundary>,
      );

      // i18n.language is 'en', so clicking should switch to 'es'
      await user.click(screen.getByText('Español'));
      expect(i18nMock.changeLanguage).toHaveBeenCalledWith('es');
    });

    it('Then it calls changeLanguage with en when current language is es', async () => {
      const i18nMock = (await import('@/shared/lib/i18n')).default;
      i18nMockState.language = 'es';

      render(
        <ErrorBoundary>
          <BrokenChild />
        </ErrorBoundary>,
      );

      // i18n.language is 'es', so the button shows "English" and clicking switches to 'en'
      await user.click(screen.getByText('English'));
      expect(i18nMock.changeLanguage).toHaveBeenCalledWith('en');
    });
  });

  describe('Given i18n.t returns undefined (fallback path in the t() helper)', () => {
    it('Then the component renders using the raw key as fallback text', () => {
      i18nMockState.returnNull = true;

      render(
        <ErrorBoundary>
          <BrokenChild />
        </ErrorBoundary>,
      );

      // When i18n.t returns undefined, the t() helper falls back to the key itself
      // The key for the title is 'title', so it should render 'title'
      expect(screen.getByText('title')).toBeInTheDocument();
    });
  });

  describe('Given the page fallback is rendered with i18n.language set to es', () => {
    it('Then it renders the US flag and English text in the language toggle', () => {
      i18nMockState.language = 'es';

      render(
        <ErrorBoundary>
          <BrokenChild />
        </ErrorBoundary>,
      );

      expect(screen.getByText('English')).toBeInTheDocument();
    });
  });
});
