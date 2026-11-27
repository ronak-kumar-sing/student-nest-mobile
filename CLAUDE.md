# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

`AGENTS.md` (imported above) is the rulebook for this repo: stack, folder structure, conventions and the "always use `npx expo install`" rule. This file only adds what it leaves out.

## Current state

- Expo SDK 58 app with Expo Router routes in `src/app/` and feature code in `src/features/<feature>/` (an `api.ts` with a mock and an http implementation, React Query hooks, mappers, screens).
- `src/api/mode.ts` picks `mock` or `http` per feature from `EXPO_PUBLIC_API_MODE` and the dev menu (`/dev`).
- Wired to the real API: auth, search, property detail, favorites, bookings and owner listings. The rest still runs on `src/api/mock/`. `docs/mobile-plan.md` has the per-screen table.
- Sign-in uses the Firebase JS SDK (Auth only) with the API's custom tokens, so the app runs in Expo Go.

## Commands

```bash
npx tsc --noEmit          # typecheck
npx expo lint             # lint
npx jest --ci             # all tests
npx jest __tests__/lib/cn.test.ts   # one file
npm run sync:api          # copy the backend's OpenAPI file and regenerate types
```

## Gotchas

- `cn()` in `src/lib/cn.ts` must know every custom font size and font family from `tailwind.config.js`; otherwise tailwind-merge drops colour classes next to them.
- On web, `SafeAreaView` from `react-native-safe-area-context` writes its own inline padding. Put padding on an inner `View`, not on the `SafeAreaView`.
- Do not nest a pressable inside another pressable; put secondary actions next to the card's main pressable.
- The API answers `403 PROFILE_REQUIRED` from `GET /v1/users/me` until signup is done; `src/features/auth/session-sync.ts` treats that as "needs signup".
