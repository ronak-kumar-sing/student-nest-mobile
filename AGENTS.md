# Student Nest Mobile — Agent Rules

> This file is the single source of truth for AI agents working on this codebase.
> Read it before writing any code. If anything here conflicts with an agent skill, this file wins.

---

## 1. What this app is

**Student Nest Mobile** is a production-grade React Native (Expo) app for a broker-free student housing marketplace in India. Students find rooms, PGs, and hostels near their college and contact **verified owners directly**. A NestJS + Firebase backend is built in parallel by another team.

Personas: **Guest** (browse only), **Student**, **Owner**. The account's role decides which tab layout the user sees. Admins use a separate web console — they are **not** in this app.

---

## 2. Backend contract

The backend API contract lives at **`docs/features/`**: one spec per feature (`00`–`15`), with `plan.md` at the project root as the overview. The `docs/features/README.md` describes conventions shared by every spec.

**Before building any feature, read the relevant spec.** If a spec is unclear or missing something, don't invent fields — add the question to `docs/mobile-plan.md` → "Contract questions" and ask the human.

---

## 3. Expo — do not trust training data

Expo ships breaking changes every SDK release. Before writing code that touches an Expo, EAS, or React Native API:

1. Read the `expo` version in `package.json` (currently **SDK 58**).
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v58.0.0/`
3. For anything else, fetch `https://docs.expo.dev/llms.txt` — follow links to the specific page; never answer from memory.

---

## 4. Commands

```bash
npx expo install <package>    # ALWAYS use instead of npm/yarn add — resolves SDK-compatible versions
npx expo start                # start the dev server
npx expo lint                 # lint
npx tsc --noEmit              # typecheck
npx expo-doctor               # diagnose dependency and config issues
npx expo install --fix        # fix incompatible package versions
npm test                      # jest
npx maestro test maestro/     # e2e
```

Run `lint`, `typecheck`, and `test` before declaring any task done.

---

## 5. Tech stack

Do not swap libraries without updating this file.

