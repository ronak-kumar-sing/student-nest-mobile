/**
 * Module augmentation for React Native persistence support in Firebase Auth.
 *
 * In firebase@13, @firebase/auth package.json exports["."] lists:
 *   "types": "./dist/auth-public.d.ts"
 * before the "react-native" condition.
 * As a result, TypeScript picks the web/node typings by default, which lack `getReactNativePersistence`.
 * At runtime Metro uses the react-native condition to resolve `dist/rn/index.js` which exports it.
 * This declaration file augments the types so `import { getReactNativePersistence } from 'firebase/auth'` is typed.
 */

import type { Persistence, ReactNativeAsyncStorage } from '@firebase/auth';

declare module '@firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
