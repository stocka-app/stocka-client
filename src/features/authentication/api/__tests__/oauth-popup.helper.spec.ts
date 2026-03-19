import { openOAuthPopup } from '@/features/authentication/api/oauth-popup.helper';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildWindowMock(overrides: Partial<typeof window> = {}): typeof window {
  return {
    screenX: 100,
    screenY: 50,
    outerWidth: 1280,
    outerHeight: 800,
    open: vi.fn(),
    ...overrides,
  } as unknown as typeof window;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('openOAuthPopup', () => {
  let originalWindow: typeof window;

  beforeEach(() => {
    originalWindow = global.window;
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  describe('Given the browser allows popup windows', () => {
    let mockPopup: Window;

    beforeEach(() => {
      mockPopup = { closed: false } as Window;
      global.window = buildWindowMock({
        open: vi.fn().mockReturnValue(mockPopup),
      });
    });

    describe('When openOAuthPopup is called with a URL', () => {
      it('Then it opens a popup window with the correct width and height', () => {
        openOAuthPopup('https://example.com/oauth');

        expect(window.open).toHaveBeenCalledWith(
          'https://example.com/oauth',
          'oauth-popup',
          expect.stringContaining('width=500'),
        );
        expect(window.open).toHaveBeenCalledWith(
          'https://example.com/oauth',
          'oauth-popup',
          expect.stringContaining('height=600'),
        );
      });

      it('Then the popup is centered horizontally on screen', () => {
        // window.screenX=100, outerWidth=1280, popup width=500
        // expected left = 100 + (1280 - 500) / 2 = 100 + 390 = 490
        openOAuthPopup('https://example.com/oauth');

        expect(window.open).toHaveBeenCalledWith(
          'https://example.com/oauth',
          'oauth-popup',
          expect.stringContaining('left=490'),
        );
      });

      it('Then the popup is centered vertically on screen', () => {
        // window.screenY=50, outerHeight=800, popup height=600
        // expected top = 50 + (800 - 600) / 2 = 50 + 100 = 150
        openOAuthPopup('https://example.com/oauth');

        expect(window.open).toHaveBeenCalledWith(
          'https://example.com/oauth',
          'oauth-popup',
          expect.stringContaining('top=150'),
        );
      });

      it('Then toolbar and menubar are disabled in the popup features', () => {
        openOAuthPopup('https://example.com/oauth');

        expect(window.open).toHaveBeenCalledWith(
          'https://example.com/oauth',
          'oauth-popup',
          expect.stringContaining('toolbar=no'),
        );
        expect(window.open).toHaveBeenCalledWith(
          'https://example.com/oauth',
          'oauth-popup',
          expect.stringContaining('menubar=no'),
        );
      });

      it('Then it returns the popup window reference', () => {
        const result = openOAuthPopup('https://example.com/oauth');

        expect(result).toBe(mockPopup);
      });
    });
  });

  describe('Given the browser blocks popup windows', () => {
    beforeEach(() => {
      // Simulate popup blocker — window.open returns null
      Object.defineProperty(global, 'window', {
        value: buildWindowMock({
          open: vi.fn().mockReturnValue(null),
          location: { href: '' } as Location,
        }),
        writable: true,
        configurable: true,
      });
    });

    describe('When openOAuthPopup is called', () => {
      it('Then it falls back to full-page redirect via window.location.href', () => {
        openOAuthPopup('https://example.com/oauth');

        expect(window.location.href).toBe('https://example.com/oauth');
      });

      it('Then it returns null', () => {
        const result = openOAuthPopup('https://example.com/oauth');

        expect(result).toBeNull();
      });
    });
  });
});
