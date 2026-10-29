# Student Nest Mobile — Mobile Plan

> Screens, phases, statuses, and contract questions. Updated as features progress.

---

## 1. Feature Status Tracker

| # | Feature | Phase | Mobile Status | Backend Status | Notes |
| --- | --- | --- | --- | --- | --- |
| 00 | Foundation | M0 | ✅ mock | planned | Scaffold, UI kit, mock core, tab layouts |
| 01 | Auth | M1 | ⏳ planned | planned | Email OTP, phone verify |
| 02 | Users & Profiles | M1 | ⏳ planned | planned | Profile setup/edit, prefs |
| 03 | Owner KYC | M2 | ⏳ planned | planned | Document capture flow |
| 04 | Properties | M2 | ⏳ planned | planned | Listing detail + create wizard |
| 05 | Search & Discovery | M2 | ⏳ planned | planned | Explore tab, map, filters |
| 06 | Favorites | M2 | ⏳ planned | planned | Save/unsave, list |
| 07 | Bookings | M3 | ⏳ planned | planned | Apply, status timeline |
| 08 | Tours | M3 | ⏳ planned | planned | Request, slot proposal |
| 09 | Inquiries (Chat) | M3 | ⏳ planned | planned | Realtime messaging |
| 10 | Notifications | M3 | ⏳ planned | planned | Inbox, FCM, deep links |
| 11 | Roommates | M4 | ⏳ planned | planned | Profile, matching, requests |
| 12 | Reviews | M4 | ⏳ planned | planned | Write, edit, reply |
| 13 | Reports | M5 | ⏳ planned | planned | Report flows, moderation |
| 14 | Admin | — | ⏳ n/a | planned | Web console only |
| 15 | Analytics | M6 | ⏳ planned | planned | Owner dashboard |

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
| — | — | (none yet) | — |

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

