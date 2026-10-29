# 09 — Inquiries (Student ↔ Owner Messaging)

**Phase 3** · Module: `inquiries` · *New. The original plan counted `stats.inquiries` and a "contact" event but had no feature that produces them.*

## 1. Goal & user stories

- As a **student**, I ask an owner a question ("is food included on Sundays?") without sharing my phone number.
- As an **owner**, I reply from the app. My response rate is shown on my listings.
- As the **platform**, contact happens in-app, which is broker-free and auditable, and phone numbers are revealed only on booking approval or tour confirmation.

## 2. Scope

**In:**
- One thread per (student, property).
- Text messages.
- Read receipts.
- Realtime reads via a Firestore listener.
- Push on new message.
- Basic abuse controls.

**Out:** attachments, voice, group chats, typing indicators, and end-to-end encryption.

## 3. Data

`inquiries/{threadId}` with `threadId = ${propertyId}_${studentId}` (deterministic, so there's never a duplicate thread):

| Field | Type | Notes |
| --- | --- | --- |
| `propertyId`, `studentId`, `ownerId` | string | |
| `participants` | `[studentId, ownerId]` | For the rules |
| `propertySnapshot` | `{ title, coverImage }` | |
| `lastMessage` | `{ text (≤ 120), senderId, at }` | |
| `unread` | `{ [uid]: int }` | |
| `status` | `ThreadStatus` = `open \| closed \| blocked` | |
| `firstResponseAt` | Timestamp? | For the owner response-rate metric |

`inquiries/{threadId}/messages/{id}`: `{ senderId, text (1–1000), createdAt, flagged?: bool }`

Indexes: `(participants array-contains, lastMessage.at desc)`.

## 4. Endpoints

| Method | Path | Role | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/v1/inquiries` | student (phone verified) | `{ propertyId, text }` | `201 ThreadDto` (or `200` with the existing thread, appending the message) | `PROPERTY_UNAVAILABLE`, `BLOCKED` (403), `RATE_LIMITED` |
| GET | `/v1/inquiries?cursor=` | student/owner | — | `Page<ThreadDto>` (own threads) | — |
| GET | `/v1/inquiries/:threadId/messages?cursor=` | participant | — | `Page<MessageDto>` (newest first) | `NOT_FOUND` |
| POST | `/v1/inquiries/:threadId/messages` | participant | `{ text }` | `201 MessageDto` | `THREAD_CLOSED`, `BLOCKED`, `RATE_LIMITED` |
| POST | `/v1/inquiries/:threadId/read` | participant | — | `200` (resets `unread[me]`) | — |
| POST | `/v1/inquiries/:threadId/actions` | participant | `{ action: close \| block \| unblock }` | `ThreadDto` | `INVALID_TRANSITION` |

Messages are written **only** via the API. The app may **read** threads and messages with a realtime listener.

## 5. Business rules

- **Contact redaction:** before sending, messages pass a filter that masks phone numbers, emails, and UPI IDs (`[hidden — share after booking]`) until a booking between the parties is approved or a tour is confirmed. This prevents off-platform deals and broker scraping.
- **Rate limits:**
  - 20 messages per minute per user.
  - A student may open at most 10 new threads per day. This is the anti-broker-scraping limit.
- Message text runs through a basic profanity and spam heuristic. If it matches, `flagged=true` and an auto-report goes to moderation (13). The message is still delivered.
- `block` by either party sets the thread to blocked, and further messages return 403 `BLOCKED`.
- **Owner response metrics:** `firstResponseAt` is set on the owner's first reply. A nightly job computes `responseRate` (share of threads answered within 24 h) and `avgResponseMins` on `users.ownerProfile`, over the last 30 days.

## 6. Side effects

- A new message triggers the `new_message` push to the other participant, collapsed per thread (FCM `collapse_key`). There's no email unless the message has been unread for more than 12 h (digest).
- A first message in a new thread increments `properties_{id}_inquiries` and logs a `contact` analytics event.

## 7. Security (Firestore rules: a read path is added here, so a rules test is required)

```
match /inquiries/{threadId} {
  allow read: if request.auth != null && request.auth.uid in resource.data.participants;
  allow write: if false;
  match /messages/{msgId} {
    allow read: if request.auth != null
      && request.auth.uid in get(/databases/$(database)/documents/inquiries/$(threadId)).data.participants;
    allow write: if false;
  }
}
```

## 8. Edge cases

- A student messages their own deleted account's old thread: deleted users' threads are closed.
- The property is deleted: threads stay readable and are closed.
- An owner replies after 30 days: allowed. Threads auto-close after 90 days of inactivity.

## 9. Acceptance tests

- Start a thread → owner replies → `unread` is updated → read resets it.
- A phone number in the text before approval is masked. After approval it's unmasked.
- The 11th new thread in a day returns 429. A blocked thread returns 403.
- Rules tests: a participant can read, a non-participant is denied, and any client write is denied.

## 10. Open questions

- Is in-app messaging in v1, or is "Request tour" enough? The recommendation is to include it. It's the main broker-free trust feature and the source of the `inquiries` metric.
