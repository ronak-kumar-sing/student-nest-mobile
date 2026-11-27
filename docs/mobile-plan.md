# Student Nest Mobile — Mobile Plan

> Screens, phases, statuses, and contract questions. Updated as features progress.

---

## 1. Feature Status Tracker

| # | Feature | Phase | Mobile Status | Backend Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 00 | Foundation | M0 | ✅ mock | local ✅ | Scaffold, UI kit, mock core, tab layouts, EAS linked, NativeWind tokens verified |
| 01 | Auth | M1 | 🔗 http-ready | local ✅ | Email OTP sign-in/sign-up live; phone verify ⏳ planned (needs native Firebase phone auth) |
| 02 | Users & Profiles | M1 | 🔨 in-progress | local ✅ | `GET/PATCH /v1/users/me` wired (session + profile setup); edit/prefs screens still mock |
| 03 | Owner KYC | M2 | ⏳ planned | local ✅ | Document capture flow |
| 04 | Properties | M2 | 🔗 http-ready | local ✅ | Listing detail + create wizard |
| 05 | Search & Discovery | M2 | 🔗 http-ready | local ✅ | Explore tab, map, filters |
| 06 | Favorites | M2 | 🔗 http-ready | local ✅ | Save/unsave, list |
| 07 | Bookings | M3 | 🔗 http-ready | local ✅ | Apply, status timeline |
| 08 | Tours | M3 | ⏳ planned | local ✅ | Request, slot proposal |
| 09 | Inquiries (Chat) | M3 | ⏳ planned | local ✅ | Realtime messaging |
| 10 | Notifications | M3 | ⏳ planned | local ✅ | Inbox, FCM, deep links |
| 11 | Roommates | M4 | ⏳ planned | local ✅ | Profile, matching, requests |
| 12 | Reviews | M4 | ⏳ planned | local ✅ | Write, edit, reply |
| 13 | Reports | M5 | ⏳ planned | local ✅ | Report flows, moderation |
| 14 | Admin | — | ⏳ n/a | local ✅ | Web console only |
| 15 | Analytics | M6 | ⏳ planned | local ✅ | Owner dashboard |

Status legend: ⏳ planned → 🔨 in-progress → ✅ mock → 🔗 http-ready → 🟢 live

---

## 2. Screen Inventory

### 2.1 Auth & Onboarding (Spec 01, 02)

| Screen | Route | Description |
| --- | --- | --- |
| Welcome | `(auth)/index` | 3-slide carousel with Lottie, "Get Started" and "Skip to Browse" |
| Email Entry | `(auth)/email` | Email input, "Continue" |
| OTP Verify | `(auth)/otp` | 6-digit input, resend timer 30s, error states |
| Role Select | `(auth)/role` | Student / Owner choice |
| Profile Setup | `(auth)/profile-setup` | Name, gender, college, city, avatar |
| Phone Verify | `(auth)/phone` | Skippable initially, required before booking/tours/inquiries |
| Terms Consent | `(auth)/terms` | Accept terms version |

### 2.2 Student Tabs (Specs 04–12)

| Tab | Route | Screens |
| --- | --- | --- |
| **Explore** | `(student)/(tabs)/explore` | Search bar, filter chips, filter sheet, sort menu, list ↔ map toggle, FlashList of RoomCards, skeletons, empty state, "Find roommates" entry |
| **Saved** | `(student)/(tabs)/saved` | Favorites grid/list, greyed unavailable, swipe remove |
| **Activity** | `(student)/(tabs)/activity` | Segmented: Bookings \| Tours. Status-grouped lists. |
| **Inbox** | `(student)/(tabs)/inbox` | Segmented: Messages \| Notifications. Thread list, unread badges. |
| **Profile** | `(student)/(tabs)/profile` | Profile view/edit, phone verify, notification prefs, roommate profile, my reviews/reports, language/theme, become owner, data export/delete, help/legal/version |

### 2.3 Owner Tabs (Specs 03, 04, 07, 08, 15)

| Tab | Route | Screens |
| --- | --- | --- |
| **Dashboard** | `(owner)/(tabs)/dashboard` | KPI cards, funnel chart, sparklines, pending requests shortcut, KYC banner |
| **Listings** | `(owner)/(tabs)/listings` | My listings by status, create-listing wizard (8 steps) |
| **Requests** | `(owner)/(tabs)/requests` | Booking applications + tour requests |
| **Inbox** | `(owner)/(tabs)/inbox` | Same as student |
| **Profile** | `(owner)/(tabs)/profile` | Same as student + KYC flow |

