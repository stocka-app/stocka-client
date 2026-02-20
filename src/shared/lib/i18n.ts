import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import esCommon from '@/locales/es/common.json';
import esAuth from '@/locales/es/auth.json';

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
  },
  es: {
    common: esCommon,
    auth: esAuth,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
