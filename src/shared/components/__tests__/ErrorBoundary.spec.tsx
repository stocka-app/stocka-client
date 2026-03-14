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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  withTranslation: () => (Component: React.ComponentType) => {
    const WrappedComponent = (props: Record<string, unknown>) => {
      const t = (key: string) => key;
      return <Component {...props} t={t} i18n={{ language: 'en' }} tReady={true} />;
    };
    return WrappedComponent;
  },
}));

function BrokenChild() {
  throw new Error('Test render error');
}

describe('ErrorBoundary', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
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

  describe('Given a child component throws a render error', () => {
    it('Then it renders the error fallback UI with alert role', () => {
      render(
        <ErrorBoundary>
          <BrokenChild />
        </ErrorBoundary>,
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('Then it shows the reload and go-home action buttons', () => {
      render(
        <ErrorBoundary>
          <BrokenChild />
        </ErrorBoundary>,
      );
      expect(screen.getByText('errorBoundary.reload')).toBeInTheDocument();
      expect(screen.getByText('errorBoundary.goHome')).toBeInTheDocument();
    });
  });

  describe('Given the error fallback is visible and the user clicks Reload', () => {
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

      await user.click(screen.getByText('errorBoundary.reload'));
      expect(reloadSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Given the error fallback is visible and the user clicks Go Home', () => {
    it('Then it calls location.assign with "/"', async () => {
      const assignSpy = vi.fn();
      Object.defineProperty(globalThis, 'location', {
        value: { reload: vi.fn(), assign: assignSpy },
        writable: true,
      });

      render(
        <ErrorBoundary>
          <BrokenChild />
        </ErrorBoundary>,
      );

      await user.click(screen.getByText('errorBoundary.goHome'));
      expect(assignSpy).toHaveBeenCalledWith('/');
    });
  });
});