### 2.4 Shared Screens

| Screen | Route | Spec |
| --- | --- | --- |
| Property Detail | `property/[id]` | 04, 12, 07, 08, 09 |
| Chat | `chat/[threadId]` | 09 |
| Booking Detail | `booking/[id]` | 07 |
| Tour Detail | `tour/[id]` | 08 |
| Roommate Profile | `roommate/[id]` | 11 |
| Write Review | `review/new` | 12 |
| Report | `report/new` | 13 |
| Not Found | `+not-found` | — |

### 2.5 Global

| Screen | Route | Notes |
| --- | --- | --- |
| Dev Menu | `dev` | Development builds only. Toggle mock/http per feature, reset mock data, force errors. |
| Force Update | `force-update` | Driven by remote `minAppVersion` |
| Suspended/Banned | `suspended` | Blocking screen |

---

## 3. Phase Details

### M0 — Foundation (no backend dependency)

**Goal:** App boots, tabs render, mock layer works, UI kit is usable.

- [x] Expo SDK 58 scaffold
- [x] All §2 dependencies installed
- [x] `app.config.ts` with development/preview/production variants
- [x] `eas.json` with build profiles
- [x] NativeWind v4 + `tailwind.config.js` + `global.css` with tokens
- [x] Fonts embedded (Plus Jakarta Sans + Inter)
- [x] Dark mode
- [x] UI kit components: Button, Input, Card, Badge, Avatar, Skeleton, Sheet, Tabs, Chip, Toast, EmptyState, ErrorState
- [x] Expo Router skeleton: all tab layouts, placeholder screens
- [x] Mock backend core: db, latency simulator, error injection, dev menu
- [x] TanStack Query + MMKV persistence
- [x] Zustand stores: session, filters, devSettings
- [x] i18n (en.json, structure ready for hi.json)
- [x] Sentry config
- [x] ESLint flat config + Prettier
- [x] Jest config + sample test
- [x] Maestro config + sample flow
- [x] `cn()` helper
- [x] `formatINR()`, date helpers
- [x] Lint + typecheck + test pass

### M1 — Auth & Profile (Backend Phase 1)

- [ ] Welcome carousel
- [ ] Email entry + OTP verify (mock: any email, OTP 000000)
- [ ] Role select
- [ ] Profile setup (name, gender, college, city, avatar)
- [ ] Phone verification flow
- [ ] Profile view + edit
- [ ] Notification preferences
- [ ] Become an owner
- [ ] Delete account + data export
- [ ] Firebase Auth integration (http mode)

### M2 — Discover & List (Backend Phase 2)

- [ ] Explore screen (search, filters, sort, list/map toggle)
- [ ] Property detail screen
- [ ] Favorites (save/unsave/list)
- [ ] Owner KYC flow
- [ ] Create-listing wizard (8 steps)
- [ ] My listings management
- [ ] Search suggestions

### M3 — Transact (Backend Phase 3)

- [ ] Apply to book (sheet)
- [ ] Booking detail + status timeline
- [ ] Owner requests queue
- [ ] Tour request + slot proposal
- [ ] Tour detail
- [ ] Chat (realtime with Firestore listeners)
- [ ] Notifications inbox
- [ ] FCM integration
- [ ] Deep links

### M4 — Community (Backend Phase 4)

- [ ] Roommate profile wizard
- [ ] Roommate matches + score
- [ ] Roommate requests
- [ ] Write/edit review
- [ ] Owner reply to review
- [ ] Review lists

### M5 — Trust & Safety (Backend Phase 5)

- [ ] Report flows
- [ ] Suspended/banned screens
- [ ] Block in chat

### M6 — Polish & Release (Backend Phase 6)

- [ ] Owner analytics dashboard (charts)
- [ ] Performance pass (§10 targets)
- [ ] Accessibility audit
- [ ] Hindi strings
- [ ] Store assets (screenshots via Maestro)
- [ ] App Check enforce
- [ ] Production EAS build + submit
- [ ] OTA pipeline

---

## 4. Contract Questions

> Add questions here when backend specs are unclear. Tag each with the spec number.