| Concern | Library | Notes |
| --- | --- | --- |
| Framework | **Expo SDK 58** (React Native 0.88, React 19.3), New Architecture, Hermes | |
| Language | TypeScript `strict` + `noUncheckedIndexedAccess` | No `any` without a justifying comment |
| Compiler | **React Compiler** (`experiments.reactCompiler: true`) | Avoid manual `useMemo`/`useCallback` unless profiling shows a need |
| Navigation | **Expo Router** (typed routes, `experiments.typedRoutes`) | Native stack + native tabs |
| Styling | **NativeWind v4** (stable) + Tailwind CSS 3.4 | `prettier-plugin-tailwindcss` for class sorting |
| Variants | `class-variance-authority`, `clsx`, `tailwind-merge` | `cn()` helper in `src/lib/cn.ts` |
| Component kit | **React Native Reusables** (shadcn/ui-style, NativeWind) → `src/components/ui/` + `@rn-primitives/*` | We own the code |
| Icons | `lucide-react-native` (primary), `@expo/vector-icons` (fallback) | |
| Bottom sheets | `@gorhom/bottom-sheet` v5 | Filters, apply-to-book, actions |
| Lists | `@shopify/flash-list` v2 | **Every** list > ~10 items |
| Images | `expo-image` | `cachePolicy="memory-disk"`, `placeholder` blurhash, `transition={200}` |
| Animation | `react-native-reanimated` v4 + `react-native-worklets`, `react-native-gesture-handler` | Layout animations, shared values |
| Motion extras | `lottie-react-native`, `expo-haptics`, `expo-blur`, `expo-linear-gradient`, `@shopify/react-native-skia` (charts only) | Lottie files in `assets/lottie/`, < 100 KB each |
| Toasts | `sonner-native` | |
| Keyboard | `react-native-keyboard-controller` | `KeyboardAwareScrollView` on every form |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` | Zod schemas mirror backend DTO constraints |
| OTP input | `input-otp-native` | `textContentType="oneTimeCode"`, `autoComplete="sms-otp"` |
| Dates | `date-fns` + `@date-fns/tz`, `@react-native-community/datetimepicker` | IST display, UTC on wire |
| Server state | **TanStack Query v5** + `@tanstack/query-async-storage-persister` (MMKV-backed) | Query-key factories per feature |
| Client state | **Zustand** (+ `persist` with MMKV) | Session, UI prefs, filters, dev settings |
| Storage | `react-native-mmkv` (fast KV), `expo-secure-store` (tokens/sensitive) | |
| HTTP | `openapi-fetch` + `openapi-typescript` (later). Hand-written types from specs until then. | |
| Mocking | Custom in-memory mock backend (§6 in prompt) + `@faker-js/faker` (seeded) | |
| Firebase | `@react-native-firebase/app`, `auth`, `firestore`, `messaging`, `app-check` | Dev builds only — no Expo Go |
| Notifications | `@react-native-firebase/messaging` (FCM), `expo-notifications` (foreground) | |
| Maps | `react-native-maps` (Google provider on Android), `expo-location` | Clustering |
| Media | `expo-image-picker`, `expo-image-manipulator`, `expo-document-picker` | Resize 2000 px max, JPEG 0.8 |
| Fonts | `expo-font` config plugin + `@expo-google-fonts/plus-jakarta-sans` + `@expo-google-fonts/inter` | Embedded at build time |
| i18n | `expo-localization` + `i18next` + `react-i18next` | English at launch, Hindi-ready |
| Network | `@react-native-community/netinfo` | Offline banner, query `onlineManager` |
| Charts | `victory-native` (Skia-based) | Owner analytics |
| Monitoring | `@sentry/react-native` (Expo config plugin) | |
| Testing | `jest-expo` + `@testing-library/react-native`, **Maestro** for e2e | |
| Quality | ESLint (`eslint-config-expo` flat config) + Prettier + `tsc --noEmit` + `expo-doctor` + `expo-atlas` | |
| Build | **EAS Build**, **EAS Submit**, **EAS Update** (channels: development, preview, production) | |
| Misc | `expo-linking`, `expo-web-browser`, `expo-clipboard`, `expo-sharing`, `expo-splash-screen`, `expo-system-ui`, `expo-status-bar`, `react-native-safe-area-context`, `expo-constants`, `expo-application`, `expo-updates` | |

---

## 6. Project structure

```
student-nest-mobile/
├── AGENTS.md
├── docs/
│   ├── mobile-plan.md             # screens, phases, status per feature
│   └── features/                  # backend API contract (read-only for us)
├── .agent/skills/                 # project skills
├── app.config.ts                  # variants: development | preview | production
├── eas.json
├── tailwind.config.js · global.css · metro.config.js
├── assets/ (fonts via plugin, images, lottie/)
├── maestro/                       # e2e flows
└── src/
    ├── app/                       # Expo Router routes ONLY (thin wrappers)
    │   ├── _layout.tsx            # providers, fonts, splash, auth gate
    │   ├── (auth)/                # welcome, email, otp, phone, role, profile-setup
    │   ├── (student)/(tabs)/      # explore, saved, activity, inbox, profile
    │   ├── (owner)/(tabs)/        # dashboard, listings, requests, inbox, profile
    │   ├── property/[id].tsx · chat/[threadId].tsx · booking/[id].tsx · tour/[id].tsx …
    │   └── +not-found.tsx
    ├── features/<feature>/        # auth, users, verification, properties, search, favorites,
    │   │                          # bookings, tours, inquiries, notifications, roommates,
    │   │                          # reviews, reports, analytics
    │   ├── api.ts                 # functions calling the transport (mock|http)
    │   ├── queries.ts             # TanStack Query hooks + key factory
    │   ├── schemas.ts             # zod (forms) mirroring backend DTOs
    │   ├── types.ts               # domain types (until OpenAPI types are generated)
    │   ├── components/            # feature-specific components
    │   └── screens/               # screen components used by src/app routes
    ├── api/
    │   ├── client.ts              # http transport
    │   ├── errors.ts              # ApiError + error-code → i18n map
    │   ├── pagination.ts          # useInfiniteQuery helpers
    │   ├── generated/             # openapi-typescript output (later)
    │   └── mock/                  # mock backend
    ├── components/
    │   ├── ui/                    # Reusables primitives (Button, Input, Card, Badge…)
    │   └── common/                # PriceTag, RoomCard, StatusPill, EmptyState, ErrorState…
    ├── lib/                       # cn, money, dates, firebase, storage, haptics, analytics
    ├── stores/                    # zustand: session, filters, devSettings
    ├── hooks/                     # useRefreshOnFocus, useDebounce, useAppState…
    ├── i18n/
    └── theme/                     # tokens.ts
