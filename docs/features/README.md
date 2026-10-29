# Feature Specs

One spec per feature. `plan.md` is the overview: architecture, decision log, phases. These files are the detailed contract for each feature: user stories, data, endpoints, rules, side effects, edge cases, and acceptance tests. If a spec and `plan.md` disagree, fix `plan.md` first (see `AGENTS.md`).

| # | Feature | Module(s) | Phase | Status |
| --- | --- | --- | --- | --- |
| 00 | [Foundation & platform](./00-foundation.md) | `health`, `common`, `config`, `firebase` | 0 | planned |
| 01 | [Authentication](./01-auth.md) | `auth` | 1 | planned |
| 02 | [Users, profiles & account](./02-users.md) | `users` | 1 | planned |
| 03 | [Owner verification (KYC)](./03-verification.md) | `verification` | 2 | planned |
| 04 | [Properties (listings)](./04-properties.md) | `properties` | 2 | planned |
| 05 | [Search & discovery](./05-search.md) | `search` | 2 | planned |
| 06 | [Favorites](./06-favorites.md) | `favorites` | 2 | planned (new) |
| 07 | [Bookings](./07-bookings.md) | `bookings` | 3 | planned |
| 08 | [Tours (meetings)](./08-tours.md) | `meetings` | 3 | planned |
| 09 | [Inquiries (owner chat)](./09-inquiries.md) | `inquiries` | 3 | planned (new) |
| 10 | [Notifications](./10-notifications.md) | `notifications` | 3 | planned |
| 11 | [Roommate matching](./11-roommates.md) | `roommates` | 4 | planned |
| 12 | [Reviews & ratings](./12-reviews.md) | `reviews` | 4 | planned |
| 13 | [Reports & moderation](./13-reports.md) | `reports` | 5 | planned (new module) |
| 14 | [Admin console API](./14-admin.md) | `admin` | 2 + 5 | planned |
| 15 | [Analytics](./15-analytics.md) | `analytics` | 2 + 6 | planned |

## Spec template

Every spec has these sections. Keep new specs in the same shape.

1. **Goal & user stories**: who needs it and why.
2. **Scope**: what is in and out for v1.
3. **Data**: collections, fields, enums, and indexes.
4. **Endpoints**: method, path, role, request, response, and error codes.
5. **Business rules**: state machines, invariants, limits.
6. **Side effects**: triggers, notifications, counters, search sync.
7. **Security**: guards, Firestore/Storage rules, privacy.
8. **Edge cases**
9. **Acceptance tests**: these become the e2e and unit test list.
10. **Open questions**

## Shared conventions (apply to every spec)

- All routes are under `/v1` except `/health` and `/ready`. All protected routes need `Authorization: Bearer <Firebase ID token>`.
- Lists return `{ items, nextCursor, hasMore }`. `limit` defaults to 20, max 50. Pagination is cursor only.
- State transitions use `POST /v1/<resource>/:id/actions` with `{ "action": "<verb>", ... }` and return the updated resource. An invalid transition returns `409 INVALID_TRANSITION`.
- Money is integer **paise**, in fields suffixed `…Paise`. Timestamps are Firestore `Timestamp` in storage and ISO 8601 in responses.
- Error `code`s are listed per spec and registered in `src/common/errors/error-codes.ts`. Common codes used everywhere: `VALIDATION_FAILED` (400), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `INVALID_TRANSITION` (409), `RATE_LIMITED` (429), `ACCOUNT_SUSPENDED` (403).
- Every document has `createdAt` and `updatedAt`. Every status-bearing document keeps a `history[]` of `{ status, at, by, note? }`. History is capped at 20 entries; older entries go to an `events` subcollection.
