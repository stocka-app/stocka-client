import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OfflineBanner } from '@/shared/components/OfflineBanner';

vi.mock('react-i18next', async () => {
  const { i18nMock } = await import('@/test/mocks/i18n.mock');
  return i18nMock;
});

describe('OfflineBanner', () => {
  let onLineSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    onLineSpy = vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true);
  });

  afterEach(() => {
    onLineSpy.mockRestore();
  });

  describe('Given the browser is online', () => {
    describe('When the banner renders', () => {
      it('Then nothing is rendered', () => {
        const { container } = render(<OfflineBanner />);
        expect(container).toBeEmptyDOMElement();
      });
    });
  });

  describe('Given the browser is offline', () => {
    beforeEach(() => {
      onLineSpy.mockReturnValue(false);
    });

    describe('When the banner renders', () => {
      it('Then it surfaces the bannerTitle and bannerDescription copy', () => {
        render(<OfflineBanner />);
        expect(screen.getByText(/Sin conexión/)).toBeInTheDocument();
        expect(
          screen.getByText(/Algunas acciones están desactivadas/),
        ).toBeInTheDocument();
      });

      it('Then it exposes itself as a polite live region', () => {
        render(<OfflineBanner />);
        const banner = screen.getByRole('status');
        expect(banner).toHaveAttribute('aria-live', 'polite');
      });

      it('Then a custom className is merged onto the root container', () => {
        render(<OfflineBanner className="my-custom-class" />);
        const banner = screen.getByRole('status');
        expect(banner).toHaveClass('my-custom-class');
      });
    });
  });
});
