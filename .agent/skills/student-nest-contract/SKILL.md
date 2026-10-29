---
name: student-nest-contract
description: How to read the backend contract in docs/features/, the error envelope, cursor pagination, state-change actions, paise convention, ISO dates, and the error-code → UI-message mapping.
---

# Student Nest Backend Contract

## Where to find specs

The backend API contract lives at `docs/features/`:
- `README.md` — shared conventions (read first)
- `00-foundation.md` through `15-analytics.md` — one per feature
- `plan.md` (project root) — architecture overview, decision log, phases

**Always read the relevant spec before building a feature.** If a spec and `plan.md` disagree, flag it in `docs/mobile-plan.md` → "Contract questions".

## Shared conventions

### Base URL and auth
- All routes under `/v1` except `/health` and `/ready`.
- Protected routes: `Authorization: Bearer <Firebase ID token>`.
- App Check header: `X-Firebase-AppCheck`.
- Request ID header: `X-Request-Id` (UUID, generated per request).

### Error envelope
Every error response follows this shape:
```json
{
  "error": {
    "code": "BOOKING_SLOT_TAKEN",
    "message": "Human-readable message (never switch on this)",
    "details": [
      { "field": "moveInDate", "message": "Must be in the future" }
    ]
  },
  "requestId": "uuid"
}
```

**Rules:**
- Always switch on `error.code`, never on `error.message`.
- Map `error.code` to an i18n key for the user-facing message: `src/api/errors.ts`.
- `details[].field` → show inline validation error on the matching form field.
- Toast for mutation errors; inline message for query errors.

### Common error codes
| Code | HTTP | Meaning |
| --- | --- | --- |
| `VALIDATION_FAILED` | 400 | Bad input; check `details[]` |
| `UNAUTHENTICATED` | 401 | Missing or expired token |
| `FORBIDDEN` | 403 | Role or ownership check failed |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `INVALID_TRANSITION` | 409 | State machine violation |
| `RATE_LIMITED` | 429 | Too many requests |
| `ACCOUNT_SUSPENDED` | 403 | Account is suspended/banned |

### Cursor pagination
Lists return:
```json
{
  "items": [...],
  "nextCursor": "opaque-string-or-null",
  "hasMore": true
}
```
- Default `limit`: 20, max 50.
- Use `useInfiniteQuery` with `getNextPageParam: (last) => last.hasMore ? last.nextCursor : undefined`.
- Helper in `src/api/pagination.ts`.

### State-change actions
State transitions use:
```
POST /v1/<resource>/:id/actions
{ "action": "<verb>", ...payload }
```
Returns the updated resource. Invalid transitions return `409 INVALID_TRANSITION`.

### Money
- Stored as integer **paise** (1 rupee = 100 paise).
- Fields suffixed with `…Paise` (e.g., `rentPaise`, `depositPaise`).
- Format only at the edge: `formatINR(paise)` → `₹8,500`.
- **Never** store or calculate with floats.

### Timestamps
- Firestore `Timestamp` in storage, ISO 8601 string in API responses.
- All timestamps are **UTC** on the wire.
- Display in **IST** (`Asia/Kolkata`) using `date-fns` + `@date-fns/tz`.

### Phone numbers
- E.164 format (e.g., `+919876543210`).

### Status history
Every status-bearing document has:
```json
{
  "status": "approved",
  "history": [
    { "status": "pending", "at": "ISO", "by": "userId", "note": "optional" },
    { "status": "approved", "at": "ISO", "by": "userId" }
  ]
}
```
History capped at 20 entries; older entries go to an `events` subcollection.

## How to add types from a spec

1. Read the spec's **Data** and **Endpoints** sections.
2. Create or update `src/features/<feature>/types.ts` with TypeScript interfaces matching the spec tables exactly.
3. Create or update `src/features/<feature>/schemas.ts` with Zod schemas for form inputs, matching the backend DTO constraints (min/max lengths, patterns, enums).
4. Once the backend serves `/docs-json`, run `npm run gen:api` to generate types and replace hand-written ones.

## Contact/address reveal rules
- **Before booking approval or tour confirmation:** only `publicLocation` (locality/area), no exact address, no phone/email of owner.
- **After booking approval:** exact address and owner contact revealed in the booking response.
- **After tour confirmation:** meeting point or address revealed.
- Mocks must enforce these same reveal rules.

