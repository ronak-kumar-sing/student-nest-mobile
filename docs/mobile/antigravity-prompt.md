# Student Nest Mobile — Antigravity Build Prompt

> **How to use this file (for the human):**
> 1. Create the mobile repo `student-nest-mobile`. Copy the backend's `docs/features/` folder and `plan.md` into it at `docs/backend-contract/`, and re-copy them whenever the backend specs change. They are the API contract.
> 2. Install the agent skills (see §3) into `student-nest-mobile/.agent/skills/`.
> 3. Paste everything under **"PROMPT START"** into Antigravity as the first task. After that, run one phase (§12) per task, for example: *"Do phase M2 from AGENTS.md"*.
> 4. The backend (Claude Code) and the mobile app (Antigravity) are built in parallel. The app runs fully on **mock data** until each backend phase ships, and then it switches that feature to the real API with one env flag.

---

## PROMPT START

You are building **Student Nest Mobile**, a production-grade React Native app built with **Expo**, for a broker-free student housing marketplace in India. A NestJS + Firebase backend is being built in parallel by another team. Its contract is in `docs/backend-contract/`: `plan.md` plus one spec per feature, `00`–`15`. **Read `docs/backend-contract/plan.md` and `docs/backend-contract/README.md` before writing any code. Read the relevant feature spec before building each feature.**

Your first job is to create `AGENTS.md`, `docs/mobile-plan.md`, and the project skills described in §3.3, using the content of this prompt. Then do phase **M0** and stop for review.

---

### 1. Product in one paragraph

Students find rooms, PGs, and hostels near their college and contact **verified owners directly**, with no brokers. They can save rooms, chat with owners in-app, request tours, apply to book, find compatible roommates, and review places they actually lived in. Owners pass identity verification (KYC), list properties through a guided wizard, answer inquiries, approve or reject applications, and see analytics. Contact details and exact addresses stay hidden until a booking is approved or a tour is confirmed. Admins use a separate web console, which is **not** part of this app.

Personas in the app:
- **Guest:** can browse search and listing details.
- **Student**
- **Owner**

The account's role decides which tab layout the user sees.

---

### 2. Tech stack (use exactly this; don't swap libraries without updating `AGENTS.md`)

Always add native dependencies with **`npx expo install <pkg>`** so versions match the SDK. Run `npx expo-doctor` after every dependency change.