| # | Spec | Question | Answer |
| --- | --- | --- | --- |
| a | 05 | RoomCardDto has no amenities or city display name: explore cards hide amenity pills in http mode | Open |
| b | 05 | Search requires `city` or `near`, so there is no "All cities" option | Open |
| c | 04 | `billsIncluded` is a list of names, the mock had a paise amount | Open |
| d | 00 | `nextCursor` is typed `object \| null` in the OpenAPI output (should be `string \| null`); the client treats it as an opaque string | Open |
| e | 07 | Booking creation needs a verified phone (PHONE_REQUIRED) but Firebase phone auth is not available in the JS SDK/Expo Go path, so new emulator users cannot apply until phone verification is wired or seeded | Open |
| f | 01 | `POST /v1/auth/signup` requires `acceptedTermsVersion`, but no endpoint exposes the current terms version. The app sends the constant `TERMS_VERSION = '2026-01'` (`src/features/auth/constants.ts`) | Open |
| g | 01 | Phone verification (`POST /v1/auth/phone/confirm`) reads the phone from the Firebase token, which needs Firebase Phone Auth (native reCAPTCHA/App Check). The phone screen is ⏳ planned in http mode (mock only) | Open |
| h | 04/05 | Live API returns `publicLocation: {}` (empty object) for seeded listings although the schema marks `lat`/`lng` required. The app does not read it yet (no map) | Open |
| i | 04/05 | Seeded image URLs point at `http://localhost:9199` (Storage emulator). The Android emulator cannot reach host `localhost`, so images will not load there without a host rewrite or emulator host config | Open |

---

## 5. UI Component Inventory

### Foundation (M0)

| Component | Location | Status |
| --- | --- | --- |
| Button | `src/components/ui/button.tsx` | ✅ |
| Input | `src/components/ui/input.tsx` | ✅ |
| Card | `src/components/ui/card.tsx` | ✅ |
| Badge | `src/components/ui/badge.tsx` | ✅ |
| Avatar | `src/components/ui/avatar.tsx` | ✅ |
| Skeleton | `src/components/ui/skeleton.tsx` | ✅ |
| Sheet | `src/components/ui/sheet.tsx` | ✅ |
| Tabs | `src/components/ui/tabs.tsx` | ✅ |
| Chip | `src/components/ui/chip.tsx` | ✅ |
| Toast (sonner) | `src/components/ui/toast.tsx` | ✅ |
| EmptyState | `src/components/common/empty-state.tsx` | ✅ |
| ErrorState | `src/components/common/error-state.tsx` | ✅ |
| OfflineBanner | `src/components/common/offline-banner.tsx` | ✅ |
| PriceTag | `src/components/common/price-tag.tsx` | ✅ |
| StatusPill | `src/components/common/status-pill.tsx` | ✅ |

### Feature (M1+)

| Component | Location | Phase |
| --- | --- | --- |
| RoomCard | `src/components/common/room-card.tsx` | M2 |
| OwnerCard | `src/features/properties/components/owner-card.tsx` | M2 |
| FilterSheet | `src/features/search/components/filter-sheet.tsx` | M2 |
| BookingTimeline | `src/features/bookings/components/booking-timeline.tsx` | M3 |
| ChatBubble | `src/features/inquiries/components/chat-bubble.tsx` | M3 |
| ReviewStars | `src/features/reviews/components/review-stars.tsx` | M4 |

---

## 6. Decision Log

### 2026-11-27 — Firebase JS SDK (Auth Only) & HTTP Layer Architecture
- **Firebase JS SDK (auth only):** Adopted `firebase@^13.4.0` (JS SDK) with `@react-native-async-storage/async-storage` for persistence (`getReactNativePersistence`), rather than `@react-native-firebase/*`. This allows running in Expo Go and simulators without requiring immediate native rebuilds. Firestore, messaging (FCM), and App Check native SDKs are deferred to later phases.
- **HTTP Layer:** Implemented a typed `fetch` client in `src/api/http/` backed by types generated from `docs/api/openapi.mobile.json` via `openapi-typescript` (`npm run gen:api`). Dropped `openapi-fetch` in favor of a lean, custom client handling standard ApiError envelopes, single 401 retry with forced token refresh, repeated-key query serialization, and TanStack Query cancellation.
- **Dynamic Transport Dispatch:** Added `bindTransport` in `src/api/transport.ts` to allow switching between mock and HTTP implementations at runtime via dev settings without app reloads.

