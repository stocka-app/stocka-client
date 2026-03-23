/**
 * Shared mock for react-i18next.
 *
 * Usage in test file:
 *   vi.mock('react-i18next', () => i18nMock);
 */
const i18nInstance = {
  language: 'es',
  changeLanguage: (lng: string) => { i18nInstance.language = lng; return Promise.resolve(); },
};

export const i18nMock = {
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts?.defaultValue) return opts.defaultValue as string;
      return key;
    },
    i18n: i18nInstance,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
};