| Concern | Library | Notes |
| --- | --- | --- |
| Framework | **Expo SDK 57** (React Native 0.86, React 19.2), New Architecture, Hermes | `npx create-expo-app@latest`. If a newer stable SDK exists, use it and load the `expo-upgrade` skill. |
| Language | TypeScript `strict`, plus `noUncheckedIndexedAccess` | No `any` without a justifying comment |
| Compiler | **React Compiler** (`experiments.reactCompiler: true` in app config) | Then avoid manual `useMemo`/`useCallback` unless profiling shows a need |
| Navigation | **Expo Router** (typed routes, `experiments.typedRoutes`) | Native stack plus native tabs where available |
| Styling | **NativeWind v4** (stable) + Tailwind CSS 3.4 | v5 is still a release candidate, so don't use it. Plan the v5 upgrade after it goes stable. Use `prettier-plugin-tailwindcss` for class sorting. |
| Variants | `class-variance-authority`, `clsx`, `tailwind-merge` | A `cn()` helper in `src/lib/cn.ts` |
| Component kit | **React Native Reusables** (shadcn/ui-style, NativeWind-based, copied into `src/components/ui/`) + `@rn-primitives/*` | You own the code. Restyle it to our tokens. |
| Icons | `lucide-react-native` (primary), `@expo/vector-icons` (fallback) | |
| Bottom sheets | `@gorhom/bottom-sheet` v5 | Filters, apply-to-book, actions |
| Lists | `@shopify/flash-list` v2 | **Every** list longer than about 10 items |
| Images | `expo-image` | `cachePolicy="memory-disk"`, `placeholder` blurhash, `transition={200}`, request the `_400w`/`_1200w` thumbnails |
| Animation | `react-native-reanimated` v4 + `react-native-worklets`, `react-native-gesture-handler` | Layout animations (`entering`/`exiting`), shared values, Reanimated 4 CSS-style transitions |
| Motion extras | `lottie-react-native` (empty, success, and error states), `expo-haptics`, `expo-blur`, `expo-linear-gradient`, `@shopify/react-native-skia` (only for charts or advanced visuals) | Lottie files in `assets/lottie/`. Keep each under 100 KB. |
| Toasts | `sonner-native` | |
| Keyboard | `react-native-keyboard-controller` | `KeyboardAwareScrollView` on every form |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` | Zod schemas mirror the backend DTO constraints |
| OTP input | `input-otp-native` | Auto-fill: `textContentType="oneTimeCode"` and `autoComplete="sms-otp"` |
| Dates | `date-fns` + `@date-fns/tz` (IST display, UTC on the wire), `@react-native-community/datetimepicker` | |
| Server state | **TanStack Query v5** + `@tanstack/query-async-storage-persister` (MMKV-backed) | Query-key factories per feature |
| Client state | **Zustand** (+ `persist` with MMKV) | Session, UI preferences, filters, dev settings |
| Storage | `react-native-mmkv` (fast key-value storage), `expo-secure-store` (tokens and anything sensitive) | |
| HTTP | `openapi-fetch` + `openapi-typescript` (types generated from the backend's `/docs-json` once it exists) | Hand-written types from the specs until then (§6) |
| Mocking | Custom in-memory mock backend (§6) + `@faker-js/faker` (seeded) | |
| Firebase | `@react-native-firebase/app`, `auth`, `firestore` (realtime reads only), `messaging`, `app-check` | Needs a **dev client**, not Expo Go. Use dev builds from day 1. |
| Notifications | `@react-native-firebase/messaging` (FCM token), `expo-notifications` (foreground display, channels, badges) | |
| Maps & location | `react-native-maps` (Google provider on Android), `expo-location` | Map view of search results with clustering |
| Media | `expo-image-picker`, `expo-image-manipulator` (resize to 2000 px max, JPEG at 0.8 quality before upload), `expo-document-picker` | KYC and listing photos |
| Fonts | `expo-font` config plugin + `@expo-google-fonts/plus-jakarta-sans` (headings) + `@expo-google-fonts/inter` (body) | Embedded at build time via the plugin, so there's no runtime loading flash |
| i18n | `expo-localization` + `i18next` + `react-i18next` | English at launch, Hindi-ready (all strings in `src/i18n/en.json`) |
| Network state | `@react-native-community/netinfo` | Offline banner and query `onlineManager` |
| Misc | `expo-linking`, `expo-web-browser`, `expo-clipboard`, `expo-sharing`, `expo-splash-screen`, `expo-system-ui`, `expo-status-bar`, `react-native-safe-area-context`, `expo-constants`, `expo-application`, `expo-updates` | |
| Charts | `victory-native` (Skia-based) | Owner analytics |
| Monitoring | `@sentry/react-native` (Expo config plugin, source maps uploaded on EAS Build) | Optionally `eas-observe` as well |
| Testing | `jest-expo` + `@testing-library/react-native`. **Maestro** for end-to-end flows. | |
| Quality | ESLint (`eslint-config-expo` flat config) + Prettier + `tsc --noEmit` + `expo-doctor` + `expo-atlas` (bundle analysis) | |
| Build & release | **EAS Build**, **EAS Submit**, **EAS Update** (channels `development`, `preview`, `production`), EAS Workflows for CI | |

---

### 3. Agent skills

#### 3.1 Install these into `.agent/skills/`

1. **Expo official skills:** `npx skills add expo/skills`. If the CLI doesn't target Antigravity automatically, copy each skill folder from `github.com/expo/skills` into `.agent/skills/`. Use these skills:
   - `expo-overview` (router; it picks the right skill)
   - `expo-project-structure`
   - `expo-router`
   - `expo-native-ui`
   - `expo-design-system`
   - `expo-animation`
   - `expo-data-fetching`
   - `expo-dev-client`
   - `expo-examples`
   - `expo-upgrade`
   - `eas-update`
   - `eas-app-stores`
   - `eas-workflows`
   - `eas-observe`
2. **Vercel's React Native performance skill:** `npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-native-skills`. It covers list and scroll performance, Reanimated, rendering, and state.

#### 3.2 When to load which skill

| Task | Skill(s) |
| --- | --- |
| New screen or route, tabs, modals | `expo-router` + `expo-native-ui` |
| Tokens and the UI kit | `expo-design-system` |
| Any animation or gesture | `expo-animation` + `vercel-react-native-skills` |
| Queries, caching, offline | `expo-data-fetching` |
| Lists or perf issues | `vercel-react-native-skills` |
| Dev build problems | `expo-dev-client` |
| Releases and OTA updates | `eas-app-stores`, `eas-update`, `eas-workflows` |

#### 3.3 Create these project skills (`.agent/skills/<id>/SKILL.md`, with YAML front matter `name` + `description`)

- `student-nest-contract`: how to read `docs/backend-contract/`, the error envelope, cursor pagination, `POST …/actions`, paise, ISO dates, and the error-code → UI-message mapping table.
- `student-nest-mock-api`: how to add a mock handler, fixture, or state transition (§6), and how to flip a feature to `http`.
- `student-nest-ui`: the design tokens, component inventory, and rules from §5 and §8 (loading, empty, and error states, a11y, haptics, motion).
- `student-nest-feature`: the per-feature checklist (§11) that you follow for every feature.

---

### 4. Project structure

```
student-nest-mobile/
├── AGENTS.md                      # rules for agents (you write it from this prompt)
├── docs/
│   ├── mobile-plan.md             # screens, phases, status per feature
│   └── backend-contract/          # copied from backend repo — read-only for you
├── .agent/skills/                 # §3
├── app.config.ts                  # variants: development | preview | production
├── eas.json
├── tailwind.config.js · global.css · metro.config.js · babel.config.js
├── assets/ (fonts via plugin, images, lottie/)
├── maestro/                       # e2e flows
└── src/
    ├── app/                       # Expo Router routes ONLY (thin: compose feature screens)
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
    │   ├── client.ts              # http transport: base URL, auth header, App Check, request-id, error envelope → ApiError
    │   ├── errors.ts              # ApiError + error-code → i18n message map
    │   ├── pagination.ts          # useInfiniteQuery helpers for {items,nextCursor,hasMore}
    │   ├── generated/             # openapi-typescript output (later)
    │   └── mock/                  # §6
    ├── components/
    │   ├── ui/                    # Reusables-based primitives (Button, Input, Card, Badge, Sheet, Avatar, Skeleton…)
    │   └── common/                # app-level: PriceTag, RoomCard, StatusPill, EmptyState, ErrorState, OfflineBanner…
    ├── lib/                       # cn, money (paise ↔ ₹), dates (IST), firebase, storage (mmkv), haptics, analytics
    ├── stores/                    # zustand: session, filters, devSettings
    ├── hooks/                     # useRefreshOnFocus, useDebounce, useAppState…
    ├── i18n/
    └── theme/                     # tokens.ts (mirrors tailwind config for non-className use)
