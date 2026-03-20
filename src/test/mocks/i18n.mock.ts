/**
 * Shared mock for react-i18next.
 *
 * Usage in test file:
 *   vi.mock('react-i18next', () => i18nMock);
 */
export const i18nMock = {
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.defaultValue) return opts.defaultValue as string;
      return key;
    },
  }),
  initReactI18next: { type: '3rdParty', init: () => {} },
};
