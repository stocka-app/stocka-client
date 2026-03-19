/**
 * Opens a centered OAuth popup window.
 *
 * If the browser blocks the popup (returns null), falls back to a full-page
 * redirect so the OAuth flow can still complete.
 *
 * @param url - The full OAuth URL to open (should include ?mode=popup).
 * @returns The popup Window reference, or null when the popup was blocked.
 */
export function openOAuthPopup(url: string): Window | null {
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  const features = `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`;

  const popup = window.open(url, 'oauth-popup', features);

  if (!popup) {
    window.location.href = url;
    return null;
  }

  return popup;
}
