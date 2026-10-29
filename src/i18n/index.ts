/**
 * i18n initialization.
 *
 * - Uses `expo-localization` to detect the device locale
 * - Defaults to English (`en`) with fallback
 * - Hindi (`hi`) ready — add `hi.json` when translations land
 * - `interpolation.escapeValue` is `false` because React already escapes
 */

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './en.json';

// Detect the device's preferred language code (e.g. "en", "hi")
const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

// eslint-disable-next-line import/no-named-as-default-member
i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    // hi: { translation: hi },  // uncomment when Hindi translations are ready
  },
  lng: deviceLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already handles XSS escaping
  },
  // Avoid suspense — we bundle translations, so they're always available
  react: {
    useSuspense: false,
  },
});

export default i18next;
