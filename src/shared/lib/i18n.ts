import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from '@/locales/en/common.json';
import enAuthentication from '@/locales/en/authentication.json';
import enLayout from '@/locales/en/layout.json';
import enOnboarding from '@/locales/en/onboarding.json';
import enOrganization from '@/locales/en/organization.json';
import enTeam from '@/locales/en/team.json';
import enInstallations from '@/locales/en/installations.json';
import enPrivacy from '@/locales/en/privacy.json';
import esCommon from '@/locales/es/common.json';
import esAuthentication from '@/locales/es/authentication.json';
import esLayout from '@/locales/es/layout.json';
import esOnboarding from '@/locales/es/onboarding.json';
import esOrganization from '@/locales/es/organization.json';
import esTeam from '@/locales/es/team.json';
import esInstallations from '@/locales/es/installations.json';
import esPrivacy from '@/locales/es/privacy.json';

const resources = {
  en: {
    common: enCommon,
    authentication: enAuthentication,
    layout: enLayout,
    onboarding: enOnboarding,
    organization: enOrganization,
    team: enTeam,
    installations: enInstallations,
    privacy: enPrivacy,
  },
  es: {
    common: esCommon,
    authentication: esAuthentication,
    layout: esLayout,
    onboarding: esOnboarding,
    organization: esOrganization,
    team: esTeam,
    installations: esInstallations,
    privacy: esPrivacy,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'authentication', 'layout', 'onboarding', 'organization', 'team', 'installations', 'privacy'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
