# 10 — Notifications

**Phase 3** (the dispatcher infrastructure is needed by 03 and 04 in Phase 2; build the minimal pipeline there) · Module: `notifications` · Dispatch: `firebase/functions/src/notifications/`

## 1. Goal & user stories

- As a **user**, I get timely push, email, or SMS for things that matter (booking decisions, tour times, messages) and nothing else.
- As a **user**, I see an in-app inbox with unread counts and control which types reach me on which channel.
- As the **platform**, sending is reliable, never duplicated, never blocks an API request, and is cheap (SMS only where it matters).

## 2. Scope

**In:**
- Device registration.
- The in-app inbox (realtime read).
- Read state.
- Per-type and per-channel preferences.
- A template catalog.
- Outbox-based dispatch with retries.
- Quiet hours for SMS and push.

**Out:** marketing campaigns and WhatsApp (a later candidate).

## 3. Data

- `users/{uid}/devices/{sha256(token)}`: `{ token, platform: ios|android, appVersion, locale, lastSeenAt }`. Stale after 60 days, and removed on FCM `registration-token-not-registered`.
- `notifications/{uid}/items/{id}`: `{ type: NotificationType, title, body, data: { entity, id, deepLink }, readAt?, createdAt }`.
- `notificationOutbox/{id}`: `{ uid, type, payload, channels[], status: queued|sent|partial|failed, attempts, dedupeKey, createdAt, sentAt? }`. `dedupeKey` (for example `booking_approved:{bookingId}`) is the doc ID, which makes enqueueing idempotent.

Indexes: `notifications/{uid}/items`: `(readAt, createdAt desc)`. `notificationOutbox`: `(status, createdAt)`.

## 4. Notification catalog (`NotificationType`)

| Type | Recipient | Push | Email | SMS | Default on |
| --- | --- | --- | --- | --- | --- |
| `booking_requested` | owner | ✓ | ✓ | ✓ | all |
| `booking_approved` | student | ✓ | ✓ | ✓ | all |
| `booking_rejected`, `booking_expired` | student | ✓ | ✓ | | push, email |
| `booking_cancelled` | other party | ✓ | ✓ | ✓ | all |
| `booking_withdrawn` | owner | ✓ | | | push |
| `checkin_reminder` | both | ✓ | | | push |
| `review_prompt` | student | ✓ | ✓ | | push, email |
| `tour_requested`, `tour_confirmed`, `tour_rescheduled`, `tour_cancelled`, `tour_declined` | per 08 | ✓ | ✓ | | push, email |
| `tour_reminder` | both | ✓ | | ✓ (T−1 h, in-person only) | push |
| `new_message` | participant | ✓ | digest | | push |
| `kyc_approved`, `kyc_rejected` | owner | ✓ | ✓ | | all |
| `listing_approved`, `listing_rejected`, `listing_suspended` | owner | ✓ | ✓ | | all |
| `roommate_request`, `roommate_accepted` | per 11 | ✓ | | | push |
| `account_suspended` | user | | ✓ | | email (forced) |

Transactional security emails (OTP, account suspended, deletion) ignore preferences.

## 5. Endpoints

| Method | Path | Role | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/v1/notifications/devices` | any | `{ token, platform, appVersion, locale }` | `201` (upsert) | `VALIDATION_FAILED` |
| DELETE | `/v1/notifications/devices/:tokenHash` | any | — | `200` (logout) | — |
| GET | `/v1/notifications?unreadOnly=&cursor=` | any | — | `Page<NotificationDto>` + `unreadCount` | — |
| POST | `/v1/notifications/:id/read` | any | — | `200` | `NOT_FOUND` |
| POST | `/v1/notifications/read-all` | any | — | `200 { updated }` | — |

Preferences live in `PATCH /v1/users/me/notification-preferences` (02).

## 6. Dispatch pipeline

```
Domain service / trigger ──enqueue(type, uid, payload, dedupeKey)──▶ notificationOutbox (tx.create; dup → ignored)
        onCreate(outbox) ──▶ write inbox item ──▶ resolve channels (catalog ∩ prefs ∩ quiet hours)
                          ──▶ FCM (multicast to devices) · SendGrid (template) · Twilio (SMS)
                          ──▶ status sent|partial; failures retried with backoff (max 5), then failed + alert
```

- Domain code calls `NotificationsService.enqueue(...)` **inside the same transaction** as the state change when possible. That way a booking approval and its notification commit together (the outbox pattern).
- **Quiet hours:** 22:00–08:00 IST. Push is sent silently (data-only), and SMS is deferred to 08:00, except for `tour_reminder`.
- **Templates:** `src/modules/notifications/templates/*.ts` for push and SMS text. SendGrid dynamic template IDs live in config (one env var per template group).

## 7. Security

- Firestore rule (read path added, so a rules test is required): `notifications/{uid}/items/{id}` is readable iff `request.auth.uid == uid`. No writes.
- Push payloads carry IDs and deep links only, never contact details.

## 8. Edge cases

- A user has no devices: push is skipped and the inbox item is still written.
- The same token is registered by two uids (shared phone, re-login): the token moves to the newest uid and is deleted from the old one.
- An SMS to a number with DND: Twilio transactional route. Log the failure and don't retry forever.

## 9. Acceptance tests

- Enqueuing twice with the same `dedupeKey` gives one outbox doc and one inbox item.
- Preferences with sms off mean the SMS adapter is not called (unit, with adapter mocks).
- Quiet hours defer the SMS (mocked clock).
- `GET /notifications` and `read-all` happy paths. Another user's item returns 404.
- Rules tests: own inbox is readable, others' are denied, writes are denied.

## 10. Open questions

- SMS costs and DLT registration (India requires DLT-registered templates for transactional SMS). Templates must be registered before Phase 3 launch. **This is a business task with lead time.**