```

**Rules:**
- Route files stay thin. Screens live in `features/*/screens`.
- No feature imports another feature's internals. Anything shared goes in `components/common` or `lib`.

---

### 5. Design system

- **Personality:** friendly, trustworthy, calm. Housing is a high-stakes decision for students. Use generous whitespace, clear prices, and visible trust signals ("Verified owner" badge, "Lived here" on reviews).
- **Tokens:** define them as CSS variables in `global.css` for light and dark themes and map them in `tailwind.config.js`. The semantic tokens are:
  - `background`, `foreground`, `card`, `muted`, `muted-foreground`, `border`, `input`, `ring`
  - `primary` (brand, deep teal or indigo; choose one and document it), `primary-foreground`
  - `secondary`, `accent`
  - `success`, `warning`, `destructive`, `info`
  - status colors for each booking, tour, and listing status

  Never hard-code hex values in components.
- **Typography:** headings use Plus Jakarta Sans (600/700) and body uses Inter (400/500/600). Scale: `display 32`, `h1 26`, `h2 22`, `h3 18`, `body 16`, `sm 14`, `xs 12`. Respect OS font scaling up to 1.3× (`maxFontSizeMultiplier`) without breaking layouts.
- **Spacing and shape:** 4-pt grid, radius `md 12` / `lg 16` / `xl 24`, and soft shadows (elevation 1–3 only).
- **Motion:**
  - 150–250 ms ease-out for UI and springs for sheets and drags.
  - Use `entering={FadeInDown.springify()}` on list items for the first page only.
  - Heart pop and haptic on favorite. Success Lottie plus `Haptics.notificationAsync(Success)` on booking approval.
  - Respect `useReducedMotion()`: when it's on, use no layout animations and no autoplaying Lottie.
- **Dark mode** from day 1 (`useColorScheme` + NativeWind `dark:`).
- **Accessibility:**
  - Touch targets ≥ 44×44.
  - `accessibilityLabel` and `accessibilityRole` on every interactive element.
  - Contrast ≥ 4.5:1.
  - Screen-reader announcement on async results.
  - Never rely on color alone for status: always pair a label with an icon.

---

### 6. Mock-first API layer (the most important architecture rule)

The backend lands phase by phase. The app must be **fully usable on mock data** from M0, and each feature must flip to the real API without UI changes.

```
Screen → feature/queries.ts (TanStack Query) → feature/api.ts → transport
                                                               ├── mock  (src/api/mock)   EXPO_PUBLIC_API_MODE=mock
                                                               └── http  (src/api/client) EXPO_PUBLIC_API_MODE=http
```

- `EXPO_PUBLIC_API_MODE=mock|http` sets the global default. A **per-feature override** lives in `src/api/mode.ts` (for example, `{ auth: 'http', bookings: 'mock' }`) so features migrate one at a time as backend phases ship. In development builds, a dev menu screen (`/dev`) toggles the modes at runtime.
- **The mock backend** (`src/api/mock/`):
  - `db.ts`: an in-memory store seeded from deterministic fixtures (`faker.seed(42)`), optionally persisted to MMKV so data survives reloads. A "Reset mock data" button lives in the dev menu.
  - Fixtures match the backend seed:
    - 3 cities: Indore, Bengaluru, Pune.
    - 60 properties across every `roomType`, with realistic Indian localities and colleges, rent of ₹4,000–₹25,000 **stored in paise**, and Unsplash/Picsum image URLs plus blurhash.
    - Users: 2 students, 1 verified owner, 1 unverified owner.
    - Bookings and tours in every status, inquiry threads with messages, notifications, roommate profiles, and reviews.
  - `handlers/<feature>.ts` implements **the same endpoints, request and response shapes, status codes, and error codes as the backend spec**. That includes the state machines (booking `pending → approved → …` with `availableSlots`, tour slot proposals, KYC `draft → submitted → approved` that auto-approves after 10 s in mock mode, listing `pending_review → published` that auto-approves after 10 s), cursor pagination, and contact and address reveal rules.
  - Simulated latency of 300–900 ms (configurable). Error injection from the dev menu: force `500`, `409 BOOKING_SLOT_TAKEN`, `429 RATE_LIMITED`, or offline.
  - **Auth in mock mode:** any email works and the OTP is `000000`. Phone verification is a fake confirm. The session lives in the Zustand store.
  - **Realtime in mock mode:** a tiny event emitter mimics Firestore listeners for chat messages, the notifications inbox, and booking status, with an "owner replies after 3 s" simulation in chat.
- **The HTTP transport** (`src/api/client.ts`):
  - Base URL `EXPO_PUBLIC_API_URL`.
  - Sets `Authorization: Bearer <Firebase ID token>` (via `auth().currentUser.getIdToken()`), `X-Firebase-AppCheck`, and `X-Request-Id`.
  - `Idempotency-Key` (a UUID) on `POST /v1/bookings`.
  - Parses `{ error: { code, message, details }, requestId }` into `ApiError`.
  - On `401`, refreshes the token once and retries. If the response says `refreshToken: true`, it calls `getIdToken(true)`.
- **Contract types:** until the backend serves `/docs-json`, write types by hand in `features/*/types.ts` straight from the spec tables. Once it's live, run `npx openapi-typescript $API_URL/docs-json -o src/api/generated/schema.ts` (an npm script `gen:api`). Replace the hand-written types and make `tsc` the drift detector.
- **Conventions you must mirror:**
  - Money in **paise**. Format only at the edge with `formatINR(paise)` → `₹8,500`, using `Intl.NumberFormat('en-IN')`.
  - Timestamps are ISO in UTC and displayed in IST.
  - Phone numbers are E.164.
  - Lists are `{ items, nextCursor, hasMore }`, read with `useInfiniteQuery`.
  - State changes go through `POST /v1/<resource>/:id/actions { action }`.
  - The UI switches on `error.code`, never on `message`.

---

### 7. Navigation & screen inventory

Each screen lists its backend spec number, so read that spec first.

**Root gate (`_layout.tsx`):**
1. Keep the splash screen up until fonts, the persisted session, and the remote config are ready.
2. If there's no session, show `(auth)` (guests may skip to Explore).
3. If `role=student`, show `(student)`. If `role=owner`, show `(owner)`.
4. Users who are suspended or banned see a blocking screen.
5. Users in the deletion grace period see a banner with an Undo action.

**Auth & onboarding (01, 02):**
- Welcome carousel (3 slides, Lottie).
- Email entry.
- OTP (6-digit, resend timer of 30 s, error states `OTP_INVALID` / `OTP_EXPIRED` / `OTP_LOCKED`).
- Role select (Student / Owner).
- Profile setup (name, gender, college, city, avatar).
- Phone verification. It's skippable at first, but it is **required before** booking, tours, or inquiries, so show an inline prompt when one of those actions is blocked.
- Consent: accept the terms version.

**Student tabs:**
1. **Explore (05)**
   - Search bar with suggestions (`/search/suggest`) and city picker.
   - Filter chips plus a filter bottom sheet: budget range slider, room type, gender policy, amenities, food, available-by.
   - Sort menu.
   - **List ↔ Map** toggle: map with price markers and clustering, using `publicLocation` only.
   - FlashList of `RoomCard` items (cover image, price/month, type, locality, distance, rating, heart).
   - Skeletons, an empty state with a "Clear filters" action, and pull-to-refresh.
   - Entry to **Find roommates**.
2. **Saved (06):** a grid or list of favorites. Unavailable listings are greyed out with a "No longer available" label. Swipe to remove.
3. **Activity (07, 08):**
   - Segmented control: Bookings | Tours.
   - Status-grouped lists.
   - A booking detail screen with a status timeline (`history[]`) and context actions (withdraw, cancel). Contact and address are revealed once approved.
   - A tour detail screen with the proposed slots, confirm/propose/cancel, and the meeting link or address when confirmed.
4. **Inbox (09, 10):**
   - Segmented control: Messages | Notifications.
   - Thread list with unread badges.
   - Chat screen: inverted FlashList, optimistic send, masked-contact hint, block/report.
   - Notification list with deep links and mark-all-read.
5. **Profile (02):**
   - Profile, edit, avatar.
   - Phone verification.
   - Notification preferences (per type and channel).
   - Roommate profile.
   - My reviews.
   - My reports.
   - Language and theme.
   - Become an owner.
   - Data export and delete account.
   - Help, legal, and app version.

**Property detail (04, 12, 08, 07, 09):**
- Image gallery: pager plus full-screen zoom using shared element transitions where supported.
- Price block (rent, deposit, maintenance, bills), key facts, amenities grid, house rules, and nearby places.
- Approximate map circle (exact pin only once revealed).
- Owner card: verified badge, response rate.
- Rating summary and review list.
- Sticky CTA bar: **Message**, **Request tour**, **Apply**. Apply opens a sheet with move-in date, duration, occupants, and message.
- Report action.

**Roommates (11):**
- Profile wizard: basics, budget and move-in, lifestyle, interests.
- Matches list with a score ring and the top 3 reasons as chips.
- Match detail.
- Send request.
- Incoming/outgoing requests. Accepting reveals contact details and shows a celebration animation.

**Reviews (12):** a write-review screen with star inputs per category, a 20-character minimum comment, and an edit window note. Owners can reply.

**Owner tabs:**
1. **Dashboard (15):**
   - KPI cards: views, saves, inquiries, tours, bookings for the last 7 or 30 days.
   - Funnel chart.
   - Per-listing sparkline.
   - "Pending requests" shortcut.
   - KYC status banner until approved.
2. **Listings (04):**
   - My listings, grouped by status.
   - **Create-listing wizard** (8 steps, with a draft saved on every step):
     1. Type & tenancy
     2. Location (map pin + address)
     3. Capacity & availability
     4. Pricing (₹, converted to paise)
     5. Amenities & rules
     6. Photos (picker, compression, reorder by drag, cover selection, upload progress via signed URLs)
     7. Description & nearby places
     8. Review & submit
   - Status screens: pending review, rejected (with the reason and a "Fix & resubmit" action), published (pause/resume, edit, delete).
3. **Requests (07, 08):** booking applications with student trust signals (approve with optional agreed rent, reject with a reason, check-in, complete) and tour requests (confirm a slot, propose, decline).
4. **Inbox:** same as for students.
5. **Profile:** same as for students, plus a **KYC flow (03)**: document type → legal name and last 4 digits → front/back capture → selfie → submit → status screen (draft/submitted/approved/rejected with the reason and a "Try again" action).

**Global:**
- Offline banner.
- Error boundary per route (`ErrorBoundary` export) with a retry action.
- Force-update screen, driven by a remote `minAppVersion`.
- Deep links: `studentnest://property/:id`, `…/chat/:threadId`, `…/booking/:id`. Universal links are added later.
- A dev menu (`/dev`, development builds only).