---

## 7. Running Against the Local API

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Start the local backend on port `3000` alongside Firebase emulators:
   - Auth emulator on `9099`
   - Firestore emulator on `8080`
   - Storage emulator on `9199`
   - Project ID: `student-nest-dev`
3. Dev OTP:
   - Entering `000000` bypasses OTP verification only for `*@test.studentnest.app` email addresses when the backend is running with `DEV_OTP_BYPASS=true` against the emulator.
   - Example: sign in with `asha@test.studentnest.app` and code `000000`; a new email goes through role selection and profile setup (`POST /v1/auth/signup`).
   - Search is public and needs a city: `GET /v1/search/rooms?city=indore`. The local seed has `bhopal`, `indore` and `pune` (`GET /v1/search/cities`); the explore city chips come from that endpoint.
4. Android Emulator:
   - Update `EXPO_PUBLIC_API_URL` to `http://10.0.2.2:3000` and `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` to `10.0.2.2:9099`.
5. Contract Sync:
   - When the backend OpenAPI contract updates, copy it to `docs/api/openapi.mobile.json` and regenerate TypeScript types:
     ```bash
     npm run gen:api
     ```

---

## 8. HTTP Wiring Status (2026-11-27)

### Screen & Endpoint Matrix

| Screen | Route | Feature | Wired to HTTP | Endpoints |
| --- | --- | --- | --- | --- |
| Explore | `(student)/(tabs)/explore` | Search & Discovery (05) | Yes | `GET /v1/search/rooms`, `GET /v1/search/cities` |
| Saved | `(student)/(tabs)/saved` | Favorites (06) | Yes | `GET /v1/favorites`, `DELETE /v1/favorites/:propertyId`, `PUT /v1/favorites/:propertyId` |
| Activity (Bookings) | `(student)/(tabs)/activity` | Bookings (07) | Yes | `GET /v1/bookings` |
| Booking Detail | `booking/[id]` | Bookings (07) | Yes | `GET /v1/bookings/:id`, `POST /v1/bookings/:id/actions` |
| Property Detail | `property/[id]` | Properties (04) | Yes | `GET /v1/properties/:id`, `PUT/DELETE /v1/favorites/:id`, `POST /v1/bookings` |
| Owner Listings | `(owner)/(tabs)/listings` | Properties (04) | Yes | `GET /v1/properties/mine` |
| Sign in (email) | `(auth)/index`, `login`, `signup`, `email` | Auth (01) | Yes | `POST /v1/auth/otp/email/send` |
| OTP verify | `(auth)/otp` | Auth (01) | Yes | `POST /v1/auth/otp/email/verify` + Firebase `signInWithCustomToken` |
| Role + profile setup | `(auth)/role`, `(auth)/profile-setup` | Auth (01), Users (02) | Yes | `POST /v1/auth/signup`, `PATCH /v1/users/me` |
| Session / auth gate | `_layout.tsx` | Auth (01), Users (02) | Yes | Firebase `onAuthStateChanged` + `GET /v1/users/me` |
| Profile tabs (sign out) | `(student)/(tabs)/profile`, `(owner)/(tabs)/profile` | Auth (01) | Sign-out only | Firebase `signOut`; local role switch hidden in http mode |

### Still on Mocks
- **Phone verify (`(auth)/phone`):** ⏳ planned in http mode. Firebase phone auth needs native reCAPTCHA/App Check, which the JS SDK cannot do in Expo Go; the screen shows a "coming soon" notice in http mode and keeps the mock flow in mock mode.
- **Activity (Tours segment):** Tours feature (08) endpoints not yet wired to HTTP.
- **Chat (`chat/[threadId]`):** Realtime inquiries/messaging feature (09) endpoints deferred.
- **Tour Detail (`tour/[id]`):** Tours feature (08) endpoints not yet wired to HTTP.
- **Student and Owner Inbox:** Messages and notifications feature (09, 10) not yet wired to HTTP.
- **Owner Dashboard:** Analytics and financials rollups feature (15) not yet wired to HTTP.
- **Owner Requests (`(owner)/(tabs)/requests`):** Owner bookings/tours review queue (07, 08) not yet wired to HTTP.
- **Property New (`property/new`):** 8-step create listing wizard not yet wired to `POST /v1/properties`.
