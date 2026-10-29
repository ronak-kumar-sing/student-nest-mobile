# 02 — Users, Profiles & Account

**Phase 1** · Module: `users`

## 1. Goal & user stories

- As a **user**, I view and edit my profile, choose how I'm notified, and see my verification state.
- As a **student**, I become an owner so I can list a room. This is one-way and starts KYC.
- As a **user**, I export my data or delete my account. This is required by India's DPDP Act 2023.
- As **anyone**, I view a public profile that shows no contact details.

## 2. Scope

**In:**
- Profile CRUD.
- Avatar upload (signed URL).
- Notification preferences.
- The become-owner switch.
- Public profile.
- Account deletion and data export.
- Suspend/ban plumbing (enforced by the guard; the admin endpoints are in 14).

**Out:** multi-role accounts. One role per account in v1.

## 3. Data — `users/{uid}`

| Field | Type | Notes |
| --- | --- | --- |
| `role` | `UserRole` = `student \| owner \| admin` | Mirrored in claims |
| `status` | `UserStatus` = `active \| suspended \| banned \| deleted` | Mirrored in claims. The guard rejects anything other than `active`. |
| `email`, `emailVerified` | string, bool | From the auth flow, never from the body |
| `phone`, `phoneVerified` | E.164, bool | From the token only |
| `displayName` | string 2–50 | |
| `avatarPath` | string? | Path in the public bucket. The response returns `avatarUrl`. |
| `bio` | string ≤ 300 | |
| `gender` | `Gender` = `male \| female \| non_binary \| undisclosed` | Used by gender-policy filtering and roommates |
| `college` | string? | Students. Free text in v1. |
| `city` | string? | Normalized city slug (`indore`) |
| `ownerProfile` | `{ kycStatus: KycStatus, businessName?, listedPropertyCount, responseRate?, avgResponseMins? }` | Owners only. `KycStatus = none \| pending \| approved \| rejected`. |
| `notificationPrefs` | `{ channels: { email, sms, push }, types: { [NotificationType]: bool } }` | Defaults: push on, email on, sms only for bookings |
| `consents` | `{ termsVersion, acceptedAt, marketingOptIn }` | DPDP record |
| `deletion` | `{ requestedAt, scheduledFor }?` | Set during the grace period |
| `createdAt`, `updatedAt`, `lastActiveAt` | Timestamp | `lastActiveAt` is updated at most once per hour |

Subcollection `users/{uid}/devices/{tokenHash}` belongs to feature 10.

Indexes: `(role, status, createdAt)` for the admin user list.

## 4. Endpoints

| Method | Path | Role | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| GET | `/v1/users/me` | any | — | `UserMeDto` (full, including claims and `kycStatus`) | — |
| PATCH | `/v1/users/me` | any | `{ displayName?, bio?, gender?, college?, city? }` | `UserMeDto` | `VALIDATION_FAILED` |
| POST | `/v1/users/me/avatar` | any | `{ contentType: image/jpeg\|png\|webp, sizeBytes ≤ 2MB }` | `{ uploadUrl, path, expiresAt }` (PUT, 10 min) | `VALIDATION_FAILED` |
| PUT | `/v1/users/me/avatar` | any | `{ path }` | `UserMeDto` | `UPLOAD_NOT_FOUND` |
| PATCH | `/v1/users/me/notification-preferences` | any | partial `notificationPrefs` | prefs | — |
| POST | `/v1/users/me/become-owner` | student | `{ businessName? }` | `{ user, refreshToken: true }` | `ACTIVE_BOOKINGS_EXIST` (409) |
| GET | `/v1/users/:id` | any (optional auth) | — | `PublicUserDto { id, displayName, avatarUrl, role, memberSince, ownerBadge? { verified, responseRate } }` | `NOT_FOUND` (also returned for banned/deleted users) |
| POST | `/v1/users/me/export` | any | — | `202 { requestId }`. A function emails a signed JSON link valid for 24 h. | `RATE_LIMITED` (1 per day) |
| DELETE | `/v1/users/me` | any | `{ confirm: "DELETE" }` | `202 { scheduledFor }` (14-day grace) | `ACTIVE_BOOKINGS_EXIST`, `OPEN_LISTINGS_EXIST` |
| POST | `/v1/users/me/deletion/cancel` | any | — | `200` | `NOT_FOUND` |

## 5. Business rules

- **Become owner:** allowed only for a `student` with no `pending` or `approved` bookings. It sets `role=owner` and `ownerProfile.kycStatus=none`, updates the claims, and leaves the roommate profile deactivated.
- **Deletion:**
  - Blocked while the user has active bookings (as student or owner) or published listings.
  - After the grace period, a scheduled function anonymizes the account:
    - The user doc is reduced to `{ status: deleted, displayName: "Deleted user" }`.
    - The Auth user is deleted.
    - Devices, favorites, roommate profile, and avatar are deleted.
    - KYC docs are deleted.
    - Reviews and bookings are kept, but `studentId` stays an opaque ID and the display name resolves to "Deleted user".
- **Signing in during the grace period** cancels the deletion automatically. Show a banner (the `deletion` field is present).
- **Contact details** (`email`, `phone`) are **never** in any response about another user. They are revealed only through feature-specific DTOs: approved booking (07), confirmed tour (08), and accepted roommate request (11).

## 6. Side effects

- A role or status change calls `setCustomUserClaims`, and for suspend/ban also `revokeRefreshTokens`.
- `auditLogs` entries for become-owner, deletion requested, deletion executed, and export.
- Export/deletion functions: `firebase/functions/src/account/*` (scheduled daily).

## 7. Security

- Firestore rules: a user may **read** `users/{uid}` only when `request.auth.uid == uid`. No writes.
- Storage: `avatars/{uid}/*` is publicly readable, and writes go only via signed URL.

## 8. Edge cases

- Avatar confirm with a path outside `avatars/{uid}/` returns 400.
- An owner with a `pending` KYC requests deletion: KYC is cancelled and the docs are purged.
- A suspended user calls any endpoint: 403 `ACCOUNT_SUSPENDED`. This is checked from the claims and refreshed by revocation.

## 9. Acceptance tests

- `GET/PATCH /users/me` happy path. A PATCH of `role` or `email` returns 400 (whitelisted).
- `GET /users/:id` never contains `email`, `phone`, or `consents`.
- Become-owner with an approved booking returns 409. Without one, the claims change and the next request sees `role=owner`.
- Delete, then cancel within the grace period, restores the account. A scheduled run after the grace period anonymizes it (function unit test).
- A suspended user gets 403 on `/users/me`.

## 10. Open questions

- Should owners also be able to act as students (browse, book) from the same account? v1 says no. Revisit if owners ask for it.
- Should `college` be a verified enum or list (to support "students from X college" filters later)?