---

### 8. UX states — every screen must handle all of these

- **Loading:** skeletons that match the final layout (no spinners on first load).
- **Empty:** illustration or Lottie, one sentence, one primary action.
- **Error:** a mapped message from `error.code` plus a retry action. Show a toast for mutation errors and an inline message for form fields (`details[].field`).
- **Offline:** cached data with a "You're offline" banner. Mutations are disabled, with an explanation.
- **Optimistic updates** for favorites, chat send, and mark-read. Roll back on error.
- **Pull-to-refresh** on every list, plus refetch on screen focus.

---

### 9. Firebase & notifications (real mode)

- **Auth:**
  - `signInWithCustomToken(customToken)` after the email OTP verify.
  - Phone: `auth().verifyPhoneNumber`, then `currentUser.linkWithCredential`, then `POST /v1/auth/phone/confirm`.
  - Call `getIdToken(true)` whenever the API returns `refreshToken: true`.
- **Firestore:** **read-only listeners** on the three paths the backend allows:
  - `notifications/{uid}/items`
  - `inquiries/{id}` + `/messages`
  - `bookings/{id}`

  The app **never writes** to Firestore. All writes go through the API.
- **FCM:**
  - Request permission after the first meaningful action, not on launch.
  - `messaging().getToken()`, then `POST /v1/notifications/devices`. Refresh on token change and `DELETE` on logout.
  - Android channels: `bookings`, `messages`, `tours`, `account`.
  - Tapping a notification follows the deep link in `data.deepLink`.
