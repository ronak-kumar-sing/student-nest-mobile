# 14 — Admin Console API

**Phase 2** (KYC and listing review queues, needed to publish anything) **+ Phase 5** (users, reports, reviews, overview) · Module: `admin`

All routes use `@Roles('admin')`, and the guard checks token revocation. Every mutating route writes `auditLogs`. The admin web console is a separate client, outside this repo's scope.

## 1. User stories

- As an **admin**, I clear the KYC queue and the listing review queue daily, oldest first.
- As an **admin**, I find any user and suspend, ban, or reinstate them with a reason.
- As an **admin**, I work the reports queue and moderate reviews.
- As an **admin**, I see platform health: signups, listings, bookings, conversion, and queue sizes.

## 2. Endpoints

### Phase 2 — verification & listings

| Method | Path | Request | Response | Errors |
| --- | --- | --- | --- | --- |
| GET | `/v1/admin/verifications?status=submitted&cursor=` | — | `Page<VerificationAdminDto>` (oldest first) | — |
| GET | `/v1/admin/verifications/:id` | — | detail + `files[].readUrl` (5-minute signed URLs) + user summary. Logs `kyc.view`. | `NOT_FOUND` |
| POST | `/v1/admin/verifications/:id/actions` | `{ action: approve \| reject \| revoke, reason?, note? }` | `VerificationAdminDto` | `INVALID_TRANSITION`, `REASON_REQUIRED` |
| GET | `/v1/admin/properties?status=pending_review\|published&needsReReview=&cursor=` | — | `Page<PropertyAdminDto>` (includes the exact address) | — |
| POST | `/v1/admin/properties/:id/actions` | `{ action: approve \| reject \| suspend \| reinstate \| clear_rereview, reason?, note? }` | `PropertyAdminDto` | `INVALID_TRANSITION`, `REASON_REQUIRED` |

### Phase 5 — users, moderation, overview

| Method | Path | Request | Response | Errors |
| --- | --- | --- | --- | --- |
| GET | `/v1/admin/users?role=&status=&q=&cursor=` | `q` = exact email, exact E.164 phone, or uid (no full-text) | `Page<UserAdminDto>` | — |
| GET | `/v1/admin/users/:id` | — | profile + counts (bookings, listings, reports against) + recent audit entries | — |
| POST | `/v1/admin/users/:id/actions` | `{ action: suspend \| ban \| reinstate \| make_admin \| revoke_admin, days?, reason }` | `UserAdminDto` | `CANNOT_ACT_ON_SELF`, `INVALID_TRANSITION` |
| GET | `/v1/admin/reports?status=open&priority=&targetType=&cursor=` | — | `Page<ReportAdminDto>` with a target preview | — |
| POST | `/v1/admin/reports/:id/actions` | `{ action: ModerationAction, note, days? }` | `ReportAdminDto` | `INVALID_TRANSITION` |
| GET | `/v1/admin/reviews?status=flagged&cursor=` | — | `Page<ReviewAdminDto>` | — |
| POST | `/v1/admin/reviews/:id/actions` | `{ action: hide \| restore, note }` | `ReviewAdminDto` | — |
| GET | `/v1/admin/analytics/overview?from=&to=` | — | see 15 | — |
| GET | `/v1/admin/audit-logs?actorId=&targetId=&cursor=` | — | `Page<AuditLogDto>` | — |

These replace the original plan's `approve`/`reject` sub-routes and `PATCH /admin/users/:id` with the `actions` convention.

## 3. Business rules

- **Suspend** sets `status=suspended` and `suspendedUntil`, updates the claims, revokes refresh tokens, and pauses the user's published listings. A scheduled job reinstates the user when `suspendedUntil` passes.
- **Ban** additionally withdraws pending bookings and tours and deactivates the roommate profile. Approved bookings are left to the admin to resolve case by case, with a warning shown in the response.
- `make_admin` requires the acting admin to have the `superAdmin` claim. The first super admin is created by `scripts/make-admin.ts --super`.
- Admins can't act on themselves.
- The KYC `revoke` cascade is described in 03.

## 4. Security

- Admin routes are not exposed to the mobile app. They are tagged `admin` in Swagger and excluded from the exported mobile OpenAPI spec.
- Admin tokens: require re-authentication less than 12 h old for destructive actions (check `auth_time`). Otherwise return 401 `REAUTH_REQUIRED`.

## 5. Acceptance tests

- A non-admin gets 403 on every admin route (one parameterized e2e).
- Approve KYC flips the owner's claims. Approve listing makes it searchable.
- Suspend user: their next request returns 403 `ACCOUNT_SUSPENDED`, and their listings are paused.
- Every action produces exactly one audit log entry with `before`/`after`.
- Opening a KYC detail logs `kyc.view`.