```

**Rules:**
- Route files stay thin. Screens live in `features/*/screens`.
- No feature imports another feature's internals. Shared code → `components/common` or `lib`.

---

## 7. Navigation & routing

- Use **Expo Router** for all navigation.
- Routes live in `src/app/` — every file is a screen, `_layout.tsx` files define navigators.
- Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, `useLocalSearchParams` from `expo-router`.

---

## 8. Mock-first API layer

The backend lands phase by phase. The app must be **fully usable on mock data** from M0.

```
Screen → feature/queries.ts (TanStack Query) → feature/api.ts → transport
                                                               ├── mock  (src/api/mock)   EXPO_PUBLIC_API_MODE=mock
                                                               └── http  (src/api/client) EXPO_PUBLIC_API_MODE=http
```

- `EXPO_PUBLIC_API_MODE=mock|http` is the global default. A per-feature override in `src/api/mode.ts` lets features migrate one at a time.
- A dev menu (`/dev`, development builds only) toggles modes at runtime.
- Mock mode: any email works, OTP is `000000`, latency 300–900 ms.
- The mock backend mirrors the backend's endpoints, response shapes, status codes, error codes, state machines, cursor pagination, and reveal rules.

---

## 9. Conventions

- **Money** in **paise**. Format at the edge: `formatINR(paise)` → `₹8,500` via `Intl.NumberFormat('en-IN')`.
- **Timestamps** ISO UTC, displayed in IST.
- **Phone numbers** E.164.
- **Lists** `{ items, nextCursor, hasMore }` with `useInfiniteQuery`.
- **State changes** via `POST /v1/<resource>/:id/actions { action }`.
- **Errors**: switch on `error.code`, never on `message`.

---

## 10. Design system

- **Personality:** friendly, trustworthy, calm. Generous whitespace, clear prices, visible trust signals.
- **Tokens:** CSS variables in `global.css` for light/dark, mapped in `tailwind.config.js`. Never hard-code hex in components.
- **Typography:** Plus Jakarta Sans (headings, 600/700), Inter (body, 400/500/600). Scale: display 32, h1 26, h2 22, h3 18, body 16, sm 14, xs 12. `maxFontSizeMultiplier` up to 1.3×.
- **Spacing:** 4-pt grid. Radius: md 12, lg 16, xl 24. Soft shadows (elevation 1–3).
- **Motion:** 150–250 ms ease-out. Springs for sheets. Respect `useReducedMotion()`.
- **Dark mode** from day 1.
- **a11y:** touch targets ≥ 44×44, `accessibilityLabel` + `accessibilityRole`, contrast ≥ 4.5:1, never rely on color alone.

---

## 11. UX states — every screen must handle all

- **Loading:** skeletons matching the final layout (no spinners on first load).
- **Empty:** illustration or Lottie, one sentence, one primary action.
- **Error:** mapped message from `error.code` + retry. Toast for mutation errors, inline for form fields.
- **Offline:** cached data + "You're offline" banner. Mutations disabled with explanation.
- **Optimistic updates** for favorites, chat send, mark-read.
- **Pull-to-refresh** on every list + refetch on screen focus.

---

## 12. Per-feature definition of done

1. Read the backend spec. Write/update `features/<f>/types.ts` and `schemas.ts` to match exactly.
2. Mock handlers with spec error codes and state machines. Fixtures added.
3. `api.ts` + `queries.ts` (key factory, infinite queries, optimistic updates).
4. Screens with every state from §11, dark mode, a11y labels, i18n strings.
5. Tests: unit for pure logic, RNTL for key components/forms, one Maestro flow per user journey.
6. `npm run lint && npm run typecheck && npm test` pass. `npx expo-doctor` clean.
7. Update `docs/mobile-plan.md` status: `mock` → `http-ready` → `live`.

---

## 13. Hard rules

- The app **never writes to Firestore** and **never stores money as floats**. Money is paise, formatted at the edge.
- Never show the exact address or contact details unless the API response includes them. Mocks must mimic the reveal rules.
- Every native dependency is installed with `npx expo install`. No Expo Go — use dev builds.
- No hard-coded colors, font sizes, or strings in components: use tokens and i18n.
- Every list uses FlashList. Every image uses `expo-image`.
- Switch on `error.code`, never on message text.
- Each commit is one logical change, in Conventional Commits format (`feat(search): filter sheet`).
- Before reporting a task done: lint, typecheck, tests pass; flow verified in mock mode on device/emulator.
- If the backend contract is unclear or missing, **don't invent fields**. Add to `docs/mobile-plan.md` → "Contract questions" and ask the human.

---

## 14. Phases

| Phase | Scope | Backend dep | Mode |
| --- | --- | --- | --- |
| **M0 Foundation** | Scaffold, deps, dev builds, NativeWind + tokens + fonts + dark mode, UI kit, router skeleton, mock backend core, TanStack Query + MMKV, i18n, Sentry, ESLint/Prettier/Jest/Maestro, EAS CI | none | mock |
| **M1 Auth & Profile** | Onboarding, email OTP, role select, profile setup, phone verify, profile/edit, prefs, become owner, delete/export | Phase 1 | mock → http |
| **M2 Discover & List** | Explore (list, map, filters), property detail, favorites, owner KYC, create-listing wizard, my listings | Phase 2 | mock → http |
| **M3 Transact** | Booking flow, booking detail/timeline, owner requests, tours, chat (realtime), notifications + FCM + deep links | Phase 3 | mock → http |
| **M4 Community** | Roommate wizard/matches/requests, reviews (write/edit/reply) | Phase 4 | mock → http |
| **M5 Trust & Safety** | Reports, suspended/banned screens, block in chat | Phase 5 | mock → http |
| **M6 Polish & Release** | Analytics dashboard, perf pass, a11y audit, Hindi, store assets, App Check, prod build + submit, OTA | Phase 6 | live |

---

## 15. Building with EAS

Use EAS for cloud builds (`eas build`), submissions (`eas submit`), and OTA updates (`eas update`). Run: `npx eas-cli@latest <command>`.

---

## 16. Agent skills

Load from `.agent/skills/`:

| Task | Skill(s) |
| --- | --- |
| New screen or route, tabs, modals | `expo-router` + `expo-native-ui` |
| Tokens and the UI kit | `expo-design-system` |
| Animation or gesture | `expo-animation` + `vercel-react-native-skills` |
| Queries, caching, offline | `expo-data-fetching` |
| Lists or perf issues | `vercel-react-native-skills` |
| Dev build problems | `expo-dev-client` |
| Releases and OTA | `eas-app-stores`, `eas-update`, `eas-workflows` |
| Backend contract questions | `student-nest-contract` |
| Mock API work | `student-nest-mock-api` |
| UI/component work | `student-nest-ui` |
| New feature | `student-nest-feature` |