- **App Check:** Play Integrity on Android and DeviceCheck/App Attest on iOS. Use the debug provider in development.

---

### 10. Performance & production checklist (enforce continuously)

- FlashList everywhere, with stable `keyExtractor`, light `renderItem` items, and no inline anonymous heavy components.
- `expo-image` with thumbnails sized to the view and blurhash placeholders. Never load the full-size image in lists.
- Animations run on the UI thread (Reanimated shared values and worklets). No `Animated` from `react-native` core.
- Debounce search input (300 ms). Cancel stale queries. `staleTime` per feature: search 30 s, property 5 min, profile 10 min.
- Lazy-load heavy screens and modules (maps, charts, Skia).
- Startup: keep the root layout light, embed fonts with the config plugin, and **cold start under 2.5 s on a mid-range Android** (for example, a Redmi Note-class device). Measure it.
- Bundle: check with `expo-atlas` each phase. No moment.js or lodash full imports.
- Memory: unmount offscreen tabs' heavy views and clean up listeners.
- Security:
  - Tokens only in Firebase or SecureStore. Nothing sensitive in MMKV or logs.
  - Sentry PII scrubbing.
  - No secrets in `EXPO_PUBLIC_*`.
- Config: `app.config.ts` variants with different bundle IDs and app names (`com.studentnest.app.dev`, `.preview`, and production), with env from EAS environment variables.
- Store readiness:
  - Permission strings with a clear purpose (camera for KYC and listing photos, location for "near me", photos, notifications).
  - Play Data Safety and the iOS privacy manifest.
  - Adaptive icon, splash screen, and store screenshots, captured with Maestro.
