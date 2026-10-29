# Student Nest — Backend Development Plan

> Backend for the Student Nest rebuild. Concept reference (previous version):
> https://github.com/ronak-kumar-sing/student-nest-new
>
> New stack: **React Native (mobile) + NestJS (API) + Firebase (platform)**.
>
> **Detailed per-feature specs:** [`docs/features/`](./docs/features/README.md). This file is the overview; decisions that changed the original plan are in §14, unresolved product questions in §15.

---

## 1. Product Summary

Student Nest removes the broker between room owners and students.

| Persona | Capabilities |
| --- | --- |
| **Student** | OTP signup/login (email + phone), room search & filters, favorites, in-app inquiries to owners, tour scheduling, booking applications, roommate matching, reviews & ratings, reporting |
| **Room Owner** | identity verification (KYC), property listing & management, replying to inquiries, tour and booking handling, analytics dashboard with rent benchmark, automated email/SMS/push notifications |
| **Admin** | KYC queue, listing review queue, user management, reports & content moderation, audit log, platform analytics |

---

## 2. Database Recommendation

### Decision

**Primary database: Cloud Firestore**, with a dedicated search index and file storage:

| Component | Role |
| --- | --- |
| **Cloud Firestore** | System of record for users, properties, bookings, meetings, reviews, verification, moderation |
| **Typesense** (or Algolia) | Full-text + faceted + geo search for room discovery (Firestore cannot do this) |
| **Cloud Storage for Firebase** | Property images, owner KYC documents |
| **BigQuery export** (optional, later) | Long-term analytics warehouse for the admin dashboard |

### Why Firestore

1. **Stack fit** — Auth (phone/email OTP), Firestore, Storage, FCM, and Cloud Functions live in one Firebase project with one SDK and one billing account. The previous version stitched MongoDB + Cloudinary + JWT by hand; this removes that glue code.
2. **Mobile-first realtime** — React Native gets live room availability, booking status, and notification updates via listeners, plus **offline persistence** (critical for students on flaky networks).
3. **Security model** — Firestore security rules tie directly to Firebase Auth users and custom claims (role: student/owner/admin), enforced at the database, not just at the API.
4. **Serverless scaling** — no connection pooling, no DB server to manage; scales with traffic.
5. **Booking safety** — Firestore **transactions** guarantee a room slot is claimed by exactly one student.

### Trade-offs and mitigations

| Firestore limitation | Mitigation |
| --- | --- |
| No full-text / faceted / geo search | Sync `properties` → Typesense via Cloud Function trigger; search API proxies Typesense |
| No joins or SQL aggregations | Denormalize read models; maintain `counters/` and `analytics_daily/` docs via triggers; BigQuery export for heavy reporting |
| ~1 write/sec per document | Shard hot counters (e.g. `viewCount` into 10 shards) |
| 1 MB document limit | Keep large lists (images, reviews, notifications) as subcollections, never as arrays |
| Weak relational integrity | Enforce referential rules in NestJS services; validate refs on write |

### Alternatives considered

| Option | Verdict |
| --- | --- |
| **PostgreSQL + Prisma** (Supabase / Cloud SQL) | Best-in-class for relational bookings/analytics, but abandons Firebase's realtime/offline/mobile benefits and adds infra to operate. Revisit only if the platform becomes analytics-heavy SQL workloads — BigQuery export covers that without a migration. |
| **MongoDB Atlas** (as used in v1) | Familiar, but duplicates what Firebase already provides; keeps auth/storage/search as separate bolt-ons. No reason to keep it in a Firebase stack. |

**Final call: Firestore.** If the search layer becomes a cost concern, Typesense (self-hosted on a small VM) is the cheaper alternative to Algolia.

---

## 3. System Architecture

