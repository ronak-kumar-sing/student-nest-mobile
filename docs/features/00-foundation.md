# 00 — Foundation & Platform

**Phase 0** · Modules: `health`, `src/common`, `src/config`, `src/firebase`

## 1. Goal

Every later feature relies on a running skeleton. It must have one way to talk to Firebase, one error format, one auth guard chain, and CI that enforces the gates in `AGENTS.md`.

## 2. Scope

**In:**
- NestJS 11 scaffold with strict TypeScript, ESLint, and Prettier.
- Typed `ConfigModule` that validates env at boot.
- Firebase Admin module.
- Swagger at `/docs`.
- `/health` and `/ready`.
- Error filter, request ID, and structured logging.
- Guards and decorators (skeleton).
- Firestore-backed throttler storage.
- Idempotency interceptor.
- Sharded-counter helper.
- Emulator config and seed script.
- GitHub Actions CI.

**Out:** feature modules and deploy pipelines. Deploy pipelines come in Phase 6.

## 3. Building blocks

| Piece | Location | Notes |
| --- | --- | --- |
| Env schema | `src/config/env.schema.ts` | Validated with `class-validator` or `zod`. Boot fails on a missing or invalid var. In `NODE_ENV=development\|test`, boot **refuses to start** unless `FIRESTORE_EMULATOR_HOST` is set. |
| Firebase module | `src/firebase/` | Exports `FirestoreService` (typed collection refs plus converters), `AuthAdminService`, `StorageService` (public and private buckets, signed URLs), `MessagingService`, and `ShardedCounter`. This is the only place that imports `firebase-admin`. |
| Converters | `src/firebase/converters/` | One `FirestoreDataConverter<T>` per collection. Converts `Timestamp` ↔ `Date` and strips `undefined`. |
| Error registry | `src/common/errors/` | `AppException(code, httpStatus, details?)` and an `ErrorCode` enum. |
| Exception filter | `src/common/filters/` | Maps everything to `{ error: { code, message, details? }, requestId }`. Unknown errors become 500 `INTERNAL`, logged with the stack but never returned. |
| Request ID | `src/common/interceptors/` | Reads `X-Request-Id` if present, otherwise generates `req_<ulid>`. Echoed in the response header and in logs. |
| Logging | `nestjs-pino` | JSON to stdout (Cloud Logging). Redacts `authorization`, `otp`, `code`, `phone`, and `email`. |
| Guards | `src/common/guards/` | `FirebaseAuthGuard` (verifies the ID token, checks revocation for admin routes, rejects users with `status != active`), `RolesGuard` + `@Roles()`, `VerifiedOwnerGuard`, `@Public()`, and `@OptionalAuth()`. |
| Decorators | `src/common/decorators/` | `@CurrentUser()` returns `{ uid, role, kycStatus, email?, phone? }`. |
| Pagination | `src/common/dto/` | `CursorQueryDto { cursor?, limit? }`, `Page<T>`, and a cursor codec (base64url JSON of the last sort key and doc ID). |
| Throttler storage | `src/common/throttler/` | Firestore-backed (`rateLimits/{key}`) so limits hold across Cloud Run instances. In-memory storage is only allowed in unit tests. |
| Idempotency | `src/common/idempotency/` | Interceptor on routes marked `@Idempotent()`. Stores `idempotencyKeys/{uid}_{key}` → `{ status, body, expiresAt }` with a 24 h TTL. A replay returns the stored response. The same key with a different body returns `422 IDEMPOTENCY_KEY_REUSED`. |
| Sharded counter | `src/firebase/sharded-counter.ts` | `increment(path, field, n=1)` and `read(path)`. 10 shards by default. |

## 4. Endpoints

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/health` | public | `200 { status: "ok", version, uptime }`. Never touches dependencies. |
| GET | `/ready` | public | `200 { status: "ready", checks: { firestore, auth } }` or `503` if any check fails. Each check has a 2 s timeout. |
| GET | `/docs`, `/docs-json` | public (dev/staging), basic-auth (prod) | Swagger UI and the OpenAPI JSON. |

## 5. Firestore operational collections

| Collection | Purpose | TTL policy field |
| --- | --- | --- |
| `rateLimits/{key}` | Throttler hits | `expiresAt` |
| `idempotencyKeys/{id}` | Idempotent replay | `expiresAt` |
| `otp_codes/{id}` | Hashed OTPs (see 01) | `expiresAt` |
| `counters/{path}/shards/{n}` | Sharded counters | none |
| `auditLogs/{id}` | Admin and sensitive actions (`actorId, action, targetType, targetId, before?, after?, at, requestId`) | none (retain 1 year) |

Configure the TTL policies on these fields with the Firestore TTL feature (`gcloud firestore fields ttls update`), and document the commands in `firebase/README.md`.

## 6. Repo artifacts

- `firebase.json` and `.firebaserc`: emulators for auth (9099), firestore (8080), storage (9199), functions (5001), and UI (4000).
- `firebase/firestore.rules` (deny all), `firebase/storage.rules` (deny all), `firebase/firestore.indexes.json` (empty), and `firebase/functions/` (an empty TS package).
- `scripts/seed.ts`: creates admin, owner (verified), owner (unverified), and two student users in the Auth emulator with claims, plus 20 properties across 3 cities. It refuses to run without `FIRESTORE_EMULATOR_HOST`.
- `.github/workflows/ci.yml`: install → lint → type-check → unit (+coverage gate) → e2e (emulators started via `firebase emulators:exec`) → rules tests → docker build.
- `Dockerfile`: multi-stage, `node:22-slim`, non-root.

## 7. Security

- Helmet, CORS allowlist from env (mobile apps don't need CORS, but the admin web does), and a 1 MB body limit.
- App Check: verify the `X-Firebase-AppCheck` header in a global guard. It runs in **monitor mode** in Phase 0–5 (log only) and **enforce mode** in Phase 6. It is skipped in the emulator.

## 8. Edge cases

- Emulator env vars are missing in dev, so boot fails with a clear message. It never silently falls back to prod.
- A token was revoked mid-session (ban), so the guard returns 401 `TOKEN_REVOKED` on admin and write routes. Read routes rely on the 1 h token expiry plus the `status` check against the user doc. The user doc is cached per request.

## 9. Acceptance tests

- `GET /health` returns 200 without the emulator. `GET /ready` returns 200 with the emulator and 503 when Firestore is unreachable (mocked).
- An unknown body field returns 400 `VALIDATION_FAILED` with field details.
- A thrown `AppException` produces the exact envelope and echoes `requestId`.
- Throttler: the 4th call within the window returns 429 with `Retry-After`, and this holds across two app instances sharing the emulator.
- Idempotency: the same key twice yields one doc and identical responses. The same key with a different body returns 422.
- The seed script runs twice without duplicating data (deterministic IDs).

## 10. Open questions

- Structured logger: `nestjs-pino` is recommended. Confirm.