- OTA: EAS Update with a runtime version policy of `fingerprint`. Roll out production updates at 10%, then 100%.

---

### 11. Per-feature definition of done (also captured in the `student-nest-feature` skill)

1. Read the backend spec. Write or update `features/<f>/types.ts` and `schemas.ts` to match it exactly.
2. Mock handlers implemented with the spec's error codes and state machine. Fixtures added.
3. `api.ts` + `queries.ts` (key factory, infinite queries, optimistic updates where it makes sense).
4. Screens with every state in §8, dark mode, a11y labels, and i18n strings.
5. Tests:
   - unit tests for pure logic (money, dates, scoring display, reducers);
   - RNTL tests for key components and forms (validation messages);
   - **one Maestro flow** per user journey.
6. `npm run lint && npm run typecheck && npm test` all pass, and `npx expo-doctor` is clean.
7. Update the feature's status in `docs/mobile-plan.md` (`mock` → `http-ready` → `live`).

---

### 12. Phases (run in parallel with the backend phases in `plan.md` §8)

| Mobile phase | Scope | Backend dependency | Mode |
| --- | --- | --- | --- |
| **M0 Foundation** | Scaffold, all of §2 installed, EAS dev builds (Android + iOS), NativeWind + tokens + fonts + dark mode, UI kit (Button, Input, Card, Badge, Avatar, Skeleton, Sheet, Tabs, Chip, Toast, EmptyState, ErrorState), Expo Router skeleton with all tab layouts and placeholder screens, mock backend core (db, latency, errors, dev menu), TanStack Query + MMKV persistence, i18n, Sentry, ESLint/Prettier/Jest/Maestro, EAS Workflows CI (lint → typecheck → test → preview build on PR) | none | mock |
| **M1 Auth & Profile** | Onboarding, email OTP, role select, profile setup, phone verify, profile and edit, notification prefs, become owner, delete/export | Backend Phase 1 | mock → http |
| **M2 Discover & List** | Explore (list, map, filters, sort), property detail, favorites, owner KYC flow, create-listing wizard, my listings, view analytics events | Backend Phase 2 | mock → http |
| **M3 Transact** | Apply to book, booking detail and timeline, owner requests queue, tours, chat (realtime), notifications inbox + FCM + deep links | Backend Phase 3 | mock → http |
| **M4 Community** | Roommate wizard, matches, requests; write, edit, and reply to reviews; review lists | Backend Phase 4 | mock → http |
| **M5 Trust & Safety** | Report flows everywhere, suspended/banned screens, block in chat | Backend Phase 5 | mock → http |
| **M6 Polish & Release** | Owner analytics dashboard (charts), performance pass (§10 targets), a11y audit, Hindi strings, store assets, App Check enforce, production EAS build + submit, OTA pipeline | Backend Phase 6 | live |