```
┌────────────────────┐         ┌──────────────────────────┐
│ React Native app   │  HTTPS  │  NestJS API (REST /v1)   │
│ (Expo, built in    │────────▶│  Cloud Run               │
│  Antigravity)      │         └───────────┬──────────────┘
└─────────┬──────────┘                     │
          │ realtime listeners (read-only) │ firebase-admin
          ▼                                ▼
   Firestore  ◀── security rules ──  ┌─────────────────────────────┐
   (system of record)                │ Firebase: Auth, Firestore,  │
                                     │ Storage, FCM                │
                                     └───────────┬─────────────────┘
                                                 │ triggers
                              ┌──────────────────┼──────────────────┐
                              ▼                  ▼                  ▼
                        Cloud Functions    Typesense sync     Aggregations
                        (search sync,      (rooms index)      (counters, daily)
                        notifications)
                              │
                              ▼
                    SendGrid (email) · Twilio (SMS) · FCM (push)
```

**Rules of engagement:**

- The mobile app **never writes to Firestore directly** — all writes go through the NestJS API (validation, business rules, audit trail).
- The mobile app **may read** via realtime listeners where Firestore security rules permit: own notifications, own inquiry threads, own bookings (see §6).
- NestJS is the single place where business logic, RBAC, and cross-service orchestration live.
- Cloud Functions are thin: triggers only (search sync, counters, outbound notifications).

---

## 4. Project Structure

```
student-nest-backend/
├── plan.md                        # this file (overview + decisions)
├── docs/features/                 # detailed spec per feature (00–15)
├── AGENTS.md / CLAUDE.md
├── .opencode/skills/              # Agent skills (OpenCode)
├── firebase/                      # rules, indexes, functions (own package)
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   ├── storage.rules
│   └── functions/                 # triggers + scheduled jobs (search sync, outbox, rollups, expiry)
├── scripts/                       # seed, make-admin, typesense migrate/synonyms
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── common/
│   │   ├── guards/                # FirebaseAuthGuard, RolesGuard, VerifiedOwnerGuard, AppCheckGuard
│   │   ├── interceptors/          # logging, request-id, idempotency
│   │   ├── filters/               # http-exception.filter (error envelope)
│   │   ├── errors/                # ErrorCode registry, AppException
│   │   ├── throttler/             # Firestore-backed throttler storage
│   │   ├── decorators/            # @CurrentUser(), @Roles(), @Public(), @OptionalAuth(), @Idempotent()
│   │   └── dto/                   # CursorQueryDto, Page<T>, ApiErrorDto
│   ├── config/                    # typed ConfigModule (env validation)
│   ├── firebase/                  # Admin SDK module, converters, sharded counter, signed URLs
│   └── modules/
│       ├── health/                # GET /health, /ready                       (00)
│       ├── auth/                  # email OTP → custom token, phone confirm, signup (01)
│       ├── users/                 # profile, avatar, prefs, become-owner, export/delete (02)
│       ├── verification/          # owner KYC                                 (03)
│       ├── properties/            # listings, images, publish workflow        (04)
│       ├── search/                # Typesense proxy                           (05)
│       ├── favorites/             # saved rooms                               (06)
│       ├── bookings/              # applications + inventory state machine    (07)
│       ├── meetings/              # tours (/v1/tours)                         (08)
│       ├── inquiries/             # student ↔ owner messaging                 (09)
│       ├── notifications/         # devices, inbox, outbox enqueue            (10)
│       ├── roommates/             # profiles, scoring, requests               (11)
│       ├── reviews/               # ratings, replies, helpful votes           (12)
│       ├── reports/               # user-filed reports                        (13)
│       ├── admin/                 # queues, user mgmt, moderation             (14)
│       └── analytics/             # events, owner dashboards, overview        (15)
└── test/                          # e2e (supertest + emulators), rules tests
```

---

## 5. Data Model (Firestore) — summary

Field-level definitions, enums, and indexes are in each feature spec. This is the map.

