import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '@/locales/en/common.json';
import enAuthentication from '@/locales/en/authentication.json';
import enLayout from '@/locales/en/layout.json';
import enOnboarding from '@/locales/en/onboarding.json';
import enTeam from '@/locales/en/team.json';
import enSpaces from '@/locales/en/spaces.json';
import esCommon from '@/locales/es/common.json';
import esAuthentication from '@/locales/es/authentication.json';
import esLayout from '@/locales/es/layout.json';
import esOnboarding from '@/locales/es/onboarding.json';
import esTeam from '@/locales/es/team.json';
import esSpaces from '@/locales/es/spaces.json';

const resources = {
  en: {
    common: enCommon,
    authentication: enAuthentication,
    layout: enLayout,
    onboarding: enOnboarding,
    team: enTeam,
    spaces: enSpaces,
  },
  es: {
    common: esCommon,
    authentication: esAuthentication,
    layout: esLayout,
    onboarding: esOnboarding,
    team: esTeam,
    spaces: esSpaces,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'authentication', 'layout', 'onboarding', 'team', 'spaces'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