At the end of each phase, demo every flow on **mock mode on a real Android device**, then switch the features whose backend phase is live to `http` and re-run the Maestro flows against staging.

---

### 13. Reference repos to study (patterns only; never copy wholesale)

| Repo | Learn |
| --- | --- |
| `github.com/expo/skills` and the `expo-examples` skill | Official, version-matched integrations |
| `github.com/expo/examples` | Small official examples per library (router, maps, notifications, NativeWind) |
| `github.com/obytes/react-native-template-obytes` | A production Expo template with NativeWind, TanStack Query, Zustand, MMKV, i18n, env variants, Maestro, and EAS. **Closest match to this stack.** |
| `github.com/infinitered/ignite` | App structure, generators, theming, and a11y conventions |
| `github.com/mrzachnugent/react-native-reusables` | The component source and showcase app (our UI kit base) |
| `github.com/bluesky-social/social-app` | A large production Expo app: lists, i18n, perf, deep linking, OTA |
| `github.com/Expensify/App` | Offline-first patterns and perf at scale |
| `github.com/software-mansion/react-native-reanimated` (example app) | Reanimated 4 APIs and layout animations |
| `github.com/gorhom/react-native-bottom-sheet` (example) | Sheet patterns (filters, apply flow) |
| `github.com/wcandillon/can-it-be-done-in-react-native` | Advanced gesture and Skia animation techniques |
| `github.com/Shopify/flash-list` (fixture app) | List performance patterns |

Lottie animations: LottieFiles (use free-license assets only, and record each asset's source in `assets/lottie/CREDITS.md`). Illustrations: unDraw or Storyset (record the license the same way).

---

### 14. Hard rules (copy these into `AGENTS.md`)

- The app never writes to Firestore and never stores money as floats. Money is paise, formatted at the edge.
- Never show the exact address or contact details unless the API response includes them. Mocks must mimic the reveal rules.
- Every native dependency is installed with `npx expo install`. No Expo Go, use dev builds.
- No hard-coded colors, font sizes, or strings in components: use tokens and i18n.
- Every list uses FlashList, and every image uses `expo-image`.
- Switch on `error.code`, never on message text.
- Each commit is one logical change, in Conventional Commits format (`feat(search): filter sheet`).
- Before reporting a task done, lint, typecheck, and tests must pass and the flow must be verified in mock mode on a device or emulator.
- If the backend contract is unclear or missing something, **don't invent fields**. Add the question to `docs/mobile-plan.md` → "Contract questions" and ask the human.

**Now:** create `AGENTS.md`, `docs/mobile-plan.md`, and the 4 project skills from this prompt, then do **M0**, and stop with a summary and screenshots of the tab skeletons in light and dark mode.

## PROMPT END