| Collection | Key | Spec | Notes |
| --- | --- | --- | --- |
| `users/{uid}` | Auth uid | 02 | `role`, `status`, verified email/phone, `ownerProfile.kycStatus`, `notificationPrefs`, `consents` |
| `users/{uid}/devices/{tokenHash}` | | 10 | FCM tokens |
| `users/{uid}/favorites/{propertyId}` | | 06 | Snapshot for list rendering |
| `verifications/{id}` | | 03 | Masked Aadhaar or other IDs. Files in the **private** KYC bucket, purged 30 days after the decision. |
| `properties/{id}` | | 04 | `rentPaise`/`depositPaise`, `tenancyType`, `capacity`, `availableSlots`, private `address.line1` and `geo` plus a public `publicGeo` |
| `properties/{id}/occupancy/{bookingId}` | | 07 | Who holds a slot |
| `bookings/{id}` | | 07 | Status machine with `history[]`, agreed amounts, 72 h pending expiry |
| `bookingLocks/{studentId}_{propertyId}` | deterministic | 07 | Prevents duplicate applications |
| `meetings/{id}` | | 08 | Tours: slot proposals, in-person or video |
| `inquiries/{propertyId}_{studentId}` (+ `/messages`) | deterministic | 09 | Realtime read for participants |
| `notifications/{uid}/items/{id}` | | 10 | In-app inbox (realtime read) |
| `notificationOutbox/{dedupeKey}` | deterministic | 10 | Exactly-once dispatch |
| `roommateProfiles/{uid}`, `roommateRequests/{from}_{to}` | | 11 | |
| `reviews/{propertyId}_{studentId}` (+ `/helpful`) | deterministic | 12 | **Top level**. One review per student per property. Aggregates on the property. |
| `reports/{id}`, `reportAggregates/{type}_{id}` | | 13 | |
| `auditLogs/{id}` | | 00/14 | Admin and sensitive actions |
| `counters/{name}/shards/{n}` | | 00/15 | Sharded counters (views, favorites, inquiries, bookings) |
| `analytics_daily/{date}/…`, `rentBenchmarks/{key}`, `viewMarks/{key}` | | 15 | |
| `otp_codes/{hash}`, `idempotencyKeys/{id}`, `rateLimits/{key}` | | 00/01 | TTL-policy collections |

**Status enums** (see the specs for the transitions):
- `PropertyStatus`: draft, pending_review, published, paused, rejected, suspended, deleted.
- `BookingStatus`: pending, approved, rejected, withdrawn, expired, cancelled, checked_in, completed.
- `TourStatus`: requested, confirmed, completed, cancelled, declined, no_show, expired.
- `VerificationStatus`: draft, submitted, approved, rejected, cancelled.
- `ReviewStatus`: published, flagged, hidden.
- `ReportStatus`: open, actioned, dismissed.

---

## 6. API Surface (v1) — summary

Full request, response, and error tables are in the specs. State transitions use `POST …/:id/actions { action }`.

