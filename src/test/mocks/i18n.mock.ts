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

// Stable reference — must not be recreated per call or components that include
// `t` in useEffect deps will trigger an infinite re-render loop in tests.
const tFn = (key: string, opts?: Record<string, unknown>): string => {
  if (opts?.defaultValue) return opts.defaultValue as string;
  return key;
};

export const i18nMock = {
  useTranslation: () => ({
    t: tFn,
    i18n: i18nInstance,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
};
