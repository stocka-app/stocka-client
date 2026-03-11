import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '@/locales/en/common.json';
import enAuthentication from '@/locales/en/authentication.json';
import esCommon from '@/locales/es/common.json';
import esAuthentication from '@/locales/es/authentication.json';

const resources = {
  en: {
    common: enCommon,
    authentication: enAuthentication,
  },
  es: {
    common: esCommon,
    authentication: esAuthentication,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'authentication'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