```
# Health (00)
GET  /health · GET /ready

# Auth (01)
POST /v1/auth/otp/email/send · POST /v1/auth/otp/email/verify   → Firebase custom token
POST /v1/auth/phone/confirm                                       (phone verified via Firebase Phone Auth on client)
POST /v1/auth/signup

# Users (02)
GET|PATCH /v1/users/me · POST|PUT /v1/users/me/avatar · PATCH /v1/users/me/notification-preferences
POST /v1/users/me/become-owner · POST /v1/users/me/export · DELETE /v1/users/me · POST /v1/users/me/deletion/cancel
GET  /v1/users/:id                                                public profile, no contact info

# Verification (03)
POST /v1/verification/requests · POST /v1/verification/requests/:id/upload-urls
POST /v1/verification/requests/:id/actions · GET /v1/verification/requests/me

# Properties (04)
POST /v1/properties · GET /v1/properties/mine · GET|PATCH|DELETE /v1/properties/:id
POST /v1/properties/:id/image-uploads · PUT /v1/properties/:id/images · POST /v1/properties/:id/actions

# Search (05)
GET /v1/search/rooms · GET /v1/search/cities · GET /v1/search/suggest

# Favorites (06)
PUT|DELETE /v1/favorites/:propertyId · GET /v1/favorites

# Bookings (07)
POST /v1/bookings (Idempotency-Key) · GET /v1/bookings · GET /v1/owners/bookings
GET /v1/bookings/:id · POST /v1/bookings/:id/actions

# Tours (08)
POST /v1/tours · GET /v1/tours · GET /v1/tours/:id · POST /v1/tours/:id/actions

# Inquiries (09)
POST /v1/inquiries · GET /v1/inquiries · GET|POST /v1/inquiries/:id/messages
POST /v1/inquiries/:id/read · POST /v1/inquiries/:id/actions

# Notifications (10)
POST /v1/notifications/devices · DELETE /v1/notifications/devices/:tokenHash
GET /v1/notifications · POST /v1/notifications/:id/read · POST /v1/notifications/read-all

# Roommates (11)
PUT|GET /v1/roommates/profile · POST /v1/roommates/profile/actions · GET /v1/roommates/matches
POST /v1/roommates/requests · GET /v1/roommates/requests · POST /v1/roommates/requests/:id/actions

# Reviews (12)
POST|GET /v1/properties/:id/reviews · PATCH /v1/reviews/:id · POST /v1/reviews/:id/reply
PUT|DELETE /v1/reviews/:id/helpful · GET /v1/reviews/mine

# Reports (13)
POST /v1/reports · GET /v1/reports/mine

# Admin (14) — admin role only
GET /v1/admin/verifications · GET /v1/admin/verifications/:id · POST /v1/admin/verifications/:id/actions
GET /v1/admin/properties · POST /v1/admin/properties/:id/actions
GET /v1/admin/users · GET /v1/admin/users/:id · POST /v1/admin/users/:id/actions
GET /v1/admin/reports · POST /v1/admin/reports/:id/actions
GET /v1/admin/reviews · POST /v1/admin/reviews/:id/actions
GET /v1/admin/analytics/overview · GET /v1/admin/audit-logs

# Analytics (15)
POST /v1/analytics/events · GET /v1/owners/analytics/summary · GET /v1/owners/analytics/properties/:id
```

**Firestore read paths open to the mobile app** (each needs a rules test):
- `notifications/{uid}/items` (owner of the inbox);
- `inquiries/{id}` and `/messages` (participants);
- `bookings/{id}` (parties).

Everything else is deny-all.

---

## 7. Cross-Cutting Concerns

