# 12 — Reviews & Ratings

**Phase 4** · Module: `reviews`

## 1. Goal & user stories

- As a **student who actually lived there**, I rate a property (overall, cleanliness, safety, value, location, owner behaviour) and write a review.
- As a **student browsing**, I trust that reviews are only from real tenants and see the aggregate scores.
- As an **owner**, I reply publicly once per review and can report abusive reviews.
- As an **admin**, I hide or restore reviews (13/14).

## 2. Scope

**In:**
- Eligibility-gated create.
- One review per student per property.
- A 30-day edit window.
- An owner reply.
- Aggregate ratings.
- Moderation status.
- Helpful votes.

**Out:** photos in reviews and reviews of students by owners. Owner-to-student reviews are a later candidate.

## 3. Data

**Decision:** reviews are a **top-level** collection, `reviews/{propertyId}_{studentId}`. The original plan listed both a top-level collection and a `properties/{id}/reviews` subcollection, so this resolves the conflict. Top-level makes admin moderation queries across properties simple, and the deterministic ID enforces one review per student per property.

| Field | Type | Notes |
| --- | --- | --- |
| `propertyId`, `studentId`, `ownerId`, `bookingId` | string | `bookingId` is the eligibility proof |
| `ratings` | `{ overall, cleanliness, safety, value, location, owner }` ints 1–5 | `overall` is required. The others are optional. |
| `title` | ≤ 80 | |
| `comment` | 20–2000 | |
| `stayPeriod` | `{ from, to }` | Copied from the booking and shown as "Lived here Jun–Dec 2026" |
| `ownerReply` | `{ text ≤ 1000, at }?` | |
| `helpfulCount` | int | |
| `status` | `ReviewStatus` = `published \| flagged \| hidden` | `flagged` stays visible until an admin decides. `hidden` is not visible. |
| `editedAt?`, `createdAt` | | |

`reviews/{id}/helpful/{uid}` holds helpful votes (idempotent, one per user).

Aggregates on `properties/{id}`: `ratingAvg`, `ratingCount`, and `ratingBreakdown { overall: {1..5 counts}, cleanlinessAvg, … }`. A trigger maintains them.

Indexes: `(propertyId, status, createdAt desc)`, `(propertyId, status, helpfulCount desc)`, `(status, createdAt)` for moderation, and `(studentId, createdAt desc)`.

## 4. Endpoints

| Method | Path | Role | Request | Response | Errors |
| --- | --- | --- | --- | --- | --- |
| POST | `/v1/properties/:id/reviews` | student | `{ ratings, title?, comment }` | `201 ReviewDto` | `REVIEW_NOT_ELIGIBLE` (403), `ALREADY_REVIEWED` (409), `VALIDATION_FAILED` |
| GET | `/v1/properties/:id/reviews?sort=recent\|helpful&cursor=` | optional auth | — | `Page<ReviewDto>` + `summary { avg, count, breakdown }` | `NOT_FOUND` |
| PATCH | `/v1/reviews/:id` | author | partial `{ ratings, title, comment }` | `ReviewDto` | `EDIT_WINDOW_CLOSED` (409), `FORBIDDEN` |
| POST | `/v1/reviews/:id/reply` | owner (of the property) | `{ text }` | `ReviewDto` | `ALREADY_REPLIED` (409; edit via PUT within 7 days) |
| PUT | `/v1/reviews/:id/helpful` / DELETE | any student (not the author) | — | `{ helpfulCount }` | — |
| GET | `/v1/reviews/mine` | student | — | `Page<ReviewDto>` | — |

Reporting a review uses `POST /v1/reports` (13). Admin moderation is in 14.

## 5. Business rules

- **Eligibility:** a `bookings` doc with this student and property must have `status ∈ {checked_in, completed}` and either be `completed` or have `checked_in` ≥ 30 days ago. This lets long-stay tenants review mid-stay.
- **Window:** a review must be created within 180 days of booking completion.
- **Edit window:** 30 days after creation. An edit recomputes the aggregates.
- Owners cannot delete reviews. They can reply or report.
- Reviews by a deleted user stay, attributed to "Former tenant".

## 6. Side effects

- Trigger `onReviewWrite` recomputes the property aggregates. It runs in a transaction on the property doc using the delta between before and after: a status change to or from `hidden` adds or removes the review's contribution. The trigger also bumps `searchVersion`, so the Typesense `ratingAvg` updates.
- Notifications: `review_prompt` on booking completion (07), and `new_review` to the owner (push).

## 7. Security

- There's no Firestore read path. Reviews are read via the API.
- Comment text runs through the same spam and profanity heuristic as messages (09). A hit sets `flagged`.

## 8. Edge cases

- A review is created twice concurrently: `tx.create` on the deterministic ID means the second gets 409.
- Booking cancelled after check-in (an early move-out): if `checked_in` was ≥ 30 days earlier, the student is still eligible.
- An admin hides a review: the aggregate excludes it, and the author still sees it with a "hidden by moderation" badge.

## 9. Acceptance tests

- Without a booking, create returns 403. With a completed booking it returns 201, and `ratingAvg` updates (trigger test).
- A second review returns 409. An edit on day 31 returns 409.
- Hide by admin decreases `ratingCount`, and restore increases it.
- An owner replies once, and a second reply returns 409.
- Unit: the aggregate delta math, including the hidden ↔ published transitions.

## 10. Open questions

- Should owners also review students? This would give a reliability signal for future bookings. It's deferred.