- **Authentication**: Firebase Auth is the only identity provider, and the API never mints its own sessions. Email OTP returns a Firebase custom token. The phone number comes only from the verified ID token. Roles, status, and KYC are **custom claims** set by the API, and the response tells the app to refresh its token.
- **RBAC**: `@Roles()` + `RolesGuard`. `VerifiedOwnerGuard` gates listing creation. Phone verification is required for bookings, tours, and inquiries. Admin destructive actions require `auth_time` < 12 h.
- **Validation**: global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`. Every input has a DTO.
- **Errors**: uniform envelope from one exception filter, `{ error: { code, message, details? }, requestId }`, with a stable code registry.
- **Pagination**: cursor-based (`?cursor=&limit=`), never offset. Search hides Typesense pages behind an opaque cursor. Roommate matches are a bounded top 50.
- **Rate limiting**: `@nestjs/throttler` with **Firestore-backed storage** (shared across Cloud Run instances). OTP: 3 per 15 min per identifier. Search: 60 per minute per IP. Messaging and reports have their own caps.
- **Idempotency**: `Idempotency-Key` on booking creation and every other inventory-affecting POST. Keys are stored for 24 h.
- **Privacy**:
  - Exact address and contact details are revealed only after an approved booking or confirmed tour (or an accepted roommate request).
  - Search uses a fuzzed `publicGeo`.
  - Masked Aadhaar only, and KYC files are purged 30 days after the decision.
  - DPDP Act: consent record, data export, and account deletion with a 14-day grace period.
- **Notifications**: outbox pattern (`notificationOutbox`, enqueued in the same transaction as the state change), dispatched by functions. Preferences per type and channel. Quiet hours 22:00–08:00 IST. SMS templates DLT-registered.
- **Observability**: structured JSON logs with request IDs (PII redacted), `/health` + `/ready`, and alerting on the 5xx rate, outbox failures, and search drift.
- **Files**: short-lived signed URLs for direct-to-Storage uploads. Property images and avatars go to the public bucket. KYC docs go to a separate **private** bucket.
- **App Check**: monitor mode in Phases 0–5, enforced in Phase 6.
- **Audit**: `auditLogs` for every admin action, every KYC document view, and account lifecycle events.

---

## 8. Development Phases

Each phase is done when its specs' **acceptance tests** pass, plus the gates in `AGENTS.md`.

### Phase 0 — Foundation ✅ *start here* · spec 00
Scaffold NestJS 11 with strict TS, ESLint, and Prettier. Typed env config with an emulator guard. Firebase Admin module (converters, signed URLs, sharded counter). Error filter and code registry, request ID, pino logging. Guards and decorators. Firestore throttler storage and the idempotency interceptor. Swagger at `/docs`. `/health` and `/ready`. Emulator suite config, seed script, and CI (lint → type-check → unit → e2e → rules → docker build).
**Done when:** `npm run start:dev` serves `/health` against the emulator, CI is green, and `.env.example` is documented.

### Phase 1 — Auth & Users · specs 01, 02
Email OTP → custom token, phone confirm, signup and claims, profile and avatar, notification preferences, become-owner, public profile, suspend/ban guard plumbing, export and delete.
**Done when:** signup → OTP → profile works e2e against the emulator, the throttler blocks OTP abuse, and Swagger documents every endpoint.

### Phase 2 — Verification, Listings, Search, Favorites · specs 03, 04, 05, 06, 14 (KYC + listing queues), 15 (events + counters), 10 (minimal outbox)
KYC was moved here from Phase 5 because a listing can't be published without an approved owner. Covers property CRUD and images, the publish/review workflow, address privacy, Typesense sync and reconciliation, the search API, favorites, view analytics, and the minimal notification outbox (email + push) for KYC and listing decisions.
**Done when:** an owner passes KYC, lists a property, an admin approves it, and it's searchable by city, rent, amenities, and location in < 200 ms. An admin can suspend it.

### Phase 3 — Bookings, Tours, Inquiries, Notifications · specs 07, 08, 09, 10
Transactional inventory, the booking state machine and jobs (expiry, auto-complete), tours with slot proposals and reminders, in-app inquiries with contact redaction, and the full notification catalog (push, email, SMS with quiet hours).
**Done when:** 10 concurrent approvals on a 1-slot room give exactly one success, every transition sends exactly one notification, and contact details unlock only after approval or confirmation.

### Phase 4 — Roommates & Reviews · specs 11, 12
Roommate profiles, scoring (a pure function), matches and requests, eligibility-gated reviews, aggregates, owner replies, and helpful votes.
**Done when:** seeded profiles rank as expected, only real tenants can review, and aggregates stay correct through hide and restore.

### Phase 5 — Moderation & Admin · specs 13, 14
User reports, auto-flag thresholds, the admin reports queue with moderation actions, user management (suspend, ban, admin roles), review moderation, audit log browsing, and the admin overview (basic).
**Done when:** every moderation action applies immediately, resolves related reports, and is audited.

### Phase 6 — Analytics & Hardening · spec 15 + cross-cutting
Daily rollups, owner dashboards and the rent benchmark, admin analytics, BigQuery export (optional), App Check enforcement, rate-limit audit, security-rules penetration pass, load test (search p95 < 200 ms at 50 RPS, booking approve contention), OpenAPI export for the mobile team, and Cloud Run + Firebase deploy pipelines.
**Done when:** dashboards show real data and the security review checklist is signed off.

### Later candidates (not scheduled)
Online deposits and payments (Razorpay), automatic Google Meet links, owner-to-student reviews, saved-search alerts, roommate chat, DigiLocker e-KYC, WhatsApp notifications, Google sign-in.

---

## 9. Testing Strategy

| Level | Scope | Tooling |
| --- | --- | --- |
| Unit | Services & guards; `firebase-admin` mocked | Jest |
| E2E | Controllers + full request lifecycle against **Firestore/Auth emulator** | Supertest + emulators |
| Rules | Firestore security rules | `@firebase/rules-unit-testing` |
| Contract | OpenAPI schema drift | Swagger snapshot diff in CI |

Gates: 80% coverage on `src/modules/**`, all e2e green against emulators, no lint/type errors. Emulator state resets per suite run.

---

## 10. Local Development

```
npm run start:dev          # NestJS watch mode
npm run emulators          # firebase emulators:start (auth, firestore, storage, functions)
npm run seed               # demo users, properties, bookings
npm run lint / type-check
npm run test / test:e2e / test:cov
```

Key environment variables (see `.env.example`): `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_KEY` (prod) / `FIRESTORE_EMULATOR_HOST`, `KYC_BUCKET`, `OTP_PEPPER`, `TYPESENSE_HOST`, `TYPESENSE_SEARCH_KEY`, `TYPESENSE_ADMIN_KEY`, `SENDGRID_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`.

---

## 11. CI/CD & Deployment

1. **CI** (GitHub Actions): lint → type-check → unit → e2e (service container boots emulator suite) → build image.
2. **Deploy**: Cloud Run (API, autoscaling, min 0 instances for cost), `firebase deploy` (rules, indexes, functions), Typesense collection migration script.
3. **Environments**: `dev` (emulator/local), `staging` (Firebase staging project), `prod`.

---

## 12. Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Double bookings | Firestore transactions + idempotency keys |
| OTP abuse / SMS cost | Per-identifier throttles, App Check, dev-mode fixed code only in emulator |
| KYC document leakage | Private bucket, signed URLs (5 min), no public URLs, audit logs |
| Search index drift | Search version field + reconciliation job |
| Hot counter contention | Sharded counters |
| Agent-generated drift | AGENTS.md conventions + skills + review gates before merge |

---

## 13. Coordination with the Mobile Team

- API contract is the boundary: OpenAPI spec at `/docs` is exported and shared; the mobile repo consumes it.
- Frontend repo: `student-nest-mobile` (React Native + Expo, built with Antigravity) with its own `plan.md`/`AGENTS.md`.
- Realtime channels: the mobile app reads `notifications/{uid}/items`, `inquiries/*`, and `bookings/{id}` via Firestore listeners (§6).
- Mobile build brief for Antigravity (stack, skills, mock-first API layer, screens, phases M0–M6): [`docs/mobile/antigravity-prompt.md`](./docs/mobile/antigravity-prompt.md). The mobile app copies `docs/features/` as its contract; when a spec changes, re-copy it.

---

## 14. Decision Log (refinements to the original plan)

| # | Decision | Why | Spec |
| --- | --- | --- | --- |
| D1 | Firebase Auth is the only identity provider. Email OTP verify returns a **custom token**. Phone OTP runs through Firebase Phone Auth on the client. `/auth/login`, `/auth/refresh`, and `/auth/me` were dropped. | The Firebase SDK already refreshes tokens, and a second token system adds attack surface. Taking the phone from the token means no one can claim a number they don't own. | 01 |
| D2 | All money is integer **paise** in `…Paise` fields. | The original plan said "rent (INR)" while `AGENTS.md` required paise, so this resolves the conflict. | all |
| D3 | Properties have `tenancyType` + `capacity` + `availableSlots`. **Capacity is consumed at approval, not at application.** | The original plan had no inventory model, so "double booking" was undefined. Holding slots on application would let a few students block every listing. | 04, 07 |
| D4 | Bookings gain `withdrawn` and `expired` (72 h). Transitions go through `POST /:id/actions`. | Matches the `api-design` skill. Without expiry, pending applications hang forever. | 07 |
| D5 | Exact address and geo are private until a booking is approved or a tour is confirmed. Search uses a fuzzed `publicGeo`. | Student and owner safety, and anti-scraping by brokers. | 04, 05 |
| D6 | Reviews are **top-level** with deterministic IDs (`{propertyId}_{studentId}`). | The original plan listed both a top-level collection and a subcollection. Top-level makes moderation easy and the deterministic ID enforces one review per student per property. | 12 |
| D7 | KYC moves to **Phase 2**. Masked Aadhaar only. A private bucket. Files are purged 30 days after the decision. | Listings can't be published without it. Compliance with the Aadhaar Act. | 03 |
| D8 | Admin listing review (`pending_review → published`) and post-moderation (`needsReReview`) were added. | The original plan had a publish workflow but no admin endpoint to approve listings. | 04, 14 |
| D9 | New features: **Favorites** (06), **Inquiries/messaging** (09), **Reports** (13), **account export/deletion** (02). | Inquiries are the missing source of the `inquiries` metric and the core broker-free contact channel. Reports had admin endpoints but no way for users to file them. Deletion and export are required by the DPDP Act 2023. | 02, 06, 09, 13 |
| D10 | The throttler and idempotency are stored in **Firestore** with TTL policies. | Cloud Run runs multiple instances, so in-memory limits don't hold. | 00 |
| D11 | Notifications use an **outbox** keyed by `dedupeKey` and enqueued in the same transaction. | Exactly-once delivery that never blocks a request. | 10 |
| D12 | Tours use slot proposals (up to 3), in-person or video, and an owner-provided link in v1. The API path is `/v1/tours`. | Auto-creating Google Meet links needs Workspace delegation or per-owner OAuth, which is deferred. | 08 |
| D13 | Roommate matches are a bounded top 50 (no pagination), scored by a pure function with explainable reasons. | Ranked results can't be cursor-paginated cheaply. Explainable reasons build trust. | 11 |
| D14 | Stats moved off the property doc into sharded `counters/`. View dedupe is one per viewer per property per day. | Hot-document write limit, and inflated view counts. | 15 |
| D15 | Single role per account, and student → owner is one-way. | Simplest claims model. Revisit if owners want to book too. | 02 |
| D16 | No online payments in v1. Deposit and rent are settled offline, and bookings record the agreed amounts. | Scope and compliance. Adding payments later inserts an `awaiting_payment` state. | 07 |

---

## 15. Open Questions (need a product decision)

1. **Payments**: should a booking token be collected online in v1? This affects the booking state machine (D16).
2. **Phone OTP provider**: Firebase Phone Auth (recommended) or Twilio Verify. Decides whether `TWILIO_VERIFY_SID` is needed.
3. **Guest browsing**: search and listing detail are public in these specs. Confirm, or require sign-in.
4. **Typesense hosting**: Typesense Cloud or self-hosted VM.
5. **KYC retention**: 30 days after the decision, or longer for disputes (legal review).
6. **Launch cities**: a fixed allowlist or open. This affects search, seed data, and the admin overview.
7. **SMS DLT registration**: a business task with lead time, which must be done before Phase 3 launch.
8. **Listing limit per owner** (20) and **pending applications per student** (5): confirm the numbers.
9. **Owner response window** for pending bookings: 72 h or 48 h.
